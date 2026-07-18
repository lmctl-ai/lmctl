---
title: Context & durable memory
sidebar_position: 3
---

# Context & durable memory

As a project grows, the single-context approach hits a wall. One model trying to
hold the whole project in one window runs into two problems at once:

- **Cost.** A large context is expensive on every turn.
- **Dilution.** A model attends *worse* as its window fills — the signal you
  care about competes with everything else loaded in. And the usual escape hatch,
  **compaction**, is lossy: it throws away detail to make room.

lmctl's answer is **division of context plus offline durable memory.**

## Division of context

Split the work so no single player has to hold everything:

- **The Lead focuses on delegation** — planning, assigning jobs, and retaining
  the whole-project picture. It carries the map, not every street.
- **Each Coder focuses on one task** with a tight, task-scoped context. It needs
  to know its job and the code it touches, not the entire history.

This keeps every window small enough to stay sharp, and the cost where it pays
off.

## Refresh instead of compact

When a Coder drifts — its context gets muddy, or it wanders off the task —
lmctl's move is not lossy compaction. The Lead simply **refreshes** it: starts a
fresh session for that member. Because the canonical knowledge lives outside the
session (see below), a fresh session loses nothing important. You get a clean,
sharp context back instead of a compressed, degraded one.

## durable-memory: the shared brain

**durable-memory** is the provider-agnostic record of the project, stored *with*
the project as markdown. Every member reads it, whatever provider backs that
member. It is the canonical project knowledge layer; provider sessions are just
disposable caches.

Because the canonical state lives in durable-memory, it survives:

- **fresh sessions** — a refreshed Coder reads back in,
- **provider swaps** — switch a member from one provider to another and the
  knowledge carries over,
- **session corruption** — a broken native session is no longer a loss,
- **project relocation** — durable-memory travels with the project directory.

<div className="whyDiagram">
  <div className="whyDiagramTitle">What is disposable vs durable</div>
  <div className="whyFlow">
    <div className="whyNode">
      <strong>Provider session</strong>
      <span>Useful cache: chat history, native session state, model context.</span>
    </div>
    <div className="whyArrow">→</div>
    <div className="whyNode">
      <strong>durable-memory/</strong>
      <span>Committed Markdown: decisions, current state, handoff notes.</span>
    </div>
    <div className="whyArrow">→</div>
    <div className="whyNode">
      <strong>Fresh member</strong>
      <span>Reads the same record after refresh, model swap, or checkout.</span>
    </div>
  </div>
</div>

## The net effect

Division of context plus durable-memory means **project size is scalable**, runs
can span days or weeks, and the team's overall memory stays sharp the whole time
— without paying for one enormous, diluted context window.

## Related

- [Cost & model routing](./cost-and-model-routing.md) — the cost side of the same
  design.
- [Adversarial review](./adversarial-review.md) — the reviewer reads from
  durable-memory too.
- [Architecture overview](../manuals/architecture-overview.md) — durable-memory
  versus sessions.
