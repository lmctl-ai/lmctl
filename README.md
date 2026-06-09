# lmctl-website

Documentation site for **lmctl** — tutorials and manuals — published to
`lmctl.com/lmctl/` via S3 + CloudFront.

## Development

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

The production defaults target `s3://lmctl-website-prod/lmctl/` and CloudFront
distribution `E1GKUWTM93U7IV`:

```bash
./scripts/deploy.sh
```

Operators can override either target with env vars:

```bash
S3_BUCKET=<bucket> CF_DISTRIBUTION_ID=<distribution-id> ./scripts/deploy.sh
```

The deploy script syncs the artifact to `s3://$S3_BUCKET/lmctl/`, sets
long-lived immutable caching for hashed `assets/*`, sets no-cache headers for
HTML and `sitemap.xml`, and invalidates `/lmctl/*`.

CloudFront constraints for the `/lmctl/*` behavior:

- Origin Path must be empty. Objects already live under the `lmctl/` key prefix;
  setting Origin Path to `/lmctl` double-prefixes requests and returns 404.
- The production viewer-request CloudFront Function is
  `lmctl-www-redirect`, with source in `infra/lmctl-www-redirect.js`. It keeps
  the existing `www.lmctl.com` to apex redirect and adds `/lmctl/*` clean-URL
  resolution. It does not implement 404 handling.

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

### 404 Strategy

Docusaurus emits `build/404.html`; confirm it is present before deploy. The
runtime 404 strategy is topology-dependent and deferred to the operator's
CloudFront decision:

- Dedicated docs distribution: use distribution-level custom error responses
  for 403/404 to `/lmctl/404.html`, with response code 404.
- Shared `/templates/` distribution: use Lambda@Edge origin-response on the
  `/lmctl/*` behavior to map both S3 403 and 404 responses to
  `/lmctl/404.html` and force the final response status to 404.
  Distribution-level custom error responses are distribution-wide and would
  affect the `/templates/` co-tenant.
