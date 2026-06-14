# lmctl-website

The public documentation site for **lmctl**, published to **`lmctl.com/lmctl/`**
(a path prefix, not a subdomain) — Docusaurus static site on S3, fronted by
CloudFront.

For the full design — stack, information architecture, authoring conventions,
rendering, and the publishing pipeline — see **[`site-design.md`](site-design.md)**.

## Quick start

```bash
npm ci          # install (lockfile committed)
npm start       # dev server with hot reload at /lmctl/
npm run build   # static build into build/ (fails on broken links)
npm run serve   # preview the built artifact
```

## Publishing

Automated and keyless: every push to `main` runs
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml), which builds
the site and publishes it via **GitHub Actions + AWS OIDC** (no stored AWS keys)
— `aws s3 sync` to the `lmctl/` prefix plus a CloudFront invalidation. The same
`scripts/deploy.sh` is the manual fallback for an operator with AWS access. See
[`site-design.md`](site-design.md) for details.
