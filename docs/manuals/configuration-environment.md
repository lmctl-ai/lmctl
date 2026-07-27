---
title: Configuration & Environment
sidebar_position: 5
---

# Configuration & environment

lmctl resolves its local state from a SQLite database. The settings below cover
which DB a command uses and, optionally, how to reach a remote daemon.

## State DB resolution

Verified against `lmctl 0.1.218`: the current global state selector is:

- `--db PATH` to point one command at a specific SQLite database.
- `LMCTL_DB` to set the database for commands that do not pass `--db`.
- `LMCTL_HOME` to move the default state root.

Resolution order is `--db`, then `LMCTL_DB`, then
`<LMCTL_HOME>/state.db`, then `~/.lmctl/state.db`.

Use a separate DB file when you want an isolated local test environment:

```bash
lmctl --db /tmp/lmctl-doc-test/state.db status
lmctl --db /tmp/lmctl-doc-test/state.db serve status
```

The generic word "workspace" may still appear in prose to mean your local
working directory or environment. Current command examples should use the
state DB selector above rather than the old workspace command surface.

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

`lmctl serve start` listens on port `8787` by default. If you run it on another
port, keep the API URL in sync:

```bash
setsid lmctl serve start --port 8788 > lmctl.log 2>&1 < /dev/null & disown
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
kimi
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
and terminal behavior. This page's command shapes were checked against 0.1.218.
After seeding a model-routed team, run:

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
| `kimi` | Kimi CLI's native session store under the user's home directory. |
| `copilot` | Copilot CLI's native auth/session store. |

If a provider supports multiple channels or database paths, make sure `lmctl`
is reading the same path that the provider CLI wrote.
