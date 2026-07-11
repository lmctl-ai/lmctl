---
title: Changelog
sidebar_position: 97
---

# Changelog

All notable public-preview changes for `@lmctl-ai/lmctl` are recorded here.

## Unreleased

- Documented the 0.1.97-0.1.100 sender-driven push model. The public
  orchestration surface is now `chat`, `check`, `push`, and `wait`: member-run
  `chat` queues when a target is busy, `check` reads outbound queued lanes,
  `push` delivers queued lanes for idle receivers, and `wait` wakes on tracked
  completions or delivered receipts.
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
- Updated `lmctl wait` guidance for 0.1.91. `wait` is documented as an
  interactive first-return primitive over the caller/team scope: launch tracked
  `chat` or `exec` invocations in the background, call scoped `lmctl wait`, react
  to the first completion, and continue. The docs now state that `chat`/`exec`
  are blocking commands and backgrounding is done by the harness or shell.
- Superseded the 0.1.89/0.1.90 receiver-pull queue flow with the 0.1.100
  sender-push model.
- Updated Lead fan-out guidance to the `lmctl wait` model: launch tracked
  background invocations with `lmctl chat ... &` or `lmctl exec ... &`, then use
  scoped `lmctl wait` as the wake primitive.
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
