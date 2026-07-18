# Deploying lmctl.com

This repository is the source of **lmctl.com** — the homepage plus the
Docusaurus documentation site published to `lmctl.com/lmctl/` via S3 +
CloudFront. It also hosts the runnable assets at `lmctl.com/workflows/`,
`lmctl.com/skills/`, `lmctl.com/examples/`, and the lmprobe static manual at
`lmctl.com/lmprobe/`.

## Develop the docs locally

```bash
npm ci
npm run start
```

## Build

```bash
npm ci
npm run build
```

The static artifact is written to `build/` with Docusaurus `baseUrl` set to
`/lmctl/`.

## Deploy

| Target | Script |
| --- | --- |
| Docs (`/lmctl/`) | `./scripts/deploy.sh` |
| lmprobe static manual (`/lmprobe/`) | `./scripts/deploy-lmprobe.sh` |
| Homepage (root) | `./scripts/deploy-homepage.sh` |
| Workflow catalog (`/workflows/`) | `./scripts/deploy-workflows.sh` |
| Example configs (`/examples/`) | `./scripts/deploy-examples.sh` |

The production defaults target `s3://lmctl-website-prod/` and CloudFront
distribution `E1GKUWTM93U7IV`. Operators can override either target with env
vars:

```bash
S3_BUCKET=<bucket> CF_DISTRIBUTION_ID=<distribution-id> ./scripts/deploy.sh
```

`scripts/deploy.sh` syncs the docs artifact to `s3://$S3_BUCKET/lmctl/`, sets
long-lived immutable caching for hashed `assets/*`, sets no-cache headers for
HTML and `sitemap.xml`, and invalidates `/lmctl/*`. The `deploy-workflows.sh` /
`deploy-examples.sh` scripts mirror their content from the canonical lmctl-src
repo and sync it under the matching prefix.

`scripts/deploy-lmprobe.sh` publishes the lmprobe static manual to
`s3://$S3_BUCKET/lmprobe/` and invalidates `/lmprobe` plus `/lmprobe/*`. Its
default source is the public lmprobe repo at `../lmprobe`, with
`../lmprobe/LICENSE` and `../lmprobe/ATTRIBUTION.md` copied when present. Do not
deploy from `../lmprobe-src/site`; that staging tree is stale. Override the
bundle with `LMPROBE_SITE_DIR=/path/to/site` and the metadata root with
`LMPROBE_REPO_DIR=/path/to/lmprobe`. Use `DRY_RUN=1` to preview the scoped S3
sync without invalidating CloudFront. Hidden files such as `.git/` are stripped
from the staging tree before upload.

## CloudFront constraints for prefix behaviors

- Origin Path must be empty. Objects already live under the `lmctl/` key prefix;
  setting Origin Path to `/lmctl` double-prefixes requests and returns 404. The
  same rule applies to `lmprobe/` and `internal/lmctl/` objects.
- The production viewer-request CloudFront Function is `lmctl-www-redirect`,
  with source in `infra/lmctl-www-redirect.js`. It keeps the existing
  `www.lmctl.com` → apex redirect, adds `/lmctl/*` and `/lmprobe/*` clean-URL
  resolution, and rewrites bare `/internal/lmctl` to
  `/internal/lmctl/index.html`. lmprobe assets are written with `/lmprobe/...`
  absolute URLs, so no Origin Path is needed. The function does not implement
  404 handling.

Rollback source for the prior LIVE function is kept in `.rollback/`. To roll
back the function, update DEVELOPMENT with the saved source, then publish the
returned ETag:

```bash
aws cloudfront update-function \
  --name lmctl-www-redirect \
  --if-match <current-ETag> \
  --function-config Comment="301 redirect www.lmctl.com to lmctl.com",Runtime=cloudfront-js-2.0 \
  --function-code fileb://.rollback/lmctl-www-redirect.LIVE.js

aws cloudfront publish-function \
  --name lmctl-www-redirect \
  --if-match <rollback-update-ETag>
```

## 404 strategy

Docusaurus emits `build/404.html`; confirm it is present before deploy. The
runtime 404 strategy is topology-dependent and deferred to the operator's
CloudFront decision:

- Dedicated docs distribution: use distribution-level custom error responses
  for 403/404 to `/lmctl/404.html`, with response code 404.
- Shared `/templates/` distribution: use Lambda@Edge origin-response on the
  `/lmctl/*` behavior to map both S3 403 and 404 responses to `/lmctl/404.html`
  and force the final response status to 404. Distribution-level custom error
  responses are distribution-wide and would affect the `/templates/` co-tenant.
