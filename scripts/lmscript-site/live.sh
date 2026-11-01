#!/usr/bin/env bash
# Manual, billable integration run. Never invoked by check.sh.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
[[ $# == 1 && $1 == agentic ]] || { echo 'usage: live.sh agentic' >&2; exit 2; }
cd "$ROOT"
exec python3 scripts/lmscript-site/agentic.py live
