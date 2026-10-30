#!/usr/bin/env python3
"""Stage a locked website media bundle on fresh manual-workflow runners."""
import hashlib
import json
from pathlib import Path
import re
import tarfile
import tempfile

ROOT=Path(__file__).resolve().parents[2]


def stage(lock, bundle, cache):
    expected={Path(m['url']).name:m for m in lock['media']}
    for name,m in expected.items():
        if not re.fullmatch(r'[a-z0-9][a-z0-9.-]*-'+m['sha256']+r'\.'+m['kind'],name) or not isinstance(m['bytes'],int) or not 0 < m['bytes'] <= 50*1024*1024:
            raise ValueError('invalid locked media name/size')
    def valid(path,m):
        return path.is_file() and not path.is_symlink() and path.stat().st_size==m['bytes'] and hashlib.sha256(path.read_bytes()).hexdigest()==m['sha256']
    if all(valid(cache/name,m) for name,m in expected.items()): return
    cache.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.book-media-',dir=cache.parent) as td:
        pending=Path(td);seen=set()
        with tarfile.open(bundle,'r:gz') as archive:
            for entry in archive:
                name=entry.name
                if name not in expected or name in seen or not entry.isfile() or entry.size!=expected[name]['bytes']:
                    raise ValueError('unexpected, duplicate or unsafe media bundle entry: '+name)
                seen.add(name)
                with archive.extractfile(entry) as stream: data=stream.read(entry.size+1)
                if len(data)!=entry.size or hashlib.sha256(data).hexdigest()!=expected[name]['sha256']:
                    raise ValueError('media bundle hash mismatch: '+name)
                (pending/name).write_bytes(data)
        if seen!=set(expected): raise ValueError('media bundle is incomplete')
        for name in sorted(seen): (pending/name).replace(cache/name)


def main():
    lock=json.loads((ROOT/'tools/lmvideo/books-lock.json').read_text())
    version=lock.get('released_version','')
    if not re.fullmatch(r'[0-9]+\.[0-9]+\.[0-9]+',version): raise ValueError('book lock has no released runtime version')
    bundle=ROOT/'build-inputs/lmvideo'/('media-'+version+'.tar.gz')
    cache=ROOT/'build/tools-media/lmvideo'
    stage(lock,bundle,cache)
    print(f'Staged and verified {len(lock["media"])} locked book media files')


if __name__=='__main__': main()
