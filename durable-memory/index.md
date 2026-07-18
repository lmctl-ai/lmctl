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

- 2026-07-18: Corrected queued-member-mail delivery docs after operator/source
  confirmation. Public docs must say that `lmctl chat` to a busy receiver
  enqueues, and the next `lmctl chat` to that same receiver delivers the backlog
  plus the new message once the receiver is free. No daemon is required for
  correctness; a daemon is only an optional accelerator. Do not document
  `lmctl serve` as the queued-mail delivery path. A live `lmctl terminal` lock
  makes a receiver legitimately busy; queued mail waits until the human exits
  the terminal. Verified `lmctl 0.1.131` help no longer exposes the old async
  chat flag.
- 2026-07-18: Processed lmctl 0.1.125 `status`. Public docs now state that
  `lmctl status` is zero-arg and team/SELF scoped from `LMCTL_SELF_SESSIONID` in
  member sessions; outside a member session it reports workspace scope with
  `identity: none`. Do not reintroduce project/cwd resolution, `status
  --project`, or `status --web`; both flags are removed for `status`.
- 2026-07-14: Processed lmctl 0.1.122 async-chat guidance. This was superseded
  by 0.1.131 verification; do not teach the old async chat flag as live
  guidance.
- 2026-07-12: Processed lmctl 0.1.116. Public docs and skills now remove live
  wake-loop command guidance. `chat` is synchronous and returns the member reply;
  lmctl is agnostic to foreground/background execution, and provider runtimes,
  shells, harnesses, or external supervisors own concurrency and wake behavior;
  do not document a separate LLM-called command for this.
- 2026-07-12: Processed lmctl 0.1.113 historical wake-command docs. This was
  superseded by 0.1.116; do not teach that command as live guidance.
- 2026-07-11: Processed lmctl 0.1.103 historical wake-command docs. This was
  superseded by 0.1.116; do not teach that command as live guidance.
- 2026-07-11: Added a compact "If you learned an older lmctl" warning to the
  public Team Lead basic skill, with short pointers from the Meta-Lead and
  background wake-up skills. The block mapped several removed forms to later
  wake-loop docs. This was superseded by 0.1.116 and then by 0.1.122's detached
  async-chat guidance.
- 2026-07-10: Processed lmctl 0.1.97-0.1.100 sender-driven docs. Public
  orchestration guidance centered on `chat` plus separate wake/harvest
  commands. This was superseded by later wake-loop docs, then by 0.1.116's
  synchronous-chat guidance and 0.1.122's async-chat option.
  Added the public lifecycle
  `queued -> in-flight -> delivered with receipt` and at-least-once delivery
  note.
- 2026-07-10: Processed `lmctldoc` seq 16-18 and `lmctldev` seq 52-53 for
  lmctl 0.1.95/0.1.96. Public docs now drop the old identity flags entirely,
  document `LMCTL_SELF_SESSIONID` as the automatic member-session identity
  marker, add `/lmctl/docs/manual-invocation` as experimental/unsupported, add
  `/lmctl/docs/mcp-manual-install`, and state that debug output goes to
  `~/.lmctl/debug-*.log`. Dogfood against `lmctl 0.1.96` confirmed that current
  member and local-command help had no old identity flag; removed-flag failures
  pointed to the manual-invocation page. A confusing manual-shell behavior was
  reported to `lmctldev` seq 54.
- 2026-07-08: Processed the 0.1.91 scoped first-return cleanup. Public docs
  then described an interactive first-return primitive over default-self or
  positional `<teamfile>` scopes only. Dogfood used the 0.1.91 source binary
  with two background local-command invocations from one caller: the first call
  returned one finished row plus one in-flight row; the next call returned
  the remaining completion.
  The docs also stated that chat and local commands remained blocking and
  backgrounding is done by the harness or shell, not by a detached-mode flag.
- 2026-07-08: Processed `lmctldoc` room backlog seq 7-8 after the lmchat
  Unicode filename download fix. That receiver-pull queue pass was superseded
  by later sender-driven docs.
- 2026-07-08: Tested and prepared the public `lmbio` skill update from
  `~/lab/lmbio/skills/lmbio-skill.md`. Validation included the Rust unit test
  suite, golden fixture replay, deterministic command examples, and bounded
  cache-first network examples for PubMed, ClinicalTrials.gov, RxNorm, PubChem,
  openFDA labels, iCite, and UniProt.
- 2026-07-08: Processed `lmctldoc` room backlog seq 4-6. The published async
  guidance then used a scoped first-return model with backgrounded chat or local
  commands. That guidance is superseded by 0.1.122.
- 2026-07-07: Named the previous background wake-up orchestration pattern in the
  public skill catalog. This was later superseded by scoped first-return
  wakeups, then by 0.1.122 async-chat guidance.
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
