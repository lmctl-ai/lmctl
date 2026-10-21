# Homepage level videos

Four silent, ten-second clips illustrate the homepage's four product levels. Each storyboard has a 240-frame, 24 fps sequence. The published versions use lmblender 0.3.1 for Cycles scenes and lmdraw 0.1.2 for transparent title and label layers. Page URLs, video markup, posters, transcripts and navigation do not depend on either renderer.

## Render stages

Run scripts/homepage/video/render.sh as the entry point. The lmblender path compiles and renders each scene at 1280x720 with 64 samples, composites the black-keyed frames over a navy gradient, adds an alpha overlay, then creates the poster, H.264 MP4 and VP9 WebM. It uses one scene at a time. The level scripts provide camera moves; overlay scripts sync labels to their story beats. The release-installed lmdraw host supplies the schema directly to lmscript.

Cycles frames are cached under build/homepage-video/lmblender-cycles. The cache key includes the scene script, lmblender schema and binary hash, render preset, sample count, frame count, frame rate and dimensions. Changes to overlay scripts, title wording, or the background do not invalidate this cache. Remove a level's cache directory to force that scene to render again. The final render records the lmblender version and hash, lmdraw release and hash, compiler version, dimensions, preset and frame settings in scripts/homepage/video/lmblender/manifest.json. Frame hashes cover the final composited PNGs. Encoder output bytes are not used as a reproducibility check.

The overlay scenes in scripts/homepage/video/overlay/ use lmscript's cli/install declaration for lmdraw and its embedded Noto Sans font. lmscript obtains the schema directly from the release host and caches the release binary after SHA-256 verification; no schema copy is maintained here. The binary exposes --dsl-schema --json for the compiler and --version for latest-release cache validation. render.sh resolves the same host path returned by dsl_cli and places it first on PATH for compilation and execution. The scripts label Lead, Coder and Review teams and usage in Level 1; provider names and no copy-paste in Level 2; the requirement, acceptance criteria and review handoff in Level 3; and Work, Review, QA and Acceptance in Level 4. The background and transparent overlays are PNGs, not text baked into the 3D scenes. The level page transcripts describe the same visual beats.

LMBLENDER_BIN and LMDRAW_BIN can select local binaries. Lmscript, ffmpeg and ffprobe must be available on PATH. Run render.sh --only 1 through --only 4 to publish one level's clips and poster, or --publish to write all output into homepage/assets/videos. The default build output is under build/homepage-video/lmblender. render.sh --check bypasses the Cycles cache, rerenders the scenes and compares composited frame hashes; the encoded MP4 and WebM are checked for codec, dimensions and duration but their encoder bytes are not compared. Optional audio can be supplied later with --audio DIR and matching level-N.wav files.

The production sequence is 240 frames at 24 fps. A draft mode argument on each lmblender script renders selected 960x540 frames for composition review. Use a small draft pass while adjusting cameras, then use render.sh for final-quality footage. The host permits long renders, so keep scenes serial on shared machines.

## Published story and visual checks

The videos show teams gathering and a usage bar rising; provider-labeled agents exchanging messages through a Lead; a requirement and checklist entering and a result returning for review; and a brainstorm becoming a labeled work, review, QA and acceptance pipeline. Each clip has a navy background, a title strip, a level badge, and large labels with safe margins. Level 1 keeps its running and usage panel clear of the review rail, and the usage bar fills during the running beat. Level 3 places the requirement card above the figures. Level 4 tightens the camera as the pipeline appears and eases back for the final handoff; its stage labels track the projected block positions.

The previous lmcad storyboards remain under scripts/homepage/video/ and can be selected with render.sh --engine lmcad. The current lmblender pipeline is the published default. Review representative full-size frames and contact sheets before publishing, then inspect the level pages at desktop and mobile widths. The website check verifies page links, video attributes, sources, posters and media budgets. MP4 and WebM use the site's existing video content types and byte-range delivery through S3 and CloudFront.

Run npm run check:homepage and npm run check:tools after rendering. Publish through the normal main-branch website workflow and verify the live pages with scripts/tools/verify-live.sh.

The homepage overview is described in [site design](site-design.md); the authoring contract for tool pages is in [tools docs](tools-docs.md).
