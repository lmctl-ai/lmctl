#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
LMSCRIPT_BIN="${LMSCRIPT_BIN:-$(command -v lmscript)}"
"$LMSCRIPT_BIN" --version
LMHTML="${LMHTML:-$(LMSCRIPT_BIN="$LMSCRIPT_BIN" bash scripts/tools/run.sh host-path)}"
"$LMHTML" lint --config scripts/tools/plain.conf lmscript-site
python3 - <<'PY'
from pathlib import Path
from html import unescape
import re
for path in Path('lmscript-site').glob('*.html'):
    text = path.read_text()
    if re.search(r'<(?:strong|em)(?:\s|>)', text, re.I):
        raise SystemExit(f'{path}: emphasis markup is not allowed')
    outside = re.sub(r'<pre\b[^>]*>.*?</pre>', '', text, flags=re.I | re.S)
    if re.search(r'<code(?:\s|>)', outside, re.I):
        raise SystemExit(f'{path}: inline code markup is not allowed')
    match = re.search(r'<h2>Script: ([^<]+)</h2>\s*<pre><code>(.*?)</code></pre>', text, re.S)
    if match:
        source = Path('lmscript-site/examples') / match.group(1)
        if not source.is_file() or unescape(match.group(2)) != source.read_text():
            raise SystemExit(f'{path}: displayed source differs from {source}')
        if not re.search(r'<p>Try it:.*?</p>\s*</main>', text, re.S):
            raise SystemExit(f'{path}: tutorial must end with a Try it instruction')
PY
tmp="$(mktemp -d "${TMPDIR:-/tmp}/lmscript-site-XXXXXX")"
run_expect() {
  local file="$1" expected="$2"; shift 2
  local actual
  actual="$(cd "$tmp" && "$LMSCRIPT_BIN" "$ROOT/lmscript-site/examples/$file" "$@")"
  if [[ "$actual" != "$expected" ]]; then
    printf 'FAIL %s\nexpected:\n%s\nactual:\n%s\n' "$file" "$expected" "$actual" >&2
    exit 1
  fi
  printf 'PASS %s\n' "$file"
}
# A real run is the documented first-use path for install=@latest. This example
# only saves bytecode under the temporary working directory; it does not launch
# any provider or render host. It warms verified release assets for --check.
run_expect dsl-hosts.lms 'compiled lmdraw, lmcad and lmhtml bytecode'
for file in lmscript-site/examples/*.lms; do
  "$LMSCRIPT_BIN" --check "$file"
done
run_expect hello-vars.lms 'Hello, Ada!' Ada
run_expect control-flow-functions.lms 'sum=46'
run_expect strings-data.lms $'DRAW has 3 members: Ada, Lin, Mina\n{"team":"draw","count":3}'
run_expect files-processes.lms $'lines=2 last=second line\nprocess=process-ok'
run_expect errors-require.lms 'requirements passed'
run_expect teams.lms 'Preview only. Run with --live to seed a provider session.'
run_expect team-automation.lms 'Preview only. Run with --live TEAMFILE to lint, seed, work, review and open the Lead terminal.'
run_expect autorun-entry.lms $'Autorun role: @role(Lead.provider) / @role(Lead.model)\nAdd your task here, then run this file with lmctl autorun.'
printf 'lmscript site check: 9 examples passed\n'
