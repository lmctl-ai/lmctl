#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
source "$ROOT/scripts/homepage/video/hash-files.sh"
tmp=$(mktemp -d)
trap 'rm -rf -- "$tmp"' EXIT
{
  for level in 1 2 3 4; do
    for frame in 0 1; do printf 'old-%s-%s  level-%s/frame-%s.png\n' "$level" "$frame" "$level" "$frame"; done
  done
} > "$tmp/base.sha256"
printf 'new-2-0  level-2/frame-0.png\nnew-2-1  level-2/frame-1.png\n' > "$tmp/actual.sha256"
merge_frame_hashes "$tmp/base.sha256" "$tmp/actual.sha256" 2 2 "$tmp/merged.sha256"
[[ $(wc -l < "$tmp/merged.sha256" | tr -d ' ') == 8 ]]
grep -q '^new-2-0  level-2/frame-0.png$' "$tmp/merged.sha256"
grep -q '^old-1-0  level-1/frame-0.png$' "$tmp/merged.sha256"
if merge_frame_hashes "$tmp/missing.sha256" "$tmp/actual.sha256" 2 2 "$tmp/should-not-exist.sha256" 2>/dev/null; then
  echo 'merge unexpectedly accepted a missing baseline' >&2
  exit 1
fi
echo 'frame hash merge tests: 4 passed'
