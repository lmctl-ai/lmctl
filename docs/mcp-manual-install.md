---
title: MCP Manual Install
sidebar_position: 5
---

# MCP manual install

lmctl no longer installs or relies on its MCP bridge by default. Prefer the
`lmctl chat` CLI for delegation.

The internal stdio bridge still exists as `lmctl mcp` for manual experiments.
This path is optional and not the normal support surface.

## Known issue: seeded prompts may mention `lmctl_chat`

Some older seed text may still tell an agent to use an MCP tool named
`lmctl_chat`. In practice the bridge is often not registered, and a tool search
can return no such tool. Treat that as a stale seed instruction, not as a docs
contradiction: use the CLI form instead.

```bash
lmctl chat "<teamfile>" <alias> "your task"
```

Do not stop after discovering that `lmctl_chat` is unavailable. The supported
delegation path is `lmctl chat`.

## Stale bridge cleanup

`lmctl seed`, `lmctl chat`, and `lmctl terminal` remove stale bridge entries
named `lmctl` or `lmctl0` only when the command shape also matches an lmctl MCP
bridge, such as `lmctl mcp` or legacy `lmctl0 mcp`.

That cleanup is shape-gated. Unrelated MCP servers are preserved. A
hand-installed server under the exact stale name and command shape can be
cleaned up, so choose a different server name for manual installs.

## Example configs

Workspace `.mcp.json`:

```json
{
  "mcpServers": {
    "custom-lmctl": {
      "type": "stdio",
      "command": "lmctl",
      "args": ["mcp"]
    }
  }
}
```

OpenCode `.opencode/opencode.json`:

```json
{
  "mcp": {
    "custom-lmctl": {
      "type": "local",
      "command": ["lmctl", "mcp"]
    }
  }
}
```

Codex `~/.codex/config.toml`:

```toml
[mcp_servers.custom-lmctl]
command = "lmctl"
args = ["mcp"]
```

Use a custom name like `custom-lmctl`, not `lmctl` or `lmctl0`, if you do not
want stale bridge cleanup to consider the entry.
