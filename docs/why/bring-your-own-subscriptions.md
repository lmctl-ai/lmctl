---
title: Bring your own subscriptions
sidebar_position: 5
---

# Bring your own subscriptions — add, don't switch

You already pay for at least one AI coding subscription. lmctl lets you **use the
plans you already have — together, in one team — and own the choice of which model
does what.** No lock-in, no re-platforming.

**lmctl is an orchestrator, not a model.** It doesn't sell you tokens or a model of
its own — it coordinates the provider subscriptions you *already* pay for into one
team, so you decide which model plays each role.

## The usual pitch vs. ours

The common pitch is a **switch**: *"Claude is expensive — drop it and move to a
cheaper model."* That trades one lock-in for another, and asks you to give up the
model you trust for the work that actually needs it.

lmctl's pitch is **add, don't switch**:

- Keep your top-tier model where judgment pays off — the **lead**, the **reviewer**,
  the **designer**.
- **Add** a cheaper, capable model for the high-volume mechanical work — the
  **coder** doing the bulk of the typing on a well-scoped task.
- Where a cheaper provider does the job just as well, **use it** — your call, per
  role. If it doesn't, you haven't lost your premium model; it's still on the team.

You're not betting the whole project on one vendor being cheapest *and* best. You
mix them, and the cheap seats save you money without dragging down the seats that
matter.

## Phase 1: subscriptions, not metered API

Most solo developers and small startups don't run on per-token API billing — they
run on **flat monthly coding plans**. lmctl drives those plans **through each
provider's own CLI**, so every seat runs on whatever subscription you already hold:

| Plan / subscription | lmctl provider |
| --- | --- |
| Claude Pro / Max (Claude Code) | `provider=claude` |
| ChatGPT / Codex | `provider=codex` |
| GitHub Copilot (Pro / Pro+) | `provider=opencode` |
| Google Antigravity | `provider=agy` |
| **Alibaba Qwen Coding Plan (Qwen Code)** | **`provider=qwen`** |

Put them in one team and each member uses your existing plan — no new billing
relationship, no per-token surprises.

## Qwen Code, explicitly

Alibaba's **[Qwen Coding Plan](https://www.alibabacloud.com/help/en/model-studio/coding-plan)**
(on Model Studio) is a flat monthly subscription — from ~**$50/month**, roughly
**90,000 requests/month** — for the latest **Qwen3.5-Plus** coding models (and
others: GLM-5, Kimi, MiniMax). It works with **Qwen Code** (and Claude Code), so
lmctl reaches it directly as `provider=qwen`.

In lmctl, Qwen Code is a **first-class, equal member** — capable enough to take
*any* seat (lead, reviewer, or coder), not only the cheap one. Put it where it
earns its place; the point is that it plays as a peer, not a fallback.

Drop a Qwen coder onto a team that keeps a Claude lead and a Codex reviewer:

```text
_MEMBER_ alias=Lead      provider=claude  model=<top-tier-id>
_MEMBER_ alias=Coder     provider=qwen    model=qwen3-coder-plus
_MEMBER_ alias=Reviewer  provider=codex   model=<top-tier-id>
```

Three subscriptions, one team, **adversarial cross-provider review** — and the
heavy typing runs on the cheapest capable seat.

## Why this means no lock-in

Because **you own the subscriptions** and **compose the team in plain text**,
switching is a one-line edit. Nobody's ecosystem owns your workflow:

- A provider raises prices or ships a worse model? Change one `provider=`/`model=`
  line; the rest of the team is untouched.
- A new coding plan appears with a better deal? Add it as a member and try it on a
  real task, next to what you already run.
- Your durable-memory and teamfiles are provider-agnostic plain text — they
  outlive any single vendor.

The point of a diverse team isn't only quality (different models, different blind
spots) — it's **leverage**: once you can mix providers freely, no single one can
raise your costs or corner your workflow.

## What's next (phase 2): API

Subscriptions are where solo devs and small teams start. Once you've felt what
*choice* is worth on flat plans, the same per-role routing extends to **per-token
API** — bursty, high-throughput work — with the identical teamfile. Same freedom,
different meter.

## Related

- [Cost & model routing](./cost-and-model-routing.md) — match model cost to role.
- [Players & model diversity](./players-and-diversity.md) — why a varied team
  catches what one model can't.
