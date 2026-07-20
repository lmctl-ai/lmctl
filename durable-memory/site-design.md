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
  everything; do not frame it as a network client. Do not describe `lmctl serve`
  as the queued-member-mail delivery mechanism; base queued mail is scoped to a
  `(sender, receiver)` lane and is delivered by the same sender's next chat to
  that receiver. If that sender goes idle waiting for the queued reply, this is
  deadlock, not latency.
- The **lmctl.ai** web console is **optional** (free/premium subscription), not
  required.
- Keep examples runnable. Redirect daemon logs in examples:
  `lmctl serve > lmctl.log 2>&1 &`.

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
  required because a REST/OAC S3 origin does not resolve directory indexes. For
  the `/lmctl/*` branch it: rewrites `/lmctl/` → `/lmctl/index.html`, rewrites a
  slashless extensionless path (the canonical) → `…/<name>.html`, and 301s a
  trailing-slash path to the slashless canonical. Requests with a file extension
  (`assets/*`, `.js/.css/.svg/.png/.xml`) pass through untouched. The function
  also keeps the `www`→apex redirect; all non-`/lmctl/` paths pass through.
- Deploy constraint: the `/lmctl/*` CloudFront behavior must have an **empty
  Origin Path** — objects already live under the `lmctl/` key prefix, so setting
  Origin Path `/lmctl` would double-prefix and 404.

## Publishing (GitHub Actions + AWS OIDC)

Publishing is automated and **keyless** — no AWS credentials are stored in the
repo. On every push to `main` (or a manual run), `.github/workflows/deploy.yml`:

1. builds the site (`npm ci` + `npm run build`);
2. assumes the `lmctl-website-deploy` IAM role via GitHub's OIDC provider
   (`aws-actions/configure-aws-credentials`). GitHub mints a short-lived OIDC
   token; AWS exchanges it for temporary credentials. The role **trusts only
   this repo on `main`** and is scoped to **only** the `s3://lmctl-website-prod/
   lmctl/*` prefix and `CreateInvalidation` on the `lmctl.com` distribution;
3. runs `scripts/deploy.sh`, which `aws s3 sync`s `build/` to
   `s3://lmctl-website-prod/lmctl/` (cache headers above, prefix-scoped
   `--delete`) and issues a CloudFront invalidation for `/lmctl/*`.

**Manual fallback:** an operator with AWS access can publish the same way
locally with `npm run build && S3_BUCKET=… CF_DISTRIBUTION_ID=… bash
scripts/deploy.sh` — the workflow and the manual path run the identical script.
