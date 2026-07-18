---
title: Adversarial review
sidebar_position: 2
---

# Adversarial review

Review matters. The market has already priced it: **CodeRabbit**, a company that
does nothing but AI code review, grew into a high-value business on that premise
alone. If a dedicated reviewer is worth a company, it's worth a seat on your
team.

lmctl's edge is *where* and *who* the reviewer is:

- **A different provider and model than the author.** This is adversarial
  review, not self-review. A model can't rubber-stamp its own blind spots when
  the reviewer isn't that model. Diversity of provider is the point — see
  [Players & model diversity](./players-and-diversity.md).
- **A local player with full codebase context.** The reviewer is a member of
  your team running on your machine. It can read the whole repository, its
  history, the durable-memory record, and the surrounding code — not just a PR
  diff. A remote SaaS reviewer sees the diff; a local adversarial player sees the
  project.

<div className="whyDiagram">
  <div className="whyDiagramTitle">Independence path</div>
  <div className="whyFlow">
    <div className="whyNode">
      <strong>Author</strong>
      <span>Coder on one provider/model makes the change.</span>
    </div>
    <div className="whyArrow">→</div>
    <div className="whyNode">
      <strong>Full project context</strong>
      <span>Repo, git state, and durable-memory stay local.</span>
    </div>
    <div className="whyArrow">→</div>
    <div className="whyNode">
      <strong>Independent reviewer</strong>
      <span>Different provider/model checks the work.</span>
    </div>
  </div>
</div>

## Recommended setups

A reliable setup pattern is:

- Put a strong planning model in the **Lead** seat.
- Put one provider/model in the **Coder** seat.
- Put a different provider/model in the **Reviewer** seat.

For example:

```text
_MEMBER_ alias=Lead     provider=claude
_MEMBER_ alias=Coder    provider=codex
_MEMBER_ alias=Reviewer provider=agy
```

The Lead plans and delegates, the Coder implements, and the Reviewer — a
different provider/model than the Coder — reads the change against the full
project and pushes back. Swap the providers to fit the subscriptions and models
you already use.

<figure className="screencastSlot" data-video-src="/assets/screencasts/handoff-review.mp4">
  <div className="screencastPlaceholder">
    <span className="screencastKicker">Planned screencast</span>
    <strong>“it hands work off for me”</strong>
    <span>Show a Lead relaying a Coder change to a Reviewer on a different model.</span>
  </div>
  <figcaption>Future asset path: <code>/assets/screencasts/handoff-review.mp4</code></figcaption>
</figure>

## How the approaches compare

The qualities that matter for a reviewer, framed across three approaches:

| Quality | lmctl adversarial local reviewer | Single-model self-review | Remote PR-only reviewer |
| --- | --- | --- | --- |
| Independent model (not the author)? | Yes | No | Yes |
| Full repo history & context? | Yes | Yes | No — sees the diff |
| Runs locally on your machine? | Yes | Yes | No |
| Knows durable-memory / project record? | Yes | Sometimes | No |

This is a qualitative frame, not a benchmark — the takeaway is that the local
adversarial reviewer is the only column with "yes" across all four rows.

## Related

- [Players & model diversity](./players-and-diversity.md)
- [Context & durable memory](./context-and-durable-memory.md) — what the reviewer
  reads from.
- [Concepts & glossary](../manuals/concepts-glossary.md)
