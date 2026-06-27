---
title: Players & model diversity
sidebar_position: 1
---

# Players & model diversity

A **player** is a team member backed by a native provider CLI. You give it an
alias, point it at a provider and a model, and it takes a role on the team. The
team itself is just a plain-text `.lmctl` teamfile — a list of players and the
Lead that coordinates them.

The thesis behind lmctl is simple: **different models have different,
uncorrelated blind spots.** A model that misses a class of bug, or favors a
particular design, tends to do so consistently — and its own clones share that
weakness. A team that mixes providers and models catches what any single model,
or a room full of identical ones, would miss. The same reason ensembles beat a
single estimator, and the same reason you don't review your own code.

## The native players

lmctl drives seven native provider CLIs directly:

- **Claude** — Anthropic's Claude Code CLI. Strong all-rounder; common Lead and
  reviewer choice.
- **Codex** — OpenAI's coding CLI. Strong implementer and an excellent
  adversarial reviewer against a Claude author.
- **Gemini** — Google's Gemini CLI. Requires an **API or enterprise** Google
  account (see the note below).
- **GitHub Copilot** — Copilot's CLI, with access to its hosted GPT/Claude/Gemini
  model fleet.
- **OpenCode** — the open, model-agnostic CLI; the bridge to *any* model (see
  below).
- **Qwen** — Alibaba's Qwen coding CLI.
- **Antigravity (`agy`)** — Google's Antigravity CLI; the recommended path for
  **personal** Google subscriptions.

> **Gemini note:** the `gemini` provider needs an API or enterprise Google
> account. Personal-subscription users should use **`agy`** (Antigravity)
> instead.

## Any model can be a player

Through the **OpenCode** provider, lmctl reaches essentially *any* model — local
(Ollama) or remote (DeepSeek, OpenRouter/Qwen, GitHub Copilot's GPT/Claude/Gemini,
any OpenAI-compatible endpoint). You declare those models in an `opencode.json`
config and then assign them to members like any other player.

See the [sample config](https://lmctl.com/examples/opencode.json) — five
providers and 26 Copilot models wired up and ready to use.

## How players talk

- **Within a team (Lead ↔ members):** intra-team wiring is implicit. Every
  `_MEMBER_` line in a teamfile is already connected to that team's Lead — there
  is nothing else to declare.
- **Across teams:** cross-team calls work **automatically at runtime**. A Lead
  can message a member of another team with no static declaration, and lmctl
  applies **automatic cycle protection** so a runaway loop can't spin forever.
  (The old `_CONNECT_` statement was removed — there is nothing to wire.)

See [Cross-team calls](../manuals/teams-connect.md) for the full model.

## Organizing players into teams — and into workflows

You compose players in plain text. A team is the first `_MEMBER_` (the Lead) plus
the members it works with:

```text
_MEMBER_ alias=Lead     provider=claude  model=<id>  sessiondir=/path/to/project
_MEMBER_ alias=Coder    provider=codex   model=<id>  sessiondir=/path/to/project
_MEMBER_ alias=Reviewer provider=agy     model=<id>  sessiondir=/path/to/project
```

When a team pattern recurs, capture it as a **workflow** (`.compound.json`).
lmctl ships **19 built-in workflows**, browsable in the
[templates catalog](https://lmctl.com/lmctl/docs/manuals/templates-catalog), with
the hosted JSON at [lmctl.com/workflows/](https://lmctl.com/workflows/). Run one
directly with `lmctl run <url>`.

## Related

- [Adversarial review](./adversarial-review.md) — diversity applied to review.
- [Cost & model routing](./cost-and-model-routing.md) — picking the right model
  per role.
- [Concepts & glossary](../manuals/concepts-glossary.md) — the core objects.

> _Backed by real usage. Diagrams of team / cross-team topologies and per-workflow pages are being prepared and will be presented here._
