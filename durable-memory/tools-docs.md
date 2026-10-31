# /tools/ documentation: how to create and improve a tool's pages

A guide for an LLM (or a person) adding or improving a tool's documentation in the static /tools/ section. tools/README.md is the short contract; this file explains how the pieces fit, how to gather facts, and what has gone wrong before.

## Purpose and where it is published

tools/ is the source of [https://lmctl.com/tools/](<https://lmctl.com/tools/>): one plain-HTML section per tool (lmscript, lmcad, lmdraw, lmhtml, lmcode-cpp, …), each with a skill page written for LLM agents plus optional tutorial, guide, recipes, reference, FAQ and changelog pages. There is no framework, no JavaScript and no build step: authors write content HTML, and scripts/tools/ (an lmscript \_dsl\_ program run by the lmhtml host) decorates and checks it. scripts/deploy-tools.sh publishes it directly, and a push to main automatically publishes changed tool pages through the path-filtered static workflow. Details are in [Publishing lmctl.com](<publishing.md>).

## The 30-second version

1. Write tools/\<tool\>/index.html as the tool overview and tools/\<tool\>/skill.html with an h1, an introductory paragraph and the nine skill headings (below), using only plain tags. If its repository is not github.com/lmctl-ai/\<tool\>, add tools/\<tool\>/repo.txt containing the repository URL. A bare fragment is fine.
2. npm run decorate:tools (adds head, nav, footer, catalog, icons).
3. npm run check:tools (must print check: OK).
4. Commit the content and the generated HTML together, including repo.txt when needed.

Prerequisite once: lmscript 0.2.369 or newer on PATH (or set LMSCRIPT for icon rendering). Each script declares its host with cli and install; lmscript reads that release binary's embedded schema and downloads a missing asset into its tool cache with SHA-256 verification. CI installs the matching compiler release and works from an empty host cache. lmhtml, lmcad and lmdraw scripts use @latest. lmdraw 0.1.2 exposes --version and the compiler's --lmcode-schema protocol; lmblender releases are still drafts, so its scenes keep a local schema until a release supports the install contract.

## Layout

| Path | What it is |
| --- | --- |
| tools/style.css | The only stylesheet, element selectors only; change it for everyone |
| tools/index.html | Generated catalog, one entry per tool; never hand-edit |
| tools/\<tool\>/\<role\>\[-\<topic\>\].html | Authored content pages (decorated in place) |
| tools/\<tool\>/index.html | Authored tool overview, decorated in place |
| tools/\<tool\>/img/ | Local images; icon.png (64×64) and logo.png (256×256) are picked up automatically |
| tools/\<tool\>/repo.txt | Required: one repository URL when it is not github.com/lmctl-ai/\<tool\> |
| tools/img/ | Site icon (icon.png) and catalog logo (tools.png) |
| scripts/tools/run.sh | Runner: compiles and runs against the lmhtml release named by each script |
| scripts/tools/check.lms, decorate.lms, links.lms, roles.lms | Checker, decorator, link checker, role table |
| scripts/tools/template.html | Shared shell: layout, nav/footer variants, index regions |
| scripts/tools/icons/ | lmcad icon scripts and render.sh |
| tests/tools/ | Named bad fixtures (\<!-- expect: … --\>) and authoring fixtures |
| scripts/deploy-tools.sh | The only publisher of /tools/ |

## Naming convention and roles

A page is \<role\>.html or \<role\>-\<topic\>.html (lowercase letters, digits, single hyphens). Unknown roles and names with uppercase, spaces or underscores are errors. skill.html is the only required page; add other roles only when they help the tool's readers.

The exact filename get_started.html is also accepted for a tool's quickrun landing page; its navigation label is Quickruns. Generated example books may live under tools/TOOL/examples/; their page names use the lowercase source example slug rather than a page role.

| Role | Must contain |
| --- | --- |
| skill | h2 headings in exactly this order: Purpose, When to use it, Install, Commands, Inputs and outputs, Safety rules, Worked examples, Errors and exit codes, How to verify |
| tutorial | Numbered h2 steps; commands in pre/kbd, output in pre/samp; the last h2 is What you learned |
| guide | Free headings starting with Overview, Introduction or Getting started; must not duplicate the skill |
| recipes | Each h2 introduces a task with a preformatted example |
| reference | At least one table or definition list |
| faq | h2/h3 questions ending in a question mark |
| changelog | Free content |

Topic pages (guide-schema.html, tutorial-animation.html) are labelled Role: h1 in the nav, shortened near 80 characters at a word boundary. The role order and labels live in scripts/tools/roles.lms.

## The page contract

- One h1. Allowed elements only: html head meta title link body header nav main section footer h1 h2 h3 h4 p ul ol li dl dt dd pre code kbd samp em strong a table thead tbody tr th td blockquote hr figure figcaption img.
- Forbidden: class and style attributes, script, div, span, iframes, on\* handlers, data attributes, unlisted attributes, external resources. id only on h2/h3, unique. Explicit closing tags (malformed markup is reported, not repaired). At most 153600 bytes per page.
- Commands the reader types are kbd, program output is samp, both inside pre and separated by a newline, so a doc test could run the kbd and compare the samp: html \<pre\>\<kbd\>lmscript --version\</kbd\> \<samp\>lmscript 0.2.348\</samp\>\</pre\>
- Images: local /tools/\<tool\>/img/\<file\> or /tools/img/\<file\>, must exist, nonempty alt, inside a figure with a figcaption; PNG width/height must match the file (decoration fills missing ones). PNGs must be under 30000 bytes; above 20000 bytes the checker warns.
- Links: internal links are site-rooted (/tools/lmcad/skill.html) or same-page anchors and must resolve; external http(s) and mail links are allowed and not fetched.

## What decoration derives, and what it never touches

npm run decorate:tools (preview with npm run decorate:tools -- --check; it accepts no other flag) generates from scripts/tools/template.html: doctype, lang, charset, viewport, \<title\> (h1 + suffix), description (kept if present, else from the first paragraph, shortened to ≤160 characters at a sentence or word boundary), the single stylesheet link, the PNG favicon when img/icon.png exists, the tool nav (pages that exist, ordered by role then filename), the footer with the repository link, and the catalog tools/index.html with decorative icons. It fills missing PNG width/height. Each authored tool index.html remains the overview, including its figures; do not create a separate guide-overview.html. Missing indexes get a basic generated landing page marked as generated until an overview is written.

It never rewrites authored content: text, comments, quotes and entities are kept as source bytes. The only edits inside content: a newline between adjacent kbd/samp in a pre, and empty leading/trailing lines in pre are removed. A second run changes no bytes and no timestamps. Do not hand-edit nav or footer; tool overview content belongs in its authored index, while the site catalog is generated.

## Authoring guidance for an LLM

- Gather facts by running the tool, not from memory or old notes: install the released version, run --help/--version/--schema, try each command you document, and read error messages by provoking them. Prefer the released binary or package over a local build.
- Tutorials are run for real. Every kbd in a tutorial is executed in a fresh directory and its real output pasted into samp. Normalize volatile values (absolute paths, timings, temp names) and say so once.
- Public-safe prose: no internal requirement numbers, team or agent names, private repository names or local paths; experimental features are labelled experimental.
- A good skill page lets another LLM use the tool correctly on the first try: exact install and version, the few commands that matter with their flags, input/output formats, what is destructive and needs a dry run, syntax that differs from languages it will guess at, worked examples that were run, exit codes with fixes, and a verification loop (how to prove success).
- Size: a skill page of 8–20 KB, as many numbered tutorial steps as the task needs (typically 4–12), and a guide that is a real reference rather than a second skill.
- Examples to copy: /tools/lmscript/skill.html (language skill), /tools/lmcad/ (images and animations), /tools/lmdraw/ (retained 2D scenes and SVG input), /tools/lmhtml/ (recipes page), /tools/lmcode-cpp/ (library/SDK).

## Icons

Icons are rendered by lmcad from lmscript \_dsl\_ scripts in scripts/tools/icons/ (one \<tool\>.lms each; see its README). Each script must contain the byte-exact shared look block bounded by the marked comments; copy that block verbatim from tools.lms. Each tool has one distinct silhouette and accent color, and there is no text. site.lms renders the homepage/site icon as well as its logo. The separate animated homepage explainers use lmcad too; see [Homepage animated explainers](<homepage-videos.md>).

- Regenerate: LMCAD=/path/to/lmcad scripts/tools/icons/render.sh; verify: render.sh --check (re-renders to a temp dir, byte-compares); look at sizes with render.sh --preview DIR (256/64/32/16 px). The script rewrites every tool icon and the site icon: restore unrelated outputs with git checkout -- tools/\<other\>/img tools/img, or render only your tool's .lms script.
- Outputs: tools/\<tool\>/img/logo.png (256) and icon.png (64); site: tools/img/tools.png and icon.png. Keep each under 20 KB.
- Output is deterministic for a given lmcad binary; a new lmcad release may change pixels: re-render, --check, commit.
- For documentation renders, start with the released [lmcad v0.1.0 binary](<https://github.com/lmctl-ai/lmcad/releases/tag/v0.1.0>) and the documented example scripts; its output is repeatable across local builds.
- Decoration wires them in automatically; authors add no icon markup.

## Visual review

The checks prove structure, not appearance. Serve the repository root so site-rooted links work, then look at the pages:

```
python3 -m http.server 8765 --directory <repo-root>
# open http://127.0.0.1:8765/tools/ and each page of the tool
```

For a smoke check, choose an uncommon port and request a known-good page first, for example curl -I http://127.0.0.1:18765/tools/. A stale server on the usual port can return 404s for a different checkout and make a valid page look broken.

Ask a visual reviewer model that can see browser rendering and images (Gemini family models can) to report concrete problems, and fix them in the content or in the shared stylesheet/template. Checklist:

- readable at narrow (≈360 px) and wide (≥1280 px) widths; long pre blocks scroll
- light and dark color schemes (the stylesheet follows prefers-color-scheme)
- print preview (nav and footer hidden, pre wraps)
- icons and logos crisp, centered, recognizable at 16/32 px on light and dark
- repo.txt exists when the tool's repository is outside github.com/lmctl-ai/\<tool\>
- rendered images (figures) legible, captions accurate, nothing clipped
- kbd/samp blocks copy cleanly (no prompts or generated characters)

## Checks and CI

The lmscript language tutorials are published from lmscript-site/ to the separate lmscript/ object prefix. scripts/tools/static-site.py owns a dedicated manifest only for those new pages and examples; it does not claim the existing lmscript/commands objects. Run npm run check:lmscript-site before publication. The source and reading order are documented in [the lmscript site note](<lmscript-site.md>).

| Command | Verifies |
| --- | --- |
| npm run check:tools | decorate --check (no stale/missing generated parts), then the contract: elements, attributes, head, nav/main/footer, roles and headings, links and anchors, images and PNG sizes |
| npm run check:tools:selftest | Every tests/tools/\*.html fixture fails with its \<!-- expect: … --\> message; the current tree passes; an isolated copy tests fragments, roles, template propagation, indexes, icons, dry run, source preservation and idempotence |
| scripts/tools/run.sh links DIR | Internal links of a built site directory |
| npm run test:redirect | The CloudFront routing function, including /tools/\* |

CI (.github/workflows/tools-check.yml, read-only token, pinned actions) runs the checks and self-tests on every pull request and push touching tools/, scripts/tools/ or the tests.

- Add a rule: put it in the marked ROLE RULES section of check.lms (or the general checks), add a bad fixture tests/tools/\<name\>.html whose first line is \<!-- expect: \<message\> --\>, run the self-test.
- Add a role: one name=Label pair in roles.lms, its rule in ROLE RULES; decoration picks up order and label automatically.
- Change the shell: edit template.html, run npm run decorate:tools, commit every regenerated page.
- Enhance lmhtml (when the DSL needs a host member): change lmhtml upstream, release it, then verify the @latest install declaration resolves the new binary and rerun the checks. Set LMHTML=/path/to/lmhtml to test an unreleased build.

## Publishing

```
AWS_PROFILE=lmctl-website-deploy DRY_RUN=1 bash scripts/deploy-tools.sh
AWS_PROFILE=lmctl-website-deploy bash scripts/deploy-tools.sh
```

A push to main also runs the static publisher automatically after checks; no manual approval gate is used. See [the publishing guide](<publishing.md>) for the workflow, credentials, other site areas and live verification.

The script refuses unless run.sh check passes. It excludes templates, README and hidden files, refuses unexpected types and symlinks, and compares S3 bytes/headers before uploading only changes. It publishes exact directory index aliases and invalidates uploaded/deleted paths plus any stale live CDN copies. HTML uses no-cache; CSS/images use one-day caching. See [publishing.md](<publishing.md>) for the five-minute targeted retry and verify-live.sh --repair-cdn. CloudFront function changes remain a separate administrator step.

## Known limits and pitfalls

- Serialization normalizes HTML. lexbor (inside lmhtml) inserts implied tags (tbody, html/head/body) and re-quotes attributes when it serializes a document; decoration therefore splices regions into the source bytes instead of re-serializing pages. Keep it that way when changing decorate.lms.
- Idempotence is tested. A decoration change that alters bytes on a second run fails the self-test; make generated regions deterministic.
- Node and compiler versions. The npm package declares Node ≥ 24.15 and CI uses Node 24.15. run.sh requires lmscript ≥ 0.2.369 for cli=install support.
- Decoration owns nav, footer and the site catalog. Tool overview indexes are authored content; change their text directly and rerun decoration.
- PNG budget. 30 KB hard limit, 20 KB warning; lossless recompression helps, smaller renders help more.
- No classes, no per-page CSS. Style changes go into tools/style.css for all pages, using element selectors; the pages must also read well without CSS.
- Judging small icons by eye misleads: measure a symbol's bounding box rather than trusting an upscaled 16 px preview.
- Published but unseen: .txt files are deployed (e.g. repo.txt), so keep them public-safe.

## Legacy /skills/

The older raw utility and coordination skills live in skills/\*.html and share template.html and the lmhtml host; see durable-memory/skills-docs.md (npm run build:skills, npm run check:skills). New tool skills go to /tools/\<tool\>/skill.html.

## Done checklist

- skill.html has the nine headings in order and was written from real runs
- every tutorial command was run; samp is real output, volatile values normalized
- npm run decorate:tools applied; npm run check:tools prints check: OK
- npm run check:tools:selftest passes if scripts or fixtures changed
- icons rendered (render.sh --check passes), PNGs \< 20 KB
- visual review at narrow/wide, light/dark and print; findings fixed
- prose is public-safe; experimental features are labelled
- content and generated HTML committed together; push to main for checked automatic publication or use the manual script after a dry run

## Markdown durable memory and HTML skills

Project memory is authored in Markdown under durable-memory/, with a generated index.md and an optional lmhtml web view. See [memory-format.md](<memory-format.md>). This does not change the tool page contract: /tools/\<tool\>/skill.html and legacy /skills/\*.html remain HTML-only. lmhtml's Markdown conversion, index and template features are available for project notes without adding a second format to skills.

Migration evidence: the eight former HTML documents were converted through lmhtml's generic exporter and compared after parsing back through md4c; their rendered text matched modulo whitespace before the intentional format-guide updates. The old authored index's historical material is retained in [history.md](<history.md>). Code blocks, tables, audit JSON and links were kept; chapter references now use .md.

## Plain structure and agent readability

Author headings, paragraphs, lists, tables, links and pre/code or pre/kbd/samp blocks. Do not add strong/em, inline code, classes, styles or data attributes. Use literal UTF-8 punctuation, with only syntax-required HTML entities. h2/h3 ids are retained as stable section anchors. Put each prose paragraph on one source line. decorate calls Doc.normalize; checks run lmhtml lint with the small scripts/tools/plain.conf threshold file. Default decoration and unnecessary-entity thresholds are zero. External diagram images and videos provide visual richness without decorating prose.

Before: a paragraph containing an inline code wrapper around lmctl status. After: the same paragraph with lmctl status as plain text. A copyable command instead belongs in a pre/code block. This change preserves the paragraph's words.

lmhtml clean FILE --base [https://lmctl.com/tools/lmhtml/](<https://lmctl.com/tools/lmhtml/>) extracts main content for agents and resolves URLs. clean --check verifies that extraction drops no content-bearing main elements. lint --stats --json supplies counts, density per 100 words and byte/4 token estimates; --compare SNAPSHOT_DIR compares two trees. These are deterministic offline operations on local files. clean URL additionally uses curl to fetch the page; no browser or model is involved.

## Generated example books and quickrun samples

An examples book can live below tools/TOOL/examples/. The per-tool input is tools/TOOL/book.json and is excluded from the static publication manifest. It drives both the examples book and the solo/trio scripts, so adding a tool requires data, not generator edits. It records the public repository, description, task, the LMScript DSL/API/example links, provider member defaults and optional examples/render metadata. Run TOOL=NAME REF=main npm run sync:tool-examples; set SOURCE_DIR and SOURCE_REF to use a local checkout, OUTPUT_DIR to render into a scratch tree, and DATA_FILE only to test alternate JSON. The generator reads examples/*.lms plus examples/README.md descriptions and examples/renders previews, unless book.json explicitly lists example files and rendered outputs. It writes pages, install-enabled source and compact images under tools/NAME/examples/. It runs the generated sources directly with lmscript when available, so release installation and host rendering do not need provider config. Set LMSCRIPT_TOOL_CACHE to an empty directory to prove the released install path. When ffmpeg is available, full-size PNG outputs are quantized to compact previews; otherwise the source repository preview is used.

Autorun team scripts use scripts/tools/quickrun-template.lms and the same tools/NAME/book.json. Run TOOL=NAME python3 scripts/tools/generate-quickruns.py to regenerate tools/NAME/NAME_solo.lms and NAME_trio.lms; set OUTPUT_ROOT for a scratch tree. The generator writes leading autorun-role headers and matching @role(Alias.provider) and @role(Alias.model) references from member data. Add approved script entries to autorun/examples.json, then run node scripts/build-onboarding-catalogs.mjs; this regenerates /autorun/index.txt and the hello-only /helloexample/index.txt and their HTML views. Hello provider examples join the curated autorun catalog automatically and do not belong in the tool list. Public .lms sources are deployed as text/plain with revalidation, so edits become live promptly. The tools checker handles HTML book pages and the static publisher includes HTML, source and preview assets in its manifest and live byte checks.

## Host option spelling maintenance

Run `python3 scripts/tools/generate-example-book.py --refresh-host-flag-spellings`
for a flag-only refresh of manifest-owned example scripts/pages. This preserves
existing savedsl/system/dsl_cli structure, render assets and source provenance.
Full book generation also normalizes host options when reading pinned source
snapshots. The separate language plumbing migration remains independent.

For typed books, run `python3 scripts/tools/pull-books.py --refresh-host-flag-spellings`.
It refreshes only text in books-lock-owned pages/scripts and records the spelling
overlay; input/capture/media hashes and the original source pin remain unchanged.
Neither maintenance command executes a host or publishes content.
