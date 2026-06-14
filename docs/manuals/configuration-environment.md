---
title: Configuration & Environment
sidebar_position: 5
---

# Configuration & environment

lmctl resolves its local state from a SQLite profile. The variables below
control which profile it uses and, optionally, how to reach a remote daemon.

## Database and profile resolution

CLI commands resolve the database in this order:

1. `--db PATH`
2. `LMCTL_DB`
3. `--profile NAME`
4. `LMCTL_PROFILE`
5. `~/.lmctl/active-profile`
6. `~/.lmctl/state.db`

Most users can use the default profile. Use explicit profiles when you want
separate local environments:

```bash
lmctl profile create test-profile
lmctl --profile test-profile status
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
opencode
qwen
```

Then seed a team member with that provider:

```bash
lmctl team add-member my-team --alias QA --provider claude
lmctl team seed my-team
```
