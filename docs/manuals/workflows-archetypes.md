---
title: Workflows & Archetypes
sidebar_position: 3
---

# Workflows & archetypes

A workflow is a structured state machine. It defines steps, agents, tools,
inputs, and outcome routing. lmctl ships production workflows such as bugfix
loops, PR fixer variants, triage, `qa-suite`, and `image-qa`.

## Workflow definitions

Workflow files usually live under `workflows/` and are loaded into the local
SQLite workspace database:

```bash
lmctl workflow load image-qa workflows/image-qa.compound.json
```

After loading, submit a job by workflow name:

```bash
lmctl api submit-job \
  --workflow image-qa \
  --project my-project \
  --inputs '{"image_path":"/tmp/my-project/sample.png","prompt":"describe this"}'
```

Or use the top-level workflow runner:

```bash
lmctl workflow run --workflow image-qa --project my-project --inputs '{"image_path":"/tmp/my-project/sample.png","prompt":"describe this"}' --json
```

## Archetypes

Archetypes are reusable step types that the workflow engine knows how to lower
and execute.

| Archetype | Use |
| --- | --- |
| Review | Ask an agent to inspect an artifact or answer. |
| Consolidate | Combine multiple outputs into one result. |
| Interactive | Pause for operator input and resume after a response. |
| Loop | Repeat a step sequence until an outcome stops the loop. |
| ShellStep | Run a shell command as part of a workflow. |
| AssertRepoClean | Check that a repository has no unexpected changes. |

## Outcome routing

Agent output is interpreted into an outcome, then the workflow routes to the
next step or terminal state. QA-style agents often use final-line stance values:

```text
STANCE: ok
```

Common values are `ok`, `blocked`, `inconclusive`, and `rejected`. Workflow
definitions decide what those values mean for the next transition.

## Jobs and runs

A job is the queued request. A run is the execution instance created from that
job. For most operator work, submit jobs and inspect runs:

```bash
lmctl api jobs
lmctl api runs
lmctl api run <id>
```
