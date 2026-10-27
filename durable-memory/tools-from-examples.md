# Tools documentation from public examples

Public examples are the authoring source. The website imports a pinned public Git commit, renders semantic pages with an executable lmhtml program, then applies the existing decoration and validation gates. Publication is a separate owner/mono operation. This pilot changes no tool implementation and does not deploy.

## Separation of concerns: content in the tool repo, presentation on the website

A tool repository (for example lmctl-ai/lmvideo) owns content only: example and demo sources, their metadata (titles, descriptions, ordering, tags, captions, alt text, expected outputs and hashes) and small preview media, all described by examples/manifest.json. It contains no HTML, no styling, no site layout and no generated-page paths, and it never needs to know how pages are built.

lmctl-ai/lmctl owns presentation and consistency: the lmhtml templates, navigation, styling (tools/style.css), page roles, the checks and the mapping from manifest ids to URLs. It never hand-edits tool content; to change content, change the tool repository and pull again.

The contract between them is the versioned manifest schema, scripts/tools/content-manifest-v1.schema.json (JSON Schema 2020-12). pull:tools validates every manifest against it before reading any other file. Every error names the offending tool repository file at the pulled commit and the JSON path, for example:

```
pull:tools: lmctl-ai/lmvideo@b91247c3d92e:examples/manifest.json: invalid content manifest:
  $.examples[0].title: length must be 1..4000
  $.examples[0]: unknown field "style" (presentation belongs to lmctl-ai/lmctl, not the content manifest)
```

The only presentation-adjacent fields allowed are semantic ones: kind (image, video, text or interactive), featured (README storefront selection) and tags. The template decides how each kind looks. The only website knowledge a tool repository uses is the stable permalinks /tools/TOOL/ and /tools/TOOL/BOOK/SLUG.html for README links, which the website keeps stable as part of this contract.

A repository source path identifies content, not a site layout. Code samples may contain HTML/CSS when teaching those formats; the website displays their bytes as escaped code, never as presentation. A reserved interactive kind cannot supply arbitrary HTML, JavaScript, iframe URLs or widgets; it requires a separately reviewed website renderer and schema revision. Historical website-authored chapters are explicitly migrated upstream before becoming importer-owned, rather than maintained as a second content copy.

## Ownership and layout

Each public tool repository owns these inputs:

```
examples/manifest.json       versioned per-tool configuration and example inventory
examples/<slug>.lms          exact runnable source, not a website rewrite
examples/...                optional inputs, when the importer supports their packaging
# Only a few small README preview pictures stay tracked.
docs/images/<slug>.png      compact optional README picture, not a bulk render gallery
LICENSE                     source/example licence
```

Target ownership: the website owns demo pages and heavy render assets; the public tool repository owns source, manifests and expected-output hashes. The existing three-image pilot is a compatibility baseline, not the long-term media storage model.

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

## Versioned schema and pull diagnostics

The implemented contract is the website-owned [content-manifest-v1.schema.json](../scripts/tools/content-manifest-v1.schema.json). The pull command validates decoded JSON against it before compiling a page template or replacing any generated files. It uses a dependency-free interpreter for the schema's bounded vocabulary: object/array/string/integer/boolean types, required/properties/additionalProperties, local definition references, constants/enums, patterns and size bounds. This is not a general-purpose JSON Schema implementation; unsupported keywords or reference forms fail closed. Repository identity, unique slugs, script/slug correspondence and the audited MIT licence policy are additional semantic checks. The source lock records schema_sha256 as well as source/template/compiler/host provenance. Schema updates therefore produce a visible, reviewable lock change.

Root and example objects are closed: HTML snippets as page structure, CSS/layout settings, classes, selectors, template names and output paths have no schema fields and are rejected. Existing plain-text descriptions/code remain data and are escaped. Optional example tags, featured and captured_with are semantic metadata only; accepting them does not imply that the future book/README builder has shipped. Version 2's mixed-media/group schema must be implemented and reviewed separately before any version-2 manifests are accepted.

Errors name the public repository and exact source commit/file, followed by a field path, for example:

```text
lmctl-ai/lmvideo@COMMIT:examples/manifest.json:$.examples[0]: unknown field "layout"
lmctl-ai/lmvideo@COMMIT:examples/manifest.json:$.examples[0].script_sha256: string does not match the required pattern
```

Malformed JSON includes line and column; invalid encoding identifies the source file. Missing blobs and hash/preview failures also name the offending repository input, not merely a temporary website path. These validation failures exit nonzero before publication and retain the previous imported tree. Fix the owning tool's manifest/source and repull; never patch generated website text to hide an upstream content error.

## Manifest version 1

The schema file scripts/tools/content-manifest-v1.schema.json is the definition; pull-tools.py validates it with a dependency-free built-in validator, and the offline tests also check the schema file with the reference jsonschema package when it is installed. Unknown fields are errors (additionalProperties false), so a presentation key such as class, style or layout is rejected with a hint, and new content fields arrive through a schema revision. Unknown schema versions fail. Optional semantic fields in version 1: kind (image, video, text or interactive), featured (boolean, at most 6 per manifest), tags (up to 12 lowercase slugs) and captured_with (the host and version used to capture stdout and preview, for example lmvideo 0.1.26).

| Field | Type and rule |
| --- | --- |
| version | Integer 1 |
| tool | Lowercase tool slug; must equal CLI argument |
| repository | Exactly https://github.com/lmctl-ai/TOOL, a public repository |
| title, description | Nonempty text for the index |
| licence | MIT in the initial audited pilot policy |
| examples | Array of 1–100 example objects; output index sorted by slug |
| kind, tags, featured, captured_with | Optional primary output kind, semantic tags, storefront selection boolean and capture environment description; no layout meaning |
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

This is the owner-approved next design, not an already implemented importer feature. At website commit 5039fa8, version 1 reads tracked compact PNGs; external-media fetching, a showcase role, video validation, render jobs and showcase-page.lms do not yet exist. This amendment changes documentation only. Retain existing preview references until their verified web replacements are available; do not rewrite Git history or bulk-delete galleries during this amendment.

The public lmvideo repository should contain examples/*.lms, examples/showcase/bench-NN-SLUG.lms, their manifests and expected-output hashes, plus a short README with a few small pictures and links to the website. Full-resolution stills, side-by-side comparisons, videos and the visible Tier 1–3 scoreboard belong to lmctl.com/tools/lmvideo/. Machine-readable scene status and measurement provenance remain with the public manifest so the scoreboard is reproducible, not hand-authored website text. The reference side is a written description/link, never a copied third-party render.

### Executable templates and the scoped showcase contract

Add scripts/tools/showcase-page.lms as a pinned lmhtml program using html.parse, Doc.select, Node.replace_with, Node.insert_before, Node.remove, Node.outer_html and html.save. It constructs showcase.html and optional showcase-TOPIC.html pages with the tier table, measured feature/status details, reference links, media and per-scene run commands. The example template gains a versioned media branch for individual showcase scenes. Python remains responsible for validated data, Git and media transport; no Python string templates or executable manifest expressions.

Add showcase=Showcase to roles.lms. Rich permissions apply only to that role and nested example pages explicitly classified as showcase in a validated local manifest/lock. An HTML ownership comment alone must not grant permissions. Ordinary skill/tutorial/prose pages keep the existing contract and budgets; no broad class/style/script/div exception. Showcase additions have an explicit allow-list:

| Element or feature | Permitted form and validation |
| --- | --- |
| Copy controls | At most the existing exact deferred /tools/lmctl-copy.js in head, no inline code or extra attributes. pre directly containing kbd is the marker; samp is excluded from copied text. No authored classes or data attributes are needed. |
| Video | One video inside a figure; controls, loop, muted, playsinline, preload=metadata, poster, width and height only. One or two source children with src and exact video/mp4 or video/webm type; fallback text/link. No autoplay, event handlers, iframe or arbitrary embed. |
| Side-by-side comparison | One figure with one or two images or one video, plus exactly one descriptive figcaption. Element/child selectors in the shared stylesheet provide layout; no div, inline style or per-page CSS. Each image has accurate alt/dimensions. |
| Scoreboard | Existing semantic table markup linking scene IDs, tier/status, feature witnesses, pinned binary/source and measured CPU time/RSS. PLANNED scenes show no invented PASS or timing. |
| Media URLs | Same-origin /tools/TOOL/media/SLUG-FULL_SHA256.EXT only, with an exact expected digest, dimensions, media type and byte budget in the lock. No arbitrary remote URL/redirect or traversal. Small README thumbnails retain the current PNG cap; larger showcase media receive a separate reviewed budget. |

Checker fixtures must prove ordinary roles still reject video/rich media, a forged ownership comment cannot enable it, unsupported attributes/URLs fail, and valid side-by-side/video/scoreboard pages pass. Decorate/check must validate a complete local media index offline. They never execute scene scripts, download a renderer or contact the asset store.

### Book catalogue and README storefront policy

README policy: README.md is a short storefront with at most six representative pictures and links to the web books; it is not the catalogue. For lmvideo this supersedes the older README-is-the-demo-page rule. The complete teaching material lives under /tools/TOOL/ as multi-page books, with heavy media in the website build/asset store.

The version-2 content manifest has an ordered groups array, one group per book. A group contains semantic id, title, summary, content kind and ordered chapters; each chapter contains id, title and the mixed-media blocks described below. Group order determines the tool's book catalogue, chapter order determines contents and previous/next links, and block order determines the page. No sorting by title or filename may override authored order. Every book gets its own index and each chapter its own stable page; standalone showcase.html is an optional landing/compatibility link to the showcase book, not the full book.

| Book | Default and authorship | Proposed web location |
| --- | --- | --- |
| Examples book | Required default for each onboarded tool, generated from its public examples/ manifest inventory. Groups/chapters collect related runnable examples with authored explanation and the four block kinds; existing example slugs and links are preserved. No empty catalogue masquerading as a teaching volume. | /tools/TOOL/examples/index.html and /tools/TOOL/examples/CHAPTER.html |
| Getting started | Optional hand-written chapter text and selected runnable examples for an introductory learning path. Publish only when authored content is available; until then the overview/skill links to a first examples chapter. | /tools/TOOL/getting-started/index.html and chapter pages |
| Showcase book | Optional for visual tools; lmvideo's benchmark scenes are grouped into tier/technique chapters with the shared scoreboard and feature evidence. Rendered scene detail links and media remain available within those chapters. | /tools/TOOL/showcase/index.html and chapter pages |
| Guide and Reference | Optional hand-written structured groups: conceptual guides and task/API reference, respectively. Reuse source/code/media references rather than copying example scripts. Existing authored guide/reference pages remain usable until explicitly migrated. | /tools/TOOL/guide/index.html or /tools/TOOL/reference/index.html and chapter pages |

Pinned book-index.lms and book-chapter.lms render every group with shared lmhtml block functions. The per-tool overview lists available books; each per-book index provides its own contents and summary. Chapter pages provide contents, previous and next links within that book; first/last chapters omit unavailable links, and a one-chapter book still has an index and contents navigation. Do not force readers through unrelated books. Nested discovery, role checks, stable cross-links and redirect/compatibility handling must be added to decorate/check before migrating current URLs. This is the planned model; today's example importer and older Python books are not silently changed by this documentation amendment.

A chapter or example content entry may set featured=true and point to a verified compact featured_image media reference with alt/caption and a semantic chapter/example id, whose link the website resolves. Default featured is false. Select only explicitly featured entries, in manifest group/chapter order, deduplicate reused image digests, and reject more than six selected representatives rather than silently truncating. A featured entry must have a usable picture and resolvable content reference; status or image hashes must not be invented for unimplemented scenes. If none are featured, publish textual book links without filling the README automatically. The short README may keep these few thumbnails locally or use stable website thumbnail URLs; high-resolution stills/videos stay out of its Git gallery. Generated README regions must preserve authored installation/licence text outside their markers. Feature selection changes do not remove chapters from the full books.

Use the existing nested example books and durable-memory/tool-book-feedback as migration evidence. In particular, the lmdraw feedback found four-column README grids overflowed mobile: use a compact one/two-column selection, check wide/narrow light/dark rendering, and ensure captions describe the exact pinned output. The new model keeps the useful existing book URLs while replacing Python string rendering with executable lmhtml templates one book at a time. Acceptance adds two groups with two chapters each, correct per-book contents/previous/next boundaries, README selection of zero/one/six pictures, rejection of seven, and preservation of non-featured chapters in their books.

### Books are ordered mixed-media chapters

A book combines explanation, runnable code, pictures and video within each chapter. An example listing is one useful view of its inputs, not the book's content model. Each version-2 content manifest group owns an ordered chapters array; each chapter has a stable lowercase id, title, optional summary and an ordered blocks array. Chapter and block order is authored array order, never alphabetical directory enumeration. Each block has a unique chapter-local id and exactly one of the four kinds below. The existing version-1 example inventory remains supported as the pilot input; the version-2 renderer and schema are planned, not implemented by this docs amendment.

| Block kind | Manifest fields | Consistent lmhtml rendering |
| --- | --- | --- |
| text | format is text or markdown; exactly one inline content string or bounded repository source path plus sha256. | Plain text becomes escaped paragraphs; Markdown goes through lmhtml's reviewed Markdown parser and then the page allow-list. No raw HTML escape hatch, embedded script or arbitrary resource loading. Chapter title is h1 and authored section headings start at h2. |
| code | language; exactly one inline source or pinned repository source path plus sha256; run contains literal argv tokens and a working-directory policy; expected contains stdout, stderr and exit_code, with optional output-file/media digest references. | Escaped source in pre/code, followed by the exact displayed run command in pre/kbd and expected output in adjacent samp with a newline separator. The shared copy button copies only kbd. Empty stdout is explicitly labelled as no stdout; stderr and nonzero expected exits are identified, not presented as successful stdout. |
| image | media reference to the full-digest media inventory; nonempty alt and caption; intrinsic dimensions are locked on the referenced media object. | A figure with img and figcaption, using verified dimensions and alt. A comparison is content, not layout: two ordered image blocks share a compare_group id, which states that they are meant to be compared; the template decides to render them as one two-image figure with one combined caption. Content order remains intact. |
| video | media references for supported MP4/WebM sources; required poster image reference; duration_seconds; nonempty descriptive caption; captions metadata describing timed tracks or an explicit no-audio declaration. | A figure with video, required poster and controls, preload=metadata, no autoplay; source children and verified duration/dimensions. Timed captions render as track children; a figcaption explains the clip and duration. Include a fallback link and readable transcript when speech or meaningful sound requires one. |

Example manifest fragment, with symbolic media identifiers resolved through the verified media inventory:

```json
{
  "version": 2,
  "tool": "lmvideo",
  "groups": [
    {
      "id": "examples",
      "title": "Examples book",
      "kind": "examples",
      "summary": "Draw diagrams, then animate them.",
      "chapters": [
        {
          "id": "diagram-to-animation",
          "title": "From a diagram to an animation",
          "blocks": [
            {
              "id": "explain",
              "kind": "text",
              "format": "markdown",
              "content": "## Draw the first frame\nStart with anchored boxes."
            },
            {
              "id": "run",
              "kind": "code",
              "language": "lmscript",
              "source": "examples/org-chart-grid.lms",
              "sha256": "FULL_SOURCE_SHA256",
              "run": {
                "argv": [
                  "lmctl",
                  "autorun",
                  "PINNED_RAW_SOURCE_URL"
                ],
                "working_directory": "empty"
              },
              "expected": {
                "stdout": "wrote build/org-chart-grid.dslb (images/org-chart-grid.png)\n",
                "stderr": "",
                "exit_code": 0
              }
            },
            {
              "id": "still",
              "kind": "image",
              "media": "diagram-still",
              "alt": "Seven organization-chart boxes joined by elbow connectors",
              "caption": "The initial frame."
            },
            {
              "id": "motion",
              "kind": "video",
              "sources": [
                "diagram-mp4",
                "diagram-webm"
              ],
              "poster": "diagram-poster",
              "duration_seconds": 8,
              "caption": "The same diagram reveals its connections over eight seconds.",
              "captions": {
                "no_audio": true,
                "tracks": []
              }
            }
          ]
        }
      ]
    }
  ]
}
```

This is schema illustration, not an executable pilot manifest: all symbolic hashes/URLs must resolve to valid committed inputs before use. For an audible clip, captions contains tracks with media, language, label and default fields; each media object is a hash-verified UTF-8 WebVTT file with text/vtt MIME type. Require a transcript text block or verified transcript reference for meaningful speech/audio. A silent animation may declare no_audio=true and use its descriptive caption instead of fabricating a timed track. Validate caption cue times against the declared/probed duration and allow at most one default track per language. Missing required poster, alt, caption, duration or caption metadata is an import error.

Extend the proposed showcase allow-list only for track inside video, with kind=captions, src, srclang, label and optional boolean default. The src must resolve to a locally verified same-origin full-digest WebVTT asset. No additional script, style or event attributes are needed. Standard prose roles keep their existing rules. A chapter containing rich media is explicitly classified by the validated book manifest/lock under the scoped showcase contract; an arbitrary path or ownership comment cannot confer that classification.

Add pinned executable book-index.lms and book-chapter.lms templates. The index builds a table of contents in authored order; each chapter renders blocks in order with the same reusable lmhtml block-rendering functions as example/showcase pages, plus previous/next and table-of-contents links. Output follows each group id: tools/TOOL/GROUP/index.html and tools/TOOL/GROUP/CHAPTER.html (examples retains its established location); add deliberate nested-book discovery and link/role handling to decorate/check before enabling it. Page roles describe permission and navigation, while block kinds describe content; neither requires per-tool generator code or JavaScript templates. Existing examples can be referenced by code/media ids without duplicating their source or renderer logic.

The public tool repository owns the chapter manifest and optional chapter Markdown/source files alongside examples; chapter prose is authored, not inferred from filenames. The website owns generated chapter pages and heavy media. A chapter edit invalidates that page/index through content hashes; a source/media edit invalidates referring blocks. Include ordered chapter/block records and template hashes in the build lock/cache key. Reordering blocks intentionally changes output bytes. Removing a chapter removes only importer-owned pages after a complete successful build; retain media referenced by other chapters or retained releases.

Acceptance for the future extension: a two-chapter fixture containing all four block kinds, an audible captioned clip and a silent clip; stable TOC/previous/next links; escaped source and Markdown sanitization; exact kbd/samp and command-only clipboard; poster, controls, no autoplay and a working caption track; failures for unknown block kind, missing media or duration mismatch; identical bytes on repeated offline builds. Running code to produce expected output remains a separately invoked reviewed render/test job, never part of book parsing or HTML linting.

### Books: one terminology (reconciled)

This section reconciles the two book descriptions above; where they differed, this wording applies.

- Book equals group. The version-2 manifest has one ordered groups array, one group per book (id, title, kind, summary, chapters), as in the book catalogue section. There is no separate books array.
- Chapter equals ordered mixed-media blocks. Every chapter, including those of the Examples book, is an ordered list of blocks of exactly four kinds: text (plain or Markdown), code (source, run command, expected stdout/stderr/exit code), image (media reference, alt, caption) and video (MP4/WebM sources, required poster, duration, captions or an explicit no-audio declaration). There is no special "example listing" chapter type. An example appears in a chapter as a code block whose source is examples/SLUG.lms (pinned by sha256), usually followed by its image or video block and surrounded by authored text.
- Rendering is uniform, through shared lmhtml block functions in book-chapter.lms. Text becomes escaped paragraphs or sanitised Markdown. Code becomes pre/code, then pre with a kbd and samp pair; the copy button copies only the kbd. Image becomes a figure with img and figcaption. Video becomes a figure with a video element (poster, controls, preload=metadata, never autoplay), its source and caption track children, and a figcaption.
- The version-1 example kind field (image, video, text or interactive) names an example's primary output, for selection and README use. Interactive is reserved and has no block kind or renderer until a reviewed design exists.
- Migration: the version-1 pilot inventory converts mechanically into one Examples group. Each example becomes a chapter with three blocks: description text, code with its run command and stdout, and image. The current examples/SLUG.html URLs therefore stay valid.
- Website side only: the manifest never names output paths. The site maps a group id to /tools/TOOL/GROUP/ and a chapter id to /tools/TOOL/GROUP/CHAPTER.html, and heavy media goes to /tools/TOOL/media/SLUG-SHA256.EXT. The README storefront policy is the one in the book catalogue section above.

### Manifest extension and production flow

The version-2 content manifest pairs the ordered chapters/blocks above with a typed media array: kind (image, poster, mp4, webm, captions or transcript), full sha256, byte count, dimensions, duration/frame count where applicable, MIME type, originating render-profile digest and caption/alt. URLs derive from the allowlisted tool/slug/digest; manifests cannot provide arbitrary fetch URLs. Store expected composited-frame hash lists separately from encoded-file digests. Add a bounded input-asset inventory and licence provenance for nonprocedural scenes. Do not silently accept version 2 through today's version-1 parser.

1. An explicitly invoked mono.lmctl job, manual workflow_dispatch benchmark worker or local operator checks out the pinned public source commit and renders with the pinned lmvideo binary. Heavy Cycles jobs are CPU only. Render execution is separate from website parsing/linting and runs reviewed source with bounded resources. Record the actual platform, ISA, compiler/renderer hashes, thread count, fonts, asset hashes, seeds/samples/denoiser and codec binaries, timings/RSS and feature witnesses. All 32 benchmark scenes remain PLANNED until measured.
2. Write outputs into untracked build/tools-media/TOOL/. Hash and inspect PNG dimensions or ffprobe metadata; compare expected results before promotion. A separately authorized owner/mono uploader publishes verified content-addressed objects into the website asset-store prefix /tools/TOOL/media/SLUG-FULL_SHA256.EXT with immutable caching. Public reading needs no token; uploading requires scoped publisher credentials kept outside manifests and generated content. No upload or job is created by this docs change.
3. The planned importer reads the public source/manifest at a resolved commit and obtains media from a verified local cache or the fixed same-origin HTTPS store. Enforce content length, timeout, MIME/container/dimensions and exact full SHA-256 before installing a cache entry. Refuse cross-origin redirects. Missing/corrupt objects abort staging and preserve the old pages; no silent latest fallback. A compact tracked README preview is optional compatibility input, not the source of bulk media.
4. Run the executable page templates against the verified local inventory, followed by decorate:tools and check:tools. Page locks record source commit, renderer/compiler/template hashes, media digests and render-profile identity; exclude absolute paths/timestamps. Publish verified assets before promoting pages that reference them. The public tool README links to those pages rather than accumulating renders in Git.

### Cache, determinism and retention

The render cache key is SHA-256 of a canonical record of script and all input hashes, binary/compiler hashes, architecture/ISA, thread/seed/sample/denoise settings, fonts, codec binaries and render preset. A hit may reuse a verified output, but it is not a measured fresh render and earns no new timing claim. Force-repeat acceptance bypasses the render cache. The media-byte cache is separately keyed by the full output digest and reverified before use.

Require equal repeated raster/frame hashes only in the pinned environment where demonstrated. Fixed Cycles seeds alone do not prove determinism; establish repeat evidence and document any justified numerical tolerance across CPUs or denoisers. Record composited PNG frame hashes and ffprobe stream checks separately from exact hashes of the published MP4/WebM objects. With fixed verified inputs and template/compiler/host binaries, repeated HTML builds must be byte-identical and their checks offline.

The media store has separate ownership from the HTML deployment manifest. Existing static-site.py does not support this external-media plan: extend inventory/checking and prefix ownership together before enabling it. A routine tools page sync must never delete remote media it did not inventory. Removing a page removes references; garbage collection is a separate retention-aware operation that preserves blobs referenced by retained page/release locks. Missing media should leave the previous published pages intact. Existing PNG caps and publication allow-lists stay unchanged until the showcase-specific tests and transport extension ship.

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

## Review amendments (ResearchOpus, 2026-10-26)

Reproduced on a fresh clone:

- test:pull:tools, decorate:tools, check:tools and check:tools:selftest all pass.
- A second pinned pull (--ref b91247c3d92e10dce15c2d5ce3ee4a0e0eedcebd) followed by decoration is byte-identical for the whole lmvideo subtree.
- html.load_dir returns paths sorted by name whatever the directory creation order (checked with six files created in shuffled order), so the index order is deterministic across filesystems.

Changes made:

- Attributes are set on nodes, not built as strings. example-page.lms now inserts bare img and a elements and sets src, alt and href with Node.set_attr, which escapes quotes and ampersands itself (checked). The regenerated pages are byte-identical; only template_sha256 in the lock changed.
- Text still goes through escaped() into fragments, because lmhtml 0.7.4 has no text or element constructors. Node offers insert_before, insert_after, replace_with (string), set_attr, remove and select, but no set_text or append.

Upstream lmhtml request, so templates need no escaping helper: Node.set_text(string) returning Node (escapes), plus Node.append(tag) and Node.prepend(tag) returning the new element. With those, the template becomes pure node construction. Pin the new lmhtml release and regenerate.

Open points (not blocking the pilot):

- Two generators. generate-example-book.py and sync-example-book.sh (Python string HTML) still own the existing books of lmblender, lmcad, lmdraw, lmhtml, lmpy, lmr and lmtorch (tools/TOOL/book.json). Each onboarding should migrate one of them to an upstream examples/manifest.json and delete its book.json. When the last one moves, remove generate-example-book.py, sync-example-book.sh and sync:tool-examples, so one importer remains.
- Preview drift. org-chart-grid.lms installs lmvideo@latest, while the other two pin v0.1.26. The page shows the stored preview and stdout, but lmctl autorun on the pinned raw URL still runs the newest lmvideo. Proposed additive v1 field examples[].captured_with, for example "lmvideo 0.1.26" (the host version used for stdout and preview), shown in the figcaption. Upstream examples should pin a release where byte-stable previews matter.
- Outputs beyond PNG. Superseded by the showcase design above: video, side-by-side figures and full-resolution stills come from the media store under the scoped showcase allow-list, not as links. SVG and PDF outputs still need a manifest kind (a link plus a PNG preview) in that same media branch.
- Per-page compile. The template is compiled once per page because ARGV is spliced at compile time. That is fine at the 100-example cap. If it grows, pass one JSON job file and loop inside one program.

Agreed with the next-tool order (lmdraw, lmcad, lmhtml). Each is also a migration off the Python book, which adds about a quarter day each for ownership migration and deleting its book.json.
