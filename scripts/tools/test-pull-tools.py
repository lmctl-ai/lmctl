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

    def test_duplicate_and_wrong_origin(self):
        data = copy.deepcopy(self.data)
        data['examples'] *= 2
        with self.assertRaises(ValueError): m.validate(data, 'demo')
        self.data['repository'] = 'https://github.com/attacker/demo'
        with self.assertRaises(ValueError): m.validate(self.data, 'demo')

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
