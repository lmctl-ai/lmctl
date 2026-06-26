---
title: Changelog
sidebar_position: 97
---

# Changelog

All notable public-preview changes for `@lmctl-ai/lmctl` are recorded here.

## Unreleased

- Added `provider=opencode` model-effort selection with `_MEMBER_ ... model=<id> effort=<variant>`.
  - Chat/MCP path: sends opencode ACP `session/set_config_option` for `model`, then `effort`.
  - Seed path: uses `opencode run --model <id> --variant <effort>`.
- Added managed opencode provider entries for GitHub Copilot, DeepSeek, and OpenRouter-backed Qwen models.
- Added `examples/opencode.github-copilot.json` as a copyable opencode provider/variant sample.
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
