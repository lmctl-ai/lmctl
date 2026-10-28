#!/usr/bin/env python3
"""Validate the website-owned rich-book allow-list and local media blobs."""
import hashlib
import json
from pathlib import Path
import re
import sys
import subprocess

ROOT = Path(__file__).resolve().parents[2]
LOCK = ROOT / 'tools/lmvideo/books-lock.json'
URL = re.compile(r'^/tools/lmvideo/media/[a-z0-9][a-z0-9.-]*-([0-9a-f]{64})\.(png|mp4|webm)$')


def fail(message):
    raise ValueError(f'book media: {message}')


def check():
    policy_dir = ROOT / "build"
    policy_dir.mkdir(parents=True, exist_ok=True)
    (policy_dir / 'book-media-pages.txt').write_text('')
    (policy_dir / 'book-media-urls.txt').write_text('')
    if not LOCK.exists():
        return
    try:
        data = json.loads(LOCK.read_text(encoding='utf-8'))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        fail(f'{LOCK}: invalid JSON ({error})')
    if data.get('version') != 1 or not isinstance(data.get('books'), list) or not data['books']:
        fail(f'{LOCK}: version 1 requires a nonempty books array')
    if len(set(data['books'])) != len(data['books']) or any(not re.fullmatch(r'[a-z][a-z0-9-]*', str(x)) for x in data['books']):
        fail(f'{LOCK}: books must be unique lowercase ids')
    media = data.get('media')
    if not isinstance(media, list):
        fail(f'{LOCK}: media must be an array')
    seen = set()
    for i, item in enumerate(media):
        if not isinstance(item, dict):
            fail(f'{LOCK}: media[{i}] must be an object')
        url, sha, size, kind = item.get('url'), item.get('sha256'), item.get('bytes'), item.get('kind')
        match = URL.fullmatch(url) if isinstance(url, str) else None
        if not match or url in seen:
            fail(f'{LOCK}: media[{i}].url is duplicate or outside /tools/lmvideo/media/')
        if not isinstance(sha, str) or not re.fullmatch(r'[0-9a-f]{64}', sha):
            fail(f'{LOCK}: media[{i}].sha256 must be lowercase SHA-256')
        if match.group(1) != sha:
            fail(f'{LOCK}: media[{i}] URL digest does not match sha256')
        if not isinstance(size, int) or isinstance(size,bool) or size < 1:
            fail(f'{LOCK}: media[{i}].bytes must be positive')
        if kind not in ('png', 'mp4', 'webm'):
            fail(f'{LOCK}: media[{i}].kind must be png, mp4 or webm')
        if not url.endswith('.' + kind):
            fail(f'{LOCK}: media[{i}] kind does not match URL extension')
        seen.add(url)
        rel = Path(url.removeprefix('/tools/'))
        candidates = [ROOT / 'build/tools-media/lmvideo' / rel.name, ROOT / 'tools' / rel]
        blob = next((p for p in candidates if p.is_file() and not p.is_symlink()), None)
        if blob is None:
            fail(f'{LOCK}: missing local media for {url} (expected build/tools-media/lmvideo)')
        actual = blob.stat().st_size
        if actual != size or hashlib.sha256(blob.read_bytes()).hexdigest() != sha:
            fail(f'{LOCK}: hash/size mismatch for {url} ({blob})')
        if kind == 'png':
            raw = blob.read_bytes()
            if raw[:8] != b'\x89PNG\r\n\x1a\n' or raw[12:16] != b'IHDR':
                fail(f'{LOCK}: {url} is not a valid PNG')
            width = int.from_bytes(raw[16:20], 'big'); height = int.from_bytes(raw[20:24], 'big')
            if (item.get('width') is not None and item.get('width') != width) or (item.get('height') is not None and item.get('height') != height):
                fail(f'{LOCK}: PNG dimensions do not match lock for {url}')
    for item in media:
        if item['kind'] == 'png': continue
        blob = ROOT / 'build/tools-media/lmvideo' / Path(item['url']).name
        if not blob.is_file(): blob = ROOT / item['url'].lstrip('/')
        try:
            probe = json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(blob)], timeout=30, stderr=subprocess.PIPE))
            streams = probe.get('streams',[])
            videos = [x for x in streams if x.get('codec_type')=='video']
            if len(videos)!=1 or any(x.get('codec_type')=='audio' for x in streams) or item.get('no_audio') is not True:
                fail('only locked silent single-stream book video is supported: '+item['url'])
            if (videos[0]['width'],videos[0]['height']) != (item.get('width'),item.get('height')) or abs(float(probe['format']['duration'])-item.get('duration_seconds',-1)) > .05:
                fail('book video dimensions/duration differ: '+item['url'])
        except (OSError, subprocess.SubprocessError, KeyError, TypeError, json.JSONDecodeError) as error:
            fail('invalid book video '+item['url']+': '+str(error))
    pages = []
    for book in data['books']:
        directory = ROOT / 'tools' / 'lmvideo' / book
        if directory.is_dir():
            pages.extend(str(path.relative_to(ROOT)) for path in sorted(directory.glob('*.html')))
    (policy_dir / 'book-media-pages.txt').write_text(''.join(path + '|' for path in pages))
    (policy_dir / 'book-media-urls.txt').write_text(''.join(url + '|' for url in sorted(seen)))


if __name__ == '__main__':
    try:
        check()
    except ValueError as error:
        print(error, file=sys.stderr)
        raise SystemExit(1)
