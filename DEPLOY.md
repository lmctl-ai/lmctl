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
| Full deployment (all surfaces below) | `./scripts/deploy.sh` |
| Docs (`/lmctl/`) | Included in `deploy.sh` |
| Homepage (root) | `./scripts/deploy-homepage.sh` (also in `deploy.sh`) |
| lmprobe static manual (`/lmprobe/`) | `./scripts/deploy-lmprobe.sh` |
| HTML-only skills (`/skills/`) | `./scripts/deploy-skills.sh` (also in `deploy.sh`) |
| Hello examples (`/helloexample/`) | Included in `deploy.sh` |
| Templates (`/templates/`) | Included in `deploy.sh` |
| LMScript commands (`/lmscript/commands/`) | Included in `deploy.sh` |
| Example configs (`/examples/`) | `./scripts/deploy-examples.sh` (mirrored from lmctl-src) |
| Quickrun catalog (`/quickrun/`) | `./scripts/deploy-quickrun.sh` (also in `deploy.sh`) |
| Historical workflow catalog (`/workflows/`) | `./scripts/deploy-workflows.sh` (retired mirror target) |
| Tool pages (`/tools/`, new) | `./scripts/deploy-tools.sh` only — **not** part of `deploy.sh` |

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
default source is the `site/` directory of the public lmprobe repo
(`../lmprobe/site`; the repo root also holds the Rust source and is never
uploaded), with `../lmprobe/LICENSE` and `../lmprobe/ATTRIBUTION.md` copied
when present. The script refuses a source directory that contains `Cargo.toml`
or `crates/`. Override the
bundle with `LMPROBE_SITE_DIR=/path/to/site` and the metadata root with
`LMPROBE_REPO_DIR=/path/to/lmprobe`. Use `DRY_RUN=1` to preview the scoped S3
sync without invalidating CloudFront. Hidden files such as `.git/` are stripped
from the staging tree before upload.

## Automatic static publishing

Pushes to main affecting tools, skills, migration notices, homepage, deploy scripts,
tooling or the static workflow run `.github/workflows/deploy-static.yml`. There is
no approval gate. The workflow checks tools, skills and memory plus their selftests,
then uses GitHub OIDC for `arn:aws:iam::254332045686:role/lmctl-website-deploy`.
Checkout credentials are not persisted; actions are SHA-pinned. Dispatch publishes
all three areas; pushes select areas from the push range. The existing full manual
workflow remains available. Both use `site-deploy` concurrency without cancellation.

The independent scripts `deploy-tools.sh`, `deploy-skills.sh` and
`deploy-homepage.sh` do not need a Docusaurus build. `DRY_RUN=1` reads S3 and the
CDN, and prints proposed uploads, deletions and exact invalidation paths without
writes, invalidations or polling. To run locally:

```sh
export AWS_PROFILE=lmctl-website-deploy
DRY_RUN=1 bash scripts/deploy-tools.sh
bash scripts/deploy-tools.sh
bash scripts/deploy-skills.sh
bash scripts/deploy-homepage.sh
bash scripts/tools/verify-live.sh
```

The shared Python transport (`scripts/tools/static-site.py`) compares local MD5
with S3 ETag and checks MIME/cache metadata, then uploads only changed objects via
PutObject. It uses exact keys, including trailing-slash index aliases. HTML and
notices are `no-cache, max-age=0, must-revalidate`; CSS/images have a one-day cache.
README, hidden files and tool templates are excluded. Homepage files are copied
individually, never root-synced or root-deleted. Each area publishes a deterministic
`deploy-manifest.json` (homepage's is under assets/). Only obsolete keys owned by
a previous manifest can be deleted. Out-of-band files are preserved.

Invalidations include uploaded/deleted paths AND paths whose live bytes or headers
still differ from the repo after syncing, even if S3 was already current. The root
alias `/` is checked too. Homepage directory indexes such as `levels/index.html`
also publish and verify the exact `levels` and `levels/` keys.
The publisher polls only differing paths for about five minutes and re-invalidates
remaining differences once halfway through. It does not require GetInvalidation.
CI runs `verify-live.sh --repair-cdn` for the same targeted repair/poll on any
remaining live mismatches (AWS credentials required); plain `verify-live.sh`
remains read-only and immediately reports differences. No IAM edits are made.
Live verification compares every managed file/alias byte-for-byte, including Content-Type and
Cache-Control. It detects missing/extra entries in the published inventories and
hash differences. HTTP cannot enumerate unlinked, unmanaged bucket objects;
those are outside the inventory and are not deleted or claimed as verified.

`SITE_ORIGIN=https://other.example bash scripts/tools/verify-live.sh` checks any
HTTP(S) origin (no AWS credentials). Optional arguments select `tools`, `skills`
and/or `homepage`. The live HTML is parsed by `live-links.lms` running the locked
lmhtml binary, not a hand-written tokenizer. It follows links/images and checks
anchors, expanding tools/skills pages and homepage links while ignoring external
origins. Referenced pages on other hosted sections are checked but not recursively
crawled. Production absolute lmctl.com URLs are remapped to the selected origin.

## CloudFront constraints for prefix behaviors

- Origin Path must be empty. Objects already live under the `lmctl/` key prefix;
  setting Origin Path to `/lmctl` double-prefixes requests and returns 404. The
  same rule applies to `lmprobe/` and `internal/lmctl/` objects.
- The production viewer-request CloudFront Function is `lmctl-www-redirect`,
  with source in `infra/lmctl-www-redirect.js`. It keeps the existing
  `www.lmctl.com` → apex redirect, adds `/lmctl/*` and `/lmprobe/*` clean-URL
  resolution, and rewrites bare `/internal/lmctl` to
  `/internal/lmctl/index.html`. The source now also routes `/tools/*`
  (`/tools` → `/tools/index.html`, `/tools/<tool>` → `/tools/<tool>/index.html`,
  deeper extensionless pages → `.html`, trailing slash → 301 slashless); that
  change is an admin deployment step. Index aliases work before and after it;
  the static workflow never publishes the function. Test: `node tests/infra/lmctl-www-redirect.test.mjs`. lmprobe assets are written with `/lmprobe/...`
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

## Quickrun catalog

`quickrun/*.lms` are website-owned, self-contained task scripts. Add a script with
an initial `// description: ...` comment, then run `node scripts/build-quickrun.mjs`
to regenerate both indexes. Publish with `bash scripts/deploy-quickrun.sh`.
It uploads only `/quickrun` assets, sets correct HTML/plain-text content types,
and waits for invalidation of that prefix before checking the public bytes. The CLI fetches `index.txt` and named scripts live;
adding samples using existing LMScript APIs does not need a new lmctl release.
Modern scripts access user properties via `PROPS.Provider1.provider` and
`PROPS.Provider1.model1`, and format commands using `cmd_render` (legacy bare
globals `Provider1..3`, `Model1..3`, and `shell_quote` are deprecated in modern lmctl).
Keep remote samples self-contained; relative imports are for local scripts.

Before deploying, use the candidate or current CLI to run the bundled sample
regressions with mock providers (no AI calls):

```sh
LMCTL_BIN=/absolute/path/to/lmctl node scripts/test-quickrun.mjs
```

The test checks catalog/index consistency and exercises `solo` and `review` in
isolated workspaces, including existing-file preservation. Add appropriate
coverage when publishing a new sample with a different contract.

Skills are HTML only. `build:skills` decorates HTML and generates the grouped
HTML index; it does not export another format. Publish `skills/*.html` with
`text/html; charset=utf-8`, including the `/skills/lmctl-lead.html` alias.
The checked-in one-paragraph notices in `skills-moved/*.md` are deployed at old
skill URLs with `text/plain; charset=utf-8`. They contain only a move notice,
not skill content, and the operator will remove them after one release cycle.
The three index keys (`skills`, `skills/`, `skills/index.html`) remain unchanged.
No CloudFront change is needed. Builds/checks never deploy.
