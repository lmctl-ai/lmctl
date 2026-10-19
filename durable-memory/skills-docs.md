# Legacy /skills/

Legacy utility/coordination skills coexist with `/tools/<tool>/skill.html`.
Author `skills/<stem>.html` using the plain HTML contract in `tools/README.md`;
keep authored material in `<main>`. Do not edit generated Markdown or the index.

- `npm run build:skills`: decorate with `scripts/tools/template.html`, export
  Markdown with lmhtml `Doc.markdown("main")`, and rebuild the grouped index.
- `npm run check:skills`: enforce the common HTML contract, current coordination
  invariants and exact generated-file equality.
- `npm run check:skills:selftest`: exercise malformed pages, stale/missing files
  and repeat-build idempotence in an isolated temporary tree.

The ordered catalog and coordination rules are in `scripts/tools/skills.lms`.
HTML links use `/skills/<stem>.html`; the exporter changes only actual link
attributes to `.md` for Markdown readers, preserving fragments and code samples.
The index uses absolute links so `/skills` and `/skills/` both work. Four retired
workflows retain pointer pages but are omitted from the active catalog. Deployment
keeps the raw Lead alias `/skills/lmctl-lead.md` and the three existing index keys.
No CDN change or deploy is part of generation.

The old raw files were audited before migration; see `skills-audit.md` and its
claim inventory for source/CLI evidence and intentional corrections. The 23
corrected skill bodies compare semantically with regenerated Markdown. The
one-time bootstrap converter is not a runtime dependency: build/check use the
published LMScript compiler and checksum-pinned lmhtml release, with no Node
HTML/Markdown policy code.

Preview the repo-root server at `/skills/`. The index and three skill pages were
checked via HTTP for structure; visual rendering review is a separate Lead step.

Integration note: `durable-memory/tools-docs.md` had not landed when this change
was prepared. Once that parallel guide exists, its Legacy /skills/ section should
link here; this file avoids creating or overwriting the other author's draft.
