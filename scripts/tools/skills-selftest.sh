#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
host=$(bash scripts/tools/run.sh host-path)
work=$(mktemp -d "${TMPDIR:-/tmp}/skills-selftest.XXXXXX")
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/scripts" "$work/tests" "$work/tools" "$work/homepage"
cp -R scripts/tools "$work/scripts/"
cp -R skills "$work/"
cp -R tests/skills "$work/tests/"
cp tools/style.css tools/index.html "$work/tools/"
mkdir -p "$work/tools/img"
cp tools/img/icon.png "$work/tools/img/icon.png"
cp homepage/index.html "$work/homepage/"
cd "$work"
export LMHTML="$host"
count=0
ok(){ count=$((count+1)); echo "ok $count - $1"; }
bash scripts/tools/run.sh skills --check > result.txt 2>&1 || { cat result.txt; exit 1; }
ok 'current HTML skills and generated index'
bash scripts/tools/run.sh skills tests/skills/lead-good.html > result.txt 2>&1 || { cat result.txt; exit 1; }
ok 'valid coordination page'
bash scripts/tools/run.sh skills tests/skills/commands-good.html > result.txt 2>&1 || { cat result.txt; exit 1; }
ok 'current lmctl commands in kbd'
for expected in tests/skills/*.expected; do
  page=${expected%.expected}.html
  if bash scripts/tools/run.sh skills "$page" > result.txt 2>&1; then echo "unexpected success: $page"; exit 1; fi
  grep -Fq "$(cat "$expected")" result.txt || { cat result.txt; exit 1; }
  ok "$(basename "$page")"
done
printf '\n<!-- stale index -->\n' >> skills/index.html
if bash scripts/tools/run.sh skills --check > result.txt 2>&1; then echo 'stale index accepted'; exit 1; fi
grep -Fq 'skills/index.html' result.txt
grep -Fq 'run npm run build:skills' result.txt
ok 'stale HTML index fails with rebuild command'
rm skills/index.html
if bash scripts/tools/run.sh skills --check > result.txt 2>&1; then echo 'missing generated files accepted'; exit 1; fi
grep -Fq 'run npm run build:skills' result.txt
ok 'missing generated files fail with regeneration command'
bash scripts/tools/run.sh skills > result.txt 2>&1 || { cat result.txt; exit 1; }
bash scripts/tools/run.sh skills --check > result.txt 2>&1 || { cat result.txt; exit 1; }
ok 'missing HTML index regenerated'
cp -R skills before
bash scripts/tools/run.sh skills > result.txt 2>&1 || { cat result.txt; exit 1; }
diff -qr before skills
ok 'second build changes zero bytes'
printf 'not a skill format\n' > skills/unlisted.md
if bash scripts/tools/run.sh skills --check > result.txt 2>&1; then echo 'orphan Markdown accepted'; exit 1; fi
grep -Fq 'skills must be HTML only' result.txt
ok 'Markdown files refused, never generated'
echo "PASS: $count skills checks"
