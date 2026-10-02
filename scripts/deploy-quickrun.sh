#!/usr/bin/env bash
# Publish only the website-owned quickrun catalog; no lmctl release needed.
set -euo pipefail
S3_BUCKET="${S3_BUCKET:-lmctl-website-prod}"
CF_DISTRIBUTION_ID="${CF_DISTRIBUTION_ID:-E1GKUWTM93U7IV}"
SITE_ORIGIN="${SITE_ORIGIN:-https://lmctl.com}"
QUICKRUN_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
node "$QUICKRUN_ROOT/scripts/build-quickrun.mjs"
aws s3 sync "$QUICKRUN_ROOT/quickrun/" "s3://${S3_BUCKET}/quickrun/" \
  --exclude '.*' --exclude 'index.html' \
  --content-type 'text/plain; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
for key in quickrun/index.html quickrun/ quickrun; do
  aws s3api put-object --bucket "$S3_BUCKET" --key "$key" \
    --body "$QUICKRUN_ROOT/quickrun/index.html" \
    --content-type 'text/html; charset=utf-8' \
    --cache-control 'no-cache, max-age=0, must-revalidate' > /dev/null
done
QUICKRUN_INVALIDATION_ID="$(aws cloudfront create-invalidation --distribution-id "$CF_DISTRIBUTION_ID" \
  --paths '/quickrun' '/quickrun/' '/quickrun/*' --query 'Invalidation.Id' --output text)"
aws cloudfront wait invalidation-completed --distribution-id "$CF_DISTRIBUTION_ID" --id "$QUICKRUN_INVALIDATION_ID"
for file in "$QUICKRUN_ROOT"/quickrun/*; do
  curl -fsS "$SITE_ORIGIN/quickrun/$(basename "$file")" | cmp - "$file"
done
for path in /quickrun /quickrun/; do
  curl -fsS "$SITE_ORIGIN$path" | cmp - "$QUICKRUN_ROOT/quickrun/index.html"
done
printf 'Published and verified quickrun catalog at %s/quickrun/\n' "$SITE_ORIGIN"
