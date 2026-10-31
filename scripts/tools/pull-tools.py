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
SCHEMA = ROOT / 'scripts/tools/content-manifest-v1.schema.json'
FEATURED_MAX = 6


def run(*args, **kw):
    try:
        return subprocess.run(args, check=True, text=True, **kw)
    except subprocess.CalledProcessError as error:
        if error.stdout:
            print(error.stdout, file=sys.stderr)
        raise


def digest(data):
    return hashlib.sha256(data).hexdigest()


def parse_manifest(raw, source_label):
    try:
        if isinstance(raw, bytes):
            raw = raw.decode('utf-8')
        return json.loads(raw)
    except UnicodeDecodeError as error:
        raise ManifestError(f'{source_label}: manifest must be valid UTF-8: {error.reason}') from error
    except json.JSONDecodeError as error:
        raise ManifestError(f'{source_label}: JSON syntax error at line {error.lineno}, column {error.colno}: {error.msg}') from error


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


FEATURED_MAX = 6


class ManifestError(ValueError):
    """A content-manifest problem, reported against the tool repository file that holds it."""


def schema_errors(value, schema, root, where='$'):
    """Validate the JSON Schema subset used by content-manifest-v1 (no third-party dependency)."""
    allowed = {'$schema', '$id', '$defs', '$ref', 'title', 'description', 'type', 'const', 'enum',
               'additionalProperties', 'required', 'properties', 'items', 'minLength', 'maxLength',
               'minItems', 'maxItems', 'pattern'}
    unknown_schema = set(schema) - allowed
    if unknown_schema:
        return [f'{where}: unsupported schema keyword(s): {sorted(unknown_schema)}']
    if '$ref' in schema:
        if set(schema) - {'$ref', 'title'}:
            return [f'{where}: schema reference siblings are not supported']
        ref = schema['$ref']
        if not ref.startswith('#/$defs/') or ref.rsplit('/', 1)[1] not in root.get('$defs', {}):
            return [f'{where}: unsupported schema reference {ref}']
        return schema_errors(value, root['$defs'][ref.rsplit('/', 1)[1]], root, where)
    if 'const' in schema and value != schema['const']:
        return [f'{where}: must be {json.dumps(schema["const"])}']
    if 'enum' in schema and value not in schema['enum']:
        return [f'{where}: must be one of {", ".join(map(json.dumps, schema["enum"]))}']
    kind = schema.get('type')
    types = {'object': dict, 'array': list, 'string': str, 'integer': int, 'boolean': bool}
    if kind is not None and kind not in types:
        return [f'{where}: unsupported or missing schema type {kind!r}']
    if kind and (not isinstance(value, types[kind]) or (kind == 'integer' and isinstance(value, bool))):
        return [f'{where}: expected {kind}; must be a JSON {kind}']
    errors = []
    if kind == 'string':
        if len(value) < schema.get('minLength', 0) or len(value) > schema.get('maxLength', 10**9):
            errors.append(f'{where}: length must be {schema.get("minLength", 0)}..{schema.get("maxLength", "any")}')
        if 'pattern' in schema and not re.search(schema['pattern'], value):
            errors.append(f'{where}: does not match {schema["pattern"]}')
    if kind == 'array':
        if not schema.get('minItems', 0) <= len(value) <= schema.get('maxItems', 10**9):
            errors.append(f'{where}: must have {schema.get("minItems", 0)}..{schema.get("maxItems", "any")} items')
        for n, item in enumerate(value):
            errors += schema_errors(item, schema['items'], root, f'{where}[{n}]')
    if kind == 'object':
        props = schema.get('properties', {})
        for key in schema.get('required', []):
            if key not in value:
                errors.append(f'{where}: missing required property "{key}" (missing required field "{key}")')
        for key, item in value.items():
            if key in props:
                errors += schema_errors(item, props[key], root, f'{where}.{key}')
            elif schema.get('additionalProperties') is False:
                hint = ' (presentation belongs to lmctl-ai/lmctl, not the content manifest)' if re.search(r'html|css|class|style|layout|template|page|nav', key, re.I) else ''
                errors.append(f'{where}: unknown field "{key}"{hint}')
    return errors


def validate_schema(value, schema, path, source_label, root):
    """Compatibility wrapper exposing the fail-closed subset validator to tests."""
    errors = schema_errors(value, schema, root, path)
    if errors:
        raise ValueError(f'{source_label}: ' + '; '.join(errors))


def validate(m, tool, origin=None):
    """Check a parsed manifest against the versioned schema and site policy; raise one error listing every problem."""
    origin = origin or f'lmctl-ai/{tool}:examples/manifest.json'
    if not isinstance(m, dict) or m.get('version') != 1:
        raise ManifestError(f'{origin}: $.version: unsupported manifest version {json.dumps(m.get("version") if isinstance(m, dict) else None)} (this importer reads version 1)')
    schema = json.loads(SCHEMA.read_text())
    errors = schema_errors(m, schema, schema)
    if not errors:
        if m['tool'] != tool:
            errors.append(f'$.tool: "{m["tool"]}" does not match the requested tool "{tool}"')
        if m['repository'] != f'https://github.com/lmctl-ai/{tool}':
            errors.append(f'$.repository: must be https://github.com/lmctl-ai/{tool}')
        seen = set()
        for n, e in enumerate(m['examples']):
            if e['slug'] == 'index' or e['slug'] in seen:
                errors.append(f'$.examples[{n}].slug: "{e["slug"]}" is reserved or duplicated')
            seen.add(e['slug'])
            if e['script'] != f'examples/{e["slug"]}.lms':
                errors.append(f'$.examples[{n}].script: must be examples/{e["slug"]}.lms')
            parts = PurePosixPath(e['image']).parts
            if '..' in parts or e['image'].startswith('/'):
                errors.append(f'$.examples[{n}].image: must stay inside the repository')
        featured = [e['slug'] for e in m['examples'] if e.get('featured')]
        if len(featured) > FEATURED_MAX:
            errors.append(f'$.examples: {len(featured)} featured examples, at most {FEATURED_MAX} (README storefront rule)')
    if errors:
        manifest_path = origin.split(':', 1)[-1]
        details = '\n  '.join(f'{manifest_path}:{error}' for error in errors)
        raise ManifestError(f'{origin}: invalid content manifest:\n  ' + details)


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
        origin = f'lmctl-ai/{tool}@{commit}:examples/manifest.json'
        def source_blob(path):
            try:
                return tracked(repo, commit, path)
            except (ValueError, subprocess.CalledProcessError) as error:
                raise ManifestError(f'lmctl-ai/{tool}@{commit}:{path}: {error}') from error
        raw = source_blob('examples/manifest.json')
        m = parse_manifest(raw, origin)
        validate(m, tool, origin)
        out = work / 'examples'
        (out / 'img').mkdir(parents=True)
        (out / 'source').mkdir()
        inputs = {}
        compiler = os.environ.get('LMSCRIPT_BIN', 'lmscript')
        template = ROOT / 'scripts/tools/example-page.lms'
        raw_base = f'https://raw.githubusercontent.com/lmctl-ai/{tool}/{commit}/'
        for e in sorted(m['examples'], key=lambda e: e['slug']):
            for key in ('script', 'image'):
                data = source_blob(e[key])
                if digest(data) != e[key + '_sha256']:
                    raise ManifestError(f'{origin}: $.examples[slug={e["slug"]}].{key}_sha256 does not match source file {e[key]}')
                inputs[e[key]] = digest(data)
                if key == 'image':
                    if not data.startswith(b'\x89PNG\r\n\x1a\n') or len(data) >= 30000:
                        raise ManifestError(f'lmctl-ai/{tool}:{e["image"]}: preview must be a PNG under 30000 bytes; prepare it upstream')
                    target = out / 'img' / (e['slug'] + '.png')
                else:
                    try:
                        data.decode('utf-8')
                    except UnicodeDecodeError as error:
                        raise ManifestError(f'lmctl-ai/{tool}@{commit}:{e[key]}: script must be valid UTF-8') from error
                    target = out / 'source' / (e['slug'] + '.lms')
                target.write_bytes(data)
            args = [str(work/'page.dslb'), str(out/(e['slug']+'.html')), e['title'], e['description'], str(out/'source'/(e['slug']+'.lms')), raw_base+e['script'], f'/tools/{tool}/examples/img/{e["slug"]}.png', e['alt'], e.get('stdout', '(stdout not recorded in this inventory)'), '', tool]
            run(compiler, str(template), *args, cwd=ROOT, stdout=subprocess.DEVNULL)
            host = Path(args[0] + '.host').read_text().strip()
            run(host, '--lmcode', args[0], cwd=work, stdout=subprocess.PIPE)
        args = [str(work/'page.dslb'), str(out/'index.html'), m['title'], m['description'], '', '', '', '', '', str(out), tool]
        run(compiler, str(template), *args, cwd=ROOT, stdout=subprocess.DEVNULL)
        run(host, '--lmcode', args[0], cwd=work, stdout=subprocess.PIPE)
        lock = {'version': 1, 'repository': m['repository'], 'commit': commit, 'manifest_sha256': digest(raw), 'schema_sha256': digest(SCHEMA.read_bytes()), 'inputs': dict(sorted(inputs.items())), 'template_sha256': digest(template.read_bytes()), 'renderer': {'version': subprocess.check_output([host, '--version'], text=True).strip(), 'sha256': digest(Path(host).read_bytes())}, 'compiler': subprocess.check_output([compiler, '--version'], text=True).strip()}
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
    p.add_argument('--books', action='store_true', help='pull the mixed-media book content profile')
    p.add_argument('--media-store', help='local hash-verified render store for --books')
    p.add_argument('--released-version', help='current published runtime version for book installation notices')
    a = p.parse_args()
    if a.books:
        if not a.media_store:
            p.error('--books requires --media-store')
        args = [sys.executable, str(Path(__file__).with_name('pull-books.py')), a.tool, '--ref', a.ref, '--media-store', a.media_store]
        if a.source: args += ['--source', a.source]
        if a.released_version: args += ['--released-version', a.released_version]
        raise SystemExit(subprocess.call(args))
    try:
        import_tool(a.tool, a.ref, a.source)
    except ManifestError as error:
        sys.exit(f'pull:tools: {error}')


if __name__ == '__main__':
    main()
