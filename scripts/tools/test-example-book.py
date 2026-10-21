#!/usr/bin/env python3
"""Focused checks for the generated quickrun form of source examples."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
import sys

sys.dont_write_bytecode = True

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("generate_example_book", HERE / "generate-example-book.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ExampleBookTests(unittest.TestCase):
    def test_quickrun_installs_host_and_bootstraps_svg_and_bundled_font(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "assets/fonts").mkdir(parents=True)
            (root / "assets/diagram.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg"/>')
            (root / "assets/fonts/font.ttf").write_bytes(b"font fixture")
            script = root / "example.lms"
            script.write_text('''out = "build/rendered/example.dslb";
p = _dsl_ schema="../schema/tool.json";
scene.load_font("Extra", "assets/fonts/font.ttf", false);
let imported = scene.load_svg("assets/diagram.svg", "root");
imported.set_attr("font-family", "Extra");
end _dsl_
savedsl(p, out);
''')
            result = module.quickrun_source("lmdraw", script, root / "examples", root)
        self.assertIn('install="github:lmctl-ai/lmdraw@latest"', result)
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
