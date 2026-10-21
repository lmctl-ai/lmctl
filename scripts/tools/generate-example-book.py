#!/usr/bin/env python3
"""Generate a tool examples book from its checked-out examples/ directory."""
import hashlib
import html
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import struct
import sys

ROOT = Path(__file__).resolve().parents[2]


def png_size(path):
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
        raise ValueError(f"not a PNG: {path}")
    return struct.unpack(">II", data[16:24])


def quickrun_source(tool, script, examples_root, repo_root):
    source = script.read_text()
    host_var = None
    source, count = re.subn(
        r'(?m)^(\w+)\s*=\s*_dsl_\s+schema="[^"]+"\s*;',
        lambda match: f'{match.group(1)} = _dsl_ cli="{tool}" install="github:lmctl-ai/{tool}@latest";',
        source,
        count=1,
    )
    if count != 1:
        raise ValueError(f"{script.name} must declare one schema-based _dsl_ block")
    host_var_match = re.search(r"(?m)^(\w+)\s*=\s*_dsl_", source)
    host_var = host_var_match.group(1) if host_var_match else None
    if not host_var:
        raise ValueError(f"could not find host variable in {script}")

    font_load = re.compile(
        r'(?m)^\s*scene\.load_font\("([^"]+)"\s*,\s*"assets/fonts/[^"\n]+"\s*,\s*(?:true|false)\s*\);\s*\n?'
    )
    for alias in font_load.findall(source):
        source = re.sub(
            r'(set_attr\("font-family"\s*,\s*)' + re.escape(json.dumps(alias)) + r'(\s*\))',
            r'\1"Noto Sans"\2',
            source,
        )
    source = font_load.sub("", source)

    assets = {}
    pattern = re.compile(r'("assets/[^"\n]+\.svg")')
    for quoted in sorted(set(pattern.findall(source))):
        relative = json.loads(quoted)
        rel = PurePosixPath(relative)
        if rel.is_absolute() or ".." in rel.parts:
            raise ValueError(f"unsafe SVG path in {script.name}: {relative}")
        asset = repo_root / relative
        if not asset.is_file() or asset.is_symlink():
            raise ValueError(f"missing or unsafe SVG input for {script.name}: {relative}")
        payload = asset.read_text()
        digest = hashlib.sha256(payload.encode()).hexdigest()[:16]
        target = f"assets/quickrun-{digest}.svg"
        assets[target] = payload
        source = source.replace(quoted, json.dumps(target))

    dsl_line = re.search(r"(?m)^\w+\s*=\s*_dsl_", source)
    if not dsl_line:
        raise ValueError(f"could not locate DSL block in {script.name}")
    bootstrap = [
        'if (!file_exists("build")) { mkdir("build"); }',
        'if (!file_exists("build/rendered")) { mkdir("build/rendered"); }',
    ]
    if assets:
        bootstrap.append('if (!file_exists("assets")) { mkdir("assets"); }')
        for target, payload in sorted(assets.items()):
            bootstrap.append(
                f"if (!file_exists({json.dumps(target)})) "
                f"{{ write_file_exclusive({json.dumps(target)}, {json.dumps(payload)}); }}"
            )
    source = source[:dsl_line.start()] + "\n".join(bootstrap) + "\n" + source[dsl_line.start():]
    source += (
        f"\nrun = system ${{dsl_cli({host_var})}} --dsl ${{out}};\n"
        'if (run.code != 0) { println(str(run.stderr)); lm_exit(run.code); }\n'
    )
    return source


def main():
    if len(sys.argv) != 4:
        raise SystemExit("usage: generate-example-book.py TOOL SOURCE_DIR SOURCE_REF")
    tool, source_arg, source_ref = sys.argv[1:]
    repo_root = Path(source_arg).resolve()
    examples_root = repo_root / "examples"
    data = json.loads((ROOT / f"scripts/tools/example-book-data/{tool}.json").read_text())
    display_name = data.get("display_name", tool)
    output = ROOT / "tools" / tool / "examples"
    output.mkdir(parents=True, exist_ok=True)
    manifest = output / ".generated-files"
    if manifest.exists():
        for relative in manifest.read_text().splitlines():
            target = (ROOT / relative).resolve()
            if target.is_relative_to(output.resolve()) and target.is_file():
                target.unlink()

    entries = {}
    readme = (examples_root / "README.md").read_text()
    for match in re.finditer(r"^- `([a-z0-9-]+)\.lms` (.+?)\.?$", readme, re.M):
        entries[match.group(1)] = match.group(2).rstrip(".")
    scripts = sorted(examples_root.glob("*.lms"))
    if not scripts:
        raise SystemExit(f"no lmscript examples found in {examples_root}")
    created = []
    pages = []
    for script in scripts:
        slug = script.stem
        if slug not in entries:
            raise SystemExit(f"add {slug}.lms to examples/README.md before syncing the book")
        preview_name = data.get("images", {}).get(slug, f"{slug}.png")
        preview = examples_root / "renders" / preview_name
        if not preview.is_file():
            raise SystemExit(f"add examples/renders/{preview_name} to render the {slug} page")
        width, height = png_size(preview)
        image_name = f"{slug}.png"
        image_path = output / "img" / image_name
        image_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(preview, image_path)
        image_href = f"/tools/{tool}/examples/img/{image_name}"
        source = quickrun_source(tool, script, examples_root, repo_root)
        source_name = f"{slug}.lms"
        source_path = output / source_name
        source_path.write_text(source)
        page_name = f"{slug}.html"
        title = slug.replace("-", " ").title()
        description_text = re.sub(r"`([^`]*)`", r"\1", entries[slug])
        description_text = description_text[:1].upper() + description_text[1:]
        if not description_text.endswith((".", "!", "?")):
            description_text += "."
        description = html.escape(description_text, quote=False)
        prompt = (
            f"Create a drawing inspired by the {title} example. Use the {display_name} API and source "
            "links below, compile and render a PNG, and report the source and verification."
        )
        body = f'''<h1>{html.escape(title)}</h1>
<p>{description} This page includes the render and a quickrun-ready lmscript source file.</p>
<figure><img src="{image_href}" alt="Rendered {html.escape(title)} example." width="{width}" height="{height}"><figcaption>Preview generated from the source repository at {html.escape(source_ref)}.</figcaption></figure>
<h2>Let an agent build from this example</h2>
<p>Copy this prompt into your Lead's terminal to ask an agent to make a related drawing:</p>
<pre><code>{html.escape(prompt)}
LMScript DSL: {html.escape(data['dsl_docs'])}
{html.escape(display_name)} API: {html.escape(data['tool_docs'])}
Example book: https://lmctl.com/tools/{tool}/examples/{slug}.html</code></pre>
<h2>Run the example</h2>
<pre><code>lmctl quickrun https://lmctl.com/tools/{tool}/examples/{slug}.lms</code></pre>
<p><a href="/tools/{tool}/examples/{source_name}">Read the quickrun source</a>. See <a href="/tools/{tool}/get_started.html">get started with quickrun teams</a>.</p>
<h2>Source from the project</h2>
<p>The original example is <a href="https://github.com/lmctl-ai/{tool}/blob/{html.escape(source_ref)}/examples/{slug}.lms">{slug}.lms at {html.escape(source_ref)}</a>. The published quickrun source adds release installation, local SVG fixtures, or the bundled font needed to run it from a new directory.</p>'''
        page_path = output / page_name
        page_path.write_text(body + "\n")
        created.extend([str(source_path.relative_to(ROOT)), str(page_path.relative_to(ROOT)), str(image_path.relative_to(ROOT))])
        pages.append((title, description, page_name, image_href, width, height))

    list_items = "\n".join(
        f'<li><a href="/tools/{tool}/examples/{page}">{html.escape(title)}</a>: {description} <a href="/tools/{tool}/examples/{page[:-5]}.lms">Quickrun source</a></li>'
        for title, description, page, *_ in pages
    )
    index = f'''<h1>{html.escape(display_name)} examples</h1>
<p>Browse rendered examples and run each source as a quickrun script. These pages are regenerated from the public {html.escape(display_name)} repository at {html.escape(source_ref)}.</p>
<p>Start with <a href="{html.escape(data['get_started'])}">get started</a> to learn how solo and trio quickruns work.</p>
<ul>
{list_items}
</ul>'''
    index_path = output / "index.html"
    index_path.write_text(index + "\n")
    created.append(str(index_path.relative_to(ROOT)))
    manifest.write_text("\n".join(created) + "\n")
    print(f"Generated {len(pages)} example pages from {tool} at {source_ref}")


if __name__ == "__main__":
    main()
