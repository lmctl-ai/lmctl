#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TOOL="${TOOL:-}"
REF="${REF:-main}"
[[ "$TOOL" =~ ^[a-z][a-z0-9-]*$ ]] || { echo 'Set TOOL to a lowercase tool name, for example TOOL=lmdraw' >&2; exit 2; }
data_file="${DATA_FILE:-$ROOT/tools/$TOOL/book.json}"
[[ -f "$data_file" ]] || { echo "No per-tool book data at $data_file" >&2; exit 2; }
repo_url="${REPO_URL:-$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("repository", ""))' "$data_file")}"
[[ "$repo_url" =~ ^https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\.git$ ]] || { echo "book.json repository must be a public GitHub .git URL (or set REPO_URL)" >&2; exit 2; }
work="$(mktemp -d "${TMPDIR:-/tmp}/lmctl-example-book.XXXXXX")"
trap 'rm -rf "$work"' EXIT
if [[ -n "${SOURCE_DIR:-}" ]]; then
  source_dir="$(cd "$SOURCE_DIR" && pwd)"
  source_ref="${SOURCE_REF:-HEAD}"
  source_ref="$(git -C "$source_dir" rev-parse --verify "$source_ref^{commit}")"
else
  git init -q "$work/source"
  git -C "$work/source" remote add origin "$repo_url"
  git -C "$work/source" fetch --depth 1 origin "$REF"
  git -C "$work/source" checkout --detach -q FETCH_HEAD
  source_dir="$work/source"
  source_ref="$(git -C "$source_dir" rev-parse HEAD)"
fi
output_dir="${OUTPUT_DIR:-$ROOT/tools/$TOOL/examples}"
python3 "$ROOT/scripts/tools/generate-example-book.py" \
  --tool "$TOOL" --source "$source_dir" --ref "$source_ref" \
  --data "$data_file" --output "$output_dir"
