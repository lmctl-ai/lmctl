#!/usr/bin/env bash
# Self-test of the durable-memory profile: every tests/memory/bad/<case>/ must
# fail with the message in its expect.txt; tests/memory/good must pass; index
# generation and the web view must be idempotent and never touch the source.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE/../.."
# These fixtures need scratch space, not a Docusaurus build.
mkdir -p build
run() { "$HERE/run.sh" "$@"; }
count=0
for case_dir in tests/memory/bad/*/; do
  case_dir=${case_dir%/}
  expected=$(head -n1 "$case_dir/expect.txt")
  if output=$(run check "$case_dir" 2>&1); then echo "FAIL: accepted $case_dir" >&2; exit 1; fi
  [[ $output == *"$expected"* ]] || { printf 'FAIL: %s expected %s\n%s\n' "$case_dir" "$expected" "$output" >&2; exit 1; }
  count=$((count+1))
done
echo "ok - $count bad durable-memory fixtures rejected"
run check tests/memory/good >/dev/null
echo "ok - good fixture passes"
# The sole legacy Markdown compatibility file is an exact one-line index pointer.
rm -rf build/memory-stub-check
cp -R tests/memory/good build/memory-stub-check
printf '%s\n' 'Read [index.html](index.html) first.' > build/memory-stub-check/index.md
run check build/memory-stub-check >/dev/null
printf '%s\n' 'Read the old notes.' > build/memory-stub-check/index.md
output=$(run check build/memory-stub-check 2>&1)
[[ $output == *'not an HTML note'* ]] || { echo 'FAIL: noncanonical index.md stub was not warned about' >&2; exit 1; }
rm -rf build/memory-stub-check
echo 'ok - exact Markdown index pointer is allowed; other Markdown remains warned'
# Index lifecycle and web view in an isolated copy under build/.
work=build/memory-selftest
rm -rf "$work"; mkdir -p "$work"
cp -R tests/memory/good "$work/memory"
rm "$work/memory/index.html"
if run index "$work/memory" --check >/dev/null 2>&1; then echo 'FAIL: index --check accepted a missing index' >&2; exit 1; fi
run index "$work/memory" >/dev/null
run index "$work/memory" --check >/dev/null
cp "$work/memory/index.html" "$work/index.first"
run index "$work/memory" >/dev/null
cmp "$work/index.first" "$work/memory/index.html"
run check "$work/memory" >/dev/null
echo "ok - index created from scratch, --check, idempotent apply, result passes check"
(cd "$work/memory" && find . -type f -exec sha256sum {} + | sort) > "$work/source.sums"
run web "$work/memory" "$work/web" >/dev/null
(cd "$work/web" && find . -type f -exec sha256sum {} + | sort) > "$work/web.first"
run web "$work/memory" "$work/web" >/dev/null
(cd "$work/web" && find . -type f -exec sha256sum {} + | sort) | cmp - "$work/web.first"
(cd "$work/memory" && find . -type f -exec sha256sum {} + | sort) | cmp - "$work/source.sums"
grep -q '<link rel="stylesheet" href="/tools/style.css">' "$work/web/design.html"
if grep -q 'stylesheet' "$work/memory/design.html"; then echo 'FAIL: source was decorated' >&2; exit 1; fi
if run web "$work/memory" "$work/memory/out" >/dev/null 2>&1; then echo 'FAIL: OUT inside DIR accepted' >&2; exit 1; fi
rm -rf "$work"
echo "ok - web view decorates copies only, is idempotent, refuses OUT inside DIR"
echo "PASS: durable-memory profile self-test"
