"""Offline runner negative controls; no compiler/provider/network needed."""
import contextlib
import io
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import agentic

class RunnerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.site = Path(self.temp.name)
        (self.site / 'examples').mkdir()
        (self.site / 'examples/mock-model.lms').write_text('# mock')
        for i in range(8):
            name = f'recipe-{i}'
            (self.site / f'examples/{name}.lms').write_text('println("fixture");\n')
            (self.site / f'{name}.html').write_text(
                f'<h2>Script: {name}.lms</h2><pre><code>println("fixture");\n</code></pre>'
                '<h2>Output (offline)</h2><pre><samp>fixture</samp></pre>'
                '<h2>Live run</h2><pre><samp>different</samp></pre>')
        self.site_patch = patch.object(agentic, 'SITE', self.site)
        self.site_patch.start()
        self.addCleanup(self.site_patch.stop)

    def run_mocked(self, stdout='fixture\n', code=0):
        calls = []
        def run(command, **kwargs):
            if 'schema' in command:
                return subprocess.CompletedProcess(command, 0, '{}', '')
            if any(str(arg).endswith('compile-mock.mjs') for arg in command):
                return subprocess.CompletedProcess(command, 0, '', '')
            if '--check' in command:
                return subprocess.CompletedProcess(command, 0, '', '')
            calls.append(kwargs)
            self.assertIn('exec', command)
            self.assertIn('--lmcode', command)
            self.assertNotIn('--script', command)
            self.assertIn('child', command)
            self.assertEqual(kwargs['env']['DEEPSEEK_API_KEY'], 'fixture-key')
            self.assertNotIn('OLLAMA_API_KEY', kwargs['env'])
            self.assertNotIn('AGENTIC_APPROVE', kwargs['env'])
            self.assertEqual(kwargs['stdin'], subprocess.DEVNULL)
            self.assertNotIn('LLM_MODEL_WRITER', kwargs['env'])
            self.assertTrue(Path(kwargs['cwd']).is_dir())
            return subprocess.CompletedProcess(command, code, stdout, '')
        with patch.dict(os.environ, {'OLLAMA_API_KEY': 'test-sentinel', 'LLM_MODEL_WRITER': 'unexpected', 'AGENTIC_APPROVE': 'y'}), \
             patch.object(agentic.shutil, 'which', return_value='/fixture/lmscript'), \
             patch.object(agentic, 'host_path', return_value='/fixture/lmmock'), \
             patch.object(agentic.subprocess, 'run', side_effect=run), contextlib.redirect_stdout(io.StringIO()):
            agentic.main('offline')
        self.assertEqual(len(calls), 8)
        self.assertEqual(len({c['cwd'] for c in calls}), 8)
        self.assertTrue(all(not Path(c['cwd']).exists() for c in calls))

    def test_fresh_cwd_and_fixture_env(self):
        self.run_mocked()

    def test_wrong_output_fails(self):
        with self.assertRaisesRegex(ValueError, 'differs from Output'):
            self.run_mocked('different\n')

    def test_nonzero_fails_even_matching_output(self):
        with self.assertRaisesRegex(ValueError, 'exit 1'):
            self.run_mocked(code=1)

    def test_live_redacts_key_and_removes_mock_url(self):
        def run(command, **kwargs):
            self.assertNotIn('LMSCRIPT_LLM_MOCK_URL', kwargs['env'])
            self.assertEqual(kwargs['env']['LLM_MODEL'], 'ollama-cloud/deepseek-v4.1-flash')
            return subprocess.CompletedProcess(command, 0, 'test-sentinel', '')
        output = io.StringIO()
        with patch.dict(os.environ, {'OLLAMA_API_KEY': 'test-sentinel', 'LMSCRIPT_LLM_MOCK_URL': 'http://localhost:9'}), \
             patch.object(agentic.shutil, 'which', return_value='/fixture/lmscript'), \
             patch.object(agentic.subprocess, 'run', side_effect=run), contextlib.redirect_stdout(output):
            agentic.main('live')
        self.assertNotIn('test-sentinel', output.getvalue())
        self.assertIn('[REDACTED]', output.getvalue())

    def test_static_failure_stops_execution(self):
        with patch.object(agentic.shutil, 'which', return_value='/fixture/lmscript'), \
             patch.object(agentic, 'host_path', return_value='/fixture/lmmock'), \
             patch.object(agentic.subprocess, 'run', side_effect=[
                 subprocess.CompletedProcess([], 0, '{}', ''),
                 subprocess.CompletedProcess([], 2, '', 'bad script')]):
            with self.assertRaisesRegex(ValueError, 'static check failed'):
                agentic.main('offline')

    def test_missing_recipe_fails(self):
        (self.site / 'recipe-7.html').unlink()
        with self.assertRaisesRegex(ValueError, 'eight distinct'):
            agentic.recipes()

if __name__ == '__main__':
    unittest.main()
