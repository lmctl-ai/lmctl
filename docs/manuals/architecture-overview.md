---
title: Architecture Overview
sidebar_position: 4
---

# Architecture overview

lmctl is single-operator and runs on Linux/WSL2. `lmctl serve` is the single
always-on daemon documented here; the CLI, the hosted web console, and MCP
bridges are HTTP satellites of it.

## Pipeline as the organizing layer

The workflow pipeline is the organizing layer. A workflow definition declares
which agent or tool step runs, what inputs it receives, and how outcomes route
to the next step or terminal state.

That design makes recurring AI-agent work repeatable. Operators submit the
workflow and inputs; the workflow controls the sequence.

## Daemon and API client

`lmctl serve` starts the single always-on daemon, which listens over HTTP on
`127.0.0.1:8787`. `lmctl api ...` commands are an HTTP client of that daemon.
Project, workflow, team, job, run, issue, and attention state is stored in a
SQLite profile under `~/.lmctl/` (better-sqlite3, compiled at npm install). The
hosted web console at lmctl.ai and MCP bridges are also HTTP satellites of the
daemon.

```bash
lmctl serve > lmctl.log 2>&1 &
lmctl api status
```

## Cloud transport and metering

Traffic between a client and the hosted services travels over a mailbox backed
by a cloud bucket. The poll uses a GET-next-sequence protocol: each fetch asks
for the next sequence number rather than listing object versions. Client and
browser usage is metered against a quota.

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
