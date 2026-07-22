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

- 2026-07-22: Verified docs against `@lmctl-ai/lmctl 0.1.158` help. Top-level
  help lists 21 public commands: status, diagnose, diagnose-prompt, serve, api,
  device, team, chat, terminal, tail, health, recover, ls, lint, seed, hire,
  refresh, clone, workspace, plan, and db. `mcp` is help-dispatchable but hidden
  from top-level help. Public docs now split current `api` surfaces from legacy
  compatibility, avoid teaching retired workflow/project-engine endpoints as the
  normal path, keep `chat --run ... --done` for paused managed run answers, and
  phrase refresh as a same-session self-refresh guard rather than a role-only
  restriction.
- 2026-07-19: Processed independent review finding #10. Public docs now carry a
  Docusaurus announcement banner naming the docs target,
  `@lmctl-ai/lmctl 0.1.158`; verify with `npm view @lmctl-ai/lmctl version`,
  `lmctl --version`, `lmctl --help`, `lmctl chat --help`, and
  `lmctl status --help` before changing it. `docs/changelog.md` is no longer a
  single Unreleased bucket; it has docs-site updates plus release-floor
  sections. Added `lmctl chat --prompt-file` guidance because 0.1.154+ help
  documents it as the safe input path and it directly prevents shell expansion
  of backticks, `$()`, `$VAR`, and quotes in prompts. Rechecked against 0.1.158
  and removed public references to private supervisor tooling; docs should
  describe only the agent-facing CLI. Keep prompt-file guidance in raw Lead
  skills too, not only the Docusaurus docs. Also added the standard
  send-status procedure to raw Lead skills: run `lmctl status` before important
  sends, and after queued sends use `lmctl status --since 7d` to inspect
  `Waiting on:` / `mailbox outbound` instead of trusting exit code `0`.
- 2026-07-19: Tightened deploy/link verification after independent review
  finding #8. Same-origin `/lmctl/docs/...` links that Docusaurus can check
  should be relative Markdown links. External root-prefix surfaces such as
  `/skills/`, `/examples/`, and `/lmprobe` remain published-site checks. The
  manual deploy script now waits for `/lmctl/*` CloudFront invalidation and
  smokes live `sourceRevision`, homepage, Skills docs, Install & first run, and
  Verifying delegated work. It also smokes `/lmprobe/`,
  `/skills/lmprobe-skill.md`, and `/examples/opencode.json` as the current
  root-prefix links that Docusaurus cannot validate. The Skills docs page now
  states that normal installs do not provide `lmctl_chat`; switch directly to
  CLI chat.
- 2026-07-19: Added a public `/lmctl/docs/skills` Docusaurus landing page so a
  seeded agent has a visible "read this first" entry point from the main docs,
  not only the raw `/skills/` prefix. The page states the current agent
  contract: use synchronous `lmctl chat`, treat chat exit status as transport
  status, verify delegated work with `lmctl chat --json` or `lmctl status`, use
  CLI if seed text mentions `lmctl_chat` because normal installs do not provide
  it, and keep durable knowledge in `durable-memory/`. The navbar, sidebar, and
  footer now expose Skills. The homepage now lists Baby steps and Operating
  teams, and Install & first run hands off to Baby steps instead of the older
  workflow tutorial.
- 2026-07-19: Processed independent review findings; current docs target was
  `lmctl 0.1.154`, later rechecked against 0.1.158.
  Public docs and Lead skills now state that `lmctl chat` exit `0` is not a
  delegated-work completion contract: `enqueued mailbox message N` means queued,
  and `lmctl chat --json` exposes `status: "enqueued"` plus
  `path: "enqueued"`. Queueing is identity-scoped, not shell-context scoped:
  sender identity creates the `(sender, receiver)` lane; no sender identity
  means a busy receiver cannot queue anonymous mail. Added
  `/lmctl/docs/manuals/verifying-delegated-work`. Also added model-routing
  version-floor guidance: use 0.1.151+ and verify post-seed `MODEL` values with
  `lmctl health <teamfile>`. Added a known-issue note that current seed text may
  mention MCP `lmctl_chat`; normal installs do not provide that tool, and
  public guidance remains CLI `lmctl chat`. Status visibility for old queued
  mail depends on 0.1.151+ `Waiting on:` output.
  Avoid wording that overlaps the bad seed phrase about discovering
  `lmctl_chat`; say that normal installs do not provide it and to switch
  directly to CLI chat. Exit `1` from `lmctl chat` can be busy or a real error,
  so use `--json` or the message text before retrying.
- 2026-07-18: Corrected queued-member-mail delivery docs after operator/source
  confirmation. Public docs must say that `lmctl chat` to a busy receiver
  enqueues, and the next `lmctl chat` from that same sender to that same
  receiver delivers that sender's queued lane plus the new message once the
  receiver is free. A chat from another sender to the same receiver does not
  flush the lane. Do not document any daemon command as the queued-mail delivery
  path. A live `lmctl terminal` lock makes a receiver legitimately busy; queued
  mail waits until the human exits the terminal. If the sender goes idle waiting
  for the queued reply, this is deadlock, not latency. Do not restate this rule
  without naming the sender in the delivery clause and the explicit
  `(sender, receiver)` lane key. Superseded by 2026-07-19 verification against
  `lmctl 0.1.158`.
- 2026-07-18: Processed lmctl 0.1.125 `status`. Public docs then stated that
  `lmctl status` was team/SELF scoped from `LMCTL_SELF_SESSIONID` in
  member sessions; outside a member session it reports workspace scope with
  `identity: none`. Do not reintroduce project/cwd resolution, `status
  --project`, or `status --web`; neither flag appears in current public
  `lmctl status --help`.
- 2026-07-14: Processed lmctl 0.1.122 removed-flag guidance. This was
  superseded by later verification; do not teach the old removed chat flag as
  live guidance.
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
  wake-loop docs. This was superseded by 0.1.116 and then by 0.1.122's
  removed-flag guidance.
- 2026-07-10: Processed lmctl 0.1.97-0.1.100 sender-driven docs. Public
  orchestration guidance centered on `chat` plus separate wake/harvest
  commands. This was superseded by later wake-loop docs, then by 0.1.116's
  synchronous-chat guidance and 0.1.122's removed-flag option.
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
  backgrounding is done by the harness or shell, not by an lmctl flag.
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
