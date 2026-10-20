#!/usr/bin/env python3
"""Exercise the thin Markdown memory workflow against isolated notes."""
from pathlib import Path
import importlib.util
import os
import shutil
import subprocess
import tempfile
import sys
sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
RUN = ROOT / 'scripts/memory/run.sh'
HOST = os.environ.get('LMHTML') or subprocess.check_output(['bash', str(ROOT/'scripts/tools/run.sh'), 'host-path'], text=True).strip()
count = 0

def run(*args, expected=None):
    global count
    result = subprocess.run(['bash', str(RUN), *map(str,args)], cwd=ROOT, env={**os.environ, 'LMHTML': HOST}, capture_output=True, text=True)
    text = result.stdout + result.stderr
    if expected is None:
        assert result.returncode == 0, text
    else:
        assert result.returncode != 0 and expected in text, text
    count += 1

def snapshot(directory):
    return {p.relative_to(directory).as_posix():p.read_bytes() for p in directory.rglob('*') if p.is_file()}

(ROOT/'build').mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(dir=ROOT/'build', prefix='memory-markdown-') as tmp:
    work = Path(tmp); notes=work/'notes'
    shutil.copytree(ROOT/'tests/memory/notes',notes)
    run('index',notes,'--check',expected='index drift')
    run('index',notes)
    first=(notes/'index.md').read_bytes(); stamp=(notes/'index.md').stat().st_mtime_ns
    assert first.startswith(b'<!-- generated-by: lmhtml index -->\n# Index')
    assert first.index(b'alpha.md') < first.index(b'beta.md')
    run('index',notes); assert (notes/'index.md').stat().st_mtime_ns==stamp
    run('check',notes)
    alpha=(notes/'alpha.md').read_text()
    (notes/'alpha.md').write_text(alpha.replace('Alpha summary.', 'Changed summary.'))
    run('check',notes,expected='index drift')
    run('index',notes); run('check',notes)
    (notes/'beta.md').rename(work/'beta.md')
    run('index',notes); run('check',notes,expected='broken link')
    (work/'beta.md').rename(notes/'beta.md');run('index',notes)
    (notes/'alpha.md').write_text(alpha+'\n\U0001f600\n')
    run('index',notes);run('check',notes,expected='emoji U+1F600')
    (notes/'alpha.md').write_text(alpha)
    (notes/'leftover.html').write_text('<h1>Old profile</h1>')
    run('index',notes);run('check',notes,expected='HTML notes are retired')
    (notes/'leftover.html').unlink()
    (notes/'index.md').write_text('Read [index.html](index.html) first.\n')
    run('check',notes,expected='index drift')
    run('index',notes);run('check',notes)
    source=snapshot(notes);out=work/'web'
    run('web',notes,out)
    first_web=snapshot(out)
    assert b'beta.html#details' in first_web['alpha.html']
    assert b'/tools/style.css' in first_web['index.html']
    run('web',notes,out);assert snapshot(out)==first_web and snapshot(notes)==source
    run('web',notes,notes/'output',expected='must not overlap')
    (notes/'index.md').unlink();run('web',notes,work/'without-index')
    assert (work/'without-index/index.html').exists() and not (notes/'index.md').exists()

spec=importlib.util.spec_from_file_location('memory_policy',ROOT/'scripts/memory/check.py')
policy=importlib.util.module_from_spec(spec);spec.loader.exec_module(policy)
assert all(policy.pictographic(c) for c in (0x1F600,0x2600,0x2B50,0x231A,0x23E9,0xFE0F,0xE0020))
assert all(not policy.pictographic(c) for c in (ord('A'),0x2014,0x2192,0x2500,0x25A0))
print(f'PASS: {count} Markdown memory checks plus emoji policy boundaries')
