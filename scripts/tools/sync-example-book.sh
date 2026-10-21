#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TOOL="${TOOL:-}"
REF="${REF:-main}"
[[ "$TOOL" =~ ^[a-z][a-z0-9-]*$ ]] || { echo 'Set TOOL to a lowercase tool name, for example TOOL=lmdraw' >&2; exit 2; }
[[ -f "$ROOT/scripts/tools/example-book-data/$TOOL.json" ]] || { echo "No example-book data for $TOOL" >&2; exit 2; }
work="$(mktemp -d "${TMPDIR:-/tmp}/lmctl-example-book.XXXXXX")"
trap 'rm -rf "$work"' EXIT
if [[ -n "${SOURCE_DIR:-}" ]]; then
  source_dir="$(cd "$SOURCE_DIR" && pwd)"
  source_ref="${SOURCE_REF:-$REF}"
else
  git init -q "$work/source"
  git -C "$work/source" remote add origin "https://github.com/lmctl-ai/$TOOL.git"
  git -C "$work/source" fetch --depth 1 origin "$REF"
  git -C "$work/source" checkout --detach -q FETCH_HEAD
  source_dir="$work/source"
  source_ref="$(git -C "$source_dir" rev-parse HEAD)"
fi
python3 "$ROOT/scripts/tools/generate-example-book.py" "$TOOL" "$source_dir" "$source_ref"
