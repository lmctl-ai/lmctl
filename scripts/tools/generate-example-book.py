#!/usr/bin/env python3
"""Generate a tool examples book from its checked-out examples/ directory."""
import hashlib
import argparse
import html
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import struct
import sys
import textwrap

ROOT = Path(__file__).resolve().parents[2]


def host_flag_spelling(source):
    # Normalize documentation inputs, never accept a runtime option alias.
    return source.replace('--' + 'dsl', '--lmcode')


def refresh_host_flag_spellings(root=ROOT):
    """Refresh only generated command bytes, preserving the existing plumbing."""
    changed = 0
    for manifest in sorted((root / 'tools').glob('*/examples/.generated-files')):
        book = manifest.parent.resolve()
        for relative in manifest.read_text().splitlines():
            target = root / relative if relative.startswith('tools/') else book / relative
            if target.is_symlink() or not target.resolve().is_relative_to(book):
                raise ValueError('unsafe generated book path: ' + relative)
            if not target.is_file() or target.suffix not in ('.lms', '.html'):
                continue
            raw = target.read_bytes()
            updated = raw.replace(b'--' + b'dsl', b'--lmcode')
            if raw != updated:
                target.write_bytes(updated)
                changed += 1
    return changed


def png_size(path):
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
        raise ValueError(f"not a PNG: {path}")
    return struct.unpack(">II", data[16:24])


def quickrun_source(tool, script, examples_root, repo_root, release_version="latest"):
    source = host_flag_spelling(script.read_text())
    host_var = None
    source, count = re.subn(
        r'(?m)^(\w+)\s*=\s*_(?:dsl|lmcode)_\s+schema="[^"]+"\s*;',
        lambda match: f'{match.group(1)} = _lmcode_ cli="{tool}" install="github:lmctl-ai/{tool}@{release_version}";',
        source,
        count=1,
    )
    source = re.sub(
        rf'(\binstall="github:lmctl-ai/{re.escape(tool)}@)[^"]+(";)',
        rf'\g<1>{release_version}\g<2>',
        source,
    )
    if count != 1 and not re.search(
        rf'(?m)^\w+\s*=\s*_(?:dsl|lmcode)_\s+cli="{re.escape(tool)}"\s+install="github:lmctl-ai/{re.escape(tool)}@(?:latest|[^"]+)"\s*;',
        source,
    ):
        raise ValueError(f"{script.name} must declare a {tool} LMCode host or one schema-based LMCode block")
    host_var_match = re.search(r"(?m)^(\w+)\s*=\s*_(?:dsl|lmcode)_", source)
    host_var = host_var_match.group(1) if host_var_match else None
    if not host_var:
        raise ValueError(f"could not find host variable in {script}")
    has_output = re.search(r"(?m)^out\s*=", source)
    if not has_output:
        savedsl = re.search(rf"(?m)^\s*savedsl\(\s*{re.escape(host_var)}\s*,\s*([^,)]+)\s*\);", source)
        if not savedsl:
            raise ValueError(f"{script.name} must save its {host_var} bytecode with savedsl()")
        source = source[:savedsl.start()] + f"out = {savedsl.group(1).strip()};\n" + source[savedsl.start():]

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

    dsl_line = re.search(r"(?m)^\w+\s*=\s*_(?:dsl|lmcode)_", source)
    if not dsl_line:
        raise ValueError(f"could not locate LMCode block in {script.name}")
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
    # Existing examples may already create build/ or assets; retain only missing setup.
    bootstrap = [line for line in bootstrap if line not in source]
    if bootstrap:
        source = source[:dsl_line.start()] + "\n".join(bootstrap) + "\n" + source[dsl_line.start():]
    # Complete source examples already execute their saved block.
    if re.search(rf"(?m)^\s*\w+\s*=\s*system\s+\$\{{dsl_cli\({re.escape(host_var)}\)\}}\s+--lmcode\s", source):
        return source
    source += (
        f"\nrun = system ${{dsl_cli({host_var})}} --lmcode ${{out}};\n"
        'if (run.code != 0) { println(str(run.stderr)); lm_exit(run.code); }\n'
    )
    return source


def rendered_preview(tool, slug, script_path, data):
    """Run the generated script with lmscript, or use its checked-in preview."""
    outputs = data.get("rendered", {}).get(slug, [])
    if isinstance(outputs, str):
        outputs = [outputs]
    if not outputs:
        return None
    compiler = os.environ.get("LMSCRIPT_BIN") or shutil.which("lmscript")
    if not compiler:
        return None
    import subprocess
    import tempfile

    with tempfile.TemporaryDirectory(prefix=f"lmctl-{tool}-{slug}-") as work:
        try:
            subprocess.run(
                [compiler, str(script_path)],
                cwd=work,
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                text=True,
                timeout=180,
            )
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
            detail = getattr(error, "stderr", "")
            print(f"Preview render unavailable for {slug}; using repository preview. {detail}", file=sys.stderr)
            return None
        for relative in outputs:
            candidate = Path(work) / relative
            if candidate.is_file():
                return candidate.read_bytes()
    return None


def compact_png(path):
    """Quantize full renderer output to the site's small-preview budget."""
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        return False
    import subprocess
    import tempfile

    with tempfile.TemporaryDirectory(prefix="lmctl-preview-palette-") as work:
        palette = Path(work) / "palette.png"
        compact = Path(work) / "compact.png"
        try:
            subprocess.run(
                [ffmpeg, "-y", "-v", "error", "-i", str(path), "-vf",
                 "palettegen=max_colors=96:stats_mode=diff", str(palette)],
                check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, timeout=30,
            )
            subprocess.run(
                [ffmpeg, "-y", "-v", "error", "-i", str(path), "-i", str(palette),
                 "-lavfi", "paletteuse=dither=none", str(compact)],
                check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, timeout=30,
            )
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
            return False
        if compact.stat().st_size < path.stat().st_size:
            shutil.copyfile(compact, path)
            return True
    return False


def main():
    if sys.argv[1:] == ['--refresh-host-flag-spellings']:
        print('Refreshed', refresh_host_flag_spellings(), 'generated host command files')
        return
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tool", required=True, help="lowercase tool name")
    parser.add_argument("--source", required=True, help="checked-out public tool repository")
    parser.add_argument("--ref", required=True, help="source commit or tag for page attribution")
    parser.add_argument("--data", help="per-tool JSON data; defaults to tools/TOOL/book.json")
    parser.add_argument("--output", help="output directory; defaults to tools/TOOL/examples")
    args = parser.parse_args()
    tool, source_ref = args.tool, args.ref
    if not re.fullmatch(r"[a-z][a-z0-9-]*", tool):
        raise SystemExit("--tool must be a lowercase tool name")
    if not re.fullmatch(r"[0-9a-fA-F]{40}", source_ref):
        raise SystemExit("--ref must be the full checked-out Git commit SHA")
    source_arg = args.source
    repo_root = Path(source_arg).resolve()
    examples_root = repo_root / "examples"
    data_path = Path(args.data).resolve() if args.data else ROOT / "tools" / tool / "book.json"
    if not data_path.is_file():
        raise SystemExit(f"missing per-tool data file: {data_path}")
    data = json.loads(data_path.read_text())
    for field in ("description", "task"):
        if not isinstance(data.get(field), str) or not data[field].strip():
            raise SystemExit(f"{data_path} needs a nonempty {field!r}")
    links = data.get("links")
    if not isinstance(links, dict) or not {"dsl_docs", "tool_api", "example"}.issubset(links):
        raise SystemExit(f"{data_path} needs links.dsl_docs, links.tool_api, and links.example")
    for name, link in links.items():
        if not isinstance(link, dict) or not link.get("label") or not re.fullmatch(r"https://[^\s]+", str(link.get("url", ""))):
            raise SystemExit(f"{data_path} has an invalid HTTPS link: {name}")
    display_name = data.get("display_name", tool)
    short_ref = source_ref[:10]
    output = Path(args.output).resolve() if args.output else ROOT / "tools" / tool / "examples"
    output.mkdir(parents=True, exist_ok=True)
    manifest = output / ".generated-files"
    if manifest.exists():
        for relative in manifest.read_text().splitlines():
            target = (output / relative).resolve()
            if target.is_relative_to(output) and target.is_file():
                target.unlink()

    entries = {}
    configured_examples = data.get("examples")
    if configured_examples:
        scripts = []
        for item in configured_examples:
            slug = item.get("slug", "")
            source_name = item.get("file", f"{slug}.lms")
            if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
                raise SystemExit(f"invalid example slug in {data_path}: {slug!r}")
            rel = PurePosixPath(source_name)
            if rel.is_absolute() or ".." in rel.parts or rel.suffix != ".lms":
                raise SystemExit(f"unsafe example path in {data_path}: {source_name}")
            script = examples_root / Path(*rel.parts)
            if not script.is_file() or script.is_symlink():
                raise SystemExit(f"missing or unsafe example script: {script}")
            scripts.append((script, slug))
            entries[slug] = item.get("description", "")
    else:
        readme_path = examples_root / "README.md"
        if not readme_path.is_file():
            raise SystemExit(f"add an examples list to {data_path} or provide {readme_path}")
        readme = readme_path.read_text()
        for match in re.finditer(r"^- `([a-z0-9-]+)\.lms` (.+?)\.?$", readme, re.M):
            entries[match.group(1)] = match.group(2).rstrip(".")
        scripts = [(script, script.stem) for script in sorted(examples_root.glob("*.lms"))]
    if not scripts:
        raise SystemExit(f"no lmscript examples found in {examples_root}")
    created = []
    pages = []
    for script, slug in scripts:
        if slug not in entries:
            raise SystemExit(f"add {slug}.lms to examples/README.md before syncing the book")
        example_config = next((item for item in configured_examples or [] if item.get("slug") == slug), {})
        rendered_output = example_config.get("rendered") or data.get("rendered", {}).get(slug)
        preview_name = data.get("images", {}).get(slug, f"{slug}.png")
        title = slug.replace("-", " ").title()
        preview = examples_root / "renders" / preview_name
        if not rendered_output and not preview.is_file():
            raise SystemExit(f"{slug} needs a rendered output or examples/renders/{preview_name}")
        width, height = png_size(preview) if preview.is_file() else (0, 0)
        source = quickrun_source(tool, script, examples_root, repo_root, data.get("release_version", "latest"))
        original_name = script.relative_to(examples_root).as_posix()
        source_name = f"{slug}.lms"
        source_path = output / source_name
        source_path.write_text(source)
        render_data = {**data, "rendered": {slug: rendered_output} if rendered_output else {}}
        rendered = rendered_preview(tool, slug, source_path, render_data)
        output_candidates = rendered_output if isinstance(rendered_output, list) else [rendered_output]
        output_suffixes = {Path(path).suffix.lower() for path in output_candidates if path}
        text_output = bool(output_suffixes & {".txt", ".csv"})
        if text_output and len(output_suffixes) != 1:
            raise SystemExit(f"{slug} output alternatives must use the same text format")
        if text_output:
            if rendered is None:
                raise SystemExit(f"could not render text output for {slug}")
            try:
                rendered_text = rendered.decode("utf-8")
            except UnicodeDecodeError as error:
                raise SystemExit(f"text output for {slug} is not UTF-8: {error}")
            output_name = f"{slug}{next(iter(output_suffixes))}"
            output_path = output / output_name
            output_path.write_bytes(rendered)
            presentation = (
                f'<pre><samp>{html.escape(rendered_text)}</samp></pre>\n'
                f'<p>Output generated from source revision {html.escape(short_ref)}. '
                f'<a href="/tools/{tool}/examples/{output_name}">Download the output</a>.</p>'
            )
            image_href = ""
            width = height = 0
            created.append(output_name)
        else:
            image_name = f"{slug}.png"
            image_path = output / "img" / image_name
            image_path.parent.mkdir(parents=True, exist_ok=True)
            if rendered is not None:
                image_path.write_bytes(rendered)
                compact_png(image_path)
                width, height = png_size(image_path)
            elif preview.is_file():
                shutil.copyfile(preview, image_path)
            else:
                raise SystemExit(f"could not render {slug} and no checked-in preview exists")
            image_href = f"/tools/{tool}/examples/img/{image_name}"
            presentation = (
                f'<figure><img src="{image_href}" alt="Rendered {html.escape(title)} example." '
                f'width="{width}" height="{height}"><figcaption>'
                f'{html.escape(example_config.get("preview_caption", data.get("preview_caption", "Preview generated from the source repository")))} at {html.escape(short_ref)}.</figcaption></figure>'
            )
        page_name = f"{slug}.html"
        description_text = re.sub(r"`([^`]*)`", r"\1", entries[slug])
        description_text = description_text[:1].upper() + description_text[1:]
        if not description_text.endswith((".", "!", "?")):
            description_text += "."
        description = html.escape(description_text, quote=False)
        prompt = f"{data['task']} Use the {display_name} API and the {title} example below. Report the source, output, and verification."
        prompt = textwrap.fill(prompt, width=72)
        example_url = f"https://lmctl.com/tools/{tool}/examples/{slug}.html"
        simple_example_reference = ""
        if links["example"]["url"] != example_url:
            simple_example_reference = (
                f" Also see <a href=\"{html.escape(links['example']['url'], quote=True)}\">"
                f"{html.escape(links['example']['label'])}</a>."
            )
        quickrun_command = textwrap.fill(
            f"lmctl autorun https://lmctl.com/tools/{tool}/examples/{slug}.lms",
            width=72,
            subsequent_indent="  ",
            break_long_words=False,
            break_on_hyphens=False,
        )
        quickrun_command = quickrun_command.replace("\n  ", " \\\n  ")
        example_label = f"{title} example"
        body = f'''<h1>{html.escape(title)}</h1>
<p>{description} This page includes a preview and an autorun-ready lmscript source file.</p>
{presentation}
<h2>Let an agent build from this example</h2>
<p>Copy this prompt into your Lead's terminal to ask an agent to complete a related task:</p>
<pre><code>{html.escape(prompt)}
{html.escape(links['dsl_docs']['label'])}: {html.escape(links['dsl_docs']['url'])}
{html.escape(links['tool_api']['label'])}: {html.escape(links['tool_api']['url'])}
{html.escape(example_label)}:
{html.escape(example_url)}</code></pre>
<h2>Run the example</h2>
<pre><code>{html.escape(quickrun_command)}</code></pre>
<p><a href="/tools/{tool}/examples/{source_name}">Read the autorun source</a>.{simple_example_reference} See <a href="{html.escape(data.get('get_started', f'/tools/{tool}/tutorial.html'))}">get started with provider runs</a>.</p>
<h2>Source from the project</h2>
<p>The original example is <a href="https://github.com/lmctl-ai/{tool}/blob/{html.escape(source_ref)}/examples/{html.escape(original_name, quote=True)}">{html.escape(original_name)} at {html.escape(short_ref)}</a>. The published autorun source includes the host declaration and any setup needed to run it from a new directory.</p>'''
        page_path = output / page_name
        page_path.write_text(body + "\n")
        created.extend([source_path.name, page_path.name])
        if not text_output:
            created.append(str(Path("img") / image_name))
        pages.append((title, description, page_name, image_href, width, height))

    list_items = "\n".join(
        f'<li><a href="/tools/{tool}/examples/{page}">{html.escape(title)}</a>: {description} <a href="/tools/{tool}/examples/{page[:-5]}.lms">Autorun source</a></li>'
        for title, description, page, *_ in pages
    )
    index = f'''<h1>{html.escape(display_name)} examples</h1>
<p>{html.escape(data['description'])} Browse example previews and run each source as an autorun script. These pages are regenerated from the public {html.escape(display_name)} repository at {html.escape(short_ref)}.</p>
<p>Start with <a href="{html.escape(data.get('get_started', f'/tools/{tool}/tutorial.html'))}">get started</a> to learn how solo and trio provider runs work.</p>
<ul>
{list_items}
</ul>'''
    index_path = output / "index.html"
    index_path.write_text(index + "\n")
    created.append(index_path.name)
    manifest.write_text("\n".join(created) + "\n")
    print(f"Generated {len(pages)} example pages from {tool} at {source_ref} in {output}")


if __name__ == "__main__":
    main()
