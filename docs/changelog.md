---
title: Changelog
sidebar_position: 97
---

# Changelog

All notable public-preview changes for `@lmctl-ai/lmctl` are recorded here.

## Unreleased

- Verified queued delegation guidance against `lmctl 0.1.152` and documented
  the machine-readable `lmctl chat --json` queued contract:
  `status: "enqueued"` with `path: "enqueued"`. Exit code `0` alone is not a
  delegated-work completion signal.
- Corrected busy queueing language from shell/member context to sender
  identity: calls with sender identity can queue for a busy receiver; calls
  without sender identity have no lane and return busy instead.
- Added model-routing version-floor guidance. For routed `model=` teamfiles,
  use 0.1.151 or newer and verify the post-seed `MODEL` column with
  `lmctl health <teamfile.lmctl>`.
- Added a known-issue note for stale seed text that mentions MCP `lmctl_chat`.
  Public guidance remains the CLI: `lmctl chat <teamfile> <alias> "task"`.
- Added 0.1.151+ status visibility notes for queued-mail troubleshooting.
  `Waiting on:` keeps old undelivered mail visible so old queued work does not
  disappear behind recency caps.
- Clarified that exit `1` from `lmctl chat` can be busy or a real error; use
  `--json` or the message text to tell retryable busy from non-busy failures.
- Clarified the current queued-member-mail delivery model: `lmctl chat` to a
  busy receiver enqueues, and the next `lmctl chat` from that same sender to
  that same receiver delivers that sender's queued lane plus the new message
  once the receiver is free. A live `lmctl terminal` lock is a valid busy state,
  so queued mail waits until the human exits the terminal.
- Removed stale removed-flag guidance from the public manuals and skills; the
  current live command guidance above is verified against `lmctl 0.1.152`.
- Clarified that `notify_all` is supervisor/root tooling only:
  `admincli notify`, `admincli watch`, or standalone `notify_all.py`.
  It is observe-only by default. Regular LLM agents do not call it.
- Documented the 0.1.116 command surface. `chat` is the live Lead delegation
  primitive: it is synchronous, blocks for one member turn, and returns the
  member reply. lmctl is agnostic to foreground/background execution; providers,
  runtimes, shells, harnesses, and supervisors own wake and concurrency.
- Retired the historical 0.1.103/0.1.113 wake-loop docs. Those commands are not
  in the 0.1.116 help surface, and no extra supervision command is documented
  as an LLM-called command.
- Historical note: 0.1.97-0.1.113 briefly used several wake/harvest command
  spellings. These are no longer live command guidance and are intentionally not
  named here.
- Added the concise queue lifecycle: `queued -> in-flight -> delivered with
  receipt`. Delivery is at-least-once, so a duplicate delivery can happen after a
  crash, but queued work should not be lost.
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
  the caller/team scope: launch tracked member or local invocations in the
  background, call the scoped wake command, react to the first completion, and
  continue. This is not current guidance.
- Superseded the 0.1.89/0.1.90 receiver-pull queue flow with the 0.1.100
  sender-driven model.
- Historical note: older Lead fan-out guidance used tracked background
  invocations and scoped wake primitives. This is not 0.1.116 guidance.
- Removed the top-level `lmctl init` command. Provider setup (install + authenticate each provider CLI) is documented in the [Install & first run](/lmctl/docs/tutorials/install-first-run) tutorial; lmctl reports a missing provider or credential at use time (`seed`/`chat`). `lmctl status` no longer shows a persisted active-providers list.
- Removed the static `_CONNECT_` cross-team statement and the `lmctl connect` command. Cross-team calls now work automatically at runtime, with automatic cycle protection (a cross-team call is stopped when its target is an active ancestor and it either recurs within ~60s or has been revisited more than twice — fan-out and slow back-and-forth are allowed). Legacy `_CONNECT_` lines are ignored with a `lmctl lint` deprecation warning. DB migration v38 drops the `team_connection` table.
- Added `provider=opencode` model-effort selection with `_MEMBER_ ... model=<id> effort=<variant>`.
  - Chat/MCP path: sends opencode ACP `session/set_config_option` for `model`, then `effort`.
  - Seed path: uses `opencode run --model <id> --variant <effort>`.
- Added managed opencode provider entries for GitHub Copilot, DeepSeek, and OpenRouter-backed Qwen models.
- Added `examples/opencode.json` as a copyable opencode provider/variant sample.
- `lmctl lint` now warns when:
  - `effort=` is used outside `provider=opencode`;
  - opencode `effort=` is set without `model=`;
  - `~/.config/opencode/opencode.json` is missing, while still accepting lmctl-managed model ids.

### Provider Effort Support

| Provider | `effort=` support |
| --- | --- |
| `opencode` | Supported through opencode variants. |
| `claude` | Native CLI has `--effort`, but lmctl has not wired `_MEMBER_ effort=` to Claude yet. |
| `codex` | Codex exposes effort-like config through native settings; lmctl has not wired `_MEMBER_ effort=` to Codex yet. |
| `agy` | No verified effort flag in `agy --help`; only `--model` is currently supported by lmctl. |
