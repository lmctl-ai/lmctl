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

## Provider surface at a glance

| Surface | Good fit | Why it adds diversity |
| --- | --- | --- |
| Native hosted CLIs (`claude`, `codex`, `gemini`, `copilot`, `qwen`, `agy`) | Lead, coding, review, design | Different provider stacks, tools, and model families sit in one team. |
| OpenCode (`opencode`) | Local models, OpenAI-compatible endpoints, routing through another model host | Brings models outside the first-class CLIs into the same teamfile shape. |
| Plain `.lmctl` teamfile | Role assignment and provider/model selection | Diversity is visible and reviewable as text, not hidden inside one vendor workflow. |

## Any model can be a player

Through the **OpenCode** provider, lmctl reaches essentially *any* model — local
(Ollama) or remote (DeepSeek, OpenRouter/Qwen, GitHub Copilot's GPT/Claude/Gemini,
any OpenAI-compatible endpoint). You declare those models in an `opencode.json`
config and then assign them to members like any other player.

See the [sample config](https://lmctl.com/examples/opencode.json) for OpenCode
provider examples wired up and ready to use.

## How players talk

- **Within a team (Lead ↔ members):** intra-team wiring is implicit. Every
  `_MEMBER_` line in a teamfile is already connected to that team's Lead — there
  is nothing else to declare.
- **Across teams:** cross-team calls work **automatically at runtime**. A Lead
  can message a member of another team with no static declaration, and lmctl
  applies **automatic cycle protection** so a runaway loop can't spin forever.
  (The old `_CONNECT_` statement was removed — there is nothing to wire.)

See [Cross-team calls](../manuals/teams-connect.md) for the full model.

## Organizing players into teams and patterns

You compose players in plain text. A team is the first `_MEMBER_` (the Lead) plus
the members it works with:

```text
_MEMBER_ alias=Lead     provider=claude  model=<id>
_MEMBER_ alias=Coder    provider=codex   model=<id>
_MEMBER_ alias=Reviewer provider=agy     model=<id>
```

When a team pattern recurs, capture it as Lead instructions and durable memory.
The current public model is teamfile + members + `lmctl chat`; repeatable work
comes from the prompt you give the Lead and the review structure you ask it to
enforce.

## Related

- [Adversarial review](./adversarial-review.md) — diversity applied to review.
- [Cost & model routing](./cost-and-model-routing.md) — picking the right model
  per role.
- [Bring your own subscriptions](./bring-your-own-subscriptions.md) — add Qwen
  Code or another coding plan without switching away from your current tools.
- [Concepts & glossary](../manuals/concepts-glossary.md) — the core objects.
