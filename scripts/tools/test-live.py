#!/usr/bin/env python3
"""Transport comparisons plus real lmhtml discovery: no substitute HTML parser."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('static_site', HERE / 'static-site.py')
site = importlib.util.module_from_spec(spec)
spec.loader.exec_module(site)


class LiveTests(unittest.TestCase):
    def test_comparison_fixtures(self):
        obj = dict(sha256=site.digest(b'published\n'), content_type='text/html; charset=utf-8', cache_control=site.NO_CACHE)
        for fixture in json.loads((site.ROOT / 'tests/tools/live/comparison.json').read_text()):
            with self.subTest(fixture['name']):
                response = (fixture.get('body', '').encode(), {'content-type': fixture.get('type'), 'cache-control': fixture.get('cache')}, fixture.get('error'))
                self.assertEqual(len(site.compare('page.html', obj, response)), fixture['findings'])

    def test_missing_and_extra_inventory(self):
        self.assertEqual(site.inventory_diff({'a', 'b'}, {'b', 'c'}), ['missing inventory entry a', 'extra inventory entry c'])

    def test_aliases_and_notices(self):
        tools = site.inventory('tools')
        self.assertEqual(tools['tools']['data'], tools['tools/']['data'])
        self.assertEqual(tools['tools']['data'], tools['tools/index.html']['data'])
        skills = site.inventory('skills')
        self.assertEqual(skills['skills/lmctl-lead.html']['data'], skills['skills/lmctl-lead-skill.html']['data'])
        self.assertEqual(skills['skills/lmctl-lead.md']['content_type'], 'text/plain; charset=utf-8')
        self.assertNotIn('README.md', site.inventory('homepage'))
        self.assertNotIn('tools/README.md', tools)

    def test_homepage_video_inventory_types_and_cache(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'homepage/assets/videos').mkdir(parents=True)
            (root / 'homepage/assets/videos/level-1.mp4').write_bytes(b'mp4')
            (root / 'homepage/assets/videos/level-1.webm').write_bytes(b'webm')
            entries = site.inventory('homepage', root)
        self.assertEqual(entries['assets/videos/level-1.mp4']['content_type'], 'video/mp4')
        self.assertEqual(entries['assets/videos/level-1.webm']['content_type'], 'video/webm')
        self.assertEqual(entries['assets/videos/level-1.mp4']['cache_control'], site.DAY)
        self.assertEqual(entries['assets/videos/level-1.webm']['cache_control'], site.DAY)

    def test_noop_does_not_write_or_invalidate(self):
        entries = site.inventory('tools')
        calls = []
        def fake_aws(*args):
            calls.append(args)
            operation = args[1]
            if operation == 'list-objects-v2':
                return {'Contents': [{'Key': k} for k in entries]}
            key = args[args.index('--key') + 1]
            obj = entries[key]
            if operation == 'head-object':
                return dict(ETag='"' + site.hashlib.md5(obj['data'], usedforsecurity=False).hexdigest() + '"', ContentType=obj['content_type'], CacheControl=obj['cache_control'])
            if operation == 'get-object':
                Path(args[-1]).write_bytes(obj['data'])
                return {}
            self.fail('unexpected AWS mutation: ' + str(args))
        with patch.object(site, 'aws', fake_aws):
            site.deploy('tools')
        self.assertFalse(any(call[0] == 'cloudfront' for call in calls))

    def test_real_lmhtml_discovery(self):
        host = subprocess.check_output(['bash', str(HERE / 'run.sh'), 'host-path'], text=True).strip()
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            (work / 'lmhtml.dsl.json').write_bytes(subprocess.check_output([host, '--schema', '--json']))
            page = work / 'page.html'
            page.write_bytes((site.ROOT / 'tests/tools/live/links.fixture').read_bytes())
            rows = site.inspect_html([page], work, host)
            self.assertEqual({r['message'] for r in rows if r['kind'] == 'anchor'}, {'hello', 'old'})
            self.assertEqual([r['message'] for r in rows if r['kind'] == 'base'], ['/tools/demo/'])
            links = {r['message'].split('\t', 1)[1] for r in rows if r['kind'] == 'link'}
            self.assertEqual(links, {'skill.html#hello', 'https://example.org/', 'img/icon.png', 'img/poster.png', 'demo.mp4', 'missing.html#absent'})


if __name__ == '__main__':
    unittest.main()
