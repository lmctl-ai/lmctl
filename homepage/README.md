# lmctl.com root home page

The static landing page served at the **root** of https://lmctl.com.

This is **separate from the Docusaurus docs** in this repo (those live under
`docs/` and deploy to the `/lmctl/` path via `scripts/deploy.sh`). The root home
page was previously a loose, hand-deployed file on S3 with no source in git —
this directory brings it under version control.

- `index.html` — the landing page.
- `assets/style.css`, `assets/favicon.svg` — served at `lmctl.com/assets/…`.
- `404.html`, `robots.txt`, `sitemap.xml` — other root objects.

## Deploy

```bash
bash scripts/deploy-homepage.sh
```

Copies the root files to `s3://lmctl-website-prod/` and invalidates CloudFront
`E1GKUWTM93U7IV`. It never `--delete`s the bucket (which also holds `/lmctl/`
and `/lmprobe/`). Not wired into CI yet — deploy manually for now.
