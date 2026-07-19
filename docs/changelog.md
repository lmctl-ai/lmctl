---
title: Changelog
sidebar_position: 97
---

# Changelog

All notable public-preview changes for `@lmctl-ai/lmctl` are recorded here.

These docs currently describe `@lmctl-ai/lmctl` **0.1.154**. Run
`lmctl --version` before following command examples.

## Docs Site Updates

- Converted same-origin `/lmctl/docs/...` links that Docusaurus can check into
  relative Markdown links, and extended `scripts/deploy.sh` to wait for the
  `/lmctl/*` CloudFront invalidation before smoke-checking the live
  `sourceRevision`, homepage, Skills docs page, install tutorial, and delegated
  work verification page. Root-prefix public links that stay outside the
  Docusaurus build, such as `/lmprobe/`, `/skills/lmprobe-skill.md`, and
  `/examples/opencode.json`, are now deploy-smoked against the live site.
- Added a Docusaurus `/lmctl/docs/skills` landing page for newly seeded agents,
  exposed it in the navbar/sidebar/footer, and linked it to the raw
  `/skills/` files. The page leads with the current delegation contract:
  synchronous `lmctl chat`, `lmctl chat --json`/`lmctl status` for completion
  evidence, `--prompt-file` for safe prompt input, CLI fallback when seed text
  mentions `lmctl_chat` even though normal installs do not provide it, and
  durable-memory as portable working context.
- Expanded the homepage tutorial cards to include Baby steps and Operating
  teams, and changed the Install & first run handoff to point to Baby steps
  instead of jumping directly to the older workflow tutorial.

## lmctl 0.1.154

- Verified the current command surface against `lmctl --help`, `lmctl chat
  --help`, and `lmctl status --help`.
- Documented `lmctl chat --prompt-file <path>` and `--prompt-file -` as the
  safe input path for prompts that contain command examples, backticks,
  `$(...)`, `$VAR`, or quotes. Positional prompts are assembled by the caller's
  shell before lmctl sees them. This guidance is also present in the raw Lead
  skills because seeded agents may read those directly.

## lmctl 0.1.151+

- Added model-routing version-floor guidance. For routed `model=` teamfiles,
  use 0.1.151 or newer and verify the post-seed `MODEL` column with
  `lmctl health <teamfile.lmctl>`.
- Added 0.1.151+ status visibility notes for queued-mail troubleshooting.
  `Waiting on:` keeps old undelivered mail visible so old queued work does not
  disappear behind recency caps.

## lmctl 0.1.129+

- Removed stale removed-flag guidance from the public manuals and skills:
  `chat --detach`, `more`, `wait`, `check`, `push`, and `exec` are not current
  agent-facing delegation commands.

## lmctl 0.1.125+

- Documented team/SELF scoped `lmctl status`: it resolves identity from
  `LMCTL_SELF_SESSIONID` in member sessions, reports team/member state and
  mailbox lanes, and does not take `--project` or `--web`.

## lmctl 0.1.122+

- Added a known-issue note for current seed text that mentions MCP
  `lmctl_chat`. Public guidance remains the CLI:
  `lmctl chat <teamfile> <alias> "task"`.
- Clarified that `notify_all` is supervisor/root tooling only:
  `admincli notify`, `admincli watch`, or standalone `notify_all.py`.
  It is observe-only by default. Regular LLM agents do not call it.

## lmctl 0.1.116+

- Documented the `chat` command as the live Lead delegation primitive: it is
  synchronous, blocks for one member turn, and returns the member reply when the
  receiver is idle.
- Documented that lmctl is agnostic to foreground/background execution;
  providers, runtimes, shells, harnesses, and supervisors own wake and
  concurrency.
- Retired the historical 0.1.103/0.1.113 wake-loop docs. Those commands are not
  in the 0.1.116 help surface, and no extra supervision command is documented
  as an LLM-called command.

## lmctl 0.1.100+

- Clarified the current queued-member-mail delivery model: `lmctl chat` to a
  busy receiver enqueues, and the next `lmctl chat` from that same sender to
  that same receiver delivers that sender's queued lane plus the new message
  once the receiver is free. A live `lmctl terminal` lock is a valid busy state,
  so queued mail waits until the human exits the terminal.
- Verified queued delegation guidance and documented the machine-readable
  `lmctl chat --json` queued contract: `status: "enqueued"` with
  `path: "enqueued"`. Exit code `0` alone is not a delegated-work completion
  signal.
- Corrected busy queueing language from shell/member context to sender
  identity: calls with sender identity can queue for a busy receiver; calls
  without sender identity have no lane and return busy instead.
- Clarified that exit `1` from `lmctl chat` can be busy or a real error; use
  `--json` or the message text to tell retryable busy from non-busy failures.
- Added the concise queue lifecycle: `queued -> in-flight -> delivered with
  receipt`. Delivery is at-least-once, so a duplicate delivery can happen after
  a crash, but queued work should not be lost.
- Superseded the 0.1.89/0.1.90 receiver-pull queue flow with the sender-driven
  model.

## lmctl 0.1.95+

- Documented the 0.1.95/0.1.96 identity cleanup. Old explicit identity flags
  are removed; member-run commands infer identity from `LMCTL_SELF_SESSIONID`,
  direct `lmctl chat <teamfile> <alias> "<prompt>"` works flaglessly from an
  operator shell, and manual self-identity invocation is explicitly
  experimental at `/lmctl/docs/manual-invocation`.
- Added `/lmctl/docs/mcp-manual-install` for the optional `lmctl mcp` bridge.
  lmctl no longer installs or relies on MCP by default, and stale cleanup is
  shape-gated to entries named `lmctl`/`lmctl0` that actually invoke lmctl MCP.
- Noted that debug output is written to `~/.lmctl/debug-*.log`, not terminal
  output.
- Historical note: 0.1.91 documented an interactive first-return primitive over
  the caller/team scope. This is not current guidance.
- Historical note: older Lead fan-out guidance used tracked background
  invocations and scoped wake primitives. This is not current guidance.
- Removed the top-level `lmctl init` command. Provider setup is documented in
  the [Install & first run](./tutorials/install-first-run.md) tutorial; lmctl
  reports a missing provider or credential at use time (`seed`/`chat`).
- Removed the static `_CONNECT_` cross-team statement and the `lmctl connect`
  command. Cross-team calls now work automatically at runtime, with automatic
  cycle protection. Legacy `_CONNECT_` lines are ignored with a `lmctl lint`
  deprecation warning.
- Added `provider=opencode` model-effort selection with `_MEMBER_ ...
  model=<id> effort=<variant>`.
- Added managed opencode provider entries for GitHub Copilot, DeepSeek, and
  OpenRouter-backed Qwen models.
- Added `examples/opencode.json` as a copyable opencode provider/variant
  sample.
- `lmctl lint` now warns when `effort=` is used outside `provider=opencode`,
  opencode `effort=` is set without `model=`, or
  `~/.config/opencode/opencode.json` is missing while still accepting
  lmctl-managed model ids.

### Provider Effort Support

| Provider | `effort=` support |
| --- | --- |
| `opencode` | Supported through opencode variants. |
| `claude` | Native CLI has `--effort`, but lmctl has not wired `_MEMBER_ effort=` to Claude yet. |
| `codex` | Codex exposes effort-like config through native settings; lmctl has not wired `_MEMBER_ effort=` to Codex yet. |
| `agy` | No verified effort flag in `agy --help`; only `--model` is currently supported by lmctl. |
