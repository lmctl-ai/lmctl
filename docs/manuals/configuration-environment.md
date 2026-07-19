---
title: Configuration & Environment
sidebar_position: 5
---

# Configuration & environment

lmctl resolves its local state from a SQLite database, normally through the
active workspace. The variables below control which database or workspace it
uses and, optionally, how to reach a remote daemon.

## Database and workspace resolution

The verified global selectors are:

- `--db PATH` to point one command at a specific SQLite database.
- `--workspace NAME` to run against an isolated workspace.
- `lmctl workspace use <name>` to select the active workspace for later
  commands.

Profiles are legacy. Use `lmctl workspace migrate` when you need to migrate old
profile state into workspaces.

Use workspaces when you want separate local environments. In a non-interactive
shell, provide the basedir and provider slots explicitly:

```bash
lmctl workspace init --name test-workspace \
  --basedir /tmp/lmctl-workspaces \
  --provider1 claude \
  --provider2 codex \
  --provider3 gemini
lmctl workspace use test-workspace
lmctl --workspace test-workspace status
```

## Daemon URL and token

The default daemon URL is:

```bash
http://127.0.0.1:8787
```

Set these variables when API auth is enabled or when the daemon runs on a
non-default URL:

```bash
export LMCTL_API_URL=http://127.0.0.1:8787
export LMCTL_API_TOKEN=<token>
```

## Serve port

`lmctl serve` listens on port `8787` by default. If you run it on another
port, keep the API URL in sync:

```bash
lmctl serve --port 8788 > lmctl.log 2>&1 &
export LMCTL_API_URL=http://127.0.0.1:8788
```

## Provider authentication

Provider CLIs authenticate themselves. Install and authenticate at least one of:

```text
claude
codex
gemini
copilot
opencode
qwen
agy
```

`agy` is the Antigravity CLI. It is distinct from Gemini even though its session
state lives under `~/.gemini/antigravity-cli`.

Then seed a team member with that provider:

```bash
lmctl team add-member my-team --alias QA --provider claude
lmctl team seed my-team
```

For `.lmctl` teamfiles, use the top-level seed command:

```bash
lmctl lint ./my-team.lmctl
lmctl seed ./my-team.lmctl
```

`lmctl lint` validates teamfile structure, warns on stale or placeholder session
ids, and checks configured models against the tested provider catalog. Use
per-member `--model` values when you want cost-aware routing by role:

```bash
lmctl team add-member my-team --alias Architect --provider claude --model <model>
lmctl team add-member my-team --alias Coder --provider codex --model <model>
```

For `.lmctl` teamfiles, the same routing lives on `_MEMBER_` lines:

```text
_MEMBER_ alias=Architect provider=claude model=<model>
_MEMBER_ alias=Coder provider=opencode model=<model> effort=<variant>
```

Model routing requires `@lmctl-ai/lmctl` 0.1.151 or newer for the current seed
and terminal behavior (verified against 0.1.152). After seeding a model-routed
team, run:

```bash
lmctl health ./my-team.lmctl
```

Confirm the `MODEL` column matches each `_MEMBER_ ... model=` value before
trusting the routed run.

`effort=` is the teamfile spelling for provider model variants such as OpenCode
reasoning effort. It is currently supported for `provider=opencode`; lint warns
when `effort=` is used with a provider that does not support it.

## Provider session locations

`lmctl ls`, `tail`, and `health` read provider-native session stores. When a
session is missing, check the provider's own storage and environment overrides:

| Provider | Native session storage |
| --- | --- |
| `claude` | Claude Code's native config/cache under the user's home directory. |
| `codex` | Codex CLI's native session store under the user's home directory. |
| `gemini` | Gemini CLI's native session store under the user's home directory. |
| `agy` | Antigravity CLI state under `~/.gemini/antigravity-cli`. |
| `opencode` | OpenCode's local database, commonly under the XDG data/config paths; `OPENCODE_DB` can point at a specific database. |
| `qwen` | Qwen CLI's native session store under the user's home directory. |
| `copilot` | Copilot CLI's native auth/session store. |

If a provider supports multiple channels or database paths, make sure `lmctl`
is reading the same path that the provider CLI wrote.
