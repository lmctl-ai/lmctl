#!/usr/bin/env bash
# Sync lmctl sample/example files to lmctl.com/examples/.
#   bash scripts/deploy-examples.sh
#
# Canonical source is the private lmctl-src repo (examples/) — the same files
# shipped in the npm package. This mirrors them into THIS public repo
# (lmctl-ai/lmctl, under examples/) so they are version-controlled, then pushes
# to S3 so each is fetchable at https://lmctl.com/examples/<name>. `lmctl lint`
# points users here when their opencode config is missing.
#
# Living docs: cache-control is no-cache so an update propagates on next fetch.
# The S3 sync --delete is scoped to the /examples/ prefix only.
set -euo pipefail

S3_BUCKET="${S3_BUCKET:-lmctl-website-prod}"
CF_DISTRIBUTION_ID="${CF_DISTRIBUTION_ID:-E1GKUWTM93U7IV}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${LMCTL_SRC_EXAMPLES:-$REPO_ROOT/../lmctl-src/examples}"
DEST_DIR="$REPO_ROOT/examples"

if [[ ! -d "$SRC" ]]; then
  echo "Canonical examples source not found: $SRC" >&2
  echo "Set LMCTL_SRC_EXAMPLES to the lmctl-src/examples directory." >&2
  exit 1
fi

mkdir -p "$DEST_DIR"
rm -f "$DEST_DIR"/*.json
cp "$SRC"/*.json "$DEST_DIR/"
echo "Mirrored $(ls "$DEST_DIR"/*.json | wc -l) example(s) into examples/"

aws s3 sync "$DEST_DIR/" "s3://${S3_BUCKET}/examples/" \
  --delete \
  --exclude '.*' \
  --content-type 'application/json' \
  --cache-control 'no-cache, max-age=0, must-revalidate'

aws cloudfront create-invalidation \
  --distribution-id "$CF_DISTRIBUTION_ID" \
  --paths '/examples/*'

echo "Deployed examples to https://lmctl.com/examples/"
