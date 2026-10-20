#!/usr/bin/env bash
# Thin wrappers around the checksum-pinned lmhtml Markdown CLI.
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
    ;;
  web)
    (($# == 1)) || { echo 'web requires OUT' >&2; exit 2; }
    "$host" site "$dir" "$1" --template "$HERE/template.html"
    ;;
  *) echo "unknown memory command: $mode" >&2; exit 2 ;;
esac
echo "$mode: OK"
