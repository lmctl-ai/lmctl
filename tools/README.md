# /tools/ — content first, decoration generated

Write plain HTML content. lmhtml supplies the document shell, navigation,
footers and indexes from `scripts/tools/template.html`; there are no CSS names,
framework components, per-page configuration files or required optional pages.

## Add a tool

1. Create `tools/<tool>/skill.html` with an h1, an introductory paragraph and the
   skill headings below. Write only the content: h2/h3, p, ul/ol, pre/kbd/samp/code,
   tables and figures. A bare fragment is fine. A simple tool needs only this page.
2. Optionally add `tutorial.html`, `tutorial-animation.html`, `guide.html`,
   `guide-schema.html`, `recipes.html`, `reference.html`, `faq.html` or
   `changelog.html`. Choose pages that help this tool's readers.
3. Run `npm run decorate:tools`, then `npm run check:tools`, and commit the content
   and generated HTML together. Do not author or edit an `index.html`.

Install Node supported by the published compiler and
`npm i -g @lmctl-ai/lmctl@0.2.347` (or newer) once. The runner downloads the
SHA256-pinned lmhtml release from `scripts/tools/lmhtml.lock`. `LMHTML=/path/to/lmhtml`
and `LMSCRIPT_BIN=/path/to/lmscript` select local executables.

## Names and roles

Names are `<role>.html` or `<role>-<topic>.html`, using lowercase letters, digits
and single hyphens. Unknown roles and uppercase/space/underscore names are errors.
There is no fixed page set. `skill.html` is the sole required content page.

| Role | Content rule |
| --- | --- |
| `skill` | h2 headings in exactly this order: Purpose, When to use it, Install, Commands, Inputs and outputs, Safety rules, Worked examples, Errors and exit codes, How to verify |
| `tutorial` | Numbered h2 steps, commands in pre/kbd, output in pre/samp; final h2 is What you learned |
| `guide` | Free headings, starting with Overview, Introduction or Getting started; must not duplicate the skill |
| `recipes` | Each h2 introduces a task with a preformatted example |
| `reference` | At least one table or definition list |
| `faq` | h2/h3 question headings ending in a question mark |
| `changelog` | Optional, free content |

`roles.lms` contains the shared role order and labels. The clearly marked
**ROLE RULES** section of `check.lms` contains the content checks. To add a role,
add one `name=Label` pair to the table and its rule in that section; decoration
picks up its order and label automatically. The index is labelled Overview;
base pages use the role label. Topic pages use
`Role: h1`, with the heading shortened at a word boundary near 80 characters.
Repeated labels gain the filename stem in parentheses. Nav links are ordered
by role, then filename, and only include pages that exist. There are no active-page classes.

## Decoration and generated indexes

`npm run decorate:tools -- --check` previews missing/outdated generated parts,
writes nothing and exits nonzero on a difference. Apply with
`npm run decorate:tools`. A second apply leaves bytes and file timestamps alone.
`npm run check:tools` first performs that preview, then runs the contract checker.
CI uses the same command; undecorated pages say `run npm run decorate:tools`.

The template, outside the deployed tree, has named regions for the common
layout, tool/site nav and footer variants, and tool/site indexes. Edit it once
and apply decoration to propagate changes. Placeholders for tool name, title,
description and repository are visible in that file. The repository is derived
as `https://github.com/lmctl-ai/<tool>`. A rare repository-name exception can
provide one URL in `tools/<tool>/repo.txt`; lmscript uses the website repository
because there is no public `lmctl-ai/lmscript` repository. This is tool-level,
not per-page configuration.

Titles come from h1 plus the tool/site suffix. An existing nonempty description
is retained; otherwise it comes from the first content paragraph, as do generated
summaries. Both use the same shortening rule: prefer the last sentence ending
within 160 characters, or end at a whole word with an ellipsis. A single oversized word stays intact.
Include an introductory paragraph. Old automatically truncated descriptions
are regenerated from that paragraph.
Authored content is retained as source bytes, including comments, quotes and
entities, with two formatting exceptions: adjacent kbd/samp commands and output
inside pre gain a separating newline, and empty leading/trailing newline lines
inside pre/code are removed. Other preformatted spacing stays intact. Loose
fragments are wrapped in main. Invalid content such as a div or class attribute is **not repaired**: the contract checker
reports it. Explicit main content is retained as well.

Each tool index is generated from the first content page in alphabetical
filename order: its h1 and first paragraph, links to the pages that exist, and
the derived repository link. The catalog has exactly one entry per tool with
content pages, in alphabetical directory order. Titles/summaries come from the
same source as the generated tool index, never a second configuration. New tools
appear automatically; deleted tools disappear. Missing indexes are recreated.
The old authored overview pages were preserved as `guide-overview.html` during
migration; old `user-guide.html` pages are now `guide.html`.

## Content contract

- One h1; allowed elements: html head meta title link body header nav main
  section footer h1 h2 h3 h4 p ul ol li dl dt dd pre code kbd samp em strong a
  table thead tbody tr th td blockquote hr figure figcaption img.
- No class/style attributes, scripts, div/span, iframes, on* handlers, external
  resources or unlisted attributes. IDs only on h2/h3; no duplicate IDs.
- Commands use kbd, output uses samp, both inside pre, separated by newlines.
  Paste real output.
- Images are local `/tools/<tool>/img/<file>`, with nonempty alt, inside a figure
  with a figcaption. Each page is at most 153600 bytes.
- Internal links are site-rooted or same-page anchors and must resolve. External
  HTTP(S), protocol-relative and mail links are allowed and are not fetched.
- Source markup must use explicit closing tags. Decoration does not silently
  repair malformed or ambiguous content.

The generated shell has HTML doctype, lang=en, charset, viewport, title,
description and exactly one stylesheet `/tools/style.css`, followed by nav,
main and footer. Change the stylesheet for everyone, not for one page.

Site-rooted links resolve from the repository root; `/` maps to the deployed
`homepage/index.html`. `scripts/tools/run.sh links /path/to/built/site` reports
broken internal links independently, ignoring external/non-web schemes.
`npm run check:tools:selftest` tests named bad fixtures and the current tree,
then uses an isolated copy to test fragments, roles, template propagation,
indexes, dry-run, source preservation and idempotence.

Only `scripts/deploy-tools.sh` deploys this section. The template and scripts are
outside `tools/` and are never uploaded. No Node HTML checker remains; lmscript
compiles the DSL and lmhtml runs it.
