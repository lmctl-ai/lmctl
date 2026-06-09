---
title: Architecture Overview
sidebar_position: 4
---

# Architecture overview

lmctl is local-first. `lmctl-next` is the command and repo for the shipped
runtime documented here.

## Pipeline as the organizing layer

The workflow pipeline is the organizing layer. A workflow definition declares
which agent or tool step runs, what inputs it receives, and how outcomes route
to the next step or terminal state.

That design makes recurring AI-agent work repeatable. Operators submit the
workflow and inputs; the workflow controls the sequence.

## Daemon and API client

`lmctl-next serve` starts the local daemon. `lmctl-next api ...` commands talk
to that daemon. Project, workflow, team, job, run, issue, and attention state is
stored in the local SQLite profile.

```bash
lmctl-next serve > lmctl.log 2>&1 &
lmctl-next api status
```

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
provider changes.

## Attentions

An attention is a durable operator notification. It lets the runtime preserve
conditions that need visibility even after a shell session exits.

```bash
lmctl-next api attentions --json
```
