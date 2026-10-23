#!/usr/bin/env python3
"""Transport comparisons plus real lmhtml discovery: no substitute HTML parser."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
import sys
sys.dont_write_bytecode = True
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('static_site', HERE / 'static-site.py')
site = importlib.util.module_from_spec(spec)
spec.loader.exec_module(site)


class LiveTests(unittest.TestCase):
    def test_lmchat_and_lmmail_skill_pages_document_collection_deletes(self):
        skills = site.inventory('skills')
        chat = skills['skills/lmchat-skill.html']['data'].decode()
        mail = skills['skills/lmmail-skill.html']['data'].decode()
        self.assertIn('DELETE "$API/rooms/$ROOM"', chat)
        self.assertIn('{"deleted":true,"room_name":"bug-issue-42"}', chat)
        self.assertIn('DELETE "$API/mailboxes/build-owner"', mail)
        self.assertIn('"messages_deleted":2', mail)

    def test_device_login_docs_are_published_and_indexed(self):
        skills = site.inventory('skills')
        page = skills['skills/device-login.html']['data'].decode()
        index = skills['skills/index.html']['data'].decode()
        self.assertIn('short, one-time code', page)
        self.assertIn('skills/device-login.html', index)

    def test_comparison_fixtures(self):
        obj = dict(sha256=site.digest(b'published\n'), content_type='text/html; charset=utf-8', cache_control=site.NO_CACHE)
        for fixture in json.loads((site.ROOT / 'tests/tools/live/comparison.json').read_text()):
            with self.subTest(fixture['name']):
                response = (fixture.get('body', '').encode(), {'content-type': fixture.get('type'), 'cache-control': fixture.get('cache')}, fixture.get('error'))
                self.assertEqual(len(site.compare('page.html', obj, response)), fixture['findings'])

    def test_onboarding_catalog_paths_select_their_managed_deploys(self):
        self.assertEqual(site.changed_areas(["helloexample/hello.lms"]), {"helloexample"})
        self.assertEqual(site.changed_areas(["autorun/index.txt"]), {"autorun"})
        self.assertEqual(site.changed_areas(["scripts/deploy-helloexample.sh"]), set(site.MANIFESTS))

    def test_onboarding_catalog_inventory_types(self):
        hello = site.inventory("helloexample")
        self.assertEqual(hello["helloexample/index.txt"]["content_type"], "text/plain; charset=utf-8")
        self.assertEqual(hello["helloexample/claude.lms"]["cache_control"], site.NO_CACHE)
        self.assertEqual(hello["helloexample/claude.lmctl"]["content_type"], "text/plain; charset=utf-8")
        autorun = site.inventory("autorun")
        self.assertEqual(autorun["autorun/index.txt"]["content_type"], "text/plain; charset=utf-8")
        self.assertEqual(autorun["autorun/index.html"]["content_type"], "text/html; charset=utf-8")

    def test_lmscript_site_is_incremental_and_preserves_commands(self):
        self.assertEqual(site.changed_areas(["lmscript-site/examples/hello-vars.lms"]), {"lmscript"})
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "lmscript-site/examples").mkdir(parents=True)
            (root / "lmscript-site/index.html").write_text("index")
            (root / "lmscript-site/img").mkdir()
            (root / "lmscript-site/img/diagram.png").write_bytes(b"png")
            (root / "lmscript-site/examples/hello.lms").write_text("script")
            entries = site.inventory("lmscript", root)
        self.assertEqual(entries["lmscript/index.html"]["data"], b"index")
        self.assertEqual(entries["lmscript/examples/hello.lms"]["content_type"], "text/plain; charset=utf-8")
        self.assertEqual(entries["lmscript/examples/hello.lms"]["cache_control"], site.NO_CACHE)
        self.assertEqual(entries["lmscript/img/diagram.png"]["content_type"], "image/png")
        self.assertEqual(entries["lmscript/img/diagram.png"]["cache_control"], site.DAY)
        self.assertEqual(entries["lmscript"]["data"], b"index")
        self.assertEqual(entries["lmscript/"]["data"], b"index")
        self.assertNotIn("lmscript/commands/index.html", entries)

    def test_missing_and_extra_inventory(self):
        self.assertEqual(site.inventory_diff({'a', 'b'}, {'b', 'c'}), ['missing inventory entry a', 'extra inventory entry c'])

    def test_aliases_and_notices(self):
        tools = site.inventory('tools')
        self.assertNotIn('tools/lmcad/book.json', tools)
        self.assertEqual(tools['tools']['data'], tools['tools/']['data'])
        self.assertEqual(tools['tools']['data'], tools['tools/index.html']['data'])
        skills = site.inventory('skills')
        self.assertEqual(skills['skills/lmctl-lead.html']['data'], skills['skills/lmctl-lead-skill.html']['data'])
        self.assertEqual(skills['skills/lmctl-lead.md']['content_type'], 'text/plain; charset=utf-8')
        self.assertNotIn('README.md', site.inventory('homepage'))
        self.assertNotIn('tools/README.md', tools)

    def test_tools_quickrun_sources_are_plain_text_and_revalidate(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'tools/lmdraw').mkdir(parents=True)
            (root / 'tools/lmdraw/lmdraw_solo.lms').write_text('p = _dsl_ cli="lmdraw";\n')
            entries = site.inventory('tools', root)
        obj = entries['tools/lmdraw/lmdraw_solo.lms']
        self.assertEqual(obj['content_type'], 'text/plain; charset=utf-8')
        self.assertEqual(obj['cache_control'], site.NO_CACHE)

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
        with patch.object(site, 'aws', fake_aws), patch.object(site, 'fetch_targets', side_effect=lambda targets: {k: (v['data'], {'content-type': v['content_type'], 'cache-control': v['cache_control']}, None) for k, v in targets.items()}):
            site.deploy('tools')
        self.assertFalse(any(call[0] == 'cloudfront' for call in calls))

    def test_levels_aliases(self):
        entries = site.inventory('homepage')
        for key in ('levels', 'levels/'):
            self.assertEqual(entries[key], entries['levels/index.html'])
            self.assertIn(key, site.live_targets(entries))
        self.assertEqual(site.live_targets(entries)[''], entries['index.html'])

    def test_stale_edge_with_current_s3(self):
        entries = site.inventory('homepage')
        calls = []
        def fake_aws(*args):
            calls.append(args)
            if args[0] == 'cloudfront':
                return {'Invalidation': {'Id': 'fixture'}}
            operation = args[1]
            if operation == 'list-objects-v2':
                prefix = args[args.index('--prefix') + 1] if '--prefix' in args else ''
                keys = [k for k in entries if k.startswith(prefix) and ('--delimiter' not in args or '/' not in k)]
                return {'Contents': [{'Key': k} for k in keys]}
            obj = entries[args[args.index('--key') + 1]]
            if operation == 'head-object':
                return dict(ETag=site.hashlib.md5(obj['data'], usedforsecurity=False).hexdigest(), ContentType=obj['content_type'], CacheControl=obj['cache_control'])
            if operation == 'get-object':
                Path(args[-1]).write_bytes(obj['data'])
                return {}
            self.fail('unexpected S3 write: ' + str(args))
        def stale(targets):
            responses = {k: (v['data'], {'content-type': v['content_type'], 'cache-control': v['cache_control']}, None) for k, v in targets.items()}
            data, headers, error = responses['assets/style.css']
            responses['assets/style.css'] = (b'old cached CSS', headers, error)
            return responses
        with patch.object(site, 'aws', fake_aws), patch.object(site, 'fetch_targets', side_effect=stale), patch.object(site, 'poll_differences'):
            site.deploy('homepage')
        invalidations = [c for c in calls if c[0] == 'cloudfront']
        self.assertEqual(len(invalidations), 1)
        self.assertEqual(invalidations[0][invalidations[0].index('--paths') + 1:], ('/assets/style.css',))
        calls.clear()
        with patch.dict(site.os.environ, {'DRY_RUN': '1'}), patch.object(site, 'aws', fake_aws), patch.object(site, 'fetch_targets', side_effect=stale), patch.object(site, 'poll_differences') as poll:
            site.deploy('homepage')
        self.assertFalse(any(c[0] == 'cloudfront' for c in calls))
        poll.assert_not_called()

    def test_poll_only_differing_paths_and_reinvalidate_once(self):
        obj = dict(data=b'new', sha256=site.digest(b'new'), content_type='text/css', cache_control=site.DAY)
        good = (b'new', {'content-type': 'text/css', 'cache-control': site.DAY}, None)
        bad = (b'old', good[1], None)
        targets = {'fresh.css': obj, 'stale.css': obj}
        responses = {'fresh.css': good, 'stale.css': bad}
        with patch.object(site.time, 'monotonic', side_effect=[0, 0, 150, 200]), patch.object(site.time, 'sleep'), patch.object(site, 'invalidate') as invalidate, patch.object(site, 'fetch_targets', side_effect=[{'stale.css': bad}, {'stale.css': bad}, {'stale.css': good}]) as fetch:
            site.poll_differences(targets, responses)
        invalidate.assert_called_once_with({'stale.css': obj})
        self.assertTrue(all(set(c.args[0]) == {'stale.css'} for c in fetch.call_args_list))
        self.assertEqual(responses['stale.css'], good)
        with patch.object(site.time, 'monotonic', side_effect=[0, 300]):
            with self.assertRaisesRegex(RuntimeError, 'did not converge: /stale.css'):
                site.poll_differences({'stale.css': obj}, {'stale.css': bad})

    def test_real_lmhtml_discovery(self):
        host = subprocess.check_output(['bash', str(HERE / 'run.sh'), 'host-path'], text=True).strip()
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            page = work / 'page.html'
            page.write_bytes((site.ROOT / 'tests/tools/live/links.fixture').read_bytes())
            rows = site.inspect_html([page], work, host)
            self.assertEqual({r['message'] for r in rows if r['kind'] == 'anchor'}, {'hello', 'old'})
            self.assertEqual([r['message'] for r in rows if r['kind'] == 'base'], ['/tools/demo/'])
            links = {r['message'].split('\t', 1)[1] for r in rows if r['kind'] == 'link'}
            self.assertEqual(links, {'skill.html#hello', 'https://example.org/', 'img/icon.png', 'img/poster.png', 'demo.mp4', 'missing.html#absent'})


if __name__ == '__main__':
    unittest.main()
