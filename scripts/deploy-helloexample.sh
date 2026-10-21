#!/usr/bin/env bash
# Publish only the website-owned hello/autorun scripts and catalog.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
S3_BUCKET="${S3_BUCKET:-lmctl-website-prod}"
CF_DISTRIBUTION_ID="${CF_DISTRIBUTION_ID:-E1GKUWTM93U7IV}"
SITE_ORIGIN="${SITE_ORIGIN:-https://lmctl.com}"

aws s3 sync helloexample/ "s3://${S3_BUCKET}/helloexample/" \
  --exclude '.*' --exclude 'index.html' \
  --content-type 'text/plain; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
for key in helloexample/index.html helloexample/ helloexample; do
  aws s3api put-object --bucket "$S3_BUCKET" --key "$key" \
    --body helloexample/index.html \
    --content-type 'text/html; charset=utf-8' \
    --cache-control 'no-cache, max-age=0, must-revalidate' > /dev/null
done
invalidation="$(aws cloudfront create-invalidation --distribution-id "$CF_DISTRIBUTION_ID" \
  --paths '/helloexample' '/helloexample/' '/helloexample/*' \
  --query 'Invalidation.Id' --output text)"
aws cloudfront wait invalidation-completed --distribution-id "$CF_DISTRIBUTION_ID" --id "$invalidation"
for file in helloexample/*.lms helloexample/*.lmctl; do
  [[ -f "$file" ]] || continue
  curl -fsS "$SITE_ORIGIN/${file}" | cmp - "$file"
  headers="$(curl -fsSI "$SITE_ORIGIN/${file}")"
  grep -qi '^content-type: text/plain' <<<"$headers"
done
for path in /helloexample /helloexample/ /helloexample/index.html; do
  curl -fsS "$SITE_ORIGIN$path" | cmp - helloexample/index.html
done
printf 'Published and verified helloexample scripts at %s/helloexample/\n' "$SITE_ORIGIN"
