#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${S3_BUCKET:-}" ]]; then
  echo "S3_BUCKET is required. Example: S3_BUCKET=docs-bucket CF_DISTRIBUTION_ID=E123 ./scripts/deploy.sh" >&2
  exit 1
fi

if [[ -z "${CF_DISTRIBUTION_ID:-}" ]]; then
  echo "CF_DISTRIBUTION_ID is required. Example: S3_BUCKET=docs-bucket CF_DISTRIBUTION_ID=E123 ./scripts/deploy.sh" >&2
  exit 1
fi

if [[ ! -d build ]]; then
  echo "build/ does not exist. Run npm run build before deploying." >&2
  exit 1
fi

DEST="s3://${S3_BUCKET}/lmctl/"

aws s3 sync build/ "${DEST}" \
  --delete \
  --exclude 'assets/*' \
  --cache-control 'no-cache, max-age=0, must-revalidate'

aws s3 sync build/assets/ "${DEST}assets/" \
  --delete \
  --cache-control 'public, max-age=31536000, immutable'

aws s3 cp build/sitemap.xml "${DEST}sitemap.xml" \
  --cache-control 'no-cache, max-age=0, must-revalidate'

aws cloudfront create-invalidation \
  --distribution-id "${CF_DISTRIBUTION_ID}" \
  --paths '/lmctl/*'
