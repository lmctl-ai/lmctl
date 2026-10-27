#!/usr/bin/env python3
"""Import a bounded public example manifest; lmhtml owns all page rendering."""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
NAME = re.compile(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*\Z')
SHA = re.compile(r'[0-9a-f]{64}\Z')


def run(*args, **kw):
    try:
        return subprocess.run(args, check=True, text=True, **kw)
    except subprocess.CalledProcessError as error:
        if error.stdout:
            print(error.stdout, file=sys.stderr)
        raise


def digest(data):
    return hashlib.sha256(data).hexdigest()


def tracked(repo, ref, path):
    p = PurePosixPath(path)
    if p.is_absolute() or '..' in p.parts or str(p) != path or '\\' in path:
        raise ValueError(f'unsafe source path: {path}')
    mode = subprocess.check_output(['git', '-C', str(repo), 'ls-tree', ref, '--', path], text=True)
    if not mode.startswith('100644 blob ') and not mode.startswith('100755 blob '):
        raise ValueError(f'not a tracked regular file: {path}')
    data = subprocess.check_output(['git', '-C', str(repo), 'show', f'{ref}:{path}'])
    if len(data) > 153600:
        raise ValueError(f'file exceeds 150 KiB: {path}')
    return data


def validate(m, tool):
    if m.get('version') != 1 or m.get('tool') != tool or m.get('repository') != f'https://github.com/lmctl-ai/{tool}':
        raise ValueError('manifest version/tool/repository mismatch')
    if not isinstance(m.get('examples'), list) or not 1 <= len(m['examples']) <= 100:
        raise ValueError('manifest must contain 1..100 examples')
    seen = set()
    for e in m['examples']:
        slug = e.get('slug', '')
        if not NAME.fullmatch(slug) or slug == 'index' or slug in seen:
            raise ValueError(f'bad or duplicate slug: {slug}')
        seen.add(slug)
        for key in ('title', 'description', 'alt', 'stdout', 'licence'):
            if not isinstance(e.get(key), str) or not e[key].strip() or len(e[key]) > 4000:
                raise ValueError(f'invalid {key} for {slug}')
        if e['licence'] != 'MIT' or m.get('licence') != 'MIT':
            raise ValueError('pilot accepts audited MIT examples only; extend policy explicitly')
        if e.get('script') != f'examples/{slug}.lms' or not e.get('image', '').endswith('.png'):
            raise ValueError('scripts must match slug; previews must be PNG')
        for key in ('script_sha256', 'image_sha256'):
            if not SHA.fullmatch(e.get(key, '')):
                raise ValueError(f'invalid {key}')
    for key in ('title', 'description'):
        if not isinstance(m.get(key), str) or not m[key].strip():
            raise ValueError(f'missing manifest {key}')


def import_tool(tool, ref, source=None):
    if not NAME.fullmatch(tool):
        raise ValueError('tool must be a lowercase slug')
    if ref.startswith('-') or not re.fullmatch(r'[a-zA-Z0-9_./-]+', ref):
        raise ValueError('invalid Git ref')
    with tempfile.TemporaryDirectory(prefix='lmtools-pull-') as td:
        work = Path(td)
        repo = Path(source).resolve() if source else work / 'source'
        if not source:
            run('git', 'init', '-q', str(repo))
            run('git', '-C', str(repo), 'fetch', '--depth=1', f'https://github.com/lmctl-ai/{tool}.git', ref)
            ref = 'FETCH_HEAD'
        commit = subprocess.check_output(['git', '-C', str(repo), 'rev-parse', '--verify', f'{ref}^{{commit}}'], text=True).strip()
        raw = tracked(repo, commit, 'examples/manifest.json')
        m = json.loads(raw)
        validate(m, tool)
        out = work / 'examples'
        (out / 'img').mkdir(parents=True)
        (out / 'source').mkdir()
        inputs = {}
        compiler = os.environ.get('LMSCRIPT_BIN', 'lmscript')
        template = ROOT / 'scripts/tools/example-page.lms'
        raw_base = f'https://raw.githubusercontent.com/lmctl-ai/{tool}/{commit}/'
        for e in sorted(m['examples'], key=lambda e: e['slug']):
            for key in ('script', 'image'):
                data = tracked(repo, commit, e[key])
                if digest(data) != e[key + '_sha256']:
                    raise ValueError(f'hash mismatch: {e[key]}')
                inputs[e[key]] = digest(data)
                if key == 'image':
                    if not data.startswith(b'\x89PNG\r\n\x1a\n') or len(data) >= 30000:
                        raise ValueError('preview must be a PNG under 30000 bytes; prepare it upstream')
                    target = out / 'img' / (e['slug'] + '.png')
                else:
                    data.decode('utf-8')
                    target = out / 'source' / (e['slug'] + '.lms')
                target.write_bytes(data)
            args = [str(work/'page.dslb'), str(out/(e['slug']+'.html')), e['title'], e['description'], str(out/'source'/(e['slug']+'.lms')), raw_base+e['script'], f'/tools/{tool}/examples/img/{e["slug"]}.png', e['alt'], e['stdout'], '', tool]
            run(compiler, str(template), *args, cwd=ROOT, stdout=subprocess.DEVNULL)
            host = Path(args[0] + '.host').read_text().strip()
            run(host, '--dsl', args[0], cwd=work, stdout=subprocess.PIPE)
        args = [str(work/'page.dslb'), str(out/'index.html'), m['title'], m['description'], '', '', '', '', '', str(out), tool]
        run(compiler, str(template), *args, cwd=ROOT, stdout=subprocess.DEVNULL)
        run(host, '--dsl', args[0], cwd=work, stdout=subprocess.PIPE)
        lock = {'version': 1, 'repository': m['repository'], 'commit': commit, 'manifest_sha256': digest(raw), 'inputs': dict(sorted(inputs.items())), 'template_sha256': digest(template.read_bytes()), 'renderer': {'version': subprocess.check_output([host, '--version'], text=True).strip(), 'sha256': digest(Path(host).read_bytes())}, 'compiler': subprocess.check_output([compiler, '--version'], text=True).strip()}
        (out/'source-lock.json').write_text(json.dumps(lock, indent=2)+'\n')
        destination = ROOT/'tools'/tool/'examples'
        # Never delete authored pages or an older example book without an explicit migration.
        if destination.exists() and not (destination/'source-lock.json').is_file():
            raise ValueError(f'unowned destination: {destination}')
        # Replace only the dedicated importer-owned subtree after every page succeeds.
        # No writes to authored overview/skill pages or unrelated tools.
        destination.parent.mkdir(parents=True, exist_ok=True)
        if destination.is_symlink():
            raise ValueError('refusing symlink destination')
        replacement = destination.parent / '.examples-import-new'
        backup = destination.parent / '.examples-import-old'
        if replacement.exists() or backup.exists():
            raise ValueError('unfinished import detected; inspect .examples-import-* first')
        shutil.copytree(out, replacement)
        if destination.exists():
            destination.rename(backup)
        try:
            replacement.rename(destination)
        except OSError:
            if backup.exists():
                backup.rename(destination)
            raise
        if backup.exists():
            shutil.rmtree(backup)
        print(f'{tool}: imported {len(m["examples"])} examples at {commit}; run decorate:tools and check:tools')


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('tool')
    p.add_argument('--ref', default='main')
    p.add_argument('--source', help='offline tracked Git checkout; reads committed blobs only')
    a = p.parse_args()
    import_tool(a.tool, a.ref, a.source)


if __name__ == '__main__':
    main()
