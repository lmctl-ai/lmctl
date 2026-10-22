#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run check:onboarding-catalogs
python3 scripts/tools/static-site.py deploy helloexample
