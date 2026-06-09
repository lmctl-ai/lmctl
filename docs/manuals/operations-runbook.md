---
title: Operations Runbook
sidebar_position: 4
---

# Operations runbook

This page maps common operator questions to the `lmctl-next` commands to run.
For the API command group definition, see
[apicli](./cli-apicli-reference.md#apicli).

## Start by orienting

```bash
lmctl-next status
lmctl-next api attentions --json
```

Use `lmctl-next status` for the human-readable operator view. It resolves the
current project from your working directory when possible. Use
`lmctl-next api status` when you need the daemon status payload.

## What is waiting for me?

```bash
lmctl-next api attentions --json
lmctl-next api escalations list --json
```

Attentions are durable notifications. Escalations are workflow pauses waiting
for operator input.

Respond to an escalation:

```bash
lmctl-next api escalations respond <attention_id> "Use the smaller scope and continue."
```

## What happened in a run?

List recent runs and inspect one:

```bash
lmctl-next api runs
lmctl-next api run <id>
```

List queued jobs:

```bash
lmctl-next api jobs
lmctl-next api job <id>
```

A job is the queued request. A run is the workflow execution created from the
job.

## Run a workflow

```bash
lmctl-next api submit-job \
  --workflow qa-suite \
  --project my-project \
  --inputs '{"project_name":"my-project"}'
```

`submit-job` waits for the run to reach a terminal state.

## Diagnose a stuck run

Start with:

```bash
lmctl-next status
lmctl-next api run <id>
lmctl-next api attentions --json
lmctl-next diagnose
```

If the run is paused for input, answer the escalation. If the run failed, use
the run detail and diagnostic bundle as evidence for an issue.

## Issue lifecycle

List open issues:

```bash
lmctl-next api issues list my-project --status open --json
```

Create an issue:

```bash
lmctl-next api issues create my-project \
  --title "Status smoke failed" \
  --body "Expected status data; observed a terminal failure in the workflow run." \
  --severity high
```

Close an issue after the fix is verified:

```bash
lmctl-next api issues close <id> --commit-hash <sha>
```
