# lmhtml tool-book dogfood feedback — 2026-10-21

Merged into the skill on 2026-10-22.

## Findings

- The publish skill says to add curated entries to autorun/examples.json. The current repository reads scripts/autorun-examples.json and generates the catalogs with node scripts/build-onboarding-catalogs.mjs. Proposal: name the actual source file and generated outputs in the skill before telling teams to edit the catalog.
- The real-run section invokes lmctl autorun, but the @lmctl-ai/lmctl 0.2.373 CLI used in the initial probe had no autorun command; lmctl quickrun accepts a hosted URL or local LMScript file and executes the provider-session script. Proposal: either specify the autorun-enabled CLI version and installation steps, or use lmctl quickrun in the command examples.
- The scratch example calls scripts/tools/run.sh check tools/NAME. run.sh passes its argument to lmhtml clean --check as a single page, so a directory fails with “cannot read tools/NAME”. Proposal: use run.sh check for the full tree, or loop over each HTML page when checking one tool in isolation.
- The scratch setup copies scripts/tools but then directs the operator to run the onboarding catalog builder. The root scripts/build-onboarding-catalogs.mjs file and its autorun/ and helloexample/ inputs are not included in that copy, so the documented scratch command cannot run there. Proposal: copy those inputs too, or run the catalog gate from the website checkout after overlaying the scratch-generated files.
- The scratch setup omits lmscript-site/, but tools/lmscript/index.html links to /lmscript/guide.html there. The scratch full-tree check reports a broken link until that deployed content tree is copied. Proposal: include lmscript-site/ in the scratch copy list.
- A get_started.html page is accepted by the page contract but checked under the guide role. A first h2 such as Overview, Introduction or Getting started is required. Proposal: add that heading rule next to the get_started.html filename rule.
- Generated quickrun sources append a call that uses the source variable out. The source examples must declare out and pass it to savedsl; otherwise the generated file fails with “Undeclared variable 'out'”. The lmdraw examples show this pattern, but the publish skill does not state it. Proposal: require out = ARGV.len() > 0 ? ARGV[0] : "build/name.dslb" followed by savedsl(program, out) in examples intended for the book generator.
- The example generator runs each source in a clean temporary directory. Examples that read tests/fixtures from the repository fail there because those fixtures are not copied into the quickrun. Proposal: state that every example must create its own synthetic inputs or explicitly bundle all required inputs.
- A fresh LMSCRIPT_TOOL_CACHE made the public GitHub release lookup hit an unauthenticated API rate limit (HTTP 403). Setting GITHUB_TOKEN from the authenticated gh CLI allowed the install to proceed and the binary checksum was verified. Proposal: include an authenticated release lookup setup in the fresh-cache probe and mention the API limit diagnostic.
- The book generator requires a PNG preview even when the host output is text or HTML. lmhtml writes reports and templates, so we used compact, labeled preview cards showing their checked outputs. Proposal: explicitly allow an expected-output preview for non-image tools, or document the card format and keep its caption clear that it visualizes text output.
- The visual gate says to open pages at desktop and mobile sizes but gives no browser workflow. Proposal: provide a short Playwright command for the overview and examples index at 1280 px and 360 px, with screenshots retained for review.

## Evidence

- Tool repository: https://github.com/lmctl-ai/lmhtml at commit 186d5108b830319e9ca9cc65a93c51df0e332b2e; released host lmhtml 0.7.3. The tag/version guard, --version, --dsl-schema --json and --dsl-signatures all passed; the embedded schema matched schema/lmhtml.dsl.json byte-for-byte.
- The tool test script passed all 67 checks. All five generated example scripts ran from an empty working directory through lmctl quickrun with a fresh LMSCRIPT_TOOL_CACHE; the cache contained the verified v0.7.3 Linux binary and each report matched its expected output.
- Scratch site: /tmp/lmhtml-publish-dryrun.qbLTBW/site. All 12 lmhtml HTML pages passed individual contract, lint and clean checks. Desktop 1280 px and mobile 360 px screenshots of the overview and examples index were inspected; headings, links, images and code fit without horizontal clipping.
- The full scratch-tree checker passed after using the correct scope-specific page checks; the main website check:tools gate passed with lmscript-site present.
- No release was cut: the existing v0.7.3 release has all required flags, schema bytes and the guarded tag/version CI check.

## Publication review corrections

- Verified that installed lmctl 0.2.378 supports autorun and retains quickrun as a deprecated alias. The quickstart now names that version and uses hosted script URLs, so it works outside a website checkout.
- Replaced drawing-specific instructions in the shared generators with task/output wording and regenerated only lmhtml artifacts. The book identifies preview cards as illustrations of expected text or HTML output, and no longer claims lmhtml examples require SVG fixtures or fonts.
- The pinned upstream check-links PNG repeats both findings. Its page caption now explicitly identifies the duplication; the executable report and tutorial correctly contain two findings.

## README workflow feedback — 2026-10-22

- The README section says to record the hero idea and gallery in the tool's book.json, but the book.json used by the fan-out workflow lives in the separate lmctl website repository at tools/NAME/book.json, not in the public tool repository. Proposal: name that path and tell the operator to update their own website clone.
- The section says to regenerate three-to-six "actual rendered examples" from examples/*.lms, but text-oriented tools do not naturally produce image files. We regenerated each lmhtml report with the released host, then used an lmscript/lmdraw card renderer to turn the actual report text into the gallery PNG. Proposal: explicitly allow report cards generated from real text/HTML output and require the render script to run the source examples first.
- The recipe does not define how render.sh finds versioned release binaries or diagnose a fresh-cache GitHub API limit. This run needed GITHUB_TOKEN after the unauthenticated release lookup returned 403. Proposal: document the lmscript cache layout or a supported host-resolution command and include the authenticated-cache setup for CI/README rendering.

## Automatic tool schema workflow feedback — 2026-10-22

The new automatic install declaration works for consumers, but repository test scripts also need to put the freshly built host directory first on PATH. lmscript then selects that binary when its version matches instead of downloading the public release, allowing tests to exercise the local build. Proposal: state this PATH rule in the recipe for tool authors who compile examples against uncommitted host changes. Keep schema-file input as one clearly labeled compatibility test; SDK authors still need the schema-author workflow.
