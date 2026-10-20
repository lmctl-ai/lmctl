<!-- generated-by: lmhtml index -->
# Index

Read the relevant chapter before changing this repository.

- [Website history](history.md) — Historical changes and evidence retained from the previous authored index. Dated entries describe past behavior, not current command guidance; consult publishing.md and skills-audit.md for current decisions.
- [Homepage animated explainers](homepage-videos.md) — The four homepage levels use short silent animations rendered from deterministic lmcad storyboards, with stable media URLs so a future renderer can replace the frame-generation step without changing page markup.
- [Durable memory format: Markdown notes](memory-format.md) — Author durable memory as readable Markdown, keep a generated chapter index, and build an optional HTML web view with lmhtml. The notes contain project knowledge, not presentation or emoji.
- [Publishing lmctl.com](publishing.md) — Static homepage, tools and skills changes publish automatically from main after the path-filtered workflow checks them, uploads changed objects, invalidates their exact URLs and verifies the live site.
- [lmctl docs site — design & authoring](site-design.md) — The public documentation site for lmctl, served at lmctl.com/lmctl/ (a path prefix, not a subdomain). This page covers how the site is built, authored, rendered, and published. It is itself public — keep it free of internal paths, infrastructure secrets, or unreleased features.
- [Skills audit — 2026-10-19](skills-audit.md) — This section supersedes the historical dual-format migration notes below; their audit results and comparison evidence are retained, not current build instructions. All 23 generated skills/\*.md copies were deleted. Skills are authored and served only as HTML; build/check no longer call a Markdown exporter or compare formats. The grouped HTML index and audited content/invariants remain. The command checker uses the checked-in 21-subcommand vocabulary refreshed from lmctl --help by python3 scripts/tools/update-lmctl-subcommands.py.
- [Legacy /skills/: HTML only](skills-docs.md) — Skills have one format: HTML. Author skills/\<stem\>.html using the plain HTML contract in tools/README.md; keep authored material in \<main\>.
- [/tools/ documentation: how to create and improve a tool's pages](tools-docs.md) — A guide for an LLM (or a person) adding or improving a tool's documentation in the static /tools/ section. tools/README.md is the short contract; this file explains how the pieces fit, how to gather facts, and what has gone wrong before.
