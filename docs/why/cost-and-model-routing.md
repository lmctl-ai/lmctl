---
title: Cost & model routing
sidebar_position: 4
---

# Cost & model routing

Not every role needs your most expensive model. lmctl lets you **route models by
role**: put top-tier models where judgment pays off, and cheaper-but-capable
models on high-volume mechanical work.

- **Top-tier models** — the **Lead** (planning, delegation, whole-project
  picture), the **designer**, **research**, and the **reviewer**. These roles
  make decisions; pay for quality there.
- **Leaner, cheaper models** — a **Coder** doing heavy read/write on a
  well-scoped task. The work is high volume and mechanical; a capable mid-tier
  model handles it well at a fraction of the cost.

This pairs directly with [division of context](./context-and-durable-memory.md):
a well-scoped Coder doesn't need a frontier model *or* a giant context window.

<div className="whyMatrix whyMatrix4">
  <div className="whyCell whyCellHead">Role</div>
  <div className="whyCell whyCellHead">What it decides</div>
  <div className="whyCell whyCellHead">Model posture</div>
  <div className="whyCell whyCellHead">Why</div>
  <div className="whyCell"><strong>Lead</strong></div>
  <div className="whyCell">Plan, split work, arbitrate reviews</div>
  <div className="whyCell">Top-tier</div>
  <div className="whyCell"><span>Judgment errors propagate across the team.</span></div>
  <div className="whyCell"><strong>Coder</strong></div>
  <div className="whyCell">Implement scoped changes</div>
  <div className="whyCell">Lean capable model</div>
  <div className="whyCell"><span>High-volume work benefits from lower cost per turn.</span></div>
  <div className="whyCell"><strong>Reviewer</strong></div>
  <div className="whyCell">Challenge the result</div>
  <div className="whyCell">Strong independent model</div>
  <div className="whyCell"><span>Review quality depends on seeing what the author missed.</span></div>
</div>

## Routing models in the teamfile

Set the model per member with `model=` on each `_MEMBER_` line. Use
`effort=<variant>` to pick a reasoning variant for OpenCode reasoning models.

```text
_MEMBER_ alias=Lead     provider=claude    model=<top-tier-id>
_MEMBER_ alias=Coder    provider=qwen      model=qwen3-coder-plus
_MEMBER_ alias=Reviewer provider=codex     model=<top-tier-id>
```

A top-tier Lead and Reviewer keep the judgment sharp; a leaner Coder does the
bulk of the typing. `lmctl lint <teamfile.lmctl>` validates the models you pick
against the tested catalog. `effort=` selects a provider variant such as an
OpenCode reasoning-effort profile; lmctl rejects or warns on unsupported
provider/effort combinations.

Version floor: use `@lmctl-ai/lmctl` 0.1.151 or newer for model-routed teams
(verified against 0.1.158). Earlier public-preview builds could silently ignore
`model=` during some seed or terminal paths. After seeding, run
`lmctl health <teamfile.lmctl>` and confirm the `MODEL` column matches the
teamfile before trusting a routed run.

## Cheap-and-capable coder models

Through the **OpenCode** provider, the Coder seat opens up to cost-effective
models — including some that are essentially free to run:

- **DeepSeek** — strong coding quality at low cost.
- **Qwen-coder** — capable, inexpensive coding model.
- **GPT-5-mini** and other small hosted models — cheap per-token, fine for
  scoped tasks.
- **Local models via Ollama** — free to run on your own hardware.

Wire these up in an `opencode.json` — see the
[sample config](https://lmctl.com/examples/opencode.json) for current provider
examples.

We're deliberately not quoting prices here: provider pricing changes often, and a
number that's right today is wrong next quarter. The durable advice is the
*shape* — match model cost to role, and lean on OpenCode for the cheap seats.

## Related

- [Context & durable memory](./context-and-durable-memory.md) — why a scoped
  Coder needs less.
- [Players & model diversity](./players-and-diversity.md) — the providers you can
  route to.
- [Bring your own subscriptions](./bring-your-own-subscriptions.md) — add a
  provider without switching away from the plans you already use.
- [Templates catalog](../manuals/templates-catalog.md) —
  team patterns to start from.
