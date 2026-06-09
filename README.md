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

The operator supplies the target bucket and CloudFront distribution:

```bash
S3_BUCKET=<bucket> CF_DISTRIBUTION_ID=<distribution-id> ./scripts/deploy.sh
```

The deploy script syncs the artifact to `s3://$S3_BUCKET/lmctl/`, sets
long-lived immutable caching for hashed `assets/*`, sets no-cache headers for
HTML and `sitemap.xml`, and invalidates `/lmctl/*`.

CloudFront constraints for the `/lmctl/*` behavior:

- Origin Path must be empty. Objects already live under the `lmctl/` key prefix;
  setting Origin Path to `/lmctl` double-prefixes requests and returns 404.
- Associate the viewer-request CloudFront Function source in
  `infra/cf-rewrite.js` with the `/lmctl/*` behavior. The function rewrites
  clean `/lmctl/` paths to S3 object keys and redirects non-canonical trailing
  slash paths. It does not implement 404 handling.

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
