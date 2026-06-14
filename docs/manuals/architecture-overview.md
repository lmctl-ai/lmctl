---
title: Architecture Overview
sidebar_position: 4
---

# Architecture overview

lmctl is single-operator and runs on Linux/WSL2. The `lmctl` CLI sets up and
operates everything on its own, working directly against local state.
`lmctl serve` is the local always-on daemon that executes queued work. The
hosted web console at [lmctl.ai](https://lmctl.ai) is optional — a subscription
feature (free and premium tiers), not required to run lmctl.

## Pipeline as the organizing layer

The workflow pipeline is the organizing layer. A workflow definition declares
which agent or tool step runs, what inputs it receives, and how outcomes route
to the next step or terminal state.

That design makes recurring AI-agent work repeatable. Operators submit the
workflow and inputs; the workflow controls the sequence.

## The local daemon

`lmctl serve` starts the local always-on daemon — the queue worker and agent
services that actually *execute* your jobs and runs. Project, workflow, team,
job, run, issue, and attention state lives in a SQLite profile under `~/.lmctl/`
(better-sqlite3, compiled at npm install). The `lmctl` CLI reads and writes that
local state directly; you start `serve` once and leave it running so submitted
work gets executed. The optional hosted web console at
[lmctl.ai](https://lmctl.ai) (a free/premium subscription) connects to the same
local daemon — everything it does is also doable from the CLI.

```bash
lmctl serve > lmctl.log 2>&1 &
lmctl api status
```

## Cloud transport and metering

This applies only to the optional cloud console. It does not reach your machine
directly; it exchanges messages with the hosted services over a **mailbox**
backed by a cloud bucket (S3). The poll uses a GET-next-sequence protocol: each
fetch asks for the next sequence number rather than listing object versions.
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

## Attentions

An attention is a durable operator notification. It lets the runtime preserve
conditions that need visibility even after a shell session exits.

```bash
lmctl api attentions --json
```
