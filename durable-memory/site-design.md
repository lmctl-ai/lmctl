# lmctl docs site — design & authoring

The public documentation site for **lmctl**, served at **`lmctl.com/lmctl/`**
(a path prefix, not a subdomain). This page covers how the site is built,
authored, rendered, and published. It is itself public — keep it free of
internal paths, infrastructure secrets, or unreleased features.

## Stack

- **Docusaurus 3.x** static-site generator, Node 22.
- **Local search** via `@easyops-cn/docusaurus-search-local` — indexed at build
  time, no external search service.
- `docusaurus.config.ts`: `baseUrl: '/lmctl/'`, `trailingSlash: false`,
  `url: process.env.SITE_URL ?? 'https://lmctl.com'` (override `SITE_URL` to
  produce correct canonical/sitemap URLs for a staging domain).

## Information architecture

Two top-level sections plus a landing page, Glossary, and Troubleshooting. The
nav tree lives in `sidebars.ts`; the landing page is `src/pages/index.tsx`.

- **Tutorials** (`docs/tutorials/`, sequential, learn-by-doing): install & first
  run → your first workflow job (image-qa) → QA suite & ai-test chapters →
  operating workflows from the CLI.
- **Manuals / Reference** (`docs/manuals/`, topic-oriented): Concepts, Workflows
  & archetypes, Template catalog, Architecture overview, CLI reference,
  Operations runbook, Configuration & environment, ai-test chapter format. Plus
  top-level Glossary and Troubleshooting.

## Authoring

Docs are Markdown/MDX files under `docs/` with frontmatter:

```markdown
---
title: Page Title
sidebar_position: 3
---
```

To add a page: create `docs/<section>/<slug>.md`, then register its id (the path
without `.md`, e.g. `manuals/<slug>`) in `sidebars.ts`. Cross-link other pages
with relative paths (`./other-page.md`) so the build can validate them.

Content conventions (keep these consistent across pages):

- The product/platform is **lmctl**; the command is **`lmctl`**.
- Install is `npm install -g @lmctl-ai/lmctl`.
- The `lmctl` CLI is a **direct, local** tool — it sets up *and* operates
  everything; do not frame it as a network client. Member delegation is direct
  and synchronous via `lmctl prompt "<teamfile>.lmctl" <alias> "..."`. Busy returns an
  immediate error (`is busy; wait and retry`), establishing that nothing was sent
  and nothing is held. The legacy queue delivery engine (`mailbox_queue_enabled`,
  `mailbox_relay`, `lmctl mail deliver`) was removed in `0.1.264`. Legacy commands
  `lmctl chat`, `health`, `hire`, `refresh`, and `restore` are retired; member
  status and liveness inspection is performed via `lmctl status <teamfile> [<alias>] [--details]`.
- The **lmctl.ai** web console is **optional** (free/premium subscription), not
  required.
- Keep examples runnable and self-contained; never wrap `lmctl` dispatches in a shell `timeout`.

## Local development

```bash
npm ci          # reproducible install (lockfile is committed)
npm start       # dev server with hot reload at /lmctl/
npm run build   # static build into build/
npm run serve   # preview the built artifact locally
```

`npm run build` **fails on broken links and broken anchors** — fix them before
publishing. The artifact builds fully offline.

## Rendering & hosting

- `npm run build` emits static `build/` under the `/lmctl/` base path. With
  `trailingSlash: false`, pages render as `docs/glossary.html`, `search.html`,
  etc.; `404.html` is included.
- Objects are published under the S3 key prefix `lmctl/`. **Cache headers** are
  set on sync: hashed `assets/*` are long-TTL `immutable`; `*.html` and
  `sitemap.xml` are `no-cache`.
- A **CloudFront viewer-request function** (`infra/lmctl-www-redirect.js`) is
  required because a REST/OAC S3 origin does not resolve directory indexes.
  The function only handles clean-URL rewriting for `/lmctl/*` and `/lmprobe/*`:
  rewriting `/lmctl/` → `/lmctl/index.html`, slashless extensionless paths to `…/<name>.html`,
  and 301-redirecting trailing-slash paths to slashless canonicals. Requests with a file extension
  (`assets/*`, `.js/.css/.svg/.png/.xml`) pass through untouched. The function
  also keeps the `www`→apex redirect.
- **S3 Triple-Key Index Pattern for other prefixes:** Because `infra/lmctl-www-redirect.js`
  does not rewrite extensionless URIs for prefixes outside `/lmctl/*` and `/lmprobe/*`, all other
  paths (`/skills`, `/quickrun`, `/templates`, `/helloexample`, `/lmscript/commands`) pass
  through untouched to S3. To prevent 404 NoSuchKey errors when clients request these endpoints
  with or without trailing slashes, `scripts/deploy.sh` uploads index documents to **three distinct S3 keys**:
  `<prefix>` (e.g. `skills`), `<prefix>/` (e.g. `skills/`), and `<prefix>/index.html`.
- Deploy constraint: the `/lmctl/*` CloudFront behavior must have an **empty
  Origin Path** — objects already live under the `lmctl/` key prefix, so setting
  Origin Path `/lmctl` would double-prefix and 404.

## Publishing

Current publishing is **local/manual**. Use an operator environment with AWS
access:

```bash
npm run build
S3_BUCKET=lmctl-website-prod CF_DISTRIBUTION_ID=E1GKUWTM93U7IV bash scripts/deploy.sh
```

`scripts/deploy.sh` publishes the Docusaurus build under `s3://lmctl-website-prod/lmctl/`,
publishes the root homepage objects, syncs raw root-prefix artifacts such as
`/skills/`, and issues CloudFront invalidations plus live smoke checks.

The GitHub Actions deploy workflow still exists for `workflow_dispatch`, but the
push trigger is disabled as of 2026-08-05. Root cause: the OIDC role
`lmctl-website-deploy` is scoped to `s3://lmctl-website-prod/lmctl/*`, while
`scripts/deploy.sh` also writes the root homepage object
`s3://lmctl-website-prod/index.html`; automatic runs failed with `AccessDenied`
on that write. Re-enable automation only after widening the role scope or
splitting the homepage publish path.

For review-gated docs, work on a branch and merge/push to `main` only after the
review clears. Treat `main` as publish-ready, then deploy locally.

## Static tool pages (`/tools/`)

A separate surface from the Docusaurus site: plain HTML pages for each tool
(skill page for LLM agents, optional tutorial/guide/recipes/reference/FAQ/
changelog) in `tools/`, one shared stylesheet, no framework and no build step.
Authors write content only; `npm run decorate:tools` derives head, nav, footer,
indexes and icons from `scripts/tools/template.html`, and `npm run check:tools`
enforces the contract (also in CI). It is published only by
`scripts/deploy-tools.sh`, never by `scripts/deploy.sh`. See
[`tools-docs.md`](tools-docs.md) for the full guide.
