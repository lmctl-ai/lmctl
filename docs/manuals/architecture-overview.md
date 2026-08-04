---
title: Architecture Overview
sidebar_position: 4
---

# Architecture overview

lmctl is single-operator and runs on Linux/WSL2. The `lmctl` CLI sets up and
operates everything on its own, working directly against local state.
The `lmctl serve start` daemon is optional local infrastructure for the HTTP
API, web UI, terminal manager, agent services, and opt-in mailbox relay. With
the default synchronous chat model, busy member chat does not create queued mail,
so there may be nothing for the relay to drain. The
hosted web console at [lmctl.ai](https://lmctl.ai) is optional — a subscription
feature (free and premium tiers), not required to run lmctl.

The architecture is provider-agnostic. Teams can mix Claude, Codex, Gemini,
Copilot, OpenCode, Qwen, Kimi, and Antigravity, which makes **adversarial
cross-provider review** (the reviewer is a different provider and model than the
author, not the same model self-reviewing) and cost-aware role routing
first-class operating patterns. The operator composes and tunes these teams in
plain text — agents are not auto-spawned by a single provider.

## Pipeline as the organizing layer

The workflow pipeline is the organizing layer. A workflow definition declares
which agent or tool step runs, what inputs it receives, and how outcomes route
to the next step or terminal state.

That design makes recurring AI-agent work repeatable. Operators submit the
workflow and inputs; the workflow controls the sequence.

## The local daemon

`lmctl serve start` starts the local daemon. It is useful for daemon-backed API,
web UI, terminal, agent-service, and opt-in queue-relay use. Project, workflow, team,
job, run, issue, and attention state lives in a SQLite workspace database,
normally under `~/.lmctl/`, using Node's built-in `node:sqlite` backend. The
`lmctl` CLI reads and writes that local state directly; start `serve start` when
you need those daemon-backed services. The optional hosted web
console at
[lmctl.ai](https://lmctl.ai) (a free/premium subscription) connects to the same
local daemon — everything it does is also doable from the CLI.

```bash
setsid lmctl serve start > lmctl.log 2>&1 < /dev/null & disown
lmctl api status
```

## Cloud transport and metering

This applies only to the optional cloud console. It does not reach your machine
directly; it exchanges messages with the hosted services over a **cloud mailbox
transport** backed by a cloud bucket (S3). That cloud transport is separate from
local member-to-member mailbox lanes in the event log. The poll uses a
GET-next-sequence protocol: each fetch asks for the next sequence number rather
than listing object versions.
Cloud usage is metered against a quota. The local CLI does not use this path —
it works directly against local state.

## Job to run

Submitting a workflow creates a job. The runtime creates a run from that job and
records step state until the run reaches a terminal state.

```text
job: submitted request
run: workflow execution record
```

## durable-memory and sessions

durable-memory is the canonical project knowledge layer. Provider sessions are
disposable caches owned by native provider CLIs. Agents can read durable-memory
on demand, so project knowledge can survive fresh sessions, compaction, and
provider changes. This is the load-bearing design idea: because canonical state
lives in durable-memory and sessions are just cache, drift, compaction, and
provider swaps are cheap.

## Operator notifications

An operator notification is durable state about a condition that needs
visibility even after a shell session exits. Older API compatibility surfaces
may expose this as "attentions", but current public agent workflows should use
`lmctl status`, `lmctl tail`, and the operator's normal tracker instead of
driving attention endpoints directly.
