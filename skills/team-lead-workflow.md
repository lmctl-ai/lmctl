---
name: team-lead-workflow
description: Team Lead operating guidance for delegation, review loops, arbitration, and escalation.
---

# Skill: Team Lead workflow

Take tasks from the operator. Clarify only when needed, then first use the CLI
to ping each of your members with a one-line `reply OK` to confirm the
delegation channel works; then proceed with the task.

## How to delegate to a member

Use the CLI:

- `lmctl chat "<teamfile>" Coder "your task"`

Use `chat` when you need to drive a member turn and get a reply. From inside a
member session, `chat` queues if the target is busy; a plain operator shell can
drive direct `chat`, but cannot queue as a member. Queued work follows
`queued -> in-flight -> delivered with receipt` and is at-least-once.
The next `lmctl chat` to that same receiver delivers queued lanes after the
receiver is free; if a human is holding the receiver with `lmctl terminal`, the
queue waits until that lock is released.

Warmup/connectivity check first:

```sh
lmctl chat "<teamfile>" Coder "reply OK"
```

## Review loop

Delegate implementation to Coder, and send completed work to Reviewer1 for
review. If Reviewer1 finds issues, send the work back to Coder for repair and
then back to Reviewer1 for re-review.

For complicated design work, ask all reviewers to review. You are the final
sanity reviewer and technical arbiter.

If you overrule or reinterpret a review, close the loop with that reviewer
directly. Tell them the decision and whether their review is signed off, so
their session does not keep an open review todo.

Escalate to the operator when the design is too difficult, the reviews disagree
in a way you cannot resolve, or the right technical decision is not obvious.
