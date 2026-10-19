#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE/../.."
count=0
for fixture in tests/tools/*.html; do
  IFS= read -r line < "$fixture"
  expected=${line#<!-- expect: }; expected=${expected% -->}
  [[ $expected != "$line" && -n $expected ]] || { echo "missing expectation: $fixture" >&2; exit 1; }
  if output=$("$HERE/run.sh" contract "$fixture" 2>&1); then echo "FAIL: accepted $fixture" >&2; exit 1; fi
  [[ $output == *"$expected"* ]] || { printf 'FAIL: %s expected %s\n%s\n' "$fixture" "$expected" "$output" >&2; exit 1; }
  count=$((count+1))
done
echo "ok - $count named bad contract fixtures"
"$HERE/run.sh" check
work=$(mktemp -d "${TMPDIR:-/tmp}/lmctl-decorate-test.XXXXXX")
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/scripts" "$work/tools/zeta" "$work/homepage"
cp -R scripts/tools "$work/scripts/tools"
cp tools/style.css "$work/tools/style.css"
cp homepage/index.html "$work/homepage/index.html"
cp tests/tools/authoring/skill.fragment "$work/tools/zeta/skill.html"
cp tests/tools/authoring/skill.fragment "$work/original.fragment"
run(){ "$work/scripts/tools/run.sh" "$@"; }
expect_failure(){
  local expected=$1; shift
  if output=$(run "$@" 2>&1); then echo "FAIL: expected $expected" >&2; exit 1; fi
  [[ $output == *"$expected"* ]] || { echo "FAIL: expected $expected: $output" >&2; exit 1; }
}
expect_failure 'run npm run decorate:tools' decorate --check
cmp "$work/original.fragment" "$work/tools/zeta/skill.html"
[[ ! -e "$work/tools/index.html" && ! -e "$work/tools/zeta/index.html" ]]
printf '<h1>About tools</h1><p>A site-level page.</p>\n' > "$work/tools/about.html"
run decorate
run check
echo 'ok - bare skill-only tool, missing own/site indexes, check is read-only'
host=$("$HERE/run.sh" host-path)
"$host" --schema --json > "$work/lmhtml.dsl.json"
cat > "$work/assert.lms" <<'LMS'
p = _dsl_ schema="lmhtml.dsl.json";
let skill = html.load("tools/zeta/skill.html");
let fragment = html.load("original.fragment");
if (skill.source_inner("main") != fragment.source()) { report.add("test", "skill", 0, "authored bytes changed"); }
let root = html.load("tools/index.html");
if (root.select("main li").len() != 1 || root.select("main a").at(0).attr("href") != "/tools/zeta/") { report.add("test", "index", 0, "wrong generated index"); }
if (skill.select("nav a").len() != 3) { report.add("test", "nav", 0, "optional pages added to nav"); }
if (skill.select("head title").at(0).text() != "Example & helpers {{CONTENT}} — zeta — lmctl.com tools") { report.add("test", "title", 0, "placeholder expansion corrupted title"); }
report.write_text("assert.txt");
report.fail_if_any();
end _dsl_
savedsl(p, ARGV[0]);
LMS
compiler=${LMSCRIPT_BIN:-$(command -v lmscript)}
"$compiler" "$work/assert.lms" "$work/assert.dslb"
(cd "$work" && "$host" --dsl "$work/assert.dslb") || { cat "$work/assert.txt"; exit 1; }
cp -R "$work/tools" "$work/unchanged"
touch "$work/before-second-run"
run decorate
# cmp each file, not normalized HTML: a second apply must change zero bytes.
for file in "$work"/tools/*.html "$work"/tools/*/*.html; do cmp "$file" "$work/unchanged/${file#"$work/tools/"}"; [[ ! $file -nt $work/before-second-run ]] || { echo "FAIL: rewrote unchanged $file" >&2; exit 1; }; done
run decorate --check
echo 'ok - exact content preservation, escaping, and byte-idempotence'
# Replace the shell with an obsolete nav while retaining the same author source.
{ printf '<nav><ul><li><a href="/tools/">Stale</a></li></ul></nav>\n'; cat "$work/original.fragment"; } > "$work/tools/zeta/skill.html"
expect_failure 'outdated' decorate --check
run decorate
run check
echo 'ok - stale nav repaired'
# A template edit propagates to every page, then stabilizes.
cp "$work/scripts/tools/template.html" "$work/template.original"
# Literal fixture editing through lmscript/host, not a second HTML processor.
cat > "$work/mutate.lms" <<'LMS'
p = _dsl_ schema="lmhtml.dsl.json";
let template_doc = html.load("scripts/tools/template.html");
html.save(str_replace(template_doc.source(), "Source and releases:", "Project source and releases:"), "scripts/tools/template.html");
end _dsl_
savedsl(p, ARGV[0]);
LMS
"$compiler" "$work/mutate.lms" "$work/mutate.dslb"
(cd "$work" && "$host" --dsl "$work/mutate.dslb") >/dev/null
expect_failure 'outdated' decorate --check
run decorate
run check
cp tests/tools/authoring/tutorial.fragment "$work/tools/zeta/tutorial-animation.html"
run decorate
run check
rm "$work/tools/zeta/tutorial-animation.html"
run decorate
run check
echo 'ok - template propagation, topic tutorial, deleted optional page'
cp "$work/original.fragment" "$work/tools/zeta/skil.html"
run decorate
expect_failure 'valid roles: skill, tutorial, guide, recipes, reference, faq, changelog' contract
rm "$work/tools/zeta/skil.html"
cp "$work/original.fragment" "$work/tools/zeta/Skill.html"
run decorate
expect_failure 'bad page name' contract
rm "$work/tools/zeta/Skill.html"
# Invalid author content is preserved for the contract checker, never repaired.
{ cat "$work/original.fragment"; printf '<div class="bad">Do not erase me.</div>\n'; } > "$work/tools/zeta/skill.html"
run decorate
expect_failure 'forbidden element <div>' contract
expect_failure 'forbidden attribute class' contract
cp "$work/original.fragment" "$work/tools/zeta/skill.html"
run decorate
# Missing skill headings remain a role failure after decoration.
printf '<h1>Incomplete</h1><p>Summary.</p><h2>Purpose</h2><p>Only one.</p>\n' > "$work/tools/zeta/skill.html"
run decorate
expect_failure 'skill.html h2 headings must be exactly' contract
cp "$work/original.fragment" "$work/tools/zeta/skill.html"
run decorate
cp "$work/tools/index.html" "$work/one-tool.html"
cat > "$work/copy-guide.lms" <<'LMS'
p = _dsl_ schema="lmhtml.dsl.json";
html.save(str_replace(html.load("original.fragment").source(), "<h2>Purpose</h2>", "<h2>Overview</h2>"), "tools/zeta/guide.html");
end _dsl_
savedsl(p, ARGV[0]);
LMS
"$compiler" "$work/copy-guide.lms" "$work/copy-guide.dslb"
(cd "$work" && "$host" --dsl "$work/copy-guide.dslb") >/dev/null
run decorate
expect_failure 'guide must not duplicate skill' contract
rm "$work/tools/zeta/guide.html"
run decorate
run check
mkdir "$work/tools/alpha"
cp "$work/original.fragment" "$work/tools/alpha/skill.html"
expect_failure 'stale generated tools index' decorate --check
run decorate
run check
cp "$work/tools/index.html" "$work/two-tools.html"
rm "$work/tools/alpha/skill.html" "$work/tools/alpha/index.html"
rmdir "$work/tools/alpha"
expect_failure 'stale generated tools index' decorate --check
run decorate
run check
cmp "$work/one-tool.html" "$work/tools/index.html"
rm "$work/tools/index.html" "$work/tools/zeta/index.html"
expect_failure 'missing or stale generated' decorate --check
run decorate
run check
# H1 changes propagate through nav/topic labels and both index pages.
{ printf '<h1>Changed title</h1><p>Changed summary.</p>\n'; cat "$work/original.fragment"; } > "$work/tools/zeta/skill.html"
run decorate
[[ $(cat "$work/tools/index.html") == *'Changed title'* && $(cat "$work/tools/index.html") == *'Changed summary.'* ]]
# Restore a valid one-h1 source and verify the final tree.
cp "$work/original.fragment" "$work/tools/zeta/skill.html"
run decorate
run check
echo 'ok - new/deleted tools, missing indexes, changed titles, role errors and preserved invalid content'
printf 'PASS: %s named fixtures, current tree and authoring/index lifecycle tests\n' "$count"
