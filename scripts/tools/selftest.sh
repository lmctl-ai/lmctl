#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE/../.."
count=0
host=$("$HERE/run.sh" host-path)
LMHTML=$host
PATH="$(dirname "$host"):$PATH"
export LMHTML PATH
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
mkdir -p "$work/scripts" "$work/tools/zeta" "$work/homepage" "$work/skills"
cp -R scripts/tools "$work/scripts/tools"
cp tools/style.css "$work/tools/style.css"
cp homepage/index.html "$work/homepage/index.html"
cp skills/index.html "$work/skills/index.html"
cp tests/tools/authoring/skill.fragment "$work/tools/zeta/skill.html"
cp tests/tools/authoring/skill.fragment "$work/original.fragment"
run(){ "$work/scripts/tools/run.sh" "$@"; }
expect_failure(){
  local expected=$1; shift
  if output=$(run "$@" 2>&1); then echo "FAIL: expected $expected" >&2; exit 1; fi
  [[ $output == *"$expected"* ]] || { echo "FAIL: expected $expected: $output" >&2; exit 1; }
}
expect_failure 'run npm run decorate:tools' decorate --check
expect_failure 'run npm run decorate:tools' check tools/zeta
cmp "$work/original.fragment" "$work/tools/zeta/skill.html"
[[ ! -e "$work/tools/index.html" && ! -e "$work/tools/zeta/index.html" ]]
printf '<h1>About tools</h1><p>A site-level page.</p>\n' > "$work/tools/about.html"
run decorate
run check
echo 'ok - bare skill-only tool, missing own/site indexes, check is read-only'
cp tests/tools/authoring/copy-script.fragment "$work/tools/zeta/tutorial-copy.html"
run decorate
if ! grep -q '<script src="/tools/lmctl-copy.js" defer></script>' "$work/tools/zeta/tutorial-copy.html"; then
  echo 'FAIL: generated example page did not receive the copy script' >&2
  exit 1
fi
run check
rm "$work/tools/zeta/tutorial-copy.html"
run decorate
run check
echo 'ok - generated example pages receive one deferred same-origin copy script'
cat > "$work/assert.lms" <<'LMS'
p = _dsl_ cli="lmhtml" install="github:lmctl-ai/lmhtml@latest";
let skill = html.load("tools/zeta/skill.html");
let fragment = html.load("original.fragment");
if (skill.source_inner("main") != str_replace(fragment.source(), "&lt;input&gt;", "&lt;input>")) { report.add("test", "skill", 0, "authored bytes changed"); }
if (skill.select("main").at(0).text() != fragment.select("body").at(0).text()) { report.add("test", "skill", 0, "authored text changed"); }
let root = html.load("tools/index.html");
if (root.select("main li").len() != 1 || root.select("main li a").at(0).attr("href") != "/tools/zeta/") { report.add("test", "index", 0, "wrong generated index"); }
if (skill.select("nav a").len() != 5) { report.add("test", "nav", 0, "shared site links or optional pages missing from nav"); }
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
p = _dsl_ cli="lmhtml" install="github:lmctl-ai/lmhtml@latest";
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
# Structural errors remain findings; the plain profile removes presentational attributes.
{ cat "$work/original.fragment"; printf '<div class="bad">Do not erase me.</div>\n'; } > "$work/tools/zeta/skill.html"
run decorate
expect_failure 'forbidden element <div>' contract
if [[ $(cat "$work/tools/zeta/skill.html") == *'class="bad"'* ]]; then echo 'FAIL: decoration attribute retained'; exit 1; fi
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
p = _dsl_ cli="lmhtml" install="github:lmctl-ai/lmhtml@latest";
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
# Visual QA regressions: complete summaries, unambiguous labels and pre layout.
cp tests/tools/authoring/visual.fragment "$work/tools/zeta/guide-alpha.html"
cp tests/tools/authoring/visual.fragment "$work/visual.original"
expect_failure 'command: demo one' contract tools/zeta/guide-alpha.html
cat > "$work/visual-setup.lms" <<'LMS'
p = _dsl_ cli="lmhtml" install="github:lmctl-ai/lmhtml@latest";
let source = html.load("visual.original").source();
html.save(str_replace(source, "Visual regression examples.", "Another topic with the same heading."), "tools/zeta/guide-beta.html");
let words = "Éclair tooling preserves whole words while describing repeatable operations for teams using plain HTML documents and predictable command line programs with detailed documentation for everyone";
html.save("<h1>Fallback</h1><p>" + words + "</p><h2>Overview</h2><p>Distinct guide.</p><pre><code>\r\n  crlf preserved\r\n</code></pre>", "tools/zeta/guide-gamma.html");
end _dsl_
savedsl(p, ARGV[0]);
LMS
"$compiler" "$work/visual-setup.lms" "$work/visual-setup.dslb"
(cd "$work" && "$host" --dsl "$work/visual-setup.dslb") >/dev/null
expect_failure 'run npm run decorate:tools' decorate --check
run decorate
run check
cat > "$work/visual-assert.lms" <<'LMS'
p = _dsl_ cli="lmhtml" install="github:lmctl-ai/lmhtml@latest";
let page = html.load("tools/zeta/guide-alpha.html");
let index = html.load("tools/zeta/index.html");
if (index.select("main p").at(0).text() != "A complete first sentence.") { report.add("test", "summary", 0, "not a complete sentence"); }
if (!str_contains(html.load("tools/index.html").select("main li").at(0).text(), "A complete first sentence.")) { report.add("test", "catalog", 0, "wrong summary"); }
if (page.select("meta[name='description']").at(0).attr("content") != "A complete first sentence.") { report.add("test", "meta", 0, "not a complete sentence"); }
let fallback = html.load("tools/zeta/guide-gamma.html");
if (fallback.select("meta[name='description']").at(0).attr("content") != "Éclair tooling preserves whole words while describing repeatable operations for teams using plain HTML documents and predictable command line programs with…") { report.add("test", "words", 0, "not a whole-word UTF-8 excerpt"); }
let labels = "";
for (link in page.select("nav a")) { labels = labels + link.text() + "|"; }
if (labels != "lmctl.com|Tools|Skills|Overview|Skill|Guide: lmcad|Guide: lmcad (guide-beta)|Guide: Fallback|") { report.add("test", "nav", 0, labels); }
let original = html.load("visual.original").source();
let expected = original;
# Only the actual pre changes, not the identical snippet in the comment.
expected = str_replace(expected, "-->\n<pre><kbd>demo one</kbd> <samp>one</samp><kbd>demo two</kbd><samp>two</samp></pre>", "-->\n<pre><kbd>demo one</kbd>\n<samp>one</samp>\n<kbd>demo two</kbd>\n<samp>two</samp></pre>");
expected = str_replace(expected, "<code>\n  example &lt;input&gt;\n    preserve indentation\n</code>", "<code>  example &lt;input>\n    preserve indentation</code>");
expected = str_replace(expected, "newline --><samp>output</samp>", "newline -->\n<samp>output</samp>");
expected = str_replace(expected, "<pre>\n<kbd>boundary command</kbd>\n<samp>boundary output</samp>\n</pre>", "<pre><kbd>boundary command</kbd>\n<samp>boundary output</samp></pre>");
if (page.source_inner("main") != expected) { report.add("test", "pre", 0, "changed unrelated authored bytes or missed formatting"); }
if (fallback.source_elements("code").at(0) != "<code>  crlf preserved</code>") { report.add("test", "crlf", 0, "blank boundary lines remain"); }
report.write_text("visual-assert.txt");
report.fail_if_any();
end _dsl_
savedsl(p, ARGV[0]);
LMS
"$compiler" "$work/visual-assert.lms" "$work/visual-assert.dslb"
(cd "$work" && "$host" --dsl "$work/visual-assert.dslb") || { cat "$work/visual-assert.txt"; exit 1; }
cp -R "$work/tools" "$work/visual-unchanged"
run decorate
for file in "$work"/tools/*.html "$work"/tools/*/*.html; do cmp "$file" "$work/visual-unchanged/${file#"$work/tools/"}"; done
run decorate --check
echo 'ok - sentence/word summaries, unique topic labels, pre newlines, comments, CRLF and idempotence'
# Optional icons/logos require no author markup or per-tool configuration.
mkdir -p "$work/tools/zeta/img" "$work/tools/img"
cp tools/lmhtml/img/icon.png "$work/tools/zeta/img/icon.png"
cp tools/lmhtml/img/logo.png "$work/tools/zeta/img/logo.png"
cp tools/img/icon.png "$work/tools/img/icon.png"
cp tools/img/tools.png "$work/tools/img/tools.png"
expect_failure 'run npm run decorate:tools' decorate --check
run decorate
run check
cat > "$work/icons-assert.lms" <<'LMS'
p = _dsl_ cli="lmhtml" install="github:lmctl-ai/lmhtml@latest";
let root = html.load("tools/index.html");
let index = html.load("tools/zeta/index.html");
let skill = html.load("tools/zeta/skill.html");
if (skill.select("head link[rel=icon][type='image/png'][href='/tools/zeta/img/icon.png']").len() != 1 || skill.select("head link[rel=stylesheet]").len() != 1) { report.add("test", "head", 0, "favicon or stylesheet count"); }
if (root.select("head link[rel=icon][href='/tools/img/icon.png']").len() != 1) { report.add("test", "head", 0, "site favicon missing"); }
if (root.select("main > ul > li > img[src='/tools/zeta/img/icon.png'][alt=''][width='64'][height='64']").len() != 1) { report.add("test", "catalog", 0, "decorative icon missing"); }
if (index.select("main > h1 + figure > img[src='/tools/zeta/img/logo.png'][alt='zeta logo'][width='256'][height='256']").len() != 1 || index.select("figure").len() != 1) { report.add("test", "logo", 0, "tool logo missing or duplicated"); }
if (root.select("main > h1 + figure > img[src='/tools/img/tools.png'][alt='lmctl tools'][width='256'][height='256']").len() != 1) { report.add("test", "logo", 0, "site logo missing"); }
report.write_text("icons-assert.txt");
report.fail_if_any();
end _dsl_
savedsl(p, ARGV[0]);
LMS
"$compiler" "$work/icons-assert.lms" "$work/icons-assert.dslb"
(cd "$work" && "$host" --dsl "$work/icons-assert.dslb") || { cat "$work/icons-assert.txt"; exit 1; }
cat > "$work/tools/zeta/guide-images.html" <<'HTML'
<h1>Images</h1><p>Intrinsic geometry reserves layout space.</p><h2>Overview</h2>
<!-- <img src='/tools/zeta/img/logo.png'> -->
<figure><img src='/tools/zeta/img/logo.png' alt='A logo'><figcaption>Example.</figcaption></figure>
<figure><img src='/tools/zeta/img/icon.png' alt='An icon' width='64'><figcaption>Example.</figcaption></figure>
HTML
expect_failure 'PNG needs width and height attributes' contract
run decorate
run check
cat > "$work/dimensions.lms" <<'LMS'
p = _dsl_ cli="lmhtml" install="github:lmctl-ai/lmhtml@latest";
let page = html.load("tools/zeta/guide-images.html");
if (page.select("img[width='256'][height='256']").len() != 1 || page.select("img[width='64'][height='64']").len() != 1) { report.add("test", "dimensions", 0, "missing pair or half-pair not filled"); }
if (!str_contains(page.source(), "<!-- <img src='/tools/zeta/img/logo.png'> -->")) { report.add("test", "dimensions", 0, "comment changed"); }
report.write_text("dimensions.txt");
report.fail_if_any();
html.save(str_replace(page.source(), "width='64'", "width='12'"), "tools/zeta/guide-images.html");
end _dsl_
savedsl(p, ARGV[0]);
LMS
"$compiler" "$work/dimensions.lms" "$work/dimensions.dslb"
(cd "$work" && "$host" --dsl "$work/dimensions.dslb") || { cat "$work/dimensions.txt"; exit 1; }
run decorate
expect_failure 'PNG dimensions must match intrinsic 64x64' contract
rm "$work/tools/zeta/guide-images.html"
run decorate
cp -R "$work/tools" "$work/icons-unchanged"
run decorate
for file in "$work"/tools/*.html "$work"/tools/*/*.html; do cmp "$file" "$work/icons-unchanged/${file#"$work/tools/"}"; done
run decorate --check
cat > "$work/break-icons.lms" <<'LMS'
p = _dsl_ cli="lmhtml" install="github:lmctl-ai/lmhtml@latest";
let root = html.load("tools/index.html").source();
html.save(str_replace(root, "/tools/zeta/img/icon.png", "/tools/zeta/img/missing.png"), "tools/index.html");
let skill = html.load("tools/zeta/skill.html").source();
html.save(str_replace(skill, "/tools/zeta/img/icon.png", "/tools/zeta/img/missing.png"), "tools/zeta/skill.html");
end _dsl_
savedsl(p, ARGV[0]);
LMS
"$compiler" "$work/break-icons.lms" "$work/break-icons.dslb"
(cd "$work" && "$host" --dsl "$work/break-icons.dslb") >/dev/null
expect_failure 'image not found: /tools/zeta/img/missing.png' contract
expect_failure 'favicon not found: /tools/zeta/img/missing.png' contract
run decorate
# Existing sources are PNGs; padding changes only the byte-budget test input.
cp "$work/tools/zeta/img/icon.png" "$work/tools/zeta/img/budget.png"
truncate -s 30000 "$work/tools/zeta/img/budget.png"
expect_failure 'PNG must be under 30 KB' contract
truncate -s 20001 "$work/tools/zeta/img/budget.png"
output=$(run contract)
[[ $output == *'warning tools/zeta/img/budget.png'* ]] || { echo 'FAIL: PNG warning missing'; exit 1; }
rm "$work/tools/zeta/img/budget.png"
rm "$work/tools/zeta/img/icon.png" "$work/tools/zeta/img/logo.png" "$work/tools/img/icon.png" "$work/tools/img/tools.png"
expect_failure 'favicon not found' contract
expect_failure 'image not found' contract
run decorate
run check
# Returning to the icon-free tree must restore precisely the previous HTML.
for file in "$work"/tools/*.html "$work"/tools/*/*.html; do cmp "$file" "$work/visual-unchanged/${file#"$work/tools/"}"; done
run decorate --check
echo 'ok - optional icons/logos, missing files, PNG limits and nonfatal warnings, icon idempotence'
printf 'PASS: %s named fixtures, current tree and authoring/index lifecycle tests\n' "$count"

# Live publication comparisons and native lmhtml link discovery.
python3 "$HERE/test-live.py"
python3 "$HERE/test-example-book.py"
