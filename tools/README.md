# /tools/ — static pages for lmctl tools

Source of <https://lmctl.com/tools/>: one plain-HTML section per tool, no
framework, no JavaScript, no build step. Published only by
`scripts/deploy-tools.sh` (not by `scripts/deploy.sh`).

## Add or improve a tool

1. Copy a finished tool directory as your starting point, for example
   `cp -R tools/lmscript tools/<tool>` (`<tool>` is the lowercase repo name,
   e.g. `lmhtml`).
2. In the four copied files replace the tool name, its GitHub repo and every
   `/tools/lmscript/` link with `/tools/<tool>/`, then write the content.
   Keep the nav and footer identical on all four pages.
3. Add one line for the tool to `tools/index.html`.
4. Run `npm run check:tools` until it prints no errors.
5. Open a pull request. CI runs the same check.

## Pages

| File | Content |
| --- | --- |
| `index.html` | What it is, install, links (repo, releases, issues, license), the three docs |
| `tutorial.html` | Numbered steps with real commands and real output, ending with "What you learned" |
| `user-guide.html` | h2 sections: Overview, Install, Concepts, Reference, Tasks, Limits, Troubleshooting |
| `skill.html` | For an LLM agent. h2 sections in this order: Purpose, When to use it, Install, Commands, Inputs and outputs, Safety rules, Worked examples, Errors and exit codes, How to verify |

## Rules (enforced by `scripts/tools/check.lms` via lmhtml)

- Head: `<!doctype html>`, `<html lang="en">`, `<meta charset="utf-8">`,
  viewport meta, `<title>`, `<meta name="description">`, and exactly one
  stylesheet: `<link rel="stylesheet" href="/tools/style.css">`.
- Body: `<nav><ul>…</ul></nav>` (same on every page of a tool, with a link to
  `/tools/`), `<main>` with exactly one `<h1>`, then `<footer>`.
- Allowed elements only: html head meta title link body header nav main
  section footer h1 h2 h3 h4 p ul ol li dl dt dd pre code kbd samp em strong
  a table thead tbody tr th td blockquote hr figure figcaption img.
- No `class`, `style`, `script`, `div`, `span`, iframes, `on*` handlers, or
  external images/fonts/CSS. `id` only on `h2`/`h3` (anchor targets).
- Internal links are site-rooted (`/tools/<tool>/tutorial.html`) and must
  resolve to a file and, for `#anchor`, to an id on that page. External
  links (GitHub, npm) are fine.
- Commands the reader types: `<kbd>`; program output: `<samp>`; both inside
  `<pre>`. Paste real output from a real run.
- Images: local only, under `tools/<tool>/img/`, as
  `<figure><img src="/tools/<tool>/img/x.png" alt="…"><figcaption>…</figcaption></figure>`.
- Each page under 150 KB. `tools/style.css` is the only stylesheet; change it
  only for everyone.

`npm run check:tools:selftest` proves the checker still rejects the bad
examples in `tests/tools/`.

## Checker and navigation tooling

Install Node >= 22 and the published compiler once:
`npm i -g @lmctl-ai/lmctl@0.2.347` (newer versions also work).
`npm run check:tools` compiles `scripts/tools/check.lms` against the JSON schema
emitted by lmhtml, then runs the bytecode in that host. HTML parsing, selector
queries, markup checks, attribute enumeration, link resolution and page-size
checks use lmhtml; there is no Node HTML checker. The shell runner downloads
the platform release pinned by SHA256 in `scripts/tools/lmhtml.lock` into
`${XDG_CACHE_HOME:-$HOME/.cache}/lmctl-tools/`. Set `LMHTML` to use a local binary,
or `LMSCRIPT_BIN` to select an installed published compiler explicitly.

Edit a tool's `index.html` nav/footer, then run `npm run sync:tools -- --dry-run`
to preview changes and `npm run sync:tools` to apply them to its other pages.
Synchronization uses normalized DOM hashes (attribute ordering and insignificant
whitespace do not count as differences), replaces whole nav/footer nodes, and is
idempotent. Dry-run never saves pages. The report names each file and selector;
any checker finding causes a nonzero exit. Source markup checks require explicit
closing tags, even when HTML itself permits their omission.

Site-rooted links resolve from the repository root. The one deployment mapping
is `/` to `homepage/index.html`, the checked-in root homepage. External HTTP(S),
protocol-relative and mail links are not fetched. For an independent report on a
**built** site's internal links, use `scripts/tools/run.sh links /path/to/site`;
this command intentionally ignores external and non-web schemes. Cross-page
anchors must exist in the linked HTML. The tools checker also requires all four
pages, an index listing for each tool, and identical nav **and footer** nodes.

`npm run check:tools:selftest` checks every named bad fixture and the current tree,
then uses a temporary copy to test nav/footer mismatches, dry-run, synchronization,
byte-idempotence, empty/missing tool pages, and internal-link/anchor failures.
