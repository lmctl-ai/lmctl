---
title: Install & First Run
sidebar_position: 1
---

# Install & first run

This tutorial gets `lmctl` installed, initializes provider access, and
checks that the local environment is usable.

In these docs, lmctl is the product/platform name, and `lmctl` is the command
you run locally.

## Requirements

- Linux or WSL2. (macOS is untested; native Windows is unsupported.)
- Node 22 or newer.
- At least one native AI provider CLI installed and authenticated:
  `claude`, `codex`, `gemini`, `opencode`, or `qwen`.
- A shell where you can build native Node packages. SQLite is provided through
  `better-sqlite3`, which is compiled during `npm install`.

`lmctl` does not store provider API keys. Each provider authenticates
through its own CLI and config directory.

## Install

Install the published package globally, then initialize your local lmctl
profile:

```bash
npm install -g @lmctl-ai/lmctl
lmctl init
lmctl status
```

After `npm install -g`, the `lmctl` command is on your `PATH`.

During `init`, lmctl checks for provider CLIs and guides you through missing
install or authentication steps.

## Where lmctl keeps state

lmctl stores its local state under `~/.lmctl/`. User-facing environment
variables are prefixed `LMCTL_`.

## Verify the setup

Run:

```bash
lmctl status
```

The command reports the active profile, current project context when one can be
resolved from your working directory, recent runs, open attentions, and detected
providers.

You now have enough setup for the first workflow tutorial.
