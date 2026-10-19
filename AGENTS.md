# AGENTS.md — lmctl-website

Entry point for agents and human operators working on **lmctl-website**. Essential context only; read `durable-memory/` for long-form architecture and historical change rationale.

## Long material in `durable-memory/`

- `durable-memory/index.md` — History of docs re-baselines, CLI command migrations, and delivery-model updates.
- `durable-memory/site-design.md` — Full architectural design: Docusaurus stack, authoring conventions, S3 layout, CloudFront viewer-request functions, and prefix routing.
- `DEPLOY.md` — Publishing runbook, scoped sync scripts, CloudFront function rollbacks, and quickrun catalog deployment.

## Sources and generated documentation

This repository is `github.com/lmctl-ai/lmctl`. Verify CLI claims against installed
`lmctl --help`, subcommand help and the corresponding `lmctl-src`/companion-tool
source in the mono checkout. lmprobe's public source is `github.com/lmctl-ai/lmprobe`;
its `site/` supplies the separately deployed manual. Do not assume historical
machine-specific clone paths or hosted-service availability. The per-skill evidence
and unverifiable claims are recorded in `durable-memory/skills-audit.md`.

`skills/*.html` is canonical. Markdown is generated locally, not copied verbatim
from upstream manuals; preserve verified semantics when bringing in upstream fixes.
The lmhtml exporter is maintained at `github.com/lmctl-ai/lmhtml` and pinned in
`scripts/tools/lmhtml.lock`.

## Invariants that look optional

- **Multiple distinct hosted surfaces:** This repo does not just publish Docusaurus docs (`/lmctl/`). The S3 bucket `lmctl-website-prod` co-tenants 11 distinct surfaces:
  1. Apex homepage (`homepage/` -> `https://lmctl.com/`)
  2. Docusaurus documentation (`src/` + `docs/` -> `https://lmctl.com/lmctl/`)
  3. HTML skills and generated raw Markdown (`skills/` -> `https://lmctl.com/skills/`, plus the short alias `/skills/lmctl-lead.md`)
  4. lmprobe manual (`/lmprobe/`, deployed via `scripts/deploy-lmprobe.sh`)
  5. Sample configs (`examples/` -> `/examples/`, deployed via `scripts/deploy-examples.sh`)
  6. Dynamic quickrun LMScript catalog (`quickrun/` -> `/quickrun/`, deployed via `scripts/deploy-quickrun.sh`)
  7. Hello example teamfiles (`helloexample/` -> `/helloexample/`)
  8. Template catalog (`templates/` -> `/templates/`)
  9. Curated LMScript command library (`lmscript/commands/` -> `/lmscript/commands/`)
  10. Historical workflow catalog (`workflows/` -> `/workflows/`, deployed via `scripts/deploy-workflows.sh`)
  11. Static tool pages (`tools/` -> `/tools/`, new; deployed ONLY by `scripts/deploy-tools.sh`, never by `deploy.sh`). Plain HTML, one stylesheet, rules in `tools/README.md`, validated by `npm run check:tools` (CI: `.github/workflows/tools-check.yml`).
- **NEVER run `aws s3 sync --delete` on the S3 bucket root:** The S3 bucket `lmctl-website-prod` holds all prefixes co-tenanted. A root `--delete` wipes the other prefixes. Use scoped sync scripts (`deploy.sh`, `deploy-homepage.sh`, `deploy-quickrun.sh`, `deploy-lmprobe.sh`).
- **CloudFront Function vs S3 Triple-Key Index Hack:** `infra/lmctl-www-redirect.js` rewrites clean URLs for `/lmctl/*` and `/lmprobe/*` (deployed) and, in source but not yet deployed, `/tools/*` (`node tests/infra/lmctl-www-redirect.test.mjs`). All other paths (`/skills`, `/quickrun`, `/templates`, `/helloexample`, `/lmscript/commands`) pass through untouched. To prevent S3 404 NoSuchKey errors when accessed without `.html`, `scripts/deploy.sh` uploads triple keys: `<prefix>`, `<prefix>/`, and `<prefix>/index.html` (see `durable-memory/site-design.md`).
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
- **Publishing is local/manual, not GitHub Actions:** GitHub Actions push trigger is disabled because its OIDC role cannot write root `index.html`. Deployments are executed manually via `scripts/deploy.sh` with `S3_BUCKET=lmctl-website-prod` and `CF_DISTRIBUTION_ID=E1GKUWTM93U7IV`.
- **39 fleet teamfiles cite `/skills/lmctl-lead.md`:** The canonical file is `skills/lmctl-lead-skill.html`; Markdown is generated. `scripts/deploy.sh` copies it to `/skills/lmctl-lead.md` during deployment.
- **Generated skills byte-parity:** Every checked-in `skills/*.md` must equal the lmhtml export of its HTML content; the index is generated from the ordered catalog in `scripts/tools/skills.lms`. Retired URLs remain pointer pages.
- **Skills coordination invariants:** `scripts/tools/skills.lms` rejects removed commands (`lmctl mail`, `health`, `hire`, `refresh`, `restore`, `chat`, `connect`, `serve`, `wake`, `can`, `sees`), `mailbox_queue_enabled`, and queue/mailbox/lane concepts in active Lead guidance. Lead pages must include inline `lmctl prompt` delegation, state that it `blocks`, and include `is busy; wait and retry`, `Author must not equal reviewer`, `Never wrap lmctl in a shell timeout`, explicit reading instructions, and `automatic durable-memory onboarding is not guaranteed`. Fixtures exercise these rules. Utilities such as lmmail retain their own genuine mailbox APIs.
- **Treat `main` as publish-ready:** Do not draft unreviewed changes directly on `main`. Work on feature branches and merge only after review clears.
- **Author is never reviewer:** On `.lmctl` teams, work must be reviewed and signed off by another live seat before deployment.
