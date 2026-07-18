---
title: Concepts & Glossary
sidebar_position: 1
---

# Concepts & glossary

lmctl is a teamfile-driven AI-agent coordination tool. The command documented
here is `lmctl`; install it from npm as `@lmctl-ai/lmctl`.

The main objects are teamfiles, teams, members, provider sessions, mailbox
lanes, and durable-memory.

The current positioning is practical:

- **Provider-agnostic control plane** — one CLI over Claude, Codex, Gemini,
  Copilot, OpenCode, Qwen, and Antigravity (`agy`). Through the **OpenCode**
  provider this reaches essentially *any* model — local (Ollama) or remote
  (DeepSeek, Qwen, OpenRouter, GitHub Copilot's GPT/Claude/Gemini, any
  OpenAI-compatible endpoint). A single team can mix any collection of these
  models, working together — not one model at a time. See
  [the sample config](https://lmctl.com/examples/opencode.json).
  > **Gemini note:** the `gemini` provider requires an **API or enterprise**
  > Google account. Google has retired the Gemini CLI for **personal**
  > subscriptions — personal-subscription users should use **`agy`**
  > (Antigravity) instead. `lmctl lint` prints a reminder when a member uses
  > `provider=gemini`.
- **Adversarial cross-provider review** — review is done by a *different
  provider and model* than the author, not the same model self-reviewing in a
  different hat (a Claude lead can hand coding to Codex and have Gemini review
  it). A model can't rubber-stamp its own blind spots when the reviewer isn't
  that model. This is the value of **model diversity**: different models have
  different (uncorrelated) blind spots, so a varied team catches what one model —
  or its own clones — can't, the same reason ensembles beat a single model and
  you don't review your own code.
- **Operator-built teams, not auto-spawned agents** — unlike tools where one
  provider spawns agents you can't steer, in lmctl *you* divide the work and
  compose the team in plain text, choose which provider and model plays each
  role, and tune how a lead talks to its members and how teams connect to other
  teams.
- **Durable, scalable sessions** — durable-memory carries durable knowledge;
  provider sessions are useful caches, not the only source of truth.
- **Cost-aware model routing** — assign stronger models to architecture and
  design roles, and leaner models to focused coding or routine roles.

## Core model

- A **teamfile** is the plain-text `.lmctl` document that names a Lead and
  members.
- A **team** is a named set of members, either from a teamfile or DB-backed
  team metadata.
- A **member** is an agent alias backed by a native provider CLI.
- A **mailbox lane** is queued member-to-member mail for one sender and one
  receiver.
- **durable-memory** is the committed knowledge layer that survives provider
  sessions.

## Lead-driven orchestration

In current lmctl, the Lead instruction is the organizing layer. It determines
which member receives work, how review happens, and when to report back.

This makes recurring patterns repeatable: once a pattern stabilizes, write it
down as Lead instructions and keep the load-bearing facts in durable memory.

## Chat and mailbox lifecycle

`lmctl chat` drives one member turn when the receiver is idle. From a member
session, if the receiver is busy, it queues in that sender-to-receiver mailbox
lane. The queued-mail lifecycle is:

```text
queued -> in-flight -> delivered with receipt
```

The next `lmctl chat` to that same receiver delivers the queued lane plus the
new message once the receiver is free. A receiver held by `lmctl terminal` is
legitimately busy, so mail waits instead of failing.

```bash
lmctl chat ./team.lmctl Coder "Implement the smallest safe fix."
lmctl status
```

## Status and mailbox state

`lmctl status` is team/SELF scoped. In a seeded member session it resolves the
caller from `LMCTL_SELF_SESSIONID` and reports identity, teamfile, member
busy/idle state, recent delegation activity, and pending mailbox lanes. Outside
a member session it reports workspace scope with `identity: none`.

## serve and api commands

`lmctl serve` starts local daemon and service integrations. It is not required
for queued member-mail correctness. The `lmctl api ...` commands are part of
the CLI and act on local lmctl state or the local daemon where needed. See the
[CLI reference](./cli-reference.md) for the full command list.

To point the CLI at a remote daemon (advanced), set:

```bash
export LMCTL_API_URL=http://127.0.0.1:8787
export LMCTL_API_TOKEN=<token>
```

## Session, team seed, and sessiondir

A team member is an alias backed by a native provider CLI. Each member has a
provider session directory, or sessiondir, where that provider stores its
native conversation cache.

Run `team seed` after adding members:

```bash
lmctl team seed my-team
```

Seeding starts each provider CLI once, captures the session id, and snapshots
the member prompt so workflows can address members by alias.

Cross-team calls work automatically at runtime — no teamfile wiring is needed.
See [Cross-team calls](./teams-connect.md).

## Model routing

Members can carry role-specific model assignments. Use that to route expensive,
top-tier models to architecture, design, or review work and leaner models to
focused implementation or routine checks. `lmctl lint <teamfile.lmctl>`
validates configured models against the tested catalog for Claude, Codex,
Gemini, Copilot, Qwen, Antigravity, and the lmctl-managed OpenCode model list.

## Durable-memory versus sessions

Provider sessions are useful but disposable. They store native conversation
state in provider-specific formats. durable-memory is provider-agnostic project
knowledge stored under the project, typically as markdown chapters.

This distinction lets a workflow survive compaction, provider swaps, and fresh
sessions without losing the canonical project record.

For a compact lookup page, see [Glossary](../glossary.md).
