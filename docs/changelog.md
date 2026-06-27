---
title: Changelog
sidebar_position: 97
---

# Changelog

All notable public-preview changes for `@lmctl-ai/lmctl` are recorded here.

## Unreleased

- Removed the top-level `lmctl init` command. Provider setup (install + authenticate each provider CLI) is documented in the [Install & first run](/lmctl/docs/tutorials/install-first-run) tutorial; lmctl reports a missing provider or credential at use time (`seed`/`chat`). `lmctl status` no longer shows a persisted active-providers list.
- Removed the static `_CONNECT_` cross-team statement and the `lmctl connect` command. Cross-team calls now work automatically at runtime, with automatic cycle protection (a cross-team send is stopped when its target is an active ancestor and it either recurs within ~60s or has been revisited more than twice — fan-out and slow back-and-forth are allowed). Legacy `_CONNECT_` lines are ignored with a `lmctl lint` deprecation warning. DB migration v38 drops the `team_connection` table.
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
