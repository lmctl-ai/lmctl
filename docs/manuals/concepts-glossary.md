---
title: Concepts & Glossary
sidebar_position: 1
---

# Concepts & glossary

lmctl is the workflow-driven AI-agent platform. The command documented here is
`lmctl`; install it from npm as `@lmctl-ai/lmctl`.

The main objects are projects, teams, workflows, jobs, runs, attentions,
provider sessions, and durable-memory.

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
- **Durable, scalable sessions** — durable-memory carries project knowledge;
  provider sessions are useful caches, not the only source of truth.
- **Cost-aware model routing** — assign stronger models to architecture and
  design roles, and leaner models to focused coding or routine roles.

## Core model

- A **project** is a directory bound to a default workflow and a team.
- A **team** is a named set of members.
- A **member** is an agent alias backed by a native provider CLI.
- A **workflow** is a routed definition for sequencing agents and tool steps.
- A **job** is a queued request to run a workflow.
- A **run** is the live state-machine execution created from a job.
- An **attention** is a persistent operator notification.
- **durable-memory** is the project knowledge layer that survives provider
  sessions.

## Workflow-driven orchestration

In lmctl, the workflow definition is the organizing layer. It determines which
agent or tool step runs, how outputs are interpreted, and where each outcome
routes next.

This makes recurring patterns repeatable: once a pattern stabilizes, it can be
captured as workflow definition instead of being reconstructed by hand every
time.

## Job and run lifecycle

A job is the submitted request: run this workflow, against this project, with
these inputs. A run is the execution record created from that job.

The normal lifecycle is:

```text
submit job -> create run -> execute workflow steps -> record terminal state
```

Inspect jobs when you care about queued or submitted work. Inspect runs when
you care about step state, outputs, failures, or terminal state.

```bash
lmctl api jobs
lmctl api runs
lmctl api run <id>
```

## Attention and paused workflows

An attention is a durable operator notification. It can report a failed run,
workflow pause, drift signal, forced lock, or other condition that should not
disappear with a terminal session.

A paused workflow surfaces as an attention waiting for operator input. List
attentions and acknowledge them through the API command group:

```bash
lmctl api attentions
lmctl api attention ack <attention_id>
```

## serve and the api commands

`lmctl serve` is the local always-on daemon that executes queued work. The
`lmctl api ...` commands are part of the CLI and act on your local lmctl state
directly. See the [CLI reference](./cli-reference.md) for the full command list.

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
