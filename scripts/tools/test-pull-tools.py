#!/usr/bin/env python3
"""Offline input-policy tests; full render repeatability is checked by the pilot."""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('pull_tools', Path(__file__).with_name('pull-tools.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class Policy(unittest.TestCase):
    def setUp(self):
        self.data = {'version': 1, 'tool': 'demo', 'repository': 'https://github.com/lmctl-ai/demo', 'licence': 'MIT', 'title': 'Demo', 'description': 'Examples', 'examples': [{'slug': 'hello', 'title': 'Hello', 'description': '<script> is text', 'script': 'examples/hello.lms', 'script_sha256': 'a'*64, 'image': 'docs/images/hello.png', 'image_sha256': 'b'*64, 'alt': 'Hello', 'stdout': '(no stdout)', 'licence': 'MIT'}]}

    def test_valid(self):
        m.validate(self.data, 'demo')

    def test_bad_entries(self):
        for key, value in [('slug', '../escape'), ('slug', 'index'), ('script', 'arbitrary.lms'), ('image', 'output.svg'), ('script_sha256', 'oops'), ('licence', 'unknown'), ('title', '')]:
            data = copy.deepcopy(self.data)
            data['examples'][0][key] = value
            with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                m.validate(data, 'demo')

    def test_schema_rejects_unknown_presentation_and_types_with_paths(self):
        for key, value in [('layout', 'grid'), ('class', 'hero'), ('css', 'x'), ('featured', 'yes')]:
            data = copy.deepcopy(self.data)
            data['examples'][0][key] = value
            with self.subTest(key=key), self.assertRaisesRegex(ValueError, r'\$\.examples\[0\]'):
                m.validate(data, 'demo', 'lmctl-ai/demo@' + 'a'*40 + ':examples/manifest.json')
        data = copy.deepcopy(self.data)
        data['examples'] = 'not-a-list'
        with self.assertRaisesRegex(ValueError, r'\$\.examples.*expected array'):
            m.validate(data, 'demo')

    def test_schema_reports_missing_root_and_malformed_json_context(self):
        data = copy.deepcopy(self.data)
        del data['title']
        with self.assertRaisesRegex(ValueError, r'examples/manifest\.json:\$: missing required property .title.'):
            m.validate(data, 'demo')
        with self.assertRaisesRegex(ValueError, r'lmctl-ai/demo@a{40}:examples/manifest\.json: JSON syntax error at line 1, column 2'):
            m.parse_manifest('{', 'lmctl-ai/demo@' + 'a'*40 + ':examples/manifest.json')

    def test_referenced_schema_extensions_fail_closed(self):
        schema = {'$defs': {'entry': {'type': 'string', 'unimplementedKeyword': True}}}
        with self.assertRaisesRegex(ValueError, 'unsupported schema keyword'):
            m.validate_schema('text', {'$ref': '#/$defs/entry'}, '$', 'fixture.json', schema)
        with self.assertRaisesRegex(ValueError, 'reference siblings'):
            m.validate_schema('text', {'$ref': '#/$defs/entry', 'minLength': 1}, '$', 'fixture.json', schema)

    def test_semantic_metadata_and_encoding_errors(self):
        self.data['examples'][0].update(tags=['diagram'], featured=True, captured_with='demo 1.0')
        m.validate(self.data, 'demo')
        with self.assertRaisesRegex(ValueError, r'lmctl-ai/demo@HEAD:examples/manifest.json: manifest must be valid UTF-8'):
            m.parse_manifest(b'\xff', 'lmctl-ai/demo@HEAD:examples/manifest.json')
        self.data['version'] = True
        with self.assertRaisesRegex(ValueError, r'\$.version.*expected integer'):
            m.validate(self.data, 'demo')

    def test_duplicate_and_wrong_origin(self):
        data = copy.deepcopy(self.data)
        data['examples'] *= 2
        with self.assertRaises(ValueError): m.validate(data, 'demo')
        self.data['repository'] = 'https://github.com/attacker/demo'
        with self.assertRaises(ValueError): m.validate(self.data, 'demo')

    def test_errors_name_the_tool_repo_file_and_field(self):
        data = copy.deepcopy(self.data)
        data['examples'][0]['alt'] = ''
        data['examples'][0]['css_class'] = 'hero'
        del data['examples'][0]['stdout']
        with self.assertRaises(m.ManifestError) as caught:
            m.validate(data, 'demo')
        text = str(caught.exception)
        self.assertIn('lmctl-ai/demo:examples/manifest.json', text)
        self.assertIn('$.examples[0].alt', text)
        self.assertIn('missing required field "stdout"', text)
        self.assertIn('unknown field "css_class" (presentation belongs to lmctl-ai/lmctl', text)

    def test_semantic_optional_fields_and_featured_cap(self):
        data = copy.deepcopy(self.data)
        data['examples'][0].update({'kind': 'image', 'featured': True, 'tags': ['charts'], 'captured_with': 'lmvideo 0.1.26'})
        m.validate(data, 'demo')
        data['examples'][0]['kind'] = 'carousel'
        with self.assertRaises(m.ManifestError): m.validate(data, 'demo')
        data = copy.deepcopy(self.data)
        data['examples'] = [dict(self.data['examples'][0], slug=f'e{n}', script=f'examples/e{n}.lms', featured=True) for n in range(7)]
        with self.assertRaisesRegex(m.ManifestError, 'at most 6'): m.validate(data, 'demo')

    def test_unsupported_version_is_named(self):
        data = dict(self.data, version=2)
        with self.assertRaisesRegex(m.ManifestError, r'\$\.version: unsupported manifest version 2'): m.validate(data, 'demo')

    def test_schema_file_agrees_with_reference_validator(self):
        try:
            import jsonschema
        except ImportError:
            self.skipTest('jsonschema not installed; built-in subset validator still ran')
        schema = json.loads(m.SCHEMA.read_text())
        jsonschema.Draft202012Validator.check_schema(schema)
        jsonschema.validate(self.data, schema)
        bad = copy.deepcopy(self.data)
        bad['examples'][0]['layout'] = 'grid'
        with self.assertRaises(jsonschema.ValidationError): jsonschema.validate(bad, schema)

    def test_git_blobs_not_dirty_files_or_symlinks(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            subprocess.run(['git', 'init', '-q', d], check=True)
            (root/'hello.lms').write_text('committed')
            (root/'link').symlink_to('/etc/passwd')
            subprocess.run(['git', '-C', d, 'add', '.'], check=True)
            subprocess.run(['git', '-C', d, '-c', 'user.name=test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'fixture'], check=True)
            (root/'hello.lms').write_text('dirty')
            self.assertEqual(m.tracked(root, 'HEAD', 'hello.lms'), b'committed')
            for path in ('link', '../hello.lms', '/etc/passwd', 'a/../hello.lms', 'missing', 'hello\\lms'):
                with self.subTest(path=path), self.assertRaises(ValueError): m.tracked(root, 'HEAD', path)


if __name__ == '__main__': unittest.main()
