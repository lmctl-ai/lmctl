---
name: durable-memory
description: How a team uses durable-memory as shared provider-agnostic project memory.
---

# Skill: Durable memory

`durable-memory/` is the team's shared, provider-agnostic memory - its brain.

Every member, whatever its provider (Claude, Codex, agy, ...), reads it as
context, so knowledge is shared across agents and survives fresh sessions: a
refreshed or swapped-in agent loses its chat history but not what is written
here.

When a task is done, record durable project knowledge in `durable-memory/` and
keep `durable-memory/index.md` current so any agent can get up to speed fast.

