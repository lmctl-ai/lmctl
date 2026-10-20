# Homepage animated explainers

The four homepage levels use short silent animations rendered from deterministic lmcad storyboards, with stable media URLs so a future renderer can replace the frame\-generation step without changing page markup\.

## Storyboards and outputs

The authored scenes are `scripts/homepage/video/level-1.lms` through `level-4.lms`\. They share the same marked look block: dark navy background, gold highlights, provider colors, directional and fill lights, ambient light and fixed camera framing\. Each script renders 240 numbered 480×270 PNG frames at 24 frames per second, for a ten\-second clip\. Frame hashes live in `frames.sha256`; `render.sh --check` recompiles and rerenders the sources and verifies those hashes without relying on encoder output hashes\.

`render.sh` reads the schema from the selected lmcad binary, compiles each storyboard with the published `lmscript` compiler and renders through the lmcad v0\.1\.1 interface\. It then encodes H\.264 MP4 and VP9 WebM with fixed ffmpeg options and writes a representative story frame as the poster (the grouped team and usage view for level 1, a message moment for level 2 and near\-completion frames for levels 3 and 4\)\. Each video is checked against the 1\.5 MiB size limit\. The generated assets live in `homepage/assets/videos/` and are published under `/assets/videos/`; detail pages are in `homepage/levels/`\. The homepage check uses lmhtml to verify the four links, video attributes, sources, posters and size budgets\.

## Optional audio

The videos are silent and do not require audio\. `render.sh --audio DIR` looks for an optional `level-N.wav` track in that directory and muxes it when present; absent tracks are a no\-op\. Page transcripts remain the accessible description whether audio is added later or not\.

## Changing the renderer

When lmblender with Cycles is released, re\-render the storyboard frames with its renderer and keep the numbered frame sequence, frame rate, video encodes and published filenames\. The render command and renderer\-specific settings in `render.sh` are the part to replace; the page URLs, video markup, posters, transcripts and navigation remain stable\. The PNG frame hashes are regenerated for the new render, while ffmpeg's deterministic encoding settings and size checks continue to apply\.

## Publishing and review

Homepage assets are included recursively by the static publisher, with MP4 and WebM content types and one\-day caching\. S3 and CloudFront serve byte\-range requests for these media objects without a custom proxy\. The live verifier checks linked media bytes and headers\. Before publishing a render change, run `npm run check:homepage`, `npm run check:tools` and `render.sh --check`, then inspect representative frames and the four level pages at desktop and mobile widths\.

The homepage's four\-level overview is described in [site design](<site-design.md>)\. The separate tool\-page authoring contract is covered by [tool documentation](<tools-docs.md>)\.
