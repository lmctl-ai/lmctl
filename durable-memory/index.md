# lmctl-website — durable-memory index

You are a fresh agent on the **lmctl-website** project. Read this first.

## What this is

The public documentation website for **lmctl** (the workflow-driven AI-agent
CLI/platform; single-operator, SQLite-backed, Linux/WSL2). Tutorials + manuals,
published to **`lmctl.com/lmctl/`** (a path prefix, not a subdomain) via
S3 + CloudFront.

## Canonical docs

- **[`site-design.md`](site-design.md)** — the authoritative design: SSG choice,
  IA, content→source mapping, editorial allowlist/denylist, the
  architecture-era reconciliation rule, and the full build + deploy contract.
  **Read it before changing anything.** It reflects a converged 3-reviewer pass.

## Build & deploy (quick reference)

- SSG: **Docusaurus** (classic preset, TS config), `baseUrl: '/lmctl/'`,
  `trailingSlash: false`, `url` from `SITE_URL` env (defaults `https://lmctl.com`).
- Local search via `@easyops-cn/docusaurus-search-local` (no external service).
- Build: `npm ci && npm run build` → `build/`. Builds fully offline; the
  artifact is independent of domain wiring.
- Deploy (operator runs): `scripts/deploy.sh` — needs `S3_BUCKET` +
  `CF_DISTRIBUTION_ID`; syncs `build/` → `s3://$S3_BUCKET/lmctl/ --delete`
  (prefix-scoped, co-tenant-safe) + invalidates `/lmctl/*`.
- **CloudFront viewer-request Function** (`infra/lmctl-www-redirect.js`) handles
  the OAC/REST S3 origin: it keeps the existing `www.lmctl.com`→apex redirect and
  adds `/lmctl/*` clean-URL resolution — appends `.html` to slashless
  extensionless paths, maps bare `/lmctl/` → `/lmctl/index.html`, 301s
  trailing-slash → slashless canonical, leaves extensioned URIs untouched. It
  does NOT handle 404s (a viewer-request function has no origin visibility).
  Deployed LIVE 2026-06-09 on distribution `E1GKUWTM93U7IV` (function
  `lmctl-www-redirect`); prior code preserved in `.rollback/`.
- **404 strategy is deploy-topology-dependent** (deferred to operator): a
  dedicated docs distribution → distribution custom-error-response; a shared
  `/templates/` distribution → behavior-scoped Lambda@Edge origin-response.
  Both must map S3 **403 and 404** → `/lmctl/404.html` and force status 404.

## Open items owned by the operator (not self-serviceable)

`lmctl.com` is NOT in `lmctl-src/infra/terraform` — it terminates elsewhere and
already serves `lmctl.com/templates/`. Pending operator answers:
1. Route53 zone id, ACM cert ARN (us-east-1), and the **existing CloudFront
   distribution id** serving `/templates/` — docs attach as a `/lmctl/*`
   behavior on that distribution.
2. New bucket vs the existing `/templates/` bucket.
3. Deploy identity (operator runs deploy — assumed).

## Source of truth for content

Content is a curated PUBLIC rewrite distilled from `/home/mma/repos/lmctl-src`
(`README.md` + selected `durable-memory/` guides). Never paste internal
durable-memory verbatim; obey the allowlist/denylist in `site-design.md`.
