#!/usr/bin/env bash
# Independent static publication; DRY_RUN=1 previews exact changed keys.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run check:skills
python3 scripts/tools/static-site.py deploy skills
