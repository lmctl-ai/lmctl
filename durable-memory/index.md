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

## Recent docs updates

- 2026-07-08: Processed `lmctldoc` room backlog seq 4-6. The published async
  guidance now uses the current `lmctl wait` model: launch tracked invocations
  with backgrounded `lmctl chat` or `lmctl exec`, then block on scoped
  `lmctl wait`. Do not document a system-wide wait scope; current scopes are
  default self, `--from <teamfile:alias>`, positional `<teamfile>`, and `--id`.
- 2026-07-07: Named the previous background wake-up orchestration pattern in the
  public skill catalog. This was superseded on 2026-07-08 by `lmctl wait`.
- 2026-07-07: Ran a whole-site review with Coder, Reviewer1, and Reviewer3.
  Follow-up fixes added the Bring Your Own Subscriptions page to the Why
  sidebar, exposed the missing skills docs, removed a dead skills link, replaced
  stale CLI/storage wording, clarified Copilot vs OpenCode provider routing,
  removed brittle Qwen plan specifics, and made broken Markdown links fail the
  Docusaurus build. The deploy script now also publishes the root `homepage/`
  files, not only `/lmctl/` docs and `/skills/`.
- 2026-07-07: Added a public [Durable Memory Index](../docs/manuals/durable-memory-index.md)
  page adapted from the lmctl source project's internal `durable-memory/index.md`
  without private workspace paths or source-only implementation state.
- 2026-07-07: Folded `lmctldev` dogfood feedback into the public manuals:
  first-class `lmctl chat` CLI reference, tracked invocations, direct chat
  versus background workflow guidance, `node:sqlite` backend wording, provider
  `effort=` routing notes, and normalized `tail`/`health` examples.
