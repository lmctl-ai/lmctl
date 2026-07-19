---
title: Install & first run
sidebar_position: 1
---

# Install & first run

This is the easy on-ramp: install `lmctl`, make sure at least one AI provider is
ready, and look around. In these docs, **lmctl** is the product/platform name and
`lmctl` is the command you run locally.

## Prerequisites

- **Linux or WSL2.** (macOS is untested; native Windows is unsupported.)
- **Node.js 24.15 or newer.** lmctl uses Node's built-in SQLite, which is
  stable from Node 24.15.0.
- **At least one provider CLI, installed and authenticated** (next section).

lmctl does **not** store provider API keys. Each provider authenticates through
its own CLI and config directory; lmctl just drives them.

## Install lmctl

```bash
npm install -g @lmctl-ai/lmctl
lmctl --version
```

After `npm install -g`, the `lmctl` command is on your `PATH`.

## Install & authenticate a provider

A team member ("player") is backed by a native provider CLI. Install the ones
you want and sign in with each tool's own flow — lmctl reads their existing
sessions, it doesn't manage their credentials. Common players:

| Provider | CLI | Authenticate |
| --- | --- | --- |
| Claude | `claude` (Claude Code) | run `claude` and complete login |
| Codex | `codex` | run `codex` and complete login |
| GitHub Copilot | `copilot` | sign in via the Copilot CLI |
| OpenCode | `opencode` | per-provider creds in `~/.config/opencode/opencode.json` (see the [sample](https://lmctl.com/examples/opencode.json)) |
| Qwen | `qwen` | run `qwen` and authenticate |
| Antigravity | `agy` | run `agy` and sign in |
| Gemini | `gemini` | **API/enterprise Google accounts only** — personal-subscription users should use **`agy`** instead |

> You don't need all of them — one is enough to start. The OpenCode provider
> alone reaches almost any model (local Ollama or remote), so it's a good
> single-provider start. See [Players & model diversity](../why/players-and-diversity.md).

You don't run a setup command — lmctl detects a missing provider or credential
at the moment it needs one (during `seed` or `chat`) and tells you exactly what
to fix.

## Look around

Confirm the install and see what lmctl can resolve on this machine:

```bash
lmctl status
```

Before you seed a team member, this may show `scope: workspace` and
`identity: none`, then list registered teams and recent activity. Inside a
seeded member session, `status` switches to the team/SELF view: identity
(`<teamfile>:<alias>`), teamfile path, member busy/idle state, recent
delegation activity, and mailbox lanes. `status` does not take `--project` or
`--web`.

### See your provider sessions

Once a provider CLI has been used (by you directly, or by lmctl), you can browse
its sessions:

```bash
lmctl ls                      # list native provider sessions in scope
lmctl ls --runs               # list recent managed executions instead
lmctl tail <session-id> --provider codex     # print a session's messages
lmctl health <session-id> --provider codex   # session state + token usage
```

`lmctl ls` is your "what's here?", `lmctl tail` is your "read it", and
`lmctl health` is your "how big / what state". These work across every provider —
one set of commands, whatever CLI produced the session.

When you later seed a teamfile with per-member `model=` values, verify the
routing before assigning work:

```bash
lmctl health ./team.lmctl
```

The `MODEL` column should match the teamfile. Use `@lmctl-ai/lmctl` 0.1.151 or
newer for model-routed teams; this page was checked against 0.1.152.

## Where lmctl keeps state

lmctl stores local state under `~/.lmctl/`. User-facing environment variables are
prefixed `LMCTL_`.

You now have enough setup for the [first workflow tutorial](./first-workflow-job-image-qa.md).
