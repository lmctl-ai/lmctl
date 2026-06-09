---
title: ai-test Chapter Format
sidebar_position: 6
---

# ai-test chapter format

An `ai-test` chapter is a markdown file describing one test. The `qa-suite`
workflow reads chapters from a project's `ai-test/` directory.

## File layout

```markdown
---
name: <slug>
description: <one-line description>
type: smoke | regression | integration | exploratory
tags: [tag1, tag2]
last_run_at: never
last_run_status: pass | fail | inconclusive | unknown
last_run_id: 0
---

# Test: <human title>

## Setup

What system state must exist before the test runs.

## Action

The exact command or operation to perform.

## Expected

Specific assertions that define a pass.

## Cleanup

Idempotent teardown. Safe to run even when earlier steps fail.
```

## Writing good expected results

Prefer concrete assertions:

- Command exits 0.
- HTTP status is 200.
- JSON contains `jobs.total >= 0`.
- Response time is less than 1 second.

Avoid vague outcomes such as "works correctly" or "looks good".

## Tester and interpreter split

In a QA workflow, the tester records observations: commands, output, exit
codes, errors, and response bodies. The interpreter compares those observations
to `## Expected` and emits a final stance.

Use the final line for routing:

```text
STANCE: ok
```

Valid values are `ok`, `blocked`, `inconclusive`, and `rejected`.
