---
title: Running QA Suite & ai-test Chapters
sidebar_position: 3
---

# Running QA suite & ai-test chapters

The `qa-suite` workflow runs markdown test chapters from a project's
`ai-test/` directory. Each chapter describes setup, action, expected result,
and cleanup for one manual or semi-automated check.

## Prepare the project

Create or choose a project with a seeded team and a local path:

```bash
lmctl project create qa-project \
  --workflow qa-suite \
  --team qa-team \
  --local-path /tmp/qa-project

lmctl team create qa-team
lmctl team add-member qa-team --alias Tester --provider codex
lmctl team add-member qa-team --alias Interpreter --provider claude
lmctl team seed qa-team
```

Load the workflow:

```bash
lmctl workflow load qa-suite workflows/qa-suite.compound.json
```

## Add a chapter

Create a markdown file under the project directory:

```bash
mkdir -p /tmp/qa-project/ai-test
```

Use the chapter format from the reference page:

````markdown
---
name: api-status-ok
description: Daemon status endpoint responds successfully
type: smoke
tags: [api, status]
last_run_at: never
last_run_status: unknown
last_run_id: 0
---

# Test: API status endpoint

## Setup

The lmctl daemon is running and API auth variables are set.

## Action

Run:

```bash
lmctl api status
```

## Expected

- Command exits 0.
- Response includes status information.

## Cleanup

No cleanup required.
````

## Run the suite

Start the daemon if it is not already running:

```bash
lmctl serve > lmctl.log 2>&1 &
```

Submit the QA workflow:

```bash
lmctl api submit-job \
  --workflow qa-suite \
  --project qa-project \
  --inputs '{"project_name":"qa-project"}'
```

## Understand STANCE

Agents communicate routing outcomes with a final `STANCE:` line:

| STANCE | Meaning |
| --- | --- |
| `ok` | The step passed or completed successfully. |
| `blocked` | The step failed or cannot proceed. |
| `inconclusive` | There is not enough evidence to decide. |
| `rejected` | A reviewer rejected the result in a review loop. |

The workflow maps these values to the next step or terminal state. Put
`STANCE: <value>` on the final line when you are authoring agents or test
instructions that participate in these workflows.
