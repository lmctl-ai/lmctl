# Legacy /skills/: HTML only

Skills have one format: HTML\. Author `skills/<stem>.html` using the plain HTML contract in `tools/README.md`; keep authored material in `<main>`\.

- `npm run build:skills`: decorate HTML with `scripts/tools/template.html` and regenerate the grouped HTML index\. It produces no Markdown\.
- `npm run check:skills`: enforce HTML, coordination and command invariants, and check for stale HTML decoration/index content\.
- `npm run check:skills:selftest`: test malformed pages, stale/missing indexes, the subcommand list and repeat\-build idempotence in an isolated tree\.

The ordered catalog and coordination rules live in `scripts/tools/skills.lms`\. Refresh `lmctl-subcommands.lms` with `python3 scripts/tools/update-lmctl-subcommands.py`, which parses installed `lmctl --help`\. Commands in kbd and command code blocks are checked against that list\. Cross\-skill links always target `.html`\.

`skills-moved/` holds 24 hand\-written transitional notices, one for each former skill URL and the old Lead alias\. Deployment serves them as text/plain, not as skill copies\. Remove them after the published transition period\. The HTML alias `/skills/lmctl-lead.html` is a copy of `lmctl-lead-skill.html` served as text/html\. The three index keys (`skills`, `skills/`, `skills/index.html`\) stay intact\. No Markdown exporter or cross\-format drift check participates in this flow\.

The original audit and migration comparison are historical evidence in [skills\-audit\.md](<skills-audit.md>); its HTML\-only correction records the consumer review\. New `/tools/<tool>/skill.html` pages coexist with these legacy utilities\. Preview at `/skills/` on the repo\-root HTTP server\.

The [tools documentation](<tools-docs.md>) describes the newer `/tools/<tool>/skill.html` pages and how they coexist with this section\.
