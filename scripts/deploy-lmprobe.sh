#!/usr/bin/env bash
# Publish the lmprobe static manual to lmctl.com/lmprobe/.
#
# Source of truth is the public lmprobe repo by default, normally checked out
# beside this repo as ../lmprobe. Do not deploy from ../lmprobe-src/site; it is
# a stale staging tree. Override with LMPROBE_SITE_DIR only when testing a
# prepared bundle. The sync is scoped to the lmprobe/ S3 prefix.
set -euo pipefail

S3_BUCKET="${S3_BUCKET:-lmctl-website-prod}"
CF_DISTRIBUTION_ID="${CF_DISTRIBUTION_ID:-E1GKUWTM93U7IV}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${LMPROBE_SITE_DIR:-$REPO_ROOT/../lmprobe}"
LMPROBE_REPO_DIR="${LMPROBE_REPO_DIR:-}"
DEST="s3://${S3_BUCKET}/lmprobe/"
DRY_RUN_ARGS=()
STAGE=""

cleanup() {
  if [[ -n "${STAGE}" ]]; then
    rm -rf "${STAGE}"
  fi
}
trap cleanup EXIT

if [[ "${DRY_RUN:-}" == "1" ]]; then
  DRY_RUN_ARGS=(--dryrun)
fi

if [[ -z "${S3_BUCKET}" ]]; then
  echo "S3_BUCKET resolved empty. Set S3_BUCKET or restore the production default." >&2
  exit 1
fi

if [[ -z "${CF_DISTRIBUTION_ID}" ]]; then
  echo "CF_DISTRIBUTION_ID resolved empty. Set CF_DISTRIBUTION_ID or restore the production default." >&2
  exit 1
fi

if [[ ! -f "${SRC}/index.html" ]]; then
  echo "lmprobe site bundle not found: ${SRC}" >&2
  echo "Set LMPROBE_SITE_DIR to a directory containing index.html." >&2
  exit 1
fi

if [[ -z "${LMPROBE_REPO_DIR}" ]]; then
  LMPROBE_REPO_DIR="$(cd "${SRC}/.." && pwd)"
fi

STAGE="$(mktemp -d)"
cp -R "${SRC}/." "${STAGE}/"
find "${STAGE}" -mindepth 1 -name '.*' -prune -exec rm -rf {} +

if [[ -f "${LMPROBE_REPO_DIR}/LICENSE" ]]; then
  cp "${LMPROBE_REPO_DIR}/LICENSE" "${STAGE}/LICENSE"
fi

if [[ -f "${LMPROBE_REPO_DIR}/ATTRIBUTION.md" ]]; then
  cp "${LMPROBE_REPO_DIR}/ATTRIBUTION.md" "${STAGE}/ATTRIBUTION.md"
fi

aws s3 sync "${STAGE}/" "${DEST}" \
  --delete \
  --exclude 'index.html' \
  --exclude 'app.js' \
  --exclude 'styles.css' \
  --exclude 'assets/lmprobe-flow.svg' \
  --exclude 'README.md' \
  --exclude 'LICENSE' \
  --exclude 'ATTRIBUTION.md' \
  --cache-control 'no-cache, max-age=0, must-revalidate' \
  "${DRY_RUN_ARGS[@]}"

aws s3 cp "${STAGE}/index.html" "${DEST}index.html" \
  --content-type 'text/html; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate' \
  "${DRY_RUN_ARGS[@]}"

aws s3 cp "${STAGE}/app.js" "${DEST}app.js" \
  --content-type 'text/javascript; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate' \
  "${DRY_RUN_ARGS[@]}"

aws s3 cp "${STAGE}/styles.css" "${DEST}styles.css" \
  --content-type 'text/css; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate' \
  "${DRY_RUN_ARGS[@]}"

aws s3 cp "${STAGE}/assets/lmprobe-flow.svg" "${DEST}assets/lmprobe-flow.svg" \
  --content-type 'image/svg+xml' \
  --cache-control 'no-cache, max-age=0, must-revalidate' \
  "${DRY_RUN_ARGS[@]}"

aws s3 cp "${STAGE}/README.md" "${DEST}README.md" \
  --content-type 'text/markdown; charset=utf-8' \
  --cache-control 'no-cache, max-age=0, must-revalidate' \
  "${DRY_RUN_ARGS[@]}"

if [[ -f "${STAGE}/LICENSE" ]]; then
  aws s3 cp "${STAGE}/LICENSE" "${DEST}LICENSE" \
    --content-type 'text/plain; charset=utf-8' \
    --cache-control 'no-cache, max-age=0, must-revalidate' \
    "${DRY_RUN_ARGS[@]}"
fi

if [[ -f "${STAGE}/ATTRIBUTION.md" ]]; then
  aws s3 cp "${STAGE}/ATTRIBUTION.md" "${DEST}ATTRIBUTION.md" \
    --content-type 'text/markdown; charset=utf-8' \
    --cache-control 'no-cache, max-age=0, must-revalidate' \
    "${DRY_RUN_ARGS[@]}"
fi

if [[ "${DRY_RUN:-}" == "1" ]]; then
  echo "DRY_RUN=1: skipped CloudFront invalidation for /lmprobe and /lmprobe/*"
else
  aws cloudfront create-invalidation \
    --distribution-id "${CF_DISTRIBUTION_ID}" \
    --paths '/lmprobe' '/lmprobe/*'
fi

echo "lmprobe deploy target: ${DEST}"
