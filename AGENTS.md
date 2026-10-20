# AGENTS.md — lmctl-website

Entry point for agents and human operators working on **lmctl-website**. Essential context only; read `durable-memory/` for long-form architecture and historical change rationale.

## Long material in `durable-memory/`

- `durable-memory/index.md` — Generated chapter links and one-line summaries; read this first.
- `durable-memory/history.md` — Historical docs re-baselines and retired workflows; not current command guidance.
- `durable-memory/site-design.md` — Full architectural design: Docusaurus stack, authoring conventions, S3 layout, CloudFront viewer-request functions, and prefix routing.
- `DEPLOY.md` — Publishing runbook, scoped sync scripts, CloudFront function rollbacks, and quickrun catalog deployment.

## Sources and generated documentation

This repository is `github.com/lmctl-ai/lmctl`. Verify CLI claims against installed
`lmctl --help`, subcommand help and the corresponding `lmctl-src`/companion-tool
source in the mono checkout. lmprobe's public source is `github.com/lmctl-ai/lmprobe`;
its `site/` supplies the separately deployed manual. Do not assume historical
machine-specific clone paths or hosted-service availability. The per-skill evidence
and unverifiable claims are recorded in `durable-memory/skills-audit.md`.

Skills are HTML only (`skills/*.html`). There are no Markdown skill copies,
HTML-to-Markdown conversion or cross-format drift checks. `build:skills` only
decorates HTML and generates the HTML index. The pinned lmhtml host is maintained
at `github.com/lmctl-ai/lmhtml`; its generic exporter is not used by skills.

## Durable memory

Author notes as Markdown (`durable-memory/*.md`), without emoji. Run
`npm run build:memory-index` after editing a chapter; commit the generated
`index.md` with the source notes. `npm run check:memory` checks index drift,
links/anchors and the no-emoji policy. The wrappers use the checksum-pinned
lmhtml native Markdown commands; there is no HTML source profile or compatibility
stub. `npm run build:memory-web` optionally builds templated HTML under
`build/memory-web`. Durable-memory is not published by the static workflow.
See `durable-memory/memory-format.md` for authoring and template rules.

## Tools docs

The static `/tools/` section (one plain-HTML section per tool, skill page for
LLM agents plus optional tutorial/guide pages) has its own guide:
`durable-memory/tools-docs.md`. The three commands: `npm run decorate:tools`
(generate head, nav, footer, indexes, icons), `npm run check:tools` (contract +
stale decoration), `npm run check:tools:selftest` (checker fixtures). Push to main publishes changed static areas automatically; `scripts/deploy-tools.sh`
remains the independent manual entry point.

## Invariants that look optional

- **Multiple distinct hosted surfaces:** This repo does not just publish Docusaurus docs (`/lmctl/`). The S3 bucket `lmctl-website-prod` co-tenants 11 distinct surfaces:
  1. Apex homepage (`homepage/` -> `https://lmctl.com/`)
  2. Docusaurus documentation (`src/` + `docs/` -> `https://lmctl.com/lmctl/`)
  3. HTML-only skills (`skills/` -> `https://lmctl.com/skills/`, plus the HTML alias `/skills/lmctl-lead.html`)
  4. lmprobe manual (`/lmprobe/`, deployed via `scripts/deploy-lmprobe.sh`)
  5. Sample configs (`examples/` -> `/examples/`, deployed via `scripts/deploy-examples.sh`)
  6. Dynamic quickrun LMScript catalog (`quickrun/` -> `/quickrun/`, deployed via `scripts/deploy-quickrun.sh`)
  7. Hello example teamfiles (`helloexample/` -> `/helloexample/`)
  8. Template catalog (`templates/` -> `/templates/`)
  9. Curated LMScript command library (`lmscript/commands/` -> `/lmscript/commands/`)
  10. Historical workflow catalog (`workflows/` -> `/workflows/`, deployed via `scripts/deploy-workflows.sh`)
  11. Static tool pages (`tools/` -> `/tools/`, new; deployed by the static push workflow or `scripts/deploy-tools.sh`, never by `deploy.sh`). Plain HTML, one stylesheet, rules in `tools/README.md`, validated by `npm run check:tools` (CI: `.github/workflows/tools-check.yml`).
- **NEVER run `aws s3 sync --delete` on the S3 bucket root:** The S3 bucket `lmctl-website-prod` holds all prefixes co-tenanted. A root `--delete` wipes the other prefixes. Use scoped sync scripts (`deploy.sh`, `deploy-homepage.sh`, `deploy-quickrun.sh`, `deploy-lmprobe.sh`).
- **CloudFront Function vs S3 Triple-Key Index Hack:** `infra/lmctl-www-redirect.js` rewrites clean URLs for `/lmctl/*` and `/lmprobe/*` (deployed) and, in source but not yet deployed, `/tools/*` (`node tests/infra/lmctl-www-redirect.test.mjs`). All other paths (`/skills`, `/quickrun`, `/templates`, `/helloexample`, `/lmscript/commands`) pass through untouched. To prevent S3 404 NoSuchKey errors when accessed without `.html`, the static deploy scripts upload triple keys: `<prefix>`, `<prefix>/`, and `<prefix>/index.html` (see `durable-memory/site-design.md`).
- **Documentation checks:** Static `/tools/` pages are checked with `npm run check:tools`; `npm run check:tools:selftest` verifies that the checker rejects malformed fixtures. Legacy skills use `npm run check:skills` and `npm run check:skills:selftest`; regenerate with `npm run build:skills`. Neither checker validates Docusaurus `docs/`. There is no `scripts/test-docs.sh` in this repository.
- **`lmctl prompt`, not `lmctl chat`:** In modern lmctl, member delegation is driven by `lmctl prompt "<teamfile>.lmctl" <alias> "..."`, not the retired `lmctl chat` command.
- **Relative Markdown links in `docs/`:** `npm run build` fails on broken links and anchors. All cross-page links within `docs/` must be relative Markdown paths (e.g. `./other.md` or `../manuals/foo.md`), never absolute `https://lmctl.com/` URLs.
- **Never wrap `lmctl` in a shell `timeout`:** A dispatch that dies mid-turn is usually a timeout you set. A shell `timeout` sends SIGTERM mid-turn and leaves dead-PID locks in provider session storage. Turns of 8–47+ minutes are normal. The current prompt command has no idle-timeout flag; inspect progress with `status`/`tail` and wait for completion.
- **CloudFront Origin Path must be empty:** S3 objects already reside under the `lmctl/` key prefix. An Origin Path of `/lmctl` double-prefixes requests and returns 404.

## Commands that are not what you would assume

- **`npm run build` only builds `/lmctl/`:** Compiles Docusaurus into `build/`. It does NOT compile or stage `homepage/`, `skills/`, `quickrun/`, or `lmprobe/`.
- **`npm run check:tools` / `npm run check:tools:selftest`:** Validate static tool pages and test the lmhtml-hosted DSL checker in `scripts/tools/`. Install the published compiler (`npm i -g @lmctl-ai/lmctl@0.2.347`); the runner downloads a checksum-pinned lmhtml release, or accepts `LMHTML=/path/to/lmhtml`. `npm run decorate:tools -- --check` previews template/index changes; `npm run decorate:tools` applies them. Author content pages using roles in `scripts/tools/roles.lms`; only `skill.html` is required. Indexes are generated. Run from the repository root when changing `tools/`.
- **`node scripts/build-quickrun.mjs`:** Regenerates `quickrun/index.txt` and `quickrun/index.html` from `quickrun/*.lms` script descriptions.
- **`bash scripts/deploy.sh`:** Full manual deployment script (requires AWS access). Deploys `build/`, `skills/`, `homepage/`, and `quickrun/`, invalidates CloudFront, and runs smoke checks.
- **`bash scripts/deploy-homepage.sh`:** Deploys root homepage files (`index.html`, `404.html`, `assets/`) to S3 apex without `--delete`.
- **`bash scripts/deploy-quickrun.sh`:** Deploys only `/quickrun/` tasks and verifies content hashes via curl.
- **`npm ci` / Node version:** Requires Node >= 22 (declared in `package.json` `"engines"`).

## Traps that have bitten people

- **Editing `homepage/index.html` thinking it is Docusaurus:** The root homepage `https://lmctl.com/` is plain HTML/CSS in `homepage/`. Docusaurus only renders the subpath `https://lmctl.com/lmctl/`.
- **Static pushes publish automatically:** `.github/workflows/deploy-static.yml` checks tools, skills, memory and fixtures, assumes the website role with OIDC, and deploys changed tools/skills/homepage areas. No special gate. It shares the non-cancelling `site-deploy` concurrency group with the existing manual workflow. Exact-byte/header comparison skips unchanged objects; only changed paths are invalidated. `scripts/tools/verify-live.sh` uses the pinned lmhtml for live link/anchor discovery and checks publication hashes and headers. Independent scripts accept `DRY_RUN=1`; never edit IAM or publish the CloudFront function as part of a content deploy.
- **Skill URLs:** `/skills/lmctl-lead.html` aliases `lmctl-lead-skill.html`. All old `.md` URLs receive only the hand-written text/plain notices in `skills-moved/` for one release cycle. They are not skill content; the operator will remove them later.
- **HTML-only skills:** Never add `skills/*.md`. The grouped HTML index is generated from the ordered catalog in `scripts/tools/skills.lms`. Retired workflows remain HTML pointer pages.
- **Current command list:** The checker validates `lmctl` commands in `<kbd>` and command code blocks against `scripts/tools/lmctl-subcommands.lms`. Refresh it with `python3 scripts/tools/update-lmctl-subcommands.py` (parses installed `lmctl --help`); review the list before committing.
- **Skills coordination invariants:** `scripts/tools/skills.lms` rejects removed commands (`lmctl mail`, `health`, `hire`, `refresh`, `restore`, `chat`, `connect`, `serve`, `wake`, `can`, `sees`), `mailbox_queue_enabled`, and queue/mailbox/lane concepts in active Lead guidance. Lead pages must include inline `lmctl prompt` delegation, state that it `blocks`, and include `is busy; wait and retry`, `Author must not equal reviewer`, `Never wrap lmctl in a shell timeout`, explicit reading instructions, and `automatic durable-memory onboarding is not guaranteed`. Fixtures exercise these rules. Utilities such as lmmail retain their own genuine mailbox APIs.
- **Treat `main` as publish-ready:** Do not draft unreviewed changes directly on `main`. Work on feature branches and merge only after review clears.
- **Author is never reviewer:** On `.lmctl` teams, work must be reviewed and signed off by another live seat before deployment.
