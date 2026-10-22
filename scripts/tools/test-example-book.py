#!/usr/bin/env python3
"""Focused checks for the generated quickrun form of source examples."""
import importlib.util
import json
from pathlib import Path
import struct
import sys
import tempfile
import unittest
from unittest.mock import patch
import zlib

sys.dont_write_bytecode = True

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("generate_example_book", HERE / "generate-example-book.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ExampleBookTests(unittest.TestCase):
    def test_quickrun_preserves_release_install_declaration(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            script = root / "example.lms"
            script.write_text('''if (!file_exists("build")) { mkdir("build"); }
out = "build/example.dslb";
p = _dsl_ cli="lmdraw" install="github:lmctl-ai/lmdraw@latest";
end _dsl_
savedsl(p, out);
''')
            result = module.quickrun_source("lmdraw", script, root, root)
        self.assertIn('cli="lmdraw" install="github:lmctl-ai/lmdraw@latest"', result)
        self.assertEqual(result.count('install="github:lmctl-ai/lmdraw@latest"'), 1)

    def test_quickrun_derives_run_path_when_source_saves_a_literal_path(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            script = root / "loop-row.lms"
            script.write_text('''p = _dsl_ cli="lmcad" install="github:lmctl-ai/lmcad@latest";\nscene.assert_close(1.0, 1.0, 0.001);\nend _dsl_\nsavedsl(p, "build/loop-row.dslb");\n''')
            result = module.quickrun_source("lmcad", script, root, root)
        self.assertIn('out = "build/loop-row.dslb";', result)
        self.assertIn("system ${dsl_cli(p)} --dsl ${out}", result)

    def test_quickrun_does_not_append_a_second_host_run(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            script = root / "example.lms"
            script.write_text('''if (!file_exists("build")) { mkdir("build"); }
out = "build/example.dslb";
p = _dsl_ cli="lmr" install="github:lmctl-ai/lmr@latest";
end _dsl_
savedsl(p, out);
  r = system ${dsl_cli(p)} --dsl ${out};
''')
            result = module.quickrun_source("lmr", script, root, root)
        self.assertEqual(result.count('if (!file_exists("build"))'), 1)
        self.assertEqual(result.count("system ${dsl_cli(p)} --dsl ${out}"), 1)

    def test_text_output_is_written_and_rendered_as_plain_text(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            repo = root / "repo"
            (repo / "examples").mkdir(parents=True)
            script = repo / "examples" / "sample.lms"
            script.write_text('''out = "build/sample.dslb";
p = _dsl_ cli="sampletool" install="github:lmctl-ai/sampletool@latest";
end _dsl_
savedsl(p, out);
r = system ${dsl_cli(p)} --dsl ${out};
''')
            data_path = root / "book.json"
            data_path.write_text(json.dumps({
                "display_name": "sampletool", "description": "A sample tool.", "task": "Make a sample.",
                "links": {
                    "dsl_docs": {"label": "DSL", "url": "https://lmctl.com/tools/lmscript/skill.html"},
                    "tool_api": {"label": "API", "url": "https://lmctl.com/tools/sampletool/guide.html"},
                    "example": {"label": "Example", "url": "https://lmctl.com/tools/sampletool/examples/different.html"},
                },
                "examples": [{"slug": "sample", "description": "A sample output.", "rendered": "build/sample.txt"}],
            }))
            output = root / "scratch" / "tools" / "sampletool" / "examples"
            argv = ["generate-example-book.py", "--tool", "sampletool", "--source", str(repo), "--ref", "1" * 40, "--data", str(data_path), "--output", str(output)]
            with patch.object(sys, "argv", argv), patch.object(module, "rendered_preview", return_value=b"Stable output\n"):
                module.main()
            self.assertEqual((output / "sample.txt").read_text(), "Stable output\n")
            page = (output / "sample.html").read_text()
            self.assertIn("<pre><samp>Stable output\n</samp></pre>", page)
            self.assertIn("/tools/sampletool/examples/sample.txt", page)
            # Output alternatives were supported before text previews; preserve
            # that contract for both text and image books.
            data = json.loads(data_path.read_text())
            data["examples"][0]["rendered"] = ["build/missing.txt", "build/sample.txt"]
            data_path.write_text(json.dumps(data))
            with patch.object(sys, "argv", argv), patch.object(module, "rendered_preview", return_value=b"<value> & result\r\n"):
                module.main()
            self.assertEqual((output / "sample.txt").read_bytes(), b"<value> & result\r\n")
            self.assertIn("&lt;value&gt; &amp; result", (output / "sample.html").read_text())
            data["examples"][0]["rendered"] = ["build/first.png", "build/second.png"]
            data_path.write_text(json.dumps(data))
            png = b"\x89PNG\r\n\x1a\n" + b"\0\0\0\rIHDR" + struct.pack(">II", 2, 3)
            with patch.object(sys, "argv", argv), patch.object(module, "rendered_preview", return_value=png), patch.object(module, "compact_png"):
                module.main()
            self.assertEqual((output / "img/sample.png").read_bytes(), png)

    def test_per_tool_data_drives_a_scratch_book_without_repo_readme_or_preview(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            repo = root / "repo"
            (repo / "examples" / "book").mkdir(parents=True)
            (repo / "schema").mkdir()
            script = repo / "examples" / "book" / "sample.lms"
            script.write_text('''out = "build/sample.dslb";
p = _dsl_ schema="../schema/tool.json";
end _dsl_
savedsl(p, out);
''')
            data_path = root / "book.json"
            data_path.write_text(json.dumps({
                "display_name": "sampletool",
                "description": "A sample tool.",
                "task": "Build one small sample.",
                "links": {
                    "dsl_docs": {"label": "DSL", "url": "https://lmctl.com/tools/lmscript/skill.html"},
                    "tool_api": {"label": "API", "url": "https://lmctl.com/tools/sampletool/guide.html"},
                    "example": {"label": "Example", "url": "https://lmctl.com/tools/sampletool/examples/different.html"},
                },
                "examples": [{"slug": "sample", "file": "book/sample.lms", "description": "A sample preview.", "rendered": "build/sample.png"}],
            }))
            output = root / "scratch" / "tools" / "sampletool" / "examples"
            def chunk(name, payload):
                body = name + payload
                return struct.pack(">I", len(payload)) + body + struct.pack(">I", zlib.crc32(body) & 0xffffffff)
            png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">II5B", 1, 1, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(b"\x00\xff\x00\x00")) + chunk(b"IEND", b"")
            with patch.object(sys, "argv", ["generate-example-book.py", "--tool", "sampletool", "--source", str(repo), "--ref", "1" * 40, "--data", str(data_path), "--output", str(output)]), patch.object(module, "rendered_preview", return_value=png):
                module.main()
            self.assertTrue((output / "sample.html").is_file())
            self.assertTrue((output / "sample.lms").is_file())
            self.assertTrue((output / "img/sample.png").is_file())
            generated = (output / "sample.lms").read_text()
            self.assertIn('install="github:lmctl-ai/sampletool@latest"', generated)
            page = (output / "sample.html").read_text()
            self.assertIn("https://lmctl.com/tools/lmscript/skill.html", page)
            self.assertIn("https://lmctl.com/tools/sampletool/guide.html", page)
            self.assertIn("https://lmctl.com/tools/sampletool/examples/sample.html", page)
            self.assertIn("/examples/book/sample.lms", page)
            prompt = page.split("<pre><code>", 1)[1].split("</code>", 1)[0]
            self.assertLessEqual(max(map(len, prompt.splitlines())), 72)
            self.assertNotIn("/examples/different.html", prompt)

    def test_quickrun_installs_host_and_bootstraps_svg_and_bundled_font(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "assets/fonts").mkdir(parents=True)
            (root / "assets/diagram.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg"/>')
            (root / "assets/fonts/font.ttf").write_bytes(b"font fixture")
            script = root / "example.lms"
            script.write_text('''if (!file_exists("build")) { mkdir("build"); }
out = "build/rendered/example.dslb";
p = _dsl_ schema="../schema/tool.json";
scene.load_font("Extra", "assets/fonts/font.ttf", false);
let imported = scene.load_svg("assets/diagram.svg", "root");
imported.set_attr("font-family", "Extra");
end _dsl_
savedsl(p, out);
''')
            result = module.quickrun_source("lmdraw", script, root / "examples", root)
        self.assertIn('install="github:lmctl-ai/lmdraw@latest"', result)
        self.assertEqual(result.count('if (!file_exists("build"))'), 1)
        self.assertIn('mkdir("build/rendered")', result)
        self.assertIn('mkdir("assets")', result)
        self.assertIn('write_file_exclusive("assets/quickrun-', result)
        self.assertIn('scene.load_svg("assets/quickrun-', result)
        self.assertIn('set_attr("font-family", "Noto Sans")', result)
        self.assertNotIn("scene.load_font", result)
        self.assertIn("system ${dsl_cli(p)} --dsl ${out}", result)

    def test_refuses_svg_escape(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            script = root / "bad.lms"
            script.write_text('p = _dsl_ schema="schema.json";\nscene.load_svg("assets/../bad.svg", "x");\nend _dsl_\nsavedsl(p, "out");\n')
            with self.assertRaisesRegex(ValueError, "unsafe SVG path"):
                module.quickrun_source("lmdraw", script, root, root)


if __name__ == "__main__":
    unittest.main()
