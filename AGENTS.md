# AGENTS.md — lmctl-website

Entry point for agents and human operators working on **lmctl-website**. Essential context only; read `durable-memory/` for long-form architecture and historical change rationale.

## Long material in `durable-memory/`

- `durable-memory/index.md` — History of docs re-baselines, CLI command migrations, and delivery-model updates.
- `durable-memory/site-design.md` — Full architectural design: Docusaurus stack, authoring conventions, S3 layout, CloudFront viewer-request functions, and prefix routing.
- `DEPLOY.md` — Publishing runbook, scoped sync scripts, CloudFront function rollbacks, and quickrun catalog deployment.

## Depends on (clone paths on this machine are not guessable)

| Project | Repo | Local clone | Why |
|---|---|---|---|
| lmctl-src | `github.com/mikema3/lmctl-src` (branch `main`) | `/home/mma/repos/lmctl-src` | Canonical source for the `lmctl` CLI. All public docs, options, and skill pages must match actual CLI behavior. Also source for `examples/` (`deploy-examples.sh`) and historical `workflows/` (`deploy-workflows.sh`). |
| lmprobe | `github.com/lmctlhq/lmprobe` | `/home/mma/repos/lmprobe` | Canonical source for static manual at `https://lmctl.com/lmprobe/` (`scripts/deploy-lmprobe.sh`). Note: must be cloned to this path before deploying (or override `LMPROBE_SITE_DIR`); do not deploy from `/home/mma/repos/lmprobe-src/site` (stale staging tree). |
| tools/lmfeedback | `github.com/lmctlhq/lmfeedback` | `/home/mma/repos/tools/lmfeedback` | Canonical source for `skills/lmfeedback-skill.md` (`docs/lmfeedback-skill.md` in that repo). The website copy must remain byte-identical. |
| tools (lmmail, lmnote, lmsheet, lmtext) | `github.com/lmctlhq/<tool>` | `/home/mma/repos/tools/<tool>` | Canonical sources for raw skill pages published under `/skills/` (`lmmail-skill.md`, `lmnote-skill.md`, `lmsheet-skill.md`, `lmtext-skill.md`). |
| skills-scripts | `github.com/lmctlhq/skills-scripts` | `/home/mma/repos/skills-scripts` | Fleet workflows and validation scripts; its `scripts/check-all-lms.sh` validates website quickrun scripts (`quickrun/*.lms`). |

This repo itself: `github.com/lmctl-ai/lmctl` (note: org is `lmctl-ai` and repo is `lmctl`, cloned locally as `lmctl-website`).

## Invariants that look optional

- **Multiple distinct hosted surfaces:** This repo does not just publish Docusaurus docs (`/lmctl/`). The S3 bucket `lmctl-website-prod` co-tenants 11 distinct surfaces:
  1. Apex homepage (`homepage/` -> `https://lmctl.com/`)
  2. Docusaurus documentation (`src/` + `docs/` -> `https://lmctl.com/lmctl/`)
  3. Raw agent skill files (`skills/` -> `https://lmctl.com/skills/`, plus short aliases `/skills/lmctl-lead.md`, `/skills/lmctl-prompt.md`)
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
- **Two-speed documentation reality:** `skills/` is strictly modern (`lmctl prompt`, `lmctl status`, no queue/mailbox concepts) and enforced by `scripts/test-docs.sh`. `docs/` (Docusaurus manuals) still contains legacy references to `lmctl chat` and `mailbox_queue_enabled` because `test-docs.sh` does not scan `docs/`. When authoring or reviewing, do not let legacy terminology leak into skills or new docs.
- **`scripts/test-docs.sh` guards are strict regression gates:**
  - `lmctl mail`, `mailbox_queue_enabled`, and queue/mailbox/lane concepts are forbidden in coordination skills. The queue delivery engine was deleted from `lmctl` in `0.1.264`.
  - `lmctl health`, `lmctl hire`, `lmctl refresh`, and `lmctl restore` were removed from `lmctl`. `health` was replaced on 2026-09-24 by `lmctl status <teamfile> [<alias>] [--details]`.
  - Automatic durable memory onboarding must not be claimed: fresh sessions do not automatically re-read durable memory.
  - Coordination skill files (`skills/lmctl-lead-skill.md`, etc.) must be self-sufficient and show `lmctl prompt` inline delegation, state that it blocks, and include `is busy; wait and retry`, `nothing was sent`, and `nothing is held`.
- **`lmctl prompt`, not `lmctl chat`:** In modern lmctl, member delegation is driven by `lmctl prompt "<teamfile>.lmctl" <alias> "..."`, not the retired `lmctl chat` command.
- **Relative Markdown links in `docs/`:** `npm run build` fails on broken links and anchors. All cross-page links within `docs/` must be relative Markdown paths (e.g. `./other.md` or `../manuals/foo.md`), never absolute `https://lmctl.com/` URLs.
- **Never wrap `lmctl` in a shell `timeout`:** A dispatch that dies mid-turn is usually a timeout you set. A shell `timeout` sends SIGTERM mid-turn and leaves dead-PID locks in provider session storage. Turns of 8–47+ minutes are normal. Use `--idle-timeout 0` to disable or an explicit unit (`8h`, `300s`).
- **CloudFront Origin Path must be empty:** S3 objects already reside under the `lmctl/` key prefix. An Origin Path of `/lmctl` double-prefixes requests and returns 404.

## Commands that are not what you would assume

- **`npm run build` only builds `/lmctl/`:** Compiles Docusaurus into `build/`. It does NOT compile or stage `homepage/`, `skills/`, `quickrun/`, or `lmprobe/`.
- **`bash scripts/test-docs.sh`:** Fast doc regression test suite. Must be run from repo root (`cd /home/mma/repos/lmctl-website && bash scripts/test-docs.sh`). Always run this before submitting skill or documentation changes.
- **`node scripts/build-quickrun.mjs`:** Regenerates `quickrun/index.txt` and `quickrun/index.html` from `quickrun/*.lms` script descriptions.
- **`bash scripts/deploy.sh`:** Full manual deployment script (requires AWS access). Deploys `build/`, `skills/`, `homepage/`, and `quickrun/`, invalidates CloudFront, and runs smoke checks.
- **`bash scripts/deploy-homepage.sh`:** Deploys root homepage files (`index.html`, `404.html`, `assets/`) to S3 apex without `--delete`.
- **`bash scripts/deploy-quickrun.sh`:** Deploys only `/quickrun/` tasks and verifies content hashes via curl.
- **`npm ci` / Node version:** Requires Node >= 22 (declared in `package.json` `"engines"`).

## Traps that have bitten people

- **Editing `homepage/index.html` thinking it is Docusaurus:** The root homepage `https://lmctl.com/` is plain HTML/CSS in `homepage/`. Docusaurus only renders the subpath `https://lmctl.com/lmctl/`.
- **Publishing is local/manual, not GitHub Actions:** GitHub Actions push trigger is disabled because its OIDC role cannot write root `index.html`. Deployments are executed manually via `scripts/deploy.sh` with `S3_BUCKET=lmctl-website-prod` and `CF_DISTRIBUTION_ID=E1GKUWTM93U7IV`.
- **39 fleet teamfiles cite `/skills/lmctl-lead.md`:** The canonical file is `skills/lmctl-lead-skill.md`. `scripts/deploy.sh` copies it to `/skills/lmctl-lead.md` during deployment.
- **Imported skills byte-parity:** `skills/lmfeedback-skill.md` must remain byte-identical to upstream `tools/lmfeedback/docs/lmfeedback-skill.md`.
- **Treat `main` as publish-ready:** Do not draft unreviewed changes directly on `main`. Work on feature branches and merge only after review clears.
- **Author is never reviewer:** On `.lmctl` teams, work must be reviewed and signed off by another live seat before deployment.
