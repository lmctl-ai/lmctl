# lmctl docs website — design (v2)

Status: **converged** (Lead authored 2026-06-09; 3-reviewer design pass folded
in — all three returned APPROVE-WITH-CHANGES; Lead arbitrated). This is the
canonical design the build follows.

## Mission

Public documentation site for the **lmctl** product (workflow-driven AI-agent
CLI/platform; single-operator, SQLite-backed, Linux/WSL2). Tutorials + manuals,
published to **`lmctl.com/lmctl/`** (a **path prefix**, not a subdomain) via
S3 + CloudFront.

## Decisions (operator-approved 2026-06-09)

1. **SSG: Docusaurus.** Path-prefix hosting via `baseUrl: '/lmctl/'`.
   Node-native. Built-in tutorials/docs split, sidebar nav, MDX, code blocks,
   and **local search** via `@easyops-cn/docusaurus-search-local` (no external
   service).
2. **IA: two top sections** — *Tutorials* (task-oriented, sequential) and
   *Manuals / Reference* (topic-oriented) — plus landing, Glossary,
   Troubleshooting. Manuals is sub-bucketed (see §IA below).
3. **Content: curated PUBLIC rewrite.** Distill from lmctl-src `README.md` +
   public guides. **Do NOT paste internal `durable-memory/` verbatim.** Obey
   the source allowlist + denylist (§Editorial).
4. **Deploy: artifact + script, OPERATOR runs it.** Build produces `build/`
   (baseUrl `/lmctl/`); deploy script syncs to `s3://<bucket>/lmctl/` +
   invalidates `/lmctl/*`, parameterized by bucket + distribution id. The site
   must fully build + produce the artifact independent of domain wiring.

## RECONCILIATION RULE (resolves Reviewer1 architecture-era BLOCKER)

The source mixes two eras: README teaches the `lmctl-next serve` always-on
daemon + `lmctl-next api` client; internal V4 docs describe a master-agent /
queue / oneshot model and autonomy levels. **The docs document only the SHIPPED
public surface:**

- **Document:** `lmctl-next serve` (daemon) + `lmctl-next api` (client) + the
  apicli verbs, exactly as the README and llmuser_guide present them.
- **Do NOT publish as user features:** the V4 master-agent/queue architecture,
  autonomy levels (`relay-all`/`relay-business`/`autopilot`), the
  "master"/"Lead"/"proxy" operator persona, or anything described as in-progress.
- **Architecture overview page** stays principle-level only: durable-memory =
  canonical state / session = disposable cache; the workflow pipeline as the
  organizing layer; job → run at a high level. No unreleased internals.

## Information architecture

**Tutorials** (sequential, learn-by-doing):
- Install & first run ← `README.md`
- Your first workflow job (image-qa) ← `README.md` — **must include a step to
  create/place the sample image before submit** (else first run 404s on file).
- Running the QA suite & ai-test chapters ← `README.md` + `llmuser_guide.md`
- Operating workflows from the CLI ← `master-onboard-guide.md` §4 request→CLI
  table ONLY. **File: `operating-workflows-cli`. No "Lead"/"master" wording;
  persona = "operator".**

**Manuals / Reference** (sub-bucketed nav):
- Concepts ← `README.md` glossary + framing. Give explicit conceptual treatment
  (not just glossary entries) to: **attention/escalation**, **serve / apicli /
  auth**, **session / team seed / sessiondir**, and **run vs job lifecycle**.
- Workflows & archetypes ← README + framing (8 workflows; Review / Consolidate
  / Interactive / Loop / ShellStep / AssertRepoClean / …)
- CLI / API reference ← `llmuser_guide.md` noun list + request→CLI table. Define
  **apicli** once as shorthand for the `lmctl-next api` command group and link
  it (no separate `apicli` binary).
- Operations runbook (**NEW**) ← request→CLI translations: status vs `api
  status`, attentions/escalations, runs/jobs, diagnose a stuck run, issue
  lifecycle. "What do I run when X happens." Stripped of internal frictions.
- Configuration & environment ← `master-onboard-guide.md` §2 (DB/profile
  resolution, serve port, env vars). No autonomy modes.
- ai-test chapter format ← `llmuser_guide.md` convention block
- Troubleshooting ← generic, public-safe only
- Glossary

## Editorial rules

**Naming convention:** **lmctl** (plain text) = the product / platform /
ecosystem. `lmctl-next` (code-formatted) = the binary, command, and repo. State
early (install + concepts) that the command is `lmctl-next`.

**Voice:** external reader. Runnable examples. Daemon examples redirect logs:
`lmctl-next serve > lmctl.log 2>&1 &`.

**Source allowlist:**
- `README.md` — safest; primary source. Clean up internal-preview/license note
  and any links into `durable-memory/`.
- `llmuser_guide.md` — selectively: apicli verb surface + ai-test chapter shape.
- `master-onboard-guide.md` — selectively: the §4 request→CLI translations ONLY,
  stripped of frictions, master/proxy persona, and autonomy modes.
- `index.md` — author framing reference ONLY; never quote, never link.

**Denylist (must not appear in published content):**
internal file paths; task IDs (`DG-*` `MX-*` `SP-*` `L-*` `DX-*` `TC*` `WT*`
`DT*` `TXL*`); issue numbers (`issue #N` / `#NN`); commit hashes; "in flight",
"future direction", roadmap/sprint/wave language; autonomy levels; dogfood
notes; admin/AWS/Cognito/Terraform specifics; direct-DB / `UPDATE` workarounds;
`prompts/` references; the "master"/"proxy"/"Lead" internal persona; links into
`durable-memory/`. Coder runs a denylist scan over authored content before
reporting.

## Build + deploy contract

- `npm ci` (not `npm install`) for reproducibility; lockfile is committed.
- `docusaurus.config`: `baseUrl: '/lmctl/'`, **`trailingSlash: false`** (pin it),
  `url: process.env.SITE_URL ?? 'https://lmctl.com'` (parameterize so a wrong
  domain doesn't silently ship bad canonical/sitemap).
- `npm run build` → static `build/`. Artifact builds fully offline.
- **CloudFront Function (viewer-request) is REQUIRED** for an OAC/REST S3 origin:
  a REST origin does not resolve directory indexes, so clean URLs 404 without
  it. Ship the function source in the repo (`infra/cf-rewrite.js`). It does
  **URI rewriting + canonical redirect ONLY**:
  Single mechanism — **append `.html`** (matches Docusaurus `trailingSlash:false`
  output, which emits `docs/glossary.html`, `search.html`, etc.; no extra
  build-time index-copy step):
  - bare `/lmctl/` → rewrite origin URI to `/lmctl/index.html`
  - slashless extensionless path (the Docusaurus canonical, e.g.
    `/lmctl/docs/glossary`) → rewrite origin URI to `…/glossary.html`
  - trailing-slash path (non-canonical, except bare `/lmctl/`) → **301 redirect
    to the slashless canonical** (parity with `trailingSlash:false`),
    preserving querystring
  - URIs with a file extension (`assets/*`, `.js/.css/.svg/.png/.xml`) → untouched
- **404 strategy is topology-dependent and DEFERRED to the infra decision**
  (NOT an artifact blocker). A viewer-request CloudFront Function has no origin
  visibility — it cannot know a key is missing, so it cannot serve `404.html`
  with a 404 status for arbitrary unknown routes. Resolve at deploy time:
  - **dedicated docs distribution** → distribution-level custom-error-response
    (403/404 → `/lmctl/404.html`, response code 404). Clean; no co-tenant.
  - **shared `/templates/` distribution** → Lambda@Edge origin-response on the
    `/lmctl/*` behavior (behavior-scoped), since distribution-level error
    responses would clobber `/templates/`.
  Ensure `404.html` ships in the artifact (Docusaurus emits one). Document both
  options in the repo README.
- Deploy script `scripts/deploy.sh`: requires `S3_BUCKET` + `CF_DISTRIBUTION_ID`
  (fail clearly if unset); `aws s3 sync build/ s3://$S3_BUCKET/lmctl/ --delete`
  (prefix-scoped `--delete` is safe for a shared bucket) then
  `aws cloudfront create-invalidation --distribution-id $CF_DISTRIBUTION_ID
  --paths '/lmctl/*'`. Set cache headers on sync: long-TTL immutable for hashed
  `assets/*`, short/no-cache for `*.html` + `sitemap.xml`.
- **Operator deploy constraints (document in repo README):** the `/lmctl/*`
  behavior must have an **empty Origin Path** (objects already live under the
  `lmctl/` key prefix; setting Origin Path `/lmctl` double-prefixes → 404s).
- Gitignore stays as-is; never commit `*.lmctl`, `.lmctl0/`, `.mcp.json`.
- Accepted risk: `npm audit` reports Docusaurus transitive webpack-chain
  findings; auto-fix needs a breaking downgrade. Static-site, dev-dep
  transitive — keep Docusaurus 3.10.x.

## Open infra (escalated to operator; does NOT block the build)

1. `lmctl.com` ownership: Route53 hosted-zone id, ACM cert ARN (us-east-1), and
   the **existing CloudFront distribution id** serving `lmctl.com/templates/` —
   docs attach as a `/lmctl/*` behavior on THAT distribution.
2. New bucket vs the existing `/templates/` bucket.
3. Deploy identity (operator runs deploy — assumed).

**New infra implication from review:** because CloudFront custom-error-responses
are distribution-wide, if docs share the `/templates/` distribution, 404
handling MUST live in the `/lmctl/*` CloudFront Function (not error responses).
A dedicated docs distribution would avoid the co-tenant constraint entirely.
This is an input to operator decisions #1/#2.
