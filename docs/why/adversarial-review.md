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

## Recommended setups

We've used and tested two pairings intensively:

- **Claude as Lead + Codex as Reviewer**
- **Codex as Lead + Claude as Reviewer**

Both put a strong, independent model on the review seat. A teamfile for the first:

```text
_MEMBER_ alias=Lead     provider=claude  sessiondir=/path/to/project
_MEMBER_ alias=Coder    provider=codex   sessiondir=/path/to/project
_MEMBER_ alias=Reviewer provider=codex   sessiondir=/path/to/project
```

The Lead plans and delegates, the Coder implements, and the Reviewer — a
different provider than the Lead — reads the change against the full project and
pushes back. Swap the providers to get the second setup.

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

> _We have real usage data from running these setups intensively; side-by-side review examples and the measured analysis are being prepared and will be presented here._
