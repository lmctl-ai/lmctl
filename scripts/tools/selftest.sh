#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE/../.."
count=0
for fixture in tests/tools/*.html; do
  IFS= read -r line < "$fixture"
  expected=${line#<!-- expect: }
  expected=${expected% -->}
  [[ $expected != "$line" && -n $expected ]] || { echo "missing named expectation: $fixture" >&2; exit 1; }
  if output=$("$HERE/run.sh" check "$fixture" 2>&1); then
    echo "FAIL: accepted $fixture" >&2; exit 1
  fi
  [[ $output == *"$expected"* ]] || { printf 'FAIL: %s expected %s\n%s\n' "$fixture" "$expected" "$output" >&2; exit 1; }
  count=$((count + 1))
  echo "ok $count - $fixture"
done
"$HERE/run.sh" check
# Exercise tree invariants and writes only in an isolated copy, never shared pages.
work=$(mktemp -d "${TMPDIR:-/tmp}/lmctl-tools-test.XXXXXX")
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/scripts" "$work/homepage"
cp -R scripts/tools "$work/scripts/tools"
cp -R tools "$work/tools"
cp homepage/index.html "$work/homepage/index.html"
host=$("$HERE/run.sh" host-path)
"$host" --schema --json > "$work/lmhtml.dsl.json"
cat > "$work/mutate.lms" <<'LMS'
p = _dsl_ schema="lmhtml.dsl.json";
let page = html.load(${ARGV[1]});
page.select("footer").at(0).replace_with("<footer><p>Different footer.</p></footer>");
page.select("nav").at(0).replace_with("<nav><ul><li><a href='/tools/'>Tools</a></li></ul></nav>");
html.save(page, ${ARGV[1]});
end _dsl_
savedsl(p, ARGV[0]);
LMS
compiler=${LMSCRIPT_BIN:-$(command -v lmscript)}
"$compiler" "$work/mutate.lms" "$work/mutate.dslb" "$work/tools/lmscript/tutorial.html"
(cd "$work" && "$host" --dsl "$work/mutate.dslb") >/dev/null
if output=$("$work/scripts/tools/run.sh" check 2>&1); then echo 'FAIL: accepted inconsistent nav/footer' >&2; exit 1; fi
[[ $output == *'nav differs'* && $output == *'footer differs'* ]] || { echo "$output" >&2; exit 1; }
cp "$work/tools/lmscript/tutorial.html" "$work/before.html"
"$work/scripts/tools/run.sh" sync-nav --dry-run > "$work/dry-run.txt"
[[ $(cat "$work/dry-run.txt") == *'would-save'* ]] || { echo 'FAIL: dry-run did not report change' >&2; exit 1; }
cmp "$work/before.html" "$work/tools/lmscript/tutorial.html"
"$work/scripts/tools/run.sh" sync-nav
"$work/scripts/tools/run.sh" check
cp "$work/tools/lmscript/tutorial.html" "$work/after.html"
"$work/scripts/tools/run.sh" sync-nav
cmp "$work/after.html" "$work/tools/lmscript/tutorial.html"
echo 'ok - nav/footer consistency, dry-run, synchronization and byte-idempotence'
mkdir "$work/tools/unlisted-empty"
if output=$("$work/scripts/tools/run.sh" check 2>&1); then echo 'FAIL: accepted empty tool directory' >&2; exit 1; fi
[[ $output == *'missing tool page'* && $output == *'tool is not listed'* ]] || { echo "$output" >&2; exit 1; }
rmdir "$work/tools/unlisted-empty"
echo 'ok - missing pages and unlisted empty tool'
mv "$work/tools/style.css" "$work/style.css"
if output=$("$work/scripts/tools/run.sh" check 2>&1); then echo 'FAIL: accepted missing stylesheet' >&2; exit 1; fi
[[ $output == *'stylesheet not found'* ]] || { echo "$output" >&2; exit 1; }
mv "$work/style.css" "$work/tools/style.css"
echo 'ok - missing stylesheet'
mkdir "$work/site"
printf '%s\n' '<!doctype html><a href="https://invalid.example/external">external</a><a href="index.html#ok">anchor</a><h2 id="ok">ok</h2>' > "$work/site/index.html"
"$HERE/run.sh" links "$work/site"
printf '%s\n' '<a href="/missing.html">broken</a><a href="#nope">bad anchor</a>' >> "$work/site/index.html"
if output=$("$HERE/run.sh" links "$work/site" 2>&1); then echo 'FAIL: accepted broken links' >&2; exit 1; fi
[[ $output == *'/missing.html'* && $output == *'#nope'* ]] || { echo "$output" >&2; exit 1; }
echo 'ok - standalone link report ignores external links and catches paths/anchors'
printf 'PASS: %s named bad fixtures and the current tools tree\n' "$count"
