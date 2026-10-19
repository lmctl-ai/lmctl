#!/usr/bin/env bash
# Publish the static tool pages (tools/) to lmctl.com/tools/.
#
# Deliberately NOT part of scripts/deploy.sh: run it on its own after review.
# The sync is scoped to the tools/ S3 prefix (never the bucket root). The
# source must pass scripts/check-tools.mjs; tools/_template, README.md and
# hidden files are never uploaded; any file type other than html, css, png,
# svg or txt makes the script refuse. DRY_RUN=1 previews the S3 sync and
# skips the CloudFront invalidation.
set -euo pipefail

S3_BUCKET="${S3_BUCKET:-lmctl-website-prod}"
CF_DISTRIBUTION_ID="${CF_DISTRIBUTION_ID:-E1GKUWTM93U7IV}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${TOOLS_SITE_DIR:-$REPO_ROOT/tools}"
DEST="s3://${S3_BUCKET}/tools/"
DRY_RUN_ARGS=()
STAGE=""
NO_CACHE='no-cache, max-age=0, must-revalidate'
ONE_DAY='public, max-age=86400'

cleanup() {
  if [[ -n "${STAGE}" ]]; then
    rm -rf "${STAGE}"
  fi
}
trap cleanup EXIT

if [[ "${DRY_RUN:-}" == "1" ]]; then
  DRY_RUN_ARGS=(--dryrun)
fi

if [[ -z "${S3_BUCKET}" || -z "${CF_DISTRIBUTION_ID}" ]]; then
  echo "S3_BUCKET or CF_DISTRIBUTION_ID resolved empty; refusing to deploy." >&2
  exit 1
fi

# Belt and braces: the destination must be the tools/ prefix of the bucket.
if [[ "${DEST}" != "s3://${S3_BUCKET}/tools/" || "${S3_BUCKET}" == */* ]]; then
  echo "refusing to deploy: destination ${DEST} is not the tools/ prefix" >&2
  exit 1
fi

if [[ ! -f "${SRC}/index.html" || ! -f "${SRC}/style.css" ]]; then
  echo "tools site not found: ${SRC} (needs index.html and style.css)" >&2
  exit 1
fi

if [[ -z "${TOOLS_SITE_DIR:-}" ]]; then
  node "${REPO_ROOT}/scripts/check-tools.mjs" >/dev/null || {
    node "${REPO_ROOT}/scripts/check-tools.mjs" >&2 || true
    echo "refusing to deploy: scripts/check-tools.mjs reports errors" >&2
    exit 1
  }
fi

STAGE="$(mktemp -d)"
cp -R "${SRC}/." "${STAGE}/"
find "${STAGE}" -mindepth 1 -name '.*' -prune -exec rm -rf {} +
rm -rf "${STAGE}/_template" "${STAGE}/README.md"

unexpected="$(find "${STAGE}" -type f ! -name '*.html' ! -name '*.css' ! -name '*.png' ! -name '*.svg' ! -name '*.txt' -print)"
if [[ -n "${unexpected}" ]]; then
  echo "refusing to deploy: unexpected file types in ${SRC}:" >&2
  sed "s#^${STAGE}/##" <<<"${unexpected}" >&2
  exit 1
fi
if [[ -n "$(find "${STAGE}" -type l -print)" ]]; then
  echo "refusing to deploy: symlinks in ${SRC}" >&2
  exit 1
fi

# One scoped sync per type so each gets its content type and cache policy;
# --delete only ever applies under the tools/ prefix and only to that type.
sync_type() { # pattern content-type cache-control
  aws s3 sync "${STAGE}/" "${DEST}" \
    --no-follow-symlinks \
    --delete \
    --exclude '*' --include "$1" \
    --content-type "$2" \
    --cache-control "$3" \
    "${DRY_RUN_ARGS[@]}"
}
sync_type '*.html' 'text/html; charset=utf-8' "${NO_CACHE}"
sync_type '*.css' 'text/css; charset=utf-8' "${ONE_DAY}"
sync_type '*.png' 'image/png' "${ONE_DAY}"
sync_type '*.svg' 'image/svg+xml' "${ONE_DAY}"
sync_type '*.txt' 'text/plain; charset=utf-8' "${NO_CACHE}"

# Clean URLs before (and independent of) the CloudFront function: also store
# each index.html under the slashless and trailing-slash keys, like
# scripts/deploy.sh does for its prefixes.
while IFS= read -r index; do
  dir="${index%/index.html}"
  rel="${dir#"${STAGE}"}"
  for key in "tools${rel}" "tools${rel}/"; do
    aws s3 cp "${index}" "s3://${S3_BUCKET}/${key}" \
      --content-type 'text/html; charset=utf-8' \
      --cache-control "${NO_CACHE}" \
      "${DRY_RUN_ARGS[@]}"
  done
done < <(find "${STAGE}" -name index.html -print | sort)

if [[ "${DRY_RUN:-}" == "1" ]]; then
  echo "DRY_RUN=1: skipped CloudFront invalidation for /tools*"
else
  aws cloudfront create-invalidation \
    --distribution-id "${CF_DISTRIBUTION_ID}" \
    --paths '/tools*'
fi

echo "tools deploy target: ${DEST}"
