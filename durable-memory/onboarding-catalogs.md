# Hosted onboarding catalogs

The hosted onboarding catalogs let the CLI list and resolve new examples without embedding their names or URLs in a release.

## Hello examples

Add a short helloexample/NAME.lms script. It must have a one-sentence // description: line and exactly one leading // autorun-role: declaration. The script should seed one Lead, send one small prompt, and avoid opening a terminal. The provider and model in the role header go through autorun's normal provider preflight and substitution flow.

The provider-specific examples are agy, claude, codex, and kimi. Their legacy .lmctl teamfiles remain hosted for older clients. Do not remove the generic helloexample/hello.lms URL while it is still referenced by older clients.

## Curated autorun examples

Add a non-hello script to scripts/autorun-examples.json with a unique lowercase name, a one-sentence description, and an absolute URL such as https://lmctl.com/tools/lmdraw/lmdraw_solo.lms. The generator verifies that each URL maps to a nonempty script in this repository. Hello entries are added to this catalog automatically from helloexample/*.lms.

## Generate and verify

Run npm run build:onboarding-catalogs to regenerate helloexample/index.txt, helloexample/index.html, autorun/index.txt, and autorun/index.html. Run npm run check:onboarding-catalogs before committing; it checks generated-file freshness, catalog shape and the hello scripts with lmscript --check.

The hello index uses one tab-separated name and one-sentence description per line. The autorun index uses a tab-separated name, description, and absolute URL per line. The CLI fetches these fixed index URLs and resolves names from their contents. lmctl quickrun remains a deprecated alias that resolves its older scripts from /quickrun/; keep those URLs and that catalog intact.
