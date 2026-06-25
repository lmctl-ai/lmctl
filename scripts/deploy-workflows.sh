#!/usr/bin/env bash
# Sync the built-in lmctl workflow catalog to lmctl.com/workflows/.
#   bash scripts/deploy-workflows.sh
#
# The CANONICAL source is the private lmctl-src repo (workflows/*.compound.json +
# index.jsonl) — the same definitions bundled into the npm package and resolved by
# `lmctl://workflow/<name>`. This script mirrors them into THIS public repo
# (lmctl-ai/lmctl, under workflows/) so they are version-controlled + auditable,
# then pushes that mirror to S3 so each is fetchable at
#   https://lmctl.com/workflows/<name>.compound.json
# and runnable via `lmctl run https://lmctl.com/workflows/<name>.compound.json`.
#
# Workflows are LIVING documents (no versioning — Wikipedia model): cache-control
# is no-cache so an update propagates on the next fetch. The S3 sync --delete is
# scoped to the /workflows/ prefix only, so stale workflows are pruned without
# touching the homepage, /lmctl/, or /lmprobe/.
set -euo pipefail

S3_BUCKET="${S3_BUCKET:-lmctl-website-prod}"
CF_DISTRIBUTION_ID="${CF_DISTRIBUTION_ID:-E1GKUWTM93U7IV}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${LMCTL_SRC_WORKFLOWS:-$REPO_ROOT/../lmctl-src/workflows}"
DEST_DIR="$REPO_ROOT/workflows"

if [[ ! -d "$SRC" ]]; then
  echo "Canonical workflow source not found: $SRC" >&2
  echo "Set LMCTL_SRC_WORKFLOWS to the lmctl-src/workflows directory." >&2
  exit 1
fi

# 1. Mirror canonical -> public repo (version control). Regenerate cleanly so
#    removed workflows disappear from the mirror too.
mkdir -p "$DEST_DIR"
rm -f "$DEST_DIR"/*.compound.json "$DEST_DIR/index.jsonl"
cp "$SRC"/*.compound.json "$DEST_DIR/"
cp "$SRC/index.jsonl" "$DEST_DIR/index.jsonl"
echo "Mirrored $(ls "$DEST_DIR"/*.compound.json | wc -l) workflows + index.jsonl into workflows/"

# 2. Push the mirror to S3 under the /workflows/ prefix (living docs: no-cache).
aws s3 sync "$DEST_DIR/" "s3://${S3_BUCKET}/workflows/" \
  --delete \
  --exclude '.*' \
  --cache-control 'no-cache, max-age=0, must-revalidate'

# 3. Invalidate the workflows path so updates are visible immediately.
aws cloudfront create-invalidation \
  --distribution-id "$CF_DISTRIBUTION_ID" \
  --paths '/workflows/*'

echo "Deployed workflow catalog to https://lmctl.com/workflows/"
