---
title: Delegation Patterns & Archetypes
sidebar_position: 3
---

# Delegation patterns & archetypes

The current public lmctl model is teamfile + members + `lmctl chat`. A
repeatable "workflow" is the plain-English instruction you give a Lead, backed
by durable memory and review discipline. lmctl does not require a workflow
object for this.

## Pattern definitions

Pattern files can still be useful as examples, but treat them as prompts and
checklists for the Lead:

> Ask Coder to implement the bug fix, ask Reviewer1 to review it, send issues
> back to Coder until review passes, then commit and report the result.

## Archetypes

Archetypes are reusable team-delegation shapes a Lead can execute with
ordinary member chat:

| Archetype | Use |
| --- | --- |
| Review | Ask an agent to inspect an artifact or answer. |
| Consolidate | Combine multiple outputs into one result. |
| Interactive | Pause for operator input and resume after a response. |
| Loop | Repeat a step sequence until an outcome stops the loop. |
| ShellStep | Run a shell command as part of a workflow. |
| AssertRepoClean | Check that a repository has no unexpected changes. |

## Outcome routing

Agent output is interpreted into an outcome, then the Lead decides the next
handoff. QA-style agents often use final-line stance values:

```text
STANCE: ok
```

Common values are `ok`, `blocked`, `inconclusive`, and `rejected`. The Lead's
instructions decide what those values mean for the next handoff.

## Lead execution

For most operator work, send one concrete instruction to the Lead and let it
coordinate its members:

```bash
lmctl chat ./team.lmctl Lead "Run the bugfix pattern: assign Coder, route to Reviewer1, repair until review passes, then report."
```
