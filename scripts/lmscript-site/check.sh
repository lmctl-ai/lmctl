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
# Run native hosts in the temporary working directory so their rendered files
# stay out of the source tree, while warming verified release assets for --check.
run_expect dsl-hosts.lms 'compiled and ran lmdraw, lmcad and lmhtml'
for file in lmscript-site/examples/*.lms; do
  case "$file" in
    lmscript-site/examples/undeclared-name.lms) continue ;;
  esac
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
run_expect multi-agent-workflow.lms 'Preview only. Live order: Lead assigns, Coder works, Reviewer reviews, Lead decides.'
run_expect script-lifecycle-diagram.lms 'compiled script lifecycle diagram'
run_expect team-message-flow.lms 'compiled team message flow diagram'
for image in script-lifecycle.png team-message-flow.png; do
  if [[ ! -s "$tmp/build/rendered/$image" ]]; then
    printf 'FAIL diagram example did not render build/rendered/%s\n' "$image" >&2
    exit 1
  fi
  if ! cmp -s "$tmp/build/rendered/$image" "$ROOT/lmscript-site/img/$image"; then
    printf 'FAIL published image %s does not match its lmdraw example output\n' "$image" >&2
    exit 1
  fi
done
run_expect autorun-script.lms 'Wrote portable-team.lmctl'
run_error() {
  local file="$1" expected="$2" expected_code="$3"
  shift 3
  local actual code
  set +e
  actual="$(cd "$tmp" && "$LMSCRIPT_BIN" --source-name "$file" "$ROOT/lmscript-site/examples/$file" "$@" 2>&1)"
  code=$?
  set -e
  if [[ "$actual" != "$expected" || "$code" != "$expected_code" ]]; then
    printf 'FAIL %s (exit %s)\nexpected (exit %s):\n%s\nactual:\n%s\n' "$file" "$code" "$expected_code" "$expected" "$actual" >&2
    exit 1
  fi
  printf 'PASS expected error %s (exit %s)\n' "$file" "$code"
}
run_error undeclared-name.lms "error:undeclared-name.lms:1:9: Undeclared variable 'greet'" 2
run_error missing-map-key.lms 'error:missing-map-key.lms:2:16: map record has no key "email"; test with record.has("email") or read record.get("email", default)' 1
run_error failed-require.lms 'error:failed-require.lms:2:1: score must be positive' 1
printf 'lmscript site check: 13 passing examples and 3 reproduced errors\n'
