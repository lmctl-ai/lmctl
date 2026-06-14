---
title: Operations Runbook
sidebar_position: 4
---

# Operations runbook

This page maps common operator questions to the `lmctl` commands to run.
For the API command group definition, see
[the `api` command group](./cli-apicli-reference.md#api-command-group).

## Start by orienting

```bash
lmctl status
lmctl api attentions --json
```

Use `lmctl status` for the human-readable operator view. It resolves the
current project from your working directory when possible. Use
`lmctl api status` when you need the daemon status payload.

## What is waiting for me?

```bash
lmctl api attentions --json
lmctl api escalations list --json
```

Attentions are durable notifications. Escalations are workflow pauses waiting
for operator input.

Respond to an escalation:

```bash
lmctl api escalations respond <attention_id> "Use the smaller scope and continue."
```

## What happened in a run?

List recent runs and inspect one:

```bash
lmctl api runs
lmctl api run <id>
```

List queued jobs:

```bash
lmctl api jobs
lmctl api job <id>
```

A job is the queued request. A run is the workflow execution created from the
job.

## Run a workflow

```bash
lmctl api submit-job \
  --workflow qa-suite \
  --project my-project \
  --inputs '{"project_name":"my-project"}'
```

`submit-job` waits for the run to reach a terminal state.

## Diagnose a stuck run

Start with:

```bash
lmctl status
lmctl api run <id>
lmctl api attentions --json
lmctl diagnose
```

If the run is paused for input, answer the escalation. If the run failed, use
the run detail and diagnostic bundle as evidence for an issue.

## Issue lifecycle

List open issues:

```bash
lmctl api issues list my-project --status open --json
```

Create an issue:

```bash
lmctl api issues create my-project \
  --title "Status smoke failed" \
  --body "Expected status data; observed a terminal failure in the workflow run." \
  --severity high
```

Close an issue after the fix is verified:

```bash
lmctl api issues close <id> --commit-hash <sha>
```
