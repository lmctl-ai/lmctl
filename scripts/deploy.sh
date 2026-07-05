#!/usr/bin/env bash
set -euo pipefail

S3_BUCKET="${S3_BUCKET:-lmctl-website-prod}"
CF_DISTRIBUTION_ID="${CF_DISTRIBUTION_ID:-E1GKUWTM93U7IV}"

if [[ -z "${S3_BUCKET}" ]]; then
  echo "S3_BUCKET resolved empty. Set S3_BUCKET or restore the production default." >&2
  exit 1
fi

if [[ -z "${CF_DISTRIBUTION_ID}" ]]; then
  echo "CF_DISTRIBUTION_ID resolved empty. Set CF_DISTRIBUTION_ID or restore the production default." >&2
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

# --- skills: publish the raw skill pages to lmctl.com/skills/ (source of truth = this repo's skills/).
# No --delete: never wipe skills published out-of-band; this only adds/updates repo-tracked ones.
aws s3 sync skills/ "s3://${S3_BUCKET}/skills/" \
  --exclude '.*' \
  --content-type 'text/markdown; charset=utf-8' \
  --exclude 'index.html' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
aws s3 cp skills/index.html "s3://${S3_BUCKET}/skills/index.html" \
  --content-type 'text/html; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
aws cloudfront create-invalidation --distribution-id "${CF_DISTRIBUTION_ID}" --paths '/skills/*'
