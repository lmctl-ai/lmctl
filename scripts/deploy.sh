#!/usr/bin/env bash
set -euo pipefail

S3_BUCKET="${S3_BUCKET:-lmctl-website-prod}"
CF_DISTRIBUTION_ID="${CF_DISTRIBUTION_ID:-E1GKUWTM93U7IV}"
SITE_ORIGIN="${SITE_ORIGIN:-https://lmctl.com}"

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

SOURCE_REVISION="$(git rev-parse HEAD 2>/dev/null || printf 'unknown')"
printf '{"sourceRevision":"%s"}\n' "${SOURCE_REVISION}" > build/sourceRevision.json

aws s3 cp homepage/index.html "s3://${S3_BUCKET}/index.html" \
  --content-type 'text/html; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
aws s3 cp homepage/404.html "s3://${S3_BUCKET}/404.html" \
  --content-type 'text/html; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
aws s3 cp homepage/robots.txt "s3://${S3_BUCKET}/robots.txt" \
  --content-type 'text/plain; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
aws s3 cp homepage/sitemap.xml "s3://${S3_BUCKET}/sitemap.xml" \
  --content-type 'application/xml; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
aws s3 sync homepage/assets/ "s3://${S3_BUCKET}/assets/" \
  --cache-control 'public, max-age=31536000, immutable'
aws cloudfront create-invalidation \
  --distribution-id "${CF_DISTRIBUTION_ID}" \
  --paths '/' '/index.html' '/404.html' '/robots.txt' '/sitemap.xml' '/assets/*'

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
aws s3api put-object \
  --bucket "${S3_BUCKET}" \
  --key 'skills/' \
  --body skills/index.html \
  --content-type 'text/html; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
aws s3api put-object \
  --bucket "${S3_BUCKET}" \
  --key 'skills' \
  --body skills/index.html \
  --content-type 'text/html; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate'
SKILLS_INVALIDATION_ID="$(
  aws cloudfront create-invalidation \
    --distribution-id "${CF_DISTRIBUTION_ID}" \
    --paths '/skills' '/skills/' '/skills/*' \
    --query 'Invalidation.Id' \
    --output text
)"
aws cloudfront wait invalidation-completed \
  --distribution-id "${CF_DISTRIBUTION_ID}" \
  --id "${SKILLS_INVALIDATION_ID}"

for path in '/skills' '/skills/' '/skills/index.html'; do
  body="$(curl -fsS "${SITE_ORIGIN}${path}")"
  if ! grep -q '<title>lmctl skills</title>' <<<"${body}"; then
    echo "skills smoke failed for ${SITE_ORIGIN}${path}" >&2
    exit 1
  fi
done
