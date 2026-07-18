---
title: Running QA with ai-test Chapters
sidebar_position: 3
---

# Running QA with ai-test chapters

`ai-test/` chapters are markdown test prompts: setup, action, expected result,
and cleanup for one manual or semi-automated check. In current lmctl, ask a
Lead to run them with its members.

## Prepare a team

Use a teamfile with a Lead, a Tester, and a Reviewer:

```text
_MEMBER_ alias=Lead     provider=codex
_MEMBER_ alias=Tester   provider=codex
_MEMBER_ alias=Reviewer provider=claude
```

Then seed it:

```bash
lmctl lint ./team.lmctl
lmctl seed ./team.lmctl
```

This setup intentionally mixes providers: one agent records observations and
another interprets them. Cross-provider review catches different failure modes
than a single-model loop.

## Add a chapter

Create a markdown file under `ai-test/`:

```bash
mkdir -p ai-test
```

Use this chapter shape:

````markdown
---
name: api-status-ok
description: Status command responds successfully
type: smoke
tags: [status]
last_run_at: never
last_run_status: unknown
last_run_id: 0
---

# Test: Status command

## Setup

lmctl is installed and provider CLIs are authenticated.

## Action

Run:

```bash
lmctl status
```

## Expected

- Command exits 0.
- Output includes team/member state or workspace summary.

## Cleanup

No cleanup required.
````

## Ask the Lead to run the chapter

```bash
lmctl chat ./team.lmctl Lead "Run the ai-test/api-status-ok.md chapter. Ask Tester to execute it, ask Reviewer to verify the observation, then report STANCE: ok/blocked/inconclusive."
```

## Understand STANCE

Agents communicate routing outcomes with a final `STANCE:` line:

| STANCE | Meaning |
| --- | --- |
| `ok` | The step passed or completed successfully. |
| `blocked` | The step failed or cannot proceed. |
| `inconclusive` | There is not enough evidence to decide. |
| `rejected` | A reviewer rejected the result in a review loop. |

The Lead's instructions decide the next handoff. Put `STANCE: <value>` on the
final line when you are authoring agents or test instructions that participate
in this style of QA.
