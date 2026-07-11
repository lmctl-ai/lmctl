---
name: durable-memory
description: How a team uses durable-memory as shared provider-agnostic project memory.
---

# Skill: Durable memory

`durable-memory/` is the team's portable, provider-agnostic brain.

## Why it exists

Provider sessions are not portable. A provider session id and its chat history
are bound to that provider on that machine. You cannot move them to another
machine, switch provider, or recover them after a refresh/model swap. If you
seed on machine A, the session ids in the teamfile are meaningless on machine B.

## What survives

`durable-memory/` is plain committed Markdown. Every member, whatever its
provider (Claude, Codex, opencode, agy, lmplayer, ...), reads it as context. A
refreshed, swapped, or freshly checked-out agent loses provider chat history,
but keeps the knowledge written here.

## Git split

- `*.lmctl` and `.lmctl/` state are gitignored because they hold
  machine-specific, non-portable session pointers.
- `durable-memory/` is committed because it holds portable project knowledge.
- Never gitignore `durable-memory/`.

## Inbox relation

The distributed inbox is live cross-network communication. `durable-memory/` is
persistent shared knowledge. They complement each other; they are not the same
thing.

## Practice

- Keep one durable fact per file or section.
- When a task completes, record the durable knowledge it produced.
- Keep `durable-memory/index.md` current so any agent can get up to speed fast.
