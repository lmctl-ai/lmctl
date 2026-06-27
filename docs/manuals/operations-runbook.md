---
title: Operations Runbook
sidebar_position: 4
---

# Operations runbook

This page maps common operator questions to the `lmctl` commands to run.
For the full command list, see the [CLI reference](./cli-reference.md).

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

Show one escalation when you need the exact prompt:

```bash
lmctl api escalations show <attention_id> --json
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

You can also use the top-level runner:

```bash
lmctl workflow run --workflow qa-suite --project my-project --inputs '{"project_name":"my-project"}' --json
```

## Diagnose a stuck run

Start with:

```bash
lmctl status
lmctl api run <id>
lmctl api run timeline <id>
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
lmctl api issues close <id> --commit-hash <sha> --closed-run-id <run>
```

## Teamfile maintenance

```bash
lmctl lint ./team.lmctl
lmctl seed ./team.lmctl
lmctl clone ./team.lmctl ./team-template.lmctl
```

Run `lint` before `seed` after editing a teamfile. Cross-team calls work
automatically at runtime — there is nothing to wire up.
