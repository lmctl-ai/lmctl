# Homepage level videos

Four silent, ten-second clips illustrate the homepage's four product levels. Each storyboard has a 240-frame, 24 fps sequence. The published versions are rendered with lmcad at 480×270; the page URLs, video markup, posters, transcripts and navigation are independent of the renderer.

## Published lmcad path

The production storyboards are `scripts/homepage/video/level-1.lms` through `level-4.lms`. `scripts/homepage/video/render.sh` defaults to lmcad v0.1.1. It compiles the scenes with `lmscript`, renders 240 numbered PNGs, checks frame hashes, selects a poster, and encodes H.264 MP4 and VP9 WebM using fixed ffmpeg options. Each encoded file is checked against the 1.5 MiB budget. The rendered files go in `homepage/assets/videos/` and publish under `/assets/videos/`; the detail pages live in `homepage/levels/`.

Use `scripts/homepage/video/render.sh` to render all four. Use `scripts/homepage/video/render.sh --check` to re-render and compare the frame hashes without comparing encoder output bytes. To test one level, pass `--only 1` through `--only 4`. Optional audio can be supplied with `--audio DIR`; matching `level-N.wav` files are muxed, and missing tracks do nothing. Transcripts remain in the page text.

## Local lmblender experiment

A second set of storyboard sources lives in `scripts/homepage/video/lmblender/`. They target the local-only lmblender 0.2.1 host (DSL bytecode v5, Cycles 4.5.0, OpenImageDenoise 2.5.0). The adjacent `schema/lmblender.dsl.json` is the schema snapshot used to compile them; `render.sh --engine lmblender` compares its compiler signatures with the installed host before rendering. Install the local binary and set `LMBLENDER_BIN` if it is not on `PATH`. This renderer is not available in CI.

`render.sh --engine lmblender` writes to `build/homepage-video/lmblender/` by default. Add `--publish` only when intentionally replacing the website media. The host limits sequence renders to 64 million frame-pixels, so the 240-frame 960×540 sequence is split into two 120-frame calls. Draft settings use 16 samples and denoising. A 26-frame level-1 trial took 6m28s on the four-core development host, so complete sequences were not rendered. `scripts/homepage/video/lmblender/qa-manifest.json` records the exact local binary/version and preview-only status; `qa-contact-sheets.sha256` checks the four review contact sheets. These preview hashes are evidence for the storyboard review, not production frame hashes. When full renders are practical, `render.sh --check --engine lmblender` compares full frame hashes and the manifest records the binary and render settings. CI intentionally does not hash or execute lmblender.

Three visual review rounds compared the Cycles previews to the lmcad storyboards. Cycles materials and antialiasing looked smoother, and the story beats improved, but reviewers still found choreography defects: the inspection ring does not magnify its target, packet dots can look embedded in objects, and the Level 4 brainstorm/acceptance marks appear at the wrong times. Therefore the website continues to publish lmcad videos. The review sheets are retained under `scripts/homepage/video/lmblender/qa/` for reference.

## Checks and publishing

Run `npm run check:homepage`, `npm run check:tools` and `scripts/homepage/video/render.sh --check`, then inspect representative frames and the four pages at desktop and mobile widths. The website check verifies level links, video attributes, sources, posters and size limits. The static publisher includes MP4 and WebM content types and supports byte-range media requests through S3 and CloudFront.

The homepage overview is described in [site design](<site-design.md>); the authoring contract for tool pages is in [tools docs](<tools-docs.md>).
