# Tools documentation from public examples

Public examples are the authoring source. The website imports a pinned public Git commit, renders semantic pages with an executable lmhtml program, then applies the existing decoration and validation gates. Publication is a separate owner/mono operation. This pilot changes no tool implementation and does not deploy.

## Ownership and layout

Each public tool repository owns these inputs:

```
examples/manifest.json       versioned per-tool configuration and example inventory
examples/<slug>.lms          exact runnable source, not a website rewrite
examples/...                optional inputs, when the importer supports their packaging
# Existing gallery outputs may remain in docs/images/ to avoid duplication.
docs/images/<slug>.png      checked-in expected preview with documented provenance
LICENSE                     source/example licence
```

The lmvideo pilot adds only a manifest to the public lmctl-ai/lmvideo repository. It imports three existing scripts and their existing README gallery PNGs: org-chart-grid, confusion-matrix and symlog-outlier. The private source peer has no role in the importer. A manifest is an explicit publication inventory, not permission to scan or execute arbitrary repository files.

Website layout:

```
scripts/tools/pull-tools.py          fetch, validate hashes/policy, stage and replace
scripts/tools/example-page.lms       executable DOM template for index and detail pages
tools/<tool>/skill.html              authored skill, kept outside importer ownership
tools/<tool>/index.html              authored overview or existing decorator fallback
tools/<tool>/examples/index.html     generated example index
tools/<tool>/examples/<slug>.html    generated detail page
tools/<tool>/examples/img/*.png      byte-exact upstream previews
tools/<tool>/examples/source/*.lms   byte-exact upstream scripts, for source provenance
tools/<tool>/examples/source-lock.json  input commit and SHA-256 inventory
```

An examples page is a nested book page, already supported by check.lms; its lowercase slug is not a top-level page role. The decorator adds Examples to the tool navigation. Each detail page includes the title, task, command/output pair, preview with descriptive caption, raw pinned GitHub source link, autorun caption and full escaped script. The index links every selected detail page. Existing authored skills/tutorials/reference pages remain independent and are never replaced by this importer.

## Manifest version 1

The implemented schema is validated by pull-tools.py and its offline policy tests. Unknown fields are reserved for additive future metadata; unknown schema versions fail.

| Field | Type and rule |
| --- | --- |
| version | Integer 1 |
| tool | Lowercase tool slug; must equal CLI argument |
| repository | Exactly https://github.com/lmctl-ai/TOOL, a public repository |
| title, description | Nonempty text for the index |
| licence | MIT in the initial audited pilot policy |
| examples | Array of 1–100 example objects; output index sorted by slug |
| examples[].slug | Lowercase letters/digits and single hyphens; unique; index reserved |
| title, description, alt | Nonempty plain text, escaped by the lmhtml program |
| script | Exactly examples/SLUG.lms |
| script_sha256 | SHA-256 of the exact UTF-8 source bytes |
| image | Repository-relative PNG path; regular tracked blob, no symlinks/traversal |
| image_sha256 | SHA-256 of exact preview bytes; PNG below 30000 bytes |
| stdout | Captured stdout, or the explicit display label (no stdout) when empty |
| licence | MIT for this example in the initial policy |

See the live [lmvideo manifest](https://github.com/lmctl-ai/lmvideo/blob/b91247c3d92e10dce15c2d5ce3ee4a0e0eedcebd/examples/manifest.json) for a complete executable input. Text fields on individual examples are capped at 4000 characters; each imported blob is capped at 153600 bytes. The existing contract validates intrinsic PNG dimensions, markup, links and total HTML size after decoration. No upstream HTML or JavaScript is imported.

A licence identifier is an author assertion, not a licence audit. This pilot accepts only MIT examples/previews whose ownership was checked. A later policy extension must explicitly allow the relevant licences, carry required attribution/licence text and test its display before onboarding CC-BY, OFL or other licensed assets. Font licence rules still apply to copied font files; a screenshot alone does not grant redistribution of its inputs. Do not silently assume all files inherit the root licence.

Version 1 intentionally selects self-contained examples. It does not fetch arbitrary dependent assets, rewrite scripts, resolve includes, execute examples or generate previews on the website. For a tool needing such inputs, first define a bounded files/hash inventory and autorun-compatible packaging in a new tested manifest revision. Do not display a successful autorun for a script whose assets are unavailable from a clean directory.

## Pull on demand and optional notification

```
npm run pull:tools -- lmvideo
npm run pull:tools -- lmvideo --ref b91247c3d92e10dce15c2d5ce3ee4a0e0eedcebd
npm run decorate:tools
npm run check:tools
```

Use a full 40-character commit SHA, a tag or branch; abbreviated object IDs are not remote fetch refs. main resolves once per invocation. For an offline/repeatable import use --source /path/to/public-checkout --ref FULL_SHA: the importer reads committed Git blobs, ignoring dirty working files. It does not depend on a machine-specific path or a private peer. Ordinary public HTTPS Git reads need no token.

The importer uses a temporary shallow fetch and checks every selected tracked blob and hash before rendering. It reads the manifest from that same commit. Raw URLs embed the resulting full commit, not main; source-lock.json records the input manifest/template hashes. This lock is generated provenance, not a fetch of mutable latest content. Run the normal gates before committing generated pages and lock together.

No dispatch is required for correctness. A daily mono.lmctl job or operator can run pull:tools for the public tools inventory, inspect the resulting diff, run the gates and commit changed outputs. The pilot adds no scheduler and no automatic rendering/publication workflow. Deploy remains separate. The tools publisher and tools/memory check workflows were found to retain push triggers in this checkout; they are now workflow_dispatch-only to match the owner's manual-only policy. The old automatic-push statements in historical guides no longer describe these workflows.

Optional acceleration, not implemented in this pilot: a tool's manual workflow requests a website workflow_dispatch (or, after a deliberate policy amendment, repository_dispatch with type tools-examples-updated), carrying only an allowlisted tool slug and ref. The receiver uses this same pull command and never executes caller-provided commands or accepts arbitrary URLs. GITHUB_TOKEN in another repository cannot normally dispatch to the website. Use a narrowly installed GitHub App or fine-grained token with the target permission for notification only; never add credentials just to read public examples. No token should enter the manifest, generated page, URL or lock. Coalesce repeated notifications by resolved commit.

## Template as code

example-page.lms is a real LMCode program declaring cli="lmhtml" install="github:lmctl-ai/lmhtml@v0.7.4". The Python importer handles Git, policy and file staging; it contains no HTML templates. The program owns semantic page construction and the index, using:

- html.parse for a fixed semantic main/h1/p skeleton;
- Doc.select and NodeList.at for structural insertion targets;
- Node.replace_with and Node.insert_before for escaped text, command/output, preview, source and links;
- Node.remove to remove its temporary structural insertion point;
- html.load_dir, Doc.path and Node.text to construct index links from the generated detail pages;
- Node.outer_html and html.save for output; source text is read at compile time and supplied as a string literal, never interpolated as executable code.

The template HTML literals are program code, not a text file containing replaceable tokens. All manifest/source values are escaped before becoming markup, including script text containing closing tags. The template uses no authored class, style, div, inline script or event attributes. The existing decorator still owns the common head/navigation/footer, escaping, PNG dimensions, source preservation and normalization. A shared parser instance now supplies both first/second command-token lists in check/decorate, avoiding redundant Doc allocations: adding this book otherwise exhausted lmhtml's existing 4096-document arena during the whole-site gate. Existing source-preservation/self-tests remain the regression gate.

The template pins lmhtml v0.7.4 exactly and resolves the binary through dsl_cli from that declaration, using the compiler's checksum-verified host cache. The source lock records renderer version/binary hash and compiler version, with no local paths. Upgrading the template host requires regenerating and reviewing the pilot plus all policy/contract tests. Decoration still follows the site's existing @latest shared host; record its version in the check log and use the same cached/release binary for byte comparisons. The lock does not claim a future compiler/decorator produces identical serialization. There is no platform-dependent image recompression.

## Minimal copy-button contract amendment

Keep the source markup plain. The only allowed script is at most one head element, exactly:

```
<script src="/tools/lmctl-copy.js" defer></script>
```

No inline text, alternate URL, extra attribute, duplicate or other script is permitted. Classes/styles/data attributes remain forbidden in source pages. The decorator injects this script only for importer-generated detail pages carrying the generated ownership comment and a kbd command. The shared script recognizes pre > kbd directly and copies the command text, excluding adjacent samp output. Existing class-based consumers outside tools continue working; no new source classes are required. Buttons, helper classes and styling created at runtime are progressive enhancement by that one trusted same-origin script. Without JavaScript the command remains selectable and readable. The tools publication inventory maps the single canonical static/js/lmctl-copy.js file to /tools/lmctl-copy.js, within its existing owned prefix; no copied source file or separate asset deployment is required. source-lock.json stays a checked-in provenance file, excluded from static publication like book.json.

Negative fixtures cover wrong source, inline code, missing defer, extra attributes and duplicates; an isolated positive self-test verifies decoration/check. The source-only checker does not run browser JavaScript or claim to be a CSP/security sandbox.

## Showcase web pages, external render store and role allow-list

For rich visual hosts such as lmvideo, the demos, examples and 32-scene Blender and three.js showcase benchmark live on web pages under lmctl.com/tools/lmvideo/ rather than as large file galleries committed inside the public GitHub repository. This keeps the public lmctl-ai/lmvideo repository lean while allowing richer presentation on pages we control:

1. Lean public repository layout: lmctl-ai/lmvideo tracks examples/*.lms and examples/showcase/bench-NN-SLUG.lms, examples/manifest.json and examples/showcase/manifest.json recording expected-output SHA-256 hashes, captured stdout, feature witnesses and asset licences, plus a short README.md with a few compact preview PNGs under 30000 bytes and prominent links to lmctl.com/tools/lmvideo/showcase.html and lmctl.com/tools/lmvideo/examples/. Full-resolution renders, side-by-side comparison PNGs and encoded MP4 or WebM videos are produced into the website build or its asset store rather than committed in bulk to Git.
2. Showcase template as lmhtml code and scoped role allow-list: alongside scripts/tools/example-page.lms, the showcase generator scripts/tools/showcase-page.lms is an executable lmhtml program that builds tools/TOOL/showcase.html and optional showcase-TOPIC.html pages from examples/showcase/manifest.json. Rather than weakening the plain-tag contract globally across skill.html and prose roles, scripts/tools/roles.lms and scripts/tools/check.lms extend the contract specifically for the showcase role and importer-generated examples pages via an explicit allow-list:
   - Copy controls: head may include the single deferred /tools/lmctl-copy.js script to hydrate per-example lmctl autorun commands in pre and kbd blocks.
   - Embedded video: figure elements on showcase and examples pages may contain a video element with controls, loop, muted, playsinline, preload, poster, width and height attributes plus source children for video/mp4 and video/webm.
   - Side-by-side image comparisons: figure elements on showcase and examples pages may hold two img children, such as a CPU raster preview beside a Cycles path-traced render or an AOV pass beside a final composite, paired with one descriptive figcaption and styled by child selectors in /tools/style.css without div wrappers.
   - Scoreboard and per-scene metadata: semantic table markup renders the Tier 1 through Tier 3 showcase scoreboard, linking each scene to its reference description, feature witnesses, CPU render time and runnable script page.
3. Render generation, asset storage, page-build fetching and cache determinism:
   - Where renders are generated: website HTML lint and check steps never run scene scripts or renderers. Fast 2D and Tier 1 raster scenes run in mono.lmctl or local operator staging against the pinned lmvideo release binary; heavy 3D raster animations and Tier 2 or Tier 3 Cycles scenes run on mono.lmctl CPU workers, manual workflow_dispatch benchmark jobs or local staging.
   - Where renders are stored: the render harness writes verified media to build/tools-media/TOOL/ and publishes content-addressed objects under the website S3 and CloudFront prefix /tools/TOOL/media/SLUG-HASH12.EXT with immutable cache headers, keeping multi-megabyte clips and high-resolution renders out of Git history.
   - How the page build fetches and verifies media: pull-tools.py reads the pinned public commit and manifest, resolves each preview or video from the local build/tools-media/TOOL/ cache or the /tools/TOOL/media/ store, and verifies its exact SHA-256 digest and intrinsic dimensions or container metadata against manifest.json before running example-page.lms or showcase-page.lms. Any missing object or digest mismatch aborts the import before staging.
   - Cache and determinism: render cache entries under build/showcase-cache/TOOL/ are keyed by the SHA-256 of the lmvideo binary hash, lmscript compiler version, script hash, asset-lock hash and render preset. CPU raster stills are byte-deterministic per architecture; Cycles renders fix the Sobol seed, sample count and denoiser configuration; encoded MP4 and WebM clips are gated on composited PNG frame hashes plus ffprobe stream checks while pinning the published media object SHA-256 in source-lock.json.

## Stale pages, staging, caching and failure modes

The importer owns only tools/TOOL/examples/ and refuses a pre-existing book without source-lock.json. Existing Python-generated books require an explicit migration; no implicit deletion of authored books. A successful import builds a fresh subtree, then swaps staged directories on the same filesystem, retaining the old directory for rollback until installation succeeds. Removing a manifest entry removes its old page/source/preview on the next successful import. Author content outside that subtree survives. A leftover .examples-import-new or .examples-import-old causes a refusal for operator inspection. A process kill between renames may temporarily leave the destination absent; the backup must be restored before publication. Do not run concurrent imports for the same tool.

There is no persistent Git cache in the pilot: each online pull resolves/fetches once into temporary storage. The existing checksum-verified lmscript host cache remains in use. A future Git/blob cache should be keyed by repository+commit and sha256 and verified on every read; timestamps, local paths, network headers and fetch times must never enter output. Re-running pull followed by decorate/check with the same source/compiler/host must produce the same final bytes. The importer deliberately rebuilds so corruption and stale files are repaired; it does not promise unchanged file mtimes. No generated content can supply a shell command to the importer.

Failures are hard errors: unavailable ref/network, wrong tool/origin/version, missing/symlinked/traversing file, incorrect digest, oversized preview/source, non-UTF-8 source, duplicate slug, unsupported licence, renderer/compiler failure or unowned destination. Temporary failures leave the old book intact. No fallback to mutable main or stale cached bytes. Final gate failure blocks committing/publishing the proposed new pages; restore the prior lock/book or fix the upstream manifest. The generated skill link and new tool index are supplied in this pilot because lmvideo had no existing tools section.

## Verification and next tools

Pilot source: public lmvideo b91247c3d92e10dce15c2d5ce3ee4a0e0eedcebd. Three selected original programs were run successfully in separate empty directories; stdout was captured into the public manifest. Imported previews remain the original upstream gallery files, not falsely described as new website renders. The three exact pinned lmctl autorun commands were also executed in fresh directories: all exited 0, stdout matched the manifest and all three resulting PNG hashes matched their upstream previews. Chromium verified copying the command without samp, button placement and image loading, and no horizontal page overflow at 1280-pixel light and 360-pixel dark viewports. Recheck these behaviors when changing an example's install/asset behavior.

The acceptance commands are npm run test:pull:tools, npm run decorate:tools, npm run check:tools, npm run check:tools:selftest, npm run build:memory-index and npm run check:memory. Repeat an offline pinned pull and decoration and byte-compare the whole lmvideo subtree. Also test stale-file deletion and bad-hash rollback. No deploy-tools.sh, AWS calls, scheduled job or notification dispatch is needed or run for this pilot.

Next onboarding order and engineering estimates, excluding new artwork/tool fixes:

1. lmdraw: approximately half a day to select three self-contained diagram scripts, capture stdout, prepare upstream PNGs below the limit and add the manifest. Its existing website book requires an explicit ownership migration before using this importer; preserve authored pages.
2. lmcad: approximately one day for asset/font independence, permissive example provenance, image preparation and an explicit old-book migration. Keep OCCT binary/relink duties separate from publishing example scripts/previews.
3. lmhtml: approximately half a day for input HTML fixtures and screenshot previews; expect the versioned dependent-files packaging extension before promising clean-directory autorun. Text/HTML expected-output variants need a template branch and contract tests, rather than inventing PNGs for every example.
