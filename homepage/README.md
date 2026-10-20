# lmctl.com root home page

The static landing page served at the **root** of https://lmctl.com.

This is **separate from the Docusaurus docs** in this repo (those live under
`docs/` and deploy to the `/lmctl/` path via `scripts/deploy.sh`). The root home
page was previously a loose, hand-deployed file on S3 with no source in git —
this directory brings it under version control.

- `index.html` — the landing page.
- `assets/style.css`, `assets/favicon.svg`, brand images and `assets/videos/` — served at `lmctl.com/assets/…`.
- `levels/` — four level pages and their short explanatory videos.
- `404.html`, `robots.txt`, `sitemap.xml` — other root objects.

The four silent explainers are authored as lmcad storyboards in
`scripts/homepage/video/`. Download the pinned [lmcad v0.1.1 release](https://github.com/lmctl-ai/lmcad/releases/tag/v0.1.1) for your platform; lmscript and ffmpeg are also required.
Run `LMCAD_BIN=/path/to/lmcad scripts/homepage/video/render.sh` to render and
encode them. `--check` rerenders and compares frame hashes without changing
the published videos.

## Deploy

```bash
bash scripts/deploy-homepage.sh
```

The path-filtered static publishing workflow uploads changed homepage files to
`s3://lmctl-website-prod/` and invalidates CloudFront `E1GKUWTM93U7IV`. It never
deletes unrelated site prefixes (which also hold `/lmctl/` and `/lmprobe/`).
The same deployment can be run with `bash scripts/deploy-homepage.sh`.
