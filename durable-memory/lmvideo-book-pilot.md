# lmvideo mixed-media web-book pilot

The website now renders four books from a public-peer content candidate: Getting started, Examples, Showcase and CPU Cycles. There are 37 chapters plus four book indexes, including all 32 locally verified showcase targets and their scoreboard. These are local acceptance captures, not a fresh website benchmark run or proof that the candidate API is publicly released.

## Content contract and source

The established examples/manifest.json remains the strict examples-v1 profile and is validated before the book pull. The large examples/showcase/manifest.json is a capture/evidence ledger, not that schema; weakening the examples schema to admit its unrelated fields would conflate two contracts.

The new website-owned scripts/tools/content-book-v1.schema.json defines the separate version-1 book profile at examples/books.json: ordered groups/chapters, text/code/image/video blocks, literal run commands and transcripts, content-addressed media metadata, and hashed evidence references. No HTML, CSS, output URLs or layout settings live in tool content. Kind-specific and cross-reference validation supplements the structural schema. The current silent-video profile rejects audio; a future audible/captioned profile must be explicitly implemented and tested.

Content was authored in the isolated clone /home/mma/repos/research-sol/lmvideo-web-content, branch researchsol-web-books, based on staged public candidate 62ee47a. Content commits 550359f and 61ac53d add the book manifest, the existing authored Cycles chapter/capture metadata and its two source snippets. No lmvideo shared checkout was edited. The final input commit is 61ac53d9290df095677027e557a2db0b75d43f41; it is local and must be made publicly reachable before publishing pages that link to its raw source URLs.

The book transcripts preserve either string or line-array stdout from the ledger. Cycles transcript JSON comes from the existing locked chapter capture; timing fields describe that historical run. Neither benchmark scripts nor their verified source hashes were changed. The initial examples still use their declared host-install behavior; the new showcase/Cycles sources require the matching locally installed renderer, and the pages state that they are unpublished candidates.

## Rebuild and checks

From the website root, with the isolated candidate available:

```sh
npm run pull:tools -- lmvideo --books \
  --source /home/mma/repos/research-sol/lmvideo-web-content \
  --ref 96d8b27ad95babe05b9b367f2f3d5d54c3417bda \
  --media-store build/tools-media/lmvideo
npm run decorate:tools
npm run check:tools
npm run test:pull:tools
npm run check:tools:selftest
```

The source/store options are explicit local inputs, not hardcoded machine paths in implementation. Once the public source commit is reachable, omit --source to fetch the same ref from the public repository. Pulling verifies Git blobs, source/evidence/media hashes, sizes, image dimensions and silent-video metadata before running pinned lmhtml templates. No imported scene source is executed by the page build or HTML checker. All page/block/table markup is constructed in scripts/tools/book-page.lms; Python handles content/schema/media data and orchestration.

The importer stages every chapter and book index before swapping owned book roots with rollback. It refuses unowned roots and leftover staging markers. The old three example URLs remain stable; their previews move from committed website PNGs to the website render store. The website-owned tools/lmvideo/books-lock.json records content/schema/template hashes, book roots, every source digest and all media URLs/hashes. It grants the rich-media checker scope; an arbitrary page comment does not.

Shared tools styling/nav and semantic chapter contents/previous/next links remain consistent. Video requires controls, a locked PNG poster, typed locked sources and no autoplay. Code uses kbd/samp and copies only the command. The runner validates/decorates each tool in a separate bounded host invocation, then derives/checks the shared catalog. This makes a clean rebuild fit the host's fixed 4096-document arena while preserving every tool's checks; the host limit is unchanged. It also skips needless command-pair tokenization for source blocks without both tags, without changing source bytes. Standard role contracts remain strict.

## Media inventory and publication ownership

The selected 52 objects total 7,055,947 bytes: 43 PNGs, five MP4s and four WebMs. They are present locally at build/tools-media/lmvideo/ in the website clone, copied/verified from the renderer's local store. No bulk PNG/video files are committed with this website change. Expected public URLs are https://lmctl.com/tools/lmvideo/media/ followed by the content-addressed filename recorded in books-lock.json.

Static publication inventory includes only locked objects, rechecks hashes/bytes, and sets one-year immutable cache headers. It retains old media when page references disappear: HTML publication must not act as asset garbage collection. Publication reads the local store; fresh CI/operator clones need those exact locked blobs staged before check/deploy. The page gate deliberately fails rather than pretending absent local assets are valid remote objects. Media hosting and HTML publication remain owner/mono operations.

Owner publication steps, in order:

1. Review and promote the public-peer candidate, including book content through 61ac53d, so its pinned raw sources are reachable. From a suitable public clone, fetch the local researchsol-web-books branch from the isolated clone and push the reviewed lineage to a public ref. Do not rewrite the pinned scripts or history and assume existing page hashes still apply.
2. Provide the matching installable lmvideo renderer/Cycles module and any required companion assets for the new scripts. Existing latest binaries are not assumed to implement the candidate API. Keep the candidate warning until fresh public installation and the documented commands have been verified; do not replace raw URLs with mutable main to conceal a version mismatch.
3. Stage the 52 locked media files into the website build store on the publishing machine, or upload them to the website's tools/lmvideo/media/ object prefix with the full digest names and immutable headers. Verify all 52 URL bytes, dimensions and video content types; preserve retained release/page media. The raw media payload is approximately 6.73 MiB, before normal transport overhead.
4. Run the pull, decoration, contract/schema tests and publication preview under the website's normal credentials/process. Publish the media before or together with the checked HTML, stylesheet and shared copy script. The usual owner-controlled tools publisher includes the locked local media; do not use a bucket-root delete or remove unlisted retained media.
5. Verify Getting started, Examples, Showcase/32 scoreboard links, and the Cycles chapter on lmctl.com at desktop/mobile widths, including poster/video loading, source reachability and command-only copy behavior.

No deploy-tools.sh, AWS upload, release publication, public-peer promotion or Actions dispatch ran during this pilot. Local Chromium checks covered 1280/light and 390/dark views, loaded media, 32 scoreboard rows, controls/posters/no autoplay and clipboard behavior. Repeat pull/decorate checks compare final bytes using the same template/compiler/host and verified media.

## Review amendments (ResearchOpus, 2026-10-28)

Reproduced independently: decorate check, check:tools, test:pull:tools and a pinned rebuild are byte-identical with the 52 locked media files staged.

Fixed: the four showcase clips B12, B15, B30 and B32 are 1280x720, but their poster pointed at the 900x560 still, so the player letterboxed the poster before playback. Content commit 96d8b27 (branch researchopus-poster-fix in the isolated content clone, on top of 61ac53d) points them at the existing 1280x720 poster images. The book pull now rejects a poster whose size differs from the video, with an error naming the tool repo file and block, for example showcase/b12.blocks[5]. The rebuild ref above is 96d8b27; publish that lineage, not 61ac53d. No media changed.

Open content findings, for the content owner (not website changes):

- In 40 of 44 image blocks, alt equals caption and both equal the chapter title. Alt text should describe what the picture shows (for example "5x5 grid of spheres, metallic left to right, roughness top to bottom"), and the caption should say what to notice.
- 34 code blocks show the raw host JSON envelope as expected output, including wall_ms and phase timings that change on every run. That is honest captured stdout, but readers expect the stable line (for example "B12: 2500 point sprites, 120 frames, 1280x720@30"). Either the scripts print only their output line (which changes their locked hashes, so it needs a re-verification pass), or the book manifest gains a reviewed expected-output excerpt beside the full transcript.
- The scoreboard column titled Seconds is the historical capture wall time. Rename it Capture time (s), or explain it once in the index text.
- 47 of the 76 expected outputs listed in the private showcase ledger (non-benchmark examples such as scene3d-primitives) are not in any local render store. The four books do not use them, but they must be re-rendered before those examples get chapters.

## Published refresh: v0.1.36

This update supersedes the original candidate-promotion instructions above. Public lmctl-ai/lmvideo main is pinned at 07bacf984553317394e231d24b9cdcb0470dff3b; v0.1.36 is the non-draft, non-prerelease Latest release with Linux x64/arm64, macOS x64/arm64 and Windows x64 native runtimes. The supplied staging compatibility report records PASS for all 101 examples, with no failures or skips. This website refresh does not repeat those scene renders.

Rebuild from the published repository, without a local source override:

```sh
npm run pull:tools -- lmvideo --books \
  --ref 07bacf984553317394e231d24b9cdcb0470dff3b \
  --released-version 0.1.36 \
  --media-store build/tools-media/lmvideo
npm run decorate:tools
npm run check:tools
python3 scripts/tools/check-book-caption-urls.py
```

The public export omits optional stdout capture transcripts and evidence references. Both content validators accept their absence while validating supplied values; source/media hashes and mandatory structural fields remain required. Pages omit unrecorded program output rather than inventing a samp transcript. Every book page begins its installation commands with npm install -g @lmctl-ai/lmctl. Raw-source/autorun captions use the immutable public 07bacf9 commit, never the old candidate or mutable main. The caption checker performs GET requests, requires HTTP 200 and compares every returned source digest with the book lock; its full report is build/lmvideo-caption-urls.json.

The content still contains historical pre-release wording and a pending-release status. The website preserves those author-owned bytes and presents a clear current v0.1.36 release notice explaining that the capture notes predate publication. The lock retains content_publication_status separately from its current PUBLISHED/released_version context. No public tool content was edited by this refresh.

Four published posters have intrinsic sizes different from their video. Default candidate validation still rejects this mismatch. The explicit released-version path instead preserves the verified source image and generates an uncropped contain-and-pad presentation copy at the exact player dimensions. Derived PNGs receive full-digest filenames, derived_from/presentation records and the FFmpeg processor digest in the website lock. This is a website presentation transform; it does not overwrite source assets or change scene expectations. A focused test proves matching dimensions, source preservation and repeated derived-byte identity.

The refreshed website inventory has 56 objects totaling 7,746,011 bytes, including the four derived posters. They remain under ignored build/tools-media/lmvideo/ and publish under /tools/lmvideo/media/. Public content and runtime promotion are complete; the remaining owner action is the manual deploy-static dispatch after the usual website/media checks. No deployment, AWS upload or workflow dispatch was performed in this refresh.

The released refresh additionally includes the website-owned deterministic build input build-inputs/lmvideo/media-0.1.36.tar.gz (7,609,217 bytes). It contains only the 56 lock-listed media objects and is not part of the tool repository or a GitHub image gallery. Manual tools-check/deploy-static runners call stage-book-media.py before their checks, validating every filename, byte count and SHA-256 before installing the ignored render cache. A cold-cache extraction of all 56 objects was verified. This makes the owner's dispatch self-contained; no media staging upload or deployment was run by the agent. The original pilot's local-cache-only bootstrap is superseded for this released build.

### Review of the v0.1.36 refresh (ResearchOpus, 2026-10-29)

Reproduced on a separate clone: stage-book-media.py staged and verified all 56 objects from the build input, decorate check and check:tools passed, test:pull:tools passed, check-book-caption-urls.py returned PASS for all 37 caption URLs (HTTP 200, hashes match), and a rebuild from public 07bacf9 with --released-version 0.1.36 was byte-identical.

Follow-ups, in order of reader impact:

- Contradictory wording on every showcase page. The website notice says lmvideo 0.1.36 is released, and the content block directly below still says the source candidate and its renderer are not yet a public release. The fix is content-side: drop the pre-release sentence and the pending publication_status from examples/books.json in the next lmvideo public content push. The website notice can then go.
- Padded posters are a stopgap. The four derived posters letterbox the 900x560 still inside 1280x720, so the black bars are now baked into the poster. The content already ships a matching 1280x720 poster image for each clip (the second image block of B12, B15, B30 and B32). Pointing the video poster at it is a four-line content change, prepared earlier as commit 96d8b27 (branch researchopus-poster-fix in the isolated content clone). After it is published, the released-version normalisation path is no longer exercised and can be removed.
- Media tarball in Git. build-inputs/lmvideo/media-0.1.36.tar.gz adds 7.6 MB to the website history, and every content refresh would add another. That conflicts with keeping heavy media out of repositories. Once the first deploy has put the 56 objects under https://lmctl.com/tools/lmvideo/media/, stage-book-media.py can download each lock-listed object by its full-digest name, verify its SHA-256 and byte count, and treat the tarball only as a bootstrap fallback. Later refreshes then commit no binaries. Do not rewrite history to remove the current tarball.
- Still open from the first review: alt text equals the title in most image blocks, and the scoreboard column Seconds is the historical capture time.

## Released-content review follow-ups

The refresh starts from published 9850e28dff967d3fe664d2d2619273e99af14424, which marks the book content RELEASED. The existing poster fix was then applied as public content commit cd5cf59, and public commit 7fd44831ee766c52b40adf222ae5e9f199fd6849 adds concise visible-content alt descriptions, distinct explanatory captions, and removes two remaining stale publication sentences. These are metadata-only descendants of 9850e28: no scripts, media bytes or scene hashes changed, so no scene re-render was needed.

The website is pinned to 7fd4483 and no longer shows the historical unpublished-candidate disclaimer. Video uses the existing matching 1280x720 poster for B12/B15/B30/B32, so the website poster-padding fallback and processor provenance are removed; strict poster/video size validation remains. The scoreboard now labels its historical measurements Capture time (s), with numeric seconds rather than a misleading generic Seconds heading.

The current media lock returns to the 52 original objects, totaling 7,055,947 bytes. Follow-up 3 remains deferred: the existing media tarball is unchanged. Cold-run staging verifies retained full-digest entries from that immutable bootstrap archive but installs only the 52 currently authorized objects, leaving its four old padded posters unused. The cold-cache path was verified without rewriting the archive or changing remote media retention.

Rebuild with the previous published command and substitute the full ref 7fd44831ee766c52b40adf222ae5e9f199fd6849. Run decorate/check and check-book-caption-urls.py afterward. Deployment remains a separate owner dispatch; none was performed for these follow-ups.
