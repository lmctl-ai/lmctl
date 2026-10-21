#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run check:lmscript-site
python3 scripts/tools/static-site.py deploy lmscript
