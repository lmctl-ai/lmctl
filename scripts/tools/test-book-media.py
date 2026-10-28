import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('book_media', Path(__file__).with_name('check-book-media.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class BookMedia(unittest.TestCase):
    def test_valid_lock_and_blob(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td); blob = root / 'build/tools-media/lmvideo'; blob.mkdir(parents=True)
            payload = b'video-fixture'; name = 'hero-' + hashlib.sha256(payload).hexdigest() + '.mp4'; (blob / name).write_bytes(payload)
            lock = root / 'tools/lmvideo'; lock.mkdir(parents=True)
            (lock / 'books-lock.json').write_text(json.dumps({'version': 1, 'books': ['showcase'], 'media': [{'url': '/tools/lmvideo/media/' + name, 'sha256': hashlib.sha256(payload).hexdigest(), 'bytes': len(payload), 'kind': 'mp4', 'width': 10, 'height': 10, 'duration_seconds': 1, 'no_audio': True}]}))
            old_root, old_lock = m.ROOT, m.LOCK; m.ROOT, m.LOCK = root, lock / 'books-lock.json'
            try:
                with patch.object(m.subprocess, 'check_output', return_value=json.dumps({'streams':[{'codec_type':'video','width':10,'height':10}], 'format':{'duration':'1'}}).encode()): m.check()
                with patch.object(m.subprocess, 'check_output', return_value=json.dumps({'streams':[{'codec_type':'video','width':10,'height':10},{'codec_type':'audio'}], 'format':{'duration':'1'}}).encode()):
                    with self.assertRaisesRegex(ValueError,'silent single-stream'): m.check()
                with patch.object(m.subprocess, 'check_output', side_effect=m.subprocess.TimeoutExpired('ffprobe',30)):
                    with self.assertRaisesRegex(ValueError,'invalid book video'): m.check()
            finally: m.ROOT, m.LOCK = old_root, old_lock

    def test_rejects_unallowlisted_url_and_missing_blob(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td); lock = root / 'tools/lmvideo'; lock.mkdir(parents=True)
            (lock / 'books-lock.json').write_text(json.dumps({'version': 1, 'books': ['showcase'], 'media': [{'url': 'https://evil.test/x.png', 'sha256': '0'*64, 'bytes': 1, 'kind': 'png'}]}))
            old_root, old_lock = m.ROOT, m.LOCK; m.ROOT, m.LOCK = root, lock / 'books-lock.json'
            try:
                with self.assertRaisesRegex(ValueError, 'outside /tools/lmvideo/media'):
                    m.check()
            finally: m.ROOT, m.LOCK = old_root, old_lock


if __name__ == '__main__': unittest.main()
