#!/usr/bin/env bash
# SITE_ORIGIN may point at any HTTP(S) origin. No AWS credentials required.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
exec python3 "$HERE/static-site.py" verify "$@"
