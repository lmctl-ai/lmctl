"""Hermetic negative controls for nested page checking."""
from pathlib import Path
import tempfile
import unittest
from pages import check, offline_output

class PageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'agentic/examples').mkdir(parents=True)
        (self.root / 'agentic/examples/demo.lms').write_text('println("ok");\n')
        self.page = self.root / 'agentic/demo.html'
        self.html = ('<base href="/lmscript/agentic/"><main><h1 id="top">Demo</h1>'
                     '<a href="demo.html#top">self</a><a href="examples/demo.lms">source</a>'
                     '<h2 id="script">Script: demo.lms</h2><pre><code>println("ok");\n</code></pre>'
                     '<h2>Output (offline, mock)</h2><pre><samp>ok</samp></pre>'
                     '<h2>Live run</h2><pre><samp>live</samp></pre><p>Try it: demo</p></main>')
        self.page.write_text(self.html)

    def test_nested_base_and_offline_sample(self):
        check(self.root)
        self.assertEqual(offline_output(self.page), 'ok')

    def test_broken_nested_link(self):
        self.page.write_text(self.html.replace('demo.html#top', 'missing.html'))
        with self.assertRaisesRegex(ValueError, 'broken tutorial link'):
            check(self.root)

    def test_broken_anchor(self):
        self.page.write_text(self.html.replace('#top', '#absent'))
        with self.assertRaisesRegex(ValueError, 'missing tutorial anchor'):
            check(self.root)

    def test_stale_source(self):
        self.page.write_text(self.html.replace('println("ok")', 'println("stale")'))
        with self.assertRaisesRegex(ValueError, 'displayed source differs'):
            check(self.root)

    def test_all_source_blocks_checked(self):
        self.page.write_text(self.html.replace('<h2>Output', '<h2>Script: absent.lms</h2><pre><code>x;</code></pre><h2>Output'))
        with self.assertRaisesRegex(ValueError, 'displayed source differs'):
            check(self.root)

    def test_no_base_uses_document_url(self):
        self.page.write_text(self.html.replace('<base href="/lmscript/agentic/">', ''))
        check(self.root)

    def test_live_sample_cannot_replace_offline(self):
        self.page.write_text(self.html.replace('<pre><samp>ok</samp></pre>', ''))
        with self.assertRaisesRegex(ValueError, 'exactly one offline'):
            offline_output(self.page)

if __name__ == '__main__':
    unittest.main()
