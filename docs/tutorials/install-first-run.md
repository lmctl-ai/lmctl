---
title: Install & First Run
sidebar_position: 1
---

# Install & first run

This tutorial gets `lmctl-next` installed, initializes provider access, and
checks that the local environment is usable.

In these docs, lmctl is the product/platform name. `lmctl-next` is the command,
binary, and repo you run locally.

## Requirements

- Linux or WSL2.
- Node 22 or newer.
- At least one native AI provider CLI installed and authenticated:
  `claude`, `codex`, `gemini`, `opencode`, or `qwen`.
- A shell where you can build native Node packages. SQLite is provided through
  `better-sqlite3` during `npm install`.

`lmctl-next` does not store provider API keys. Each provider authenticates
through its own CLI and config directory.

## Install

Clone the product repo, install dependencies, build the TypeScript package, and
initialize the local lmctl profile:

```bash
git clone <repo>
cd lmctl-next
npm install
npm run build
node bin/lmctl-next init
node bin/lmctl-next status
```

During `init`, lmctl checks for provider CLIs and guides you through missing
install or authentication steps.

## Add the command to your PATH

The rest of these docs assume `lmctl-next` is directly available:

```bash
ln -s "$PWD/bin/lmctl-next" ~/bin/lmctl-next
```

If `~/bin` is not on your `PATH`, either add it or keep using
`node bin/lmctl-next`.

## Verify the setup

Run:

```bash
lmctl-next status
```

The command reports the active profile, current project context when one can be
resolved from your working directory, recent runs, open attentions, and detected
providers.

You now have enough setup for the first workflow tutorial.
