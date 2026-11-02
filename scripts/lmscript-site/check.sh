#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
LMSCRIPT_BIN="${LMSCRIPT_BIN:-$(command -v lmscript)}"
"$LMSCRIPT_BIN" --version
# Host installation uses the published compiler: mono has a separate 0.2.x
# version series that fails tools/run.sh's published-package version guard.
LMHTML="${LMHTML:-$(LMSCRIPT_BIN="${LMHTML_BOOTSTRAP_BIN:-$(command -v lmscript)}" bash scripts/tools/run.sh host-path)}"
"$LMHTML" lint --config scripts/tools/plain.conf lmscript-site
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s scripts/lmscript-site -p 'test_*.py'
python3 scripts/lmscript-site/pages.py
# Exercise new recipes even when a legacy native-host example fails later.
LMSCRIPT_BIN="$LMSCRIPT_BIN" python3 scripts/lmscript-site/agentic.py offline
tmp="$(mktemp -d "${TMPDIR:-/tmp}/lmscript-site-XXXXXX")"
trap 'rm -rf "$tmp"' EXIT
run_expect() {
  local file="$1" expected="$2"; shift 2
  local actual
  actual="$(cd "$tmp" && "$LMSCRIPT_BIN" "$ROOT/lmscript-site/examples/$file" "$@")"
  if [[ "$actual" != "$expected" ]]; then
    printf 'FAIL %s\nexpected:\n%s\nactual:\n%s\n' "$file" "$expected" "$actual" >&2
    exit 1
  fi
  python3 - "$ROOT/lmscript-site/${file%.lms}.html" "$actual" <<'PY'
from pathlib import Path
from html import unescape
import re, sys
page = Path(sys.argv[1])
if page.is_file():
    outputs = re.findall(r'<pre><samp>(.*?)</samp></pre>', page.read_text(), re.S)
    if sys.argv[2] not in [unescape(output) for output in outputs]:
        raise SystemExit(f'{page}: displayed output differs from compiler output')
PY
  printf 'PASS %s\n' "$file"
}
# Run native hosts in the temporary working directory so their rendered files
# stay out of the source tree, while warming verified release assets for --check.
run_expect dsl-hosts.lms 'compiled and ran lmdraw, lmcad and lmhtml'
while IFS= read -r -d '' file; do
  case "$file" in
    lmscript-site/examples/undeclared-name.lms) continue ;;
    # Needs a generated schema; agentic.py checks its staged copy.
    lmscript-site/agentic/examples/mock-model.lms) continue ;;
  esac
  "$LMSCRIPT_BIN" --check "$file"
done < <(find lmscript-site -path '*/examples/*.lms' -type f -print0)
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
  python3 - "$ROOT/lmscript-site/troubleshooting.html" "$actual" <<'PY'
from pathlib import Path
from html import unescape
import re, sys
outputs = re.findall(r'<pre><samp>(.*?)</samp></pre>', Path(sys.argv[1]).read_text(), re.S)
if sys.argv[2] not in [unescape(output) for output in outputs]:
    raise SystemExit('troubleshooting.html: reproduced diagnostic is missing from the page')
PY
  printf 'PASS expected error %s (exit %s)\n' "$file" "$code"
}
run_error undeclared-name.lms "error:undeclared-name.lms:1:9: Undeclared variable 'greet'" 2
run_error missing-map-key.lms 'error:missing-map-key.lms:2:16: map record has no key "email"; test with record.has("email") or read record.get("email", default)' 1
run_error failed-require.lms 'error:failed-require.lms:2:1: score must be positive' 1
printf 'lmscript site check: 13 passing examples and 3 reproduced errors\n'
