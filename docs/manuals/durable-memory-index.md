---
title: Durable Memory Index
sidebar_position: 4
---

# Durable memory index

This page is the public orientation index for lmctl's `durable-memory/`
practice. It is adapted from the project memory index used by lmctl's own
AI-managed development teams.

## What durable-memory is

`durable-memory/` is the canonical project knowledge layer. Provider sessions
are useful caches: they hold native conversation history for Claude, Codex,
Gemini, OpenCode, Qwen, Antigravity, and other tools. durable-memory is the
provider-agnostic record that survives when those sessions are refreshed,
replaced, compacted, or moved.

The default storage shape is simple markdown in the project directory:

```text
durable-memory/
  index.md
  architecture.md
  decisions.md
  runbook.md
```

The index is the first file a fresh agent reads. It should explain what the
project is, which docs are canonical, what changed recently, and where to
resume.

## Why lmctl uses it

lmctl has two complementary orchestration models:

- **Workflow jobs**: repeatable JSON or DSL-defined pipelines executed by
  `lmctl serve`.
- **AI-Lead teams**: `.lmctl` teamfiles where a Lead drives named members
  through `lmctl chat`, tracked invocations, `lmctl more`, and provider
  sessions.

Both models need a memory layer outside any single model window. durable-memory
lets an agent refresh a drifting session, switch providers, or hand work between
members without losing the project record.

See [Direct chat & background work](./direct-chat-and-background-work.md) for
the runtime distinction between synchronous member chat, tracked invocations
with `more`, and daemon workflow jobs.

## What belongs in an index

A useful `durable-memory/index.md` is not a transcript. Keep it short enough for
a fresh agent to read, and point to focused chapters for detail.

Include:

- **Project identity**: what the project does and who uses it.
- **Operating model**: the main workflows, team structure, and handoff rules.
- **Canonical docs**: which files to read second, third, and only on demand.
- **Current snapshot**: shipped state, schema or API versions, important feature
  flags, and known stale docs.
- **Pending work**: active decisions or next implementation tasks.
- **Resume instructions**: how a fresh session should regain context safely.

Avoid:

- long raw transcripts,
- unreviewed speculation,
- secrets or private credentials,
- stale task notes that should be archived,
- local-only paths that a public reader cannot use.

## Agent onboarding pattern

The recommended pattern is index-first, chapter-on-demand:

1. Read `durable-memory/index.md`.
2. Read the few files the index names as required for the current task.
3. Inspect code or runtime state only after the memory map is clear.
4. When the task changes the project, update the relevant memory chapter.
5. Move historical task notes out of the top-level memory surface once they are
   superseded by a live doc or commit history.

This keeps context focused. A fresh agent gets the map without loading every
old decision and evidence ledger into its active window.

## Relationship to provider sessions

Provider sessions can be refreshed when they drift. The refreshed member loses
its native chat history, but re-reads durable-memory and resumes from the
project record.

That gives lmctl three layers:

| Layer | Purpose |
| --- | --- |
| Role prompt | Stable identity and operating contract. |
| Provider session | Disposable conversation cache. |
| durable-memory | Canonical, provider-agnostic project state. |

This is the core recovery model behind long-running AI-agent teams.

## Relationship to public docs

The public lmctl docs explain the product surface:

- [Context & durable memory](../why/context-and-durable-memory.md) explains the
  product idea.
- [Architecture overview](./architecture-overview.md) shows where
  durable-memory fits into local jobs, runs, sessions, and attentions.
- [Templates catalog](./templates-catalog.md) lists the durable-memory scaffold.
- [Operations runbook](./operations-runbook.md) covers refresh and drift
  recovery.

The internal durable-memory index for lmctl development is more detailed. It
tracks implementation snapshots, schema versions, archived task ledgers, and
source-only design docs. Public docs should publish the durable patterns and
current operator guidance, not raw private workspace state.

## Maintenance rule

When a task or design completes, update the live durable-memory chapter that now
owns the knowledge. Archive the task note once its content is represented in a
stable doc or commit. The index should stay a map, not a storage closet.
