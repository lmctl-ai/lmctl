# lmcad tool-book dogfood feedback — 2026-10-21

## Findings

- The public lmcad guide uses lmcad --schema and lmcad --schema --json, but the released v0.1.3 binary accepts --dsl-schema and --dsl-schema --json. The book skill should treat the release protocol as authoritative and send this mismatch to the tool owner. Proposal: update the guide and signature example to the released command names before the next book release.
- The repository has no examples/README.md or checked-in render previews. The explicit examples list and rendered output path in tools/lmcad/book.json let the generator build still-life.html anyway. Proposal: lmcad should add a short examples manifest and expected-output checks to test.sh; keep explicit book metadata as the fallback for repositories with no generated example catalog.
- The lmcad example URL in book.json returns 404 until the book is published. The pre-publication provider run can use the local generated page/source, but the prompt includes an unavailable public URL. Proposal: dogfood with the local generated example path and verify that the URL resolves after deployment; do not treat a pre-publish 404 as a release failure.
- The source examples declare a local schema path, while generated book scripts rewrite that declaration to cli plus install. The rewrite was needed to render in a clean scratch directory. Proposal: keep this transformation explicit in the book skill and validate the exact generated source before using it as evidence.
- The scratch command initially omitted homepage/index.html, so the checker reported broken links to /. Copying homepage/index.html to the scratch root made the full tools check pass. The skill now says to do this.
- The skills checker rejected the valid autorun example because the checked-in lmctl subcommand list omitted commands with optional arguments; the refresh script expected two spaces after the command name and skipped autorun [example] and hello [name]. Proposal: parse the optional argument token and validate the refreshed vocabulary against the current command-list section. This has been fixed and the skills check passes.

## Evidence

- Repository: https://github.com/lmctl-ai/lmcad at commit 3ec7c9626561a8393821c4d1643c5a2333223b4a; release lmcad 0.1.3.
- Verified --version, --dsl-schema --json byte identity with schema/lmcad.dsl.json, and successful fresh-cache install/render via LMSCRIPT_TOOL_CACHE.
- Scratch book page and solo/trio scripts generated under /tmp/lmcad-dogfood.DrRsSR/tools/lmcad. Scratch decoration and full tools checker passed after adding homepage/index.html and the existing skills tree.
- Solo provider run completed and produced plate.lms, build/mounting_plate.png, and build/mounting_plate.stl under /tmp/lmcad-dogfood-runs/solo.
- Trio ran through Claude Lead, Gemini Coder (gemini-3.8-flash-high), then Codex Reviewer (gpt-6.1-sol) through the Lead. Reviewer PASS: independently compiled byte-identical DSLB, reran lmcad successfully, confirmed PNG/STL byte-identical, two open holes, 3,076 STL triangles and 60×30×7 mm bounds; volume was 10010.147543844094 mm³ with 0.001 mm³ tolerance and all six plate bounds asserted. The reviewer noted the referenced simple-example URL still returns 404 before publication. The delivered PNG and STL are under /tmp/lmcad-dogfood-runs/trio.
