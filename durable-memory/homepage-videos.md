# Homepage level videos

Four silent, ten-second clips illustrate the homepage's four product levels. Each storyboard has a 240-frame, 24 fps sequence. The published versions are rendered with lmblender 0.3.1 at 1280x720; the page URLs, video markup, posters, transcripts and navigation are independent of the renderer.

## Published lmblender path

The production storyboards are scripts/homepage/video/lmblender/level-1.lms through level-4.lms. scripts/homepage/video/render.sh defaults to lmblender. It compiles the scenes with lmscript, renders 240 numbered PNGs in four 60-frame calls (the host caps a sequence at 64 million total pixels and names the limit in its error), selects a poster, and encodes H.264 MP4 and VP9 WebM. Rendered files go in homepage/assets/videos/ and publish under /assets/videos/; the detail pages live in homepage/levels/.

The local lmblender install lives at /home/ubuntu/lmblender-release/current (lmblender 0.3.1, Cycles 4.5.0, OpenImageDenoise 2.5.0); set LMBLENDER_BIN to override. This renderer is not available in CI. The storyboards apply the named preset diagram-dark-16x9-final and raise samples to 64 with fast denoising, following the operator quality-first note. render.sh records the engine, version, binary hash, preset, samples, resolution, frames and fps in scripts/homepage/video/lmblender/manifest.json, and full-sequence frame hashes in frames.sha256. Use render.sh to render all four, render.sh --check to re-render and compare frame hashes without comparing encoder bytes, and --only 1 through --only 4 for one level. Optional audio comes from --audio DIR with matching level-N.wav files.

Each storyboard also accepts a draft mode argument and renders a handful of 960x540 frames at the draft preset for review. Representative before/after contact sheets against the previous lmcad renders are kept in scripts/homepage/video/lmblender/qa/ with hashes in qa-contact-sheets.sha256.

Visual review rounds (QA) compared the 0.3.1 storyboards against the published lmcad clips. Round 1 found Levels 1 and 2 better and Levels 3 and 4 worse; two fix rounds repaired the Level 3 packet lane, checklist and clipped human, and the Level 4 brainstorm arc, pipeline timing and acceptance check. The final verdict was SWITCH for all four levels, and the website now publishes the lmblender videos.

The media budget rules were raised for the quality-first pass: video attributes on the level pages are 1280x720, posters may be up to 300 KB, and each encoded MP4 or WebM may be up to 10 MB. The checker in scripts/tools/homepage-videos.lms enforces these; preload stays metadata and every video keeps a poster so pages stay light.

## lmcad fallback

The previous lmcad 480x270 storyboards remain in scripts/homepage/video/level-1.lms through level-4.lms, and render.sh --engine lmcad still builds them with the pinned v0.1.1 binary (checksums in lmcad-v0.1.1.sha256). The lmcad path is the fallback if lmblender is unavailable.

## Checks and publishing

Run npm run check:homepage, npm run check:tools and inspect representative frames and the four pages at desktop and mobile widths. The website check verifies level links, video attributes, sources, posters and the size budgets above. The static publisher includes MP4 and WebM content types and supports byte-range media requests through S3 and CloudFront.

The homepage overview is described in [site design](site-design.md); the authoring contract for tool pages is in [tools docs](tools-docs.md).
