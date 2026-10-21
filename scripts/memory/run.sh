#!/usr/bin/env bash
# Thin wrappers around the lmscript-resolved lmhtml Markdown CLI.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
cd "$ROOT"
(($# >= 2)) || { echo 'usage: run.sh check DIR | index DIR [--check] | web DIR OUT' >&2; exit 2; }
mode=$1; dir=$2; shift 2
host=${LMHTML:-$(bash "$ROOT/scripts/tools/run.sh" host-path)}
case "$mode" in
  index) "$host" index "$dir" "$@" ;;
  check)
    (($# == 0)) || exit 2
    "$host" index "$dir" --check
    "$host" mdcheck "$dir"
    python3 "$HERE/check.py" "$dir"
    "$host" lint --stats "$dir"
    ;;
  web)
    (($# == 1)) || { echo 'web requires OUT' >&2; exit 2; }
    "$host" site "$dir" "$1" --template "$HERE/template.html"
    "$host" normalize "$1"
    "$host" lint "$1"
    shopt -s globstar nullglob
    for page in "$1"/**/*.html; do
      if ! result=$("$host" clean --check "$page" 2>&1); then printf '%s\n' "$result" >&2; exit 1; fi
    done
    ;;
  *) echo "unknown memory command: $mode" >&2; exit 2 ;;
esac
echo "$mode: OK"
