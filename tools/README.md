# /tools/ — static pages for lmctl tools

Source of <https://lmctl.com/tools/>: one plain-HTML section per tool, no
framework, no JavaScript, no build step. Published only by
`scripts/deploy-tools.sh` (not by `scripts/deploy.sh`).

## Add or improve a tool

1. Copy the template: `cp -R tools/_template tools/<tool>` (`<tool>` is the
   lowercase repo name, e.g. `lmhtml`).
2. In the four copied files replace `_template` with `<tool>`, `Tool name`
   with the tool's name and `TOOL-REPO` with its GitHub repo, then write the
   content. Keep the nav and footer identical on all four pages.
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

## Rules (enforced by `scripts/check-tools.mjs`)

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
