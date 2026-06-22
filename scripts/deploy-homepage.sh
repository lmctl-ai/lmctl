#!/usr/bin/env bash
# Publish the lmctl.com ROOT home page (homepage/) to S3 + invalidate CloudFront.
#   bash scripts/deploy-homepage.sh
# This is SEPARATE from scripts/deploy.sh (which deploys the Docusaurus docs to
# the /lmctl/ prefix). The root bucket also holds /lmctl/ and /lmprobe/ — so we
# copy individual root files and never `--delete` the bucket.
set -euo pipefail

S3_BUCKET="${S3_BUCKET:-lmctl-website-prod}"
CF_DISTRIBUTION_ID="${CF_DISTRIBUTION_ID:-E1GKUWTM93U7IV}"
HERE="$(cd "$(dirname "$0")/.." && pwd)/homepage"

aws s3 cp "$HERE/index.html"  "s3://${S3_BUCKET}/index.html"  --cache-control 'no-cache, max-age=0, must-revalidate'
aws s3 cp "$HERE/404.html"    "s3://${S3_BUCKET}/404.html"    --cache-control 'no-cache, max-age=0, must-revalidate'
aws s3 cp "$HERE/robots.txt"  "s3://${S3_BUCKET}/robots.txt"  --cache-control 'no-cache, max-age=0, must-revalidate'
aws s3 cp "$HERE/sitemap.xml" "s3://${S3_BUCKET}/sitemap.xml" --cache-control 'no-cache, max-age=0, must-revalidate'
aws s3 sync "$HERE/assets/"   "s3://${S3_BUCKET}/assets/"     --cache-control 'public, max-age=86400'

aws cloudfront create-invalidation --distribution-id "$CF_DISTRIBUTION_ID" \
  --paths '/' '/index.html' '/404.html' '/assets/*'
