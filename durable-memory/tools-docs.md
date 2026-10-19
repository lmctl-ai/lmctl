# /tools/ documentation: how to create and improve a tool's pages

A guide for an LLM (or a person) adding or improving a tool's documentation in
the static `/tools/` section. `tools/README.md` is the short contract; this file
explains how the pieces fit, how to gather facts, and what has gone wrong before.

## Purpose and where it is published

`tools/` is the source of <https://lmctl.com/tools/>: one plain-HTML section per
tool (lmscript, lmcad, lmhtml, cpp-dsl-sdk, …), each with a skill page written
for LLM agents plus optional tutorial, guide, recipes, reference, FAQ and
changelog pages. There is no framework, no JavaScript and no build step: authors
write content HTML, and `scripts/tools/` (an lmscript `_dsl_` program run by the
lmhtml host) decorates and checks it. Only `scripts/deploy-tools.sh` publishes
it; `main` is not auto-published and `/tools/` is not part of `scripts/deploy.sh`.

## The 30-second version

1. Write `tools/<tool>/skill.html`: an h1, an introductory paragraph and the nine
   skill headings (below), using only plain tags. A bare fragment is fine.
2. `npm run decorate:tools` (adds head, nav, footer, indexes, icons).
3. `npm run check:tools` (must print `check: OK`).
4. Commit the content and the generated HTML together.

Prerequisite once: the published compiler, `npm i -g @lmctl-ai/lmctl@0.2.347`
or newer. The runner downloads the pinned lmhtml release itself.

## Layout

| Path | What it is |
| --- | --- |
| `tools/style.css` | The only stylesheet, element selectors only; change it for everyone |
| `tools/index.html` | Generated catalog, one entry per tool; never hand-edit |
| `tools/<tool>/<role>[-<topic>].html` | Authored content pages (decorated in place) |
| `tools/<tool>/index.html` | Generated tool overview; never author it |
| `tools/<tool>/img/` | Local images; `icon.png` (64×64) and `logo.png` (256×256) are picked up automatically |
| `tools/<tool>/repo.txt` | Optional: one repository URL when it is not `github.com/lmctl-ai/<tool>` |
| `tools/img/` | Site icon (`icon.png`) and catalog logo (`tools.png`) |
| `scripts/tools/run.sh` | Runner: downloads the pinned lmhtml, compiles a DSL script, runs it |
| `scripts/tools/check.lms`, `decorate.lms`, `links.lms`, `roles.lms` | Checker, decorator, link checker, role table |
| `scripts/tools/template.html` | Shared shell: layout, nav/footer variants, index regions |
| `scripts/tools/lmhtml.lock` | lmhtml release version + SHA256 per platform asset |
| `scripts/tools/icons/` | lmcad icon scripts and `render.sh` |
| `tests/tools/` | Named bad fixtures (`<!-- expect: … -->`) and authoring fixtures |
| `scripts/deploy-tools.sh` | The only publisher of `/tools/` |

## Naming convention and roles

A page is `<role>.html` or `<role>-<topic>.html` (lowercase letters, digits,
single hyphens). Unknown roles and names with uppercase, spaces or underscores
are errors. `skill.html` is the only required page; add other roles only when
they help the tool's readers.

| Role | Must contain |
| --- | --- |
| `skill` | h2 headings in exactly this order: Purpose, When to use it, Install, Commands, Inputs and outputs, Safety rules, Worked examples, Errors and exit codes, How to verify |
| `tutorial` | Numbered h2 steps; commands in pre/kbd, output in pre/samp; the last h2 is What you learned |
| `guide` | Free headings starting with Overview, Introduction or Getting started; must not duplicate the skill |
| `recipes` | Each h2 introduces a task with a preformatted example |
| `reference` | At least one table or definition list |
| `faq` | h2/h3 questions ending in a question mark |
| `changelog` | Free content |

Topic pages (`guide-schema.html`, `tutorial-animation.html`) are labelled
`Role: h1` in the nav, shortened near 80 characters at a word boundary. The
role order and labels live in `scripts/tools/roles.lms`.

## The page contract

- One h1. Allowed elements only: html head meta title link body header nav main
  section footer h1 h2 h3 h4 p ul ol li dl dt dd pre code kbd samp em strong a
  table thead tbody tr th td blockquote hr figure figcaption img.
- Forbidden: class and style attributes, script, div, span, iframes, `on*`
  handlers, data attributes, unlisted attributes, external resources. `id` only
  on h2/h3, unique. Explicit closing tags (malformed markup is reported, not
  repaired). At most 153600 bytes per page.
- Commands the reader types are `kbd`, program output is `samp`, both inside
  `pre` and separated by a newline, so a doc test could run the kbd and compare
  the samp:

  ```html
  <pre><kbd>lmscript --version</kbd>
  <samp>lmscript 0.2.348</samp></pre>
  ```

- Images: local `/tools/<tool>/img/<file>` or `/tools/img/<file>`, must exist,
  nonempty `alt`, inside a `figure` with a `figcaption`; PNG width/height must
  match the file (decoration fills missing ones). PNGs must be under 30000
  bytes; above 20000 bytes the checker warns.
- Links: internal links are site-rooted (`/tools/lmcad/skill.html`) or same-page
  anchors and must resolve; external http(s) and mail links are allowed and not
  fetched.

## What decoration derives, and what it never touches

`npm run decorate:tools` (preview with `npm run decorate:tools -- --check`;
it accepts no other flag) generates from `scripts/tools/template.html`:
doctype, `lang`, charset, viewport, `<title>` (h1 + suffix), description (kept
if present, else from the first paragraph, shortened to ≤160 characters at a
sentence or word boundary), the single stylesheet link, the PNG favicon when
`img/icon.png` exists, the tool nav (pages that exist, ordered by role then
filename), the footer with the repository link, each tool's `index.html` (h1,
first paragraph, logo, page links, repository) and the catalog
`tools/index.html` with decorative icons. It fills missing PNG width/height.

It never rewrites authored content: text, comments, quotes and entities are kept
as source bytes. The only edits inside content: a newline between adjacent
kbd/samp in a `pre`, and empty leading/trailing lines in `pre` are removed. A
second run changes no bytes and no timestamps. Do not hand-edit nav, footer or
indexes: decoration overwrites them, and `check` reports stale decoration.

## Authoring guidance for an LLM

- **Gather facts by running the tool**, not from memory or old notes: install
  the released version, run `--help`/`--version`/`--schema`, try each command
  you document, and read error messages by provoking them. Prefer the released
  binary or package over a local build.
- **Tutorials are run for real.** Every kbd in a tutorial is executed in a fresh
  directory and its real output pasted into samp. Normalize volatile values
  (absolute paths to `/home/me/…`, timings, temp names) and say so once.
- **Public-safe prose:** no internal requirement numbers, team or agent names,
  private repository names or local paths; experimental features are labelled
  experimental.
- **A good skill page** lets another LLM use the tool correctly on the first
  try: exact install and version, the few commands that matter with their
  flags, input/output formats, what is destructive and needs a dry run, syntax
  that differs from languages it will guess at, worked examples that were run,
  exit codes with fixes, and a verification loop (how to prove success).
- **Size:** a skill page of 8–20 KB, a tutorial of 10–15 steps, a guide that is
  a real reference rather than a second skill.
- **Examples to copy:** `/tools/lmscript/skill.html` (language skill),
  `/tools/lmcad/` (images and animations), `/tools/lmhtml/` (recipes page),
  `/tools/cpp-dsl-sdk/` (library/SDK).

## Icons

Icons are rendered by lmcad from lmscript `_dsl_` scripts in
`scripts/tools/icons/` (one `<tool>.lms` each; see its README). They share one
look block (tile color, lights, camera direction, supersampling), each tool has
one distinct silhouette and accent color, and there is no text.

- Regenerate: `LMCAD=/path/to/lmcad scripts/tools/icons/render.sh`; verify:
  `render.sh --check` (re-renders to a temp dir, byte-compares); look at
  sizes with `render.sh --preview DIR` (256/64/32/16 px).
- Outputs: `tools/<tool>/img/logo.png` (256) and `icon.png` (64); site:
  `tools/img/tools.png` and `icon.png`. Keep each under 20 KB.
- Output is deterministic for a given lmcad binary; a new lmcad release may
  change pixels: re-render, `--check`, commit.
- Decoration wires them in automatically; authors add no icon markup.

## Visual review

The checks prove structure, not appearance. Serve the repository root so
site-rooted links work, then look at the pages:

```sh
python3 -m http.server 8765 --directory <repo-root>
# open http://127.0.0.1:8765/tools/ and each page of the tool
```

Ask a visual reviewer model that can see browser rendering and images (Gemini
family models can) to report concrete problems, and fix them in the content or
in the shared stylesheet/template. Checklist:

- readable at narrow (≈360 px) and wide (≥1280 px) widths; long pre blocks scroll
- light and dark color schemes (the stylesheet follows `prefers-color-scheme`)
- print preview (nav and footer hidden, pre wraps)
- icons and logos crisp, centered, recognizable at 16/32 px on light and dark
- rendered images (figures) legible, captions accurate, nothing clipped
- kbd/samp blocks copy cleanly (no prompts or generated characters)

## Checks and CI

| Command | Verifies |
| --- | --- |
| `npm run check:tools` | `decorate --check` (no stale/missing generated parts), then the contract: elements, attributes, head, nav/main/footer, roles and headings, links and anchors, images and PNG sizes |
| `npm run check:tools:selftest` | Every `tests/tools/*.html` fixture fails with its `<!-- expect: … -->` message; the current tree passes; an isolated copy tests fragments, roles, template propagation, indexes, icons, dry run, source preservation and idempotence |
| `scripts/tools/run.sh links DIR` | Internal links of a built site directory |
| `npm run test:redirect` | The CloudFront routing function, including `/tools/*` |

CI (`.github/workflows/tools-check.yml`, read-only token, pinned actions) runs
the checks and self-tests on every pull request and push touching `tools/`,
`scripts/tools/` or the tests.

- **Add a rule:** put it in the marked ROLE RULES section of `check.lms` (or the
  general checks), add a bad fixture `tests/tools/<name>.html` whose first line
  is `<!-- expect: <message> -->`, run the self-test.
- **Add a role:** one `name=Label` pair in `roles.lms`, its rule in ROLE RULES;
  decoration picks up order and label automatically.
- **Change the shell:** edit `template.html`, run `npm run decorate:tools`, commit
  every regenerated page.
- **Enhance lmhtml** (when the DSL needs a host member): change lmhtml upstream,
  release it, then update `scripts/tools/lmhtml.lock`: `version vX.Y.Z` and one
  `asset sha256` line per platform, computed from the downloaded release assets
  (not local builds). `LMHTML=/path/to/lmhtml` tests an unreleased build.

## Publishing

```sh
DRY_RUN=1 scripts/deploy-tools.sh   # preview the S3 sync, no invalidation
scripts/deploy-tools.sh             # publish (operator with AWS access)
```

The script refuses unless `run.sh check` passes, stages `tools/` without
`_template`, `README.md` or hidden files, refuses file types other than
html/css/png/svg/txt and symlinks, syncs each type under `s3://…/tools/` only
(HTML no-cache, CSS/images one day), stores each `index.html` under the
slashless and trailing-slash keys, and invalidates `/tools*`. Clean URLs
(`/tools/lmcad`, `/tools/lmcad/tutorial`) additionally need the `/tools/*` rules
in `infra/lmctl-www-redirect.js` deployed to CloudFront; until then, links to
explicit `.html` files and the directory keys work.

## Known limits and pitfalls

- **Serialization normalizes HTML.** lexbor (inside lmhtml) inserts implied tags
  (`tbody`, `html/head/body`) and re-quotes attributes when it serializes a
  document; decoration therefore splices regions into the source bytes instead
  of re-serializing pages. Keep it that way when changing `decorate.lms`.
- **Idempotence is tested.** A decoration change that alters bytes on a second
  run fails the self-test; make generated regions deterministic.
- **Node and compiler versions.** The npm package declares Node ≥ 24.15; CI runs
  the checks on Node 22 (npm warns, the compiler works). Use a current Node
  locally. `run.sh` requires lmscript ≥ 0.2.347.
- **Decoration owns nav, footer and indexes.** Hand edits there are overwritten
  or reported as stale; change `template.html` instead.
- **PNG budget.** 30 KB hard limit, 20 KB warning; lossless recompression helps,
  smaller renders help more.
- **No classes, no per-page CSS.** Style changes go into `tools/style.css` for all
  pages, using element selectors; the pages must also read well without CSS.
- **Judging small icons by eye misleads:** measure a symbol's bounding box
  rather than trusting an upscaled 16 px preview.
- **Published but unseen:** `.txt` files are deployed (e.g. `repo.txt`), so keep
  them public-safe.

## Legacy /skills/

The older raw utility and coordination skills live in `skills/*.html` and share
`template.html` and the lmhtml host; see `durable-memory/skills-docs.md`
(`npm run build:skills`, `npm run check:skills`). New tool skills go to
`/tools/<tool>/skill.html`.

## Done checklist

- [ ] `skill.html` has the nine headings in order and was written from real runs
- [ ] every tutorial command was run; samp is real output, volatile values normalized
- [ ] `npm run decorate:tools` applied; `npm run check:tools` prints `check: OK`
- [ ] `npm run check:tools:selftest` passes if scripts or fixtures changed
- [ ] icons rendered (`render.sh --check` passes), PNGs < 20 KB
- [ ] visual review at narrow/wide, light/dark and print; findings fixed
- [ ] prose is public-safe; experimental features are labelled
- [ ] content and generated HTML committed together; publishing left to `deploy-tools.sh`
