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
- `lmctl chat "<teamfile>" Coder --prompt-file task.md` for non-trivial prompts

Use `chat` when you need to drive a member turn and get a reply. Queueing
is opt-in. By default, a busy target returns a busy error and creates no queued
mail. If `mailbox_queue_enabled=true` or `LMCTL_MAILBOX_QUEUE_ENABLED=true` is
set and lmctl can resolve a sender, `chat` queues in a `(sender, receiver)` lane
when the target is busy. Queued work follows `queued -> in-flight -> delivered
with receipt` and is at-least-once. Base queued rule: the next `lmctl chat`
from that same sender to that same receiver delivers that sender's queued lane
once the receiver is free. A chat from another sender to the same receiver does
not flush it. With `lmctl serve start` running in normal daemon mode, mailbox
relay is an optional accelerator: it can drain queued lanes proactively after
the receiver goes idle. If the sender is idle waiting for the reply and no relay
drains the lane, delivery can deadlock. If a human is holding the receiver with
`lmctl terminal`, queued mail waits until that lock is released.

Prefer `--prompt-file` for prompts containing command examples, backticks,
`$(...)`, `$VAR`, or quotes; positional prompts are assembled by your shell
before lmctl sees them. Write the prompt file with an editor or file-writing
tool, not `echo` or a heredoc.

Before important sends, run `lmctl status` to see receiver busy/idle state and
queued lanes. In queue-enabled setups, after a queued send, run
`lmctl status --since 7d` and read `Waiting on:` / `mailbox outbound`. Exit `0`
can mean queued, not delivered.

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
