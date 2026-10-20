# Durable memory format: Markdown notes

Author durable memory as readable Markdown, keep a generated chapter index, and build an optional HTML web view with lmhtml. The notes contain project knowledge, not presentation or emoji.

## Author a note

Write durable-memory/topic-name.md with one h1 title, a concise opening paragraph, and h2/h3 sections. Use descriptive lowercase names and relative links to chapters and repository files. Subdirectories such as archive/ are allowed. Keep decisions, constraints, evidence and next steps; avoid transcripts and duplicate facts.

````
# Release checklist

The checks needed before publishing a release.

## Steps

1. Run `npm run check:memory`.
2. Follow the [publishing guide](publishing.md).

```sh
npm run check:memory
```
````

CommonMark plus GFM tables, task lists, strikethrough and autolinks are supported by the pinned md4c parser in lmhtml. Raw HTML is disabled by default. Fenced code retains its language as data-language in the web view; there is no CSS or class syntax to remember when writing notes.

An optional leading --- block accepts single-line title: and summary: metadata. These override the first h1 and paragraph when generating the index. Matching outer quotes are stripped; this is not a general YAML parser. Other keys are ignored. An unterminated metadata block is an error.

## Generated index

durable-memory/index.md is a normal Markdown index of chapter links and one-line descriptions. It starts with one generated-by comment, then a heading and the list. The current lmctl seed instruction asks the reader to open that path first; it does not require a special first line. There is no HTML index source or compatibility pointer.

The title comes from front matter or the first h1; the summary comes from front matter or the first paragraph, with whitespace collapsed. Entries sort by relative filename. To override the order, use lmhtml index DIR --order FILE, where FILE lists relative chapter paths, one per line; remaining chapters sort after them. This repository uses the default order.

Edit chapters, then regenerate the index. Do not edit the generated list. Repeated generation changes neither bytes nor modification time. Historical material previously kept in the authored HTML index lives in [history.md](<history.md>).

## Commands

Run from the repository root:

| Command | Result |
| --- | --- |
| bash scripts/memory/run.sh index durable-memory | Generate index.md with the pinned lmhtml CLI |
| npm run check:memory | Check index drift, links/anchors and the no-emoji policy |
| npm run check:memory:selftest | Exercise drift, broken links, emoji and deterministic web builds |
| npm run build:memory-web | Convert notes to build/memory-web with the optional template |

The wrappers are thin: run.sh index DIR \[--check\] calls lmhtml index; check DIR calls index --check, mdcheck, and the repository policy scanner; web DIR OUT calls lmhtml site. Native Markdown commands need the lmhtml binary and no lmscript compiler. The wrapper obtains the SHA256-pinned release from scripts/tools/lmhtml.lock, or uses LMHTML=/path/to/lmhtml.

The checker reports a stale index with its regeneration command, rejects broken internal links/anchors, rejects HTML note sources, and reports emoji with file, line and code point. External URLs are not fetched. The audit JSON is retained as source evidence and may be linked from notes.

## Headings and links

Headings receive IDs made from lowercase ASCII letters and digits, with other runs replaced by hyphens. Empty IDs become section; collisions get -2, -3 suffixes. Link to other-note.md#heading-name or #heading-name. The web view rewrites local chapter links to .html while retaining query strings and anchors.

Links to files outside the notes directory remain links to the original repository files, with relative paths adjusted for the output location. Serve the repository root when previewing them. Moving a chapter to archive/ requires updating its links and regenerating the index.

## No emoji

Write precise words such as done, open and warning instead of pictographs. The policy scanner checks UTF-8 text files, including notes and the audit JSON, for these ranges:

| Code points | Meaning |
| --- | --- |
| U+1F000–U+1FAFF | Emoji, pictographs, regional flags and skin tones |
| U+2600–U+27BF | Miscellaneous symbols and dingbats |
| U+2B1B, U+2B1C, U+2B50, U+2B55 | Large squares, star and circle |
| U+231A, U+231B, U+23E9–U+23F3, U+23F8–U+23FA | Watch, hourglass, media and clock symbols |
| U+FE0F, U+20E3 | Emoji presentation selector and combining keycap |
| U+E0020–U+E007F | Tag characters used by flag sequences |

This is a fixed range policy, not the complete Unicode emoji property. Punctuation, arrows, mathematical operators, box drawing and geometric shapes outside the listed ranges remain allowed. Extend scripts/memory/check.py with a test if the policy needs to change.

## Optional web view and template

scripts/memory/template.html is an ordinary HTML shell, outside the source notes. Its five supported placeholders are {{title}}, {{summary}}, {{path}}, {{content}} and {{toc}}. Metadata is HTML-escaped, while content and the generated heading list are markup. Substitution is single-pass; placeholder-like text in a title stays literal. Use metadata placeholders only in HTML text or quoted attributes.

The repository shell adds the shared stylesheet, an index link, main content and a footer naming the rendered path. Source Markdown is never rewritten by site. Output inside the input directory is refused, and output must remain below the working directory. Writes are atomic and skip identical bytes. When deleting chapters, use a fresh output directory to avoid retaining obsolete web pages.

```
npm run build:memory-web
python3 -m http.server 8765 --directory .
```

Open http://127.0.0.1:8765/build/memory-web/index.html. This build is optional: durable-memory is not part of the public static deployment inventory.

## Other repositories and DSL use

Use the released lmhtml index DIR, lmhtml mdcheck DIR, and lmhtml site DIR OUT --template shell.html commands directly. Copy the wrapper and policy scanner only if you want this repository's policy; supply LMHTML or copy the pinned tools runner and lock too.

DSL users can load .md with html.load or html.load_dir, create a Doc with html.from_markdown(text), render a shell with html.render_markdown(text, template, path), and post-process the same Lexbor tree with ordinary selectors and mutations. html.index_markdown(dir, order) returns the index string and html.site(dir, out, template) builds a site. Skills under /skills/ and /tools/ remain HTML-only; this Markdown decision applies to durable memory.

## Plain structure profile

Notes use headings, paragraphs, lists, tables, links and fenced code blocks. No bold or italic emphasis, inline backticks, raw HTML or emoji. Write one paragraph per source line with no trailing whitespace. Paths, flags and identifiers are ordinary prose; copyable commands belong in fenced blocks. Images and video, rather than inline typography, supply visual explanations. lmhtml lint --stats durable-memory counts violations; check:memory enforces zero. normalize verifies text preservation and is idempotent.

Before and after, shown as literal source:

```
Before: Read **the guide** and `durable-memory/index.md`.
After: Read the guide and durable-memory/index.md.
```

The generated index starts with lmhtml's single generated-by comment, the only permitted raw-HTML metadata exception. Optional web output is normalized with the same HTML profile. h2/h3 anchor ids are the only permitted ids; they remain stable for chapter links. Lint counts these ids but does not treat them as decoration. Build output is never published by the website deploy.
