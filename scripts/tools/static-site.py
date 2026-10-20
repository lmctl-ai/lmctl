#!/usr/bin/env python3
"""Static publication inventory and transport. HTML inspection lives in live-links.lms."""
import argparse
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
NO_CACHE = 'no-cache, max-age=0, must-revalidate'
DAY = 'public, max-age=86400'
TYPES = {'.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
         '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8',
         '.md': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
         '.mp4': 'video/mp4', '.webm': 'video/webm', '.ico': 'image/x-icon'}
MANIFESTS = {'tools': 'tools/deploy-manifest.json', 'skills': 'skills/deploy-manifest.json',
             'homepage': 'assets/deploy-manifest.json'}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def inventory(area, root=ROOT):
    result = {}
    def add(key, path):
        if path.is_symlink():
            raise ValueError(f'refusing symlink: {path}')
        data = path.read_bytes()
        result[key] = dict(data=data, sha256=digest(data), content_type=TYPES[path.suffix],
                           cache_control=DAY if path.suffix in ('.css', '.png', '.svg', '.ico', '.mp4', '.webm') else NO_CACHE)
    source = root / area
    for path in sorted(source.rglob('*')):
        rel = path.relative_to(source)
        if any(p.startswith('.') or p == '_template' for p in rel.parts) or path.name == 'README.md':
            continue
        if path.is_symlink():
            raise ValueError(f'refusing symlink: {path}')
        if not path.is_file():
            continue
        allowed = {'.html', '.css', '.png', '.svg', '.txt'} if area == 'tools' else ({'.html'} if area == 'skills' else set(TYPES) - {'.md'})
        if path.suffix not in allowed:
            raise ValueError(f'unexpected publication file: {path}')
        key = rel.as_posix() if area == 'homepage' else f'{area}/{rel.as_posix()}'
        add(key, path)
        if path.name == 'index.html' and '/' in key:
            prefix = key[:-len('/index.html')]
            add(prefix, path)
            add(prefix + '/', path)
    if area == 'skills':
        for path in sorted((root / 'skills-moved').glob('*.md')):
            add('skills/' + path.name, path)
        add('skills/lmctl-lead.html', root / 'skills/lmctl-lead-skill.html')
    records = {key: {k: v for k, v in obj.items() if k != 'data'} for key, obj in result.items()}
    data = (json.dumps(records, sort_keys=True, indent=2) + '\n').encode()
    result[MANIFESTS[area]] = dict(data=data, sha256=digest(data), content_type='application/json; charset=utf-8', cache_control=NO_CACHE)
    return result


def aws(*args):
    proc = subprocess.run(['aws', *args, '--output', 'json'], capture_output=True, text=True)
    if proc.returncode:
        raise RuntimeError(proc.stderr.strip())
    return json.loads(proc.stdout or '{}')


def deploy(area):
    bucket = os.environ.get('S3_BUCKET', 'lmctl-website-prod')
    distribution = os.environ.get('CF_DISTRIBUTION_ID', 'E1GKUWTM93U7IV')
    if not bucket or '/' in bucket or not distribution:
        raise ValueError('invalid bucket/distribution')
    expected = inventory(area)
    # List first: a missing key is distinct from a denied HeadObject request.
    prefix = 'assets/' if area == 'homepage' else area
    listed = aws('s3api', 'list-objects-v2', '--bucket', bucket, '--prefix', prefix)
    present = {v['Key'] for v in listed.get('Contents', [])}
    if area == 'homepage':
        present.update(v['Key'] for v in aws('s3api', 'list-objects-v2', '--bucket', bucket, '--delimiter', '/').get('Contents', []))
        present.update(v['Key'] for v in aws('s3api', 'list-objects-v2', '--bucket', bucket, '--prefix', 'levels/').get('Contents', []))
    def changed(item):
        key, obj = item
        if key not in present:
            return key
        head = aws('s3api', 'head-object', '--bucket', bucket, '--key', key)
        md5 = hashlib.md5(obj['data'], usedforsecurity=False).hexdigest()
        if head.get('ETag', '').strip('"') != md5 or head.get('ContentType') != obj['content_type'] or head.get('CacheControl') != obj['cache_control']:
            return key
        return None
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        changes = sorted(k for k in pool.map(changed, expected.items()) if k)
    # Only remove files owned by a previous manifest. Never delete out-of-band assets.
    previous = {}
    with tempfile.TemporaryDirectory() as tmp:
        old = Path(tmp) / 'old.json'
        if MANIFESTS[area] in present:
            aws('s3api', 'get-object', '--bucket', bucket, '--key', MANIFESTS[area], str(old))
            previous = json.loads(old.read_text())
        deletions = sorted(set(previous) - set(expected))
        # Reject a corrupt or manually edited inventory that escapes its area.
        for key in deletions:
            if area == 'homepage':
                valid = key.startswith(('assets/', 'levels/')) or key in ('levels', 'index.html', '404.html', 'robots.txt', 'sitemap.xml')
            else:
                valid = key == area or key.startswith(area + '/')
            if not valid:
                raise ValueError(f'previous manifest contains out-of-scope key: {key}')
        def upload(key):
            print(f'{area}: upload {key}', flush=True)
            if os.environ.get('DRY_RUN') == '1':
                return
            obj = expected[key]
            body = Path(tmp) / 'body'
            body.write_bytes(obj['data'])
            aws('s3api', 'put-object', '--bucket', bucket, '--key', key, '--body', str(body),
                '--content-type', obj['content_type'], '--cache-control', obj['cache_control'])
        for key in changes:
            if key != MANIFESTS[area]:
                upload(key)
        for key in deletions:
            print(f'{area}: delete previously managed {key}', flush=True)
            if os.environ.get('DRY_RUN') != '1':
                aws('s3api', 'delete-object', '--bucket', bucket, '--key', key)
        # Commit the ownership inventory last, so a failed deletion is retried.
        if MANIFESTS[area] in changes:
            upload(MANIFESTS[area])
    targets = live_targets(expected)
    targets.update({key: None for key in deletions})
    responses = fetch_targets(targets)
    stale = differing(targets, responses)
    # Include writes for other edge locations, and stale CDN copies even when
    # S3 needed no writes (e.g. a previous deploy stopped before invalidation).
    paths = set(changes + deletions) | set(stale)
    if 'index.html' in changes:
        paths.add('')
    print(f'{area}: {len(stale)} live differences; {len(paths)} invalidation paths', flush=True)
    if os.environ.get('DRY_RUN') == '1':
        for key in sorted(paths):
            print(f'DRY_RUN: would invalidate /{key}', flush=True)
        print('DRY_RUN: no writes, invalidations or polling; live differences checked before proposed uploads')
    else:
        invalidate(paths)
        poll_differences(targets, responses)
    print(f'{area}: {len(changes)} uploads, {len(deletions)} deletions; unchanged objects skipped')


def fetch(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'lmctl-static-verifier/1'})
        with urllib.request.urlopen(req, timeout=45) as response:
            return response.read(), {k.lower(): v for k, v in response.headers.items()}, None
    except (urllib.error.URLError, TimeoutError) as exc:
        return b'', {}, str(exc)


def compare(key, obj, response):
    data, headers, error = response
    if error:
        return [f'missing {key}: {error}']
    findings = []
    if digest(data) != obj['sha256']:
        findings.append(f'different {key}: SHA256 differs')
    for name, field in [('content-type', 'content_type'), ('cache-control', 'cache_control')]:
        if headers.get(name, '').lower() != obj[field].lower():
            findings.append(f'{key}: {name} expected {obj[field]!r}, got {headers.get(name)!r}')
    return findings


def live_targets(expected):
    targets = dict(expected)
    if 'index.html' in targets:
        targets[''] = targets['index.html']  # CloudFront default root object
    return targets


def live_url(key):
    return os.environ.get('SITE_ORIGIN', 'https://lmctl.com').rstrip('/') + '/' + urllib.parse.quote(key, safe='/')


def fetch_targets(targets):
    keys = sorted(targets)
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        return dict(zip(keys, pool.map(fetch, map(live_url, keys))))


def differing(targets, responses):
    pending = {}
    for key, obj in targets.items():
        response = responses[key]
        if obj is None:
            error = response[2] or ''
            bad = not (error.startswith('HTTP Error 404:') or error.startswith('HTTP Error 403:'))
        else:
            bad = bool(compare(key, obj, response))
        if bad:
            pending[key] = obj
    return pending


def invalidate(keys):
    paths = sorted('/' + key for key in keys)
    for start in range(0, len(paths), 1000):
        batch = paths[start:start + 1000]
        response = aws('cloudfront', 'create-invalidation', '--distribution-id',
                       os.environ.get('CF_DISTRIBUTION_ID', 'E1GKUWTM93U7IV'), '--paths', *batch)
        print(f"invalidation {response['Invalidation']['Id']}: " + ', '.join(batch), flush=True)


def poll_differences(targets, responses, timeout=300, interval=15):
    # Retain successful responses. Re-fetch only mismatches, for about five
    # minutes, and re-invalidate the remaining paths once halfway through.
    pending = differing(targets, responses)
    started = time.monotonic()
    reinvalidated = False
    while pending:
        elapsed = time.monotonic() - started
        if elapsed >= timeout:
            raise RuntimeError('live publication did not converge: ' + ', '.join('/' + k for k in pending))
        if not reinvalidated and elapsed >= timeout / 2:
            invalidate(pending)
            reinvalidated = True
        print(f'waiting for {len(pending)} live differences: ' + ', '.join('/' + k for k in pending), flush=True)
        time.sleep(min(interval, timeout - elapsed))
        responses.update(fetch_targets(pending))
        pending = differing(pending, responses)
    return responses


def inventory_diff(expected, actual):
    return ([f'missing inventory entry {k}' for k in sorted(set(expected) - set(actual))] +
            [f'extra inventory entry {k}' for k in sorted(set(actual) - set(expected))])


def inspect_html(files, work, host):
    # The HTML parser, link discovery and anchor discovery are exclusively lmhtml.
    # Transport passes paths through a generated LMScript array, never shell/code interpolation.
    paths = [str(p) for p in files]
    driver = work / 'driver.lms'
    driver.write_text('files = ' + json.dumps("|".join(paths) + "|") + ';\n' + (ROOT / 'scripts/tools/live-links.lms').read_text())
    report = work / 'links.json'
    subprocess.run([os.environ.get('LMSCRIPT_BIN', 'lmscript'), str(driver), str(work / 'links.dslb'), str(report)], check=True, stdout=subprocess.DEVNULL)
    subprocess.run([host, '--dsl', str(work / 'links.dslb')], check=True, stdout=subprocess.DEVNULL)
    output = json.loads(report.read_text())
    return output['findings'] if isinstance(output, dict) else output


def verify(areas, repair_cdn=False):
    origin = os.environ.get('SITE_ORIGIN', 'https://lmctl.com').rstrip('/')
    parsed_origin = urllib.parse.urlsplit(origin)
    if parsed_origin.scheme not in ('http', 'https') or parsed_origin.path not in ('', '/'):
        raise ValueError('SITE_ORIGIN must be an HTTP(S) origin, without a path')
    expected = {}
    for area in areas:
        expected.update(inventory(area))
    cache = {}
    findings = []
    def url(key):
        return origin + '/' + urllib.parse.quote(key, safe='/')
    def get_many(urls):
        missing = sorted(set(urls) - set(cache))
        with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
            for address, response in zip(missing, pool.map(fetch, missing)):
                cache[address] = response
    if repair_cdn:
        targets = live_targets(expected)
        responses = fetch_targets(targets)
        invalidate(differing(targets, responses))
        poll_differences(targets, responses)
        cache.update({url(key): response for key, response in responses.items()})
    get_many(url(k) for k in expected)
    for key, obj in expected.items():
        findings.extend(compare(key, obj, cache[url(key)]))
    for area in areas:
        raw, _, error = cache[url(MANIFESTS[area])]
        if not error:
            try:
                actual = json.loads(raw)
                findings.extend(inventory_diff(set(inventory(area)) - {MANIFESTS[area]}, actual))
            except (ValueError, TypeError):
                findings.append(f'invalid published inventory: {MANIFESTS[area]}')
    if 'homepage' in areas:
        get_many([origin + '/'])
        findings.extend(compare('/', expected['index.html'], cache[origin + '/']))
    host = subprocess.check_output(['bash', str(ROOT / 'scripts/tools/run.sh'), 'host-path'], text=True).strip()
    link_count = 0
    with tempfile.TemporaryDirectory(prefix='lmctl-live-') as tmp:
        work = Path(tmp)
        schema = subprocess.check_output([host, '--schema', '--json'])
        (work / 'lmhtml.dsl.json').write_bytes(schema)
        scanned = set()
        anchors = {}
        references = []
        pending = {url(k) for k, obj in expected.items() if obj['content_type'].startswith('text/html')}
        if 'homepage' in areas:
            pending.add(origin + '/')
        # Fetch linked pages too (anchors may be on another hosted surface), but only
        # recursively expand tools/skills/homepage. Never crawl external sites.
        while pending:
            get_many(pending)
            paths = {}
            for address in sorted(pending - scanned):
                scanned.add(address)
                data, headers, error = cache[address]
                if error or 'text/html' not in headers.get('content-type', ''):
                    continue
                path = work / (digest(address.encode()) + '.html')
                path.write_bytes(data)
                paths[str(path)] = address
                anchors[address] = set()
            pending = set()
            if not paths:
                break
            records = inspect_html([Path(p) for p in paths], work, host)
            bases = {}
            for row in records:
                address = paths[row['file']]
                if row['kind'] == 'base':
                    bases.setdefault(address, urllib.parse.urljoin(address, row['message']))
                if row['kind'] == 'anchor':
                    anchors[address].add(row['message'])
            for row in records:
                if row['kind'] != 'link':
                    continue
                address = paths[row['file']]
                location = urllib.parse.urlsplit(address).path
                if not (location == '/' or location == '/index.html' or location.startswith(('/tools', '/skills', '/levels'))):
                    continue
                selector, href = row['message'].split('\t', 1)
                resolved = urllib.parse.urlsplit(urllib.parse.urljoin(bases.get(address, address), href))
                if resolved.scheme not in ('http', 'https'):
                    continue
                if resolved.netloc not in (parsed_origin.netloc, 'lmctl.com', 'www.lmctl.com'):
                    continue
                target = origin + urllib.parse.urlunsplit(('', '', resolved.path or '/', resolved.query, ''))
                references.append((address, selector, href, target, urllib.parse.unquote(resolved.fragment)))
                link_count += 1
                if target not in scanned:
                    pending.add(target)
        get_many(ref[3] for ref in references)
        for address, selector, href, target, fragment in references:
            _, _, error = cache[target]
            if error:
                findings.append(f'broken link {address} {selector}: {href}: {error}')
            elif fragment and fragment not in anchors.get(target, set()):
                findings.append(f'broken anchor {address} {selector}: {href}')
    for finding in sorted(set(findings)):
        print(finding, file=sys.stderr)
    print(f'live verification: {len(expected)} published objects, {len(scanned)} pages/resources, {link_count} internal references; {len(set(findings))} findings')
    return bool(findings)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['deploy', 'verify', 'changed'])
    parser.add_argument('areas', nargs='*')
    parser.add_argument('--repair-cdn', action='store_true', help='verify: invalidate live mismatches and poll for five minutes (AWS required)')
    args = parser.parse_args()
    if args.mode == 'changed':
        before = os.environ.get('BEFORE', '')
        after = os.environ.get('AFTER', 'HEAD')
        if not before or set(before) == {'0'} or os.environ.get('EVENT') == 'workflow_dispatch':
            print('tools skills homepage')
            return 0
        paths = subprocess.check_output(['git', 'diff', '--name-only', '-z', before, after], cwd=ROOT).decode().split('\0')
        areas = set()
        for path in paths:
            if path.startswith(('scripts/', '.github/workflows/deploy-static.yml')):
                areas.update(MANIFESTS)
            for area in MANIFESTS:
                if path.startswith(area + '/') or (area == 'skills' and path.startswith('skills-moved/')):
                    areas.add(area)
        print(' '.join(sorted(areas)))
        return 0
    areas = args.areas or list(MANIFESTS)
    if any(a not in MANIFESTS for a in areas):
        parser.error('areas must be tools, skills or homepage')
    if args.mode == 'verify':
        return verify(areas, repair_cdn=args.repair_cdn)
    for area in areas:
        deploy(area)
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (RuntimeError, ValueError, subprocess.CalledProcessError) as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
