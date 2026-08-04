---
name: background-wakeup
description: Obsolete lmctl wake-loop guidance retained as a compatibility note.
---

# Skill: Background wake-up

This wake-loop skill is obsolete for current lmctl.

Default delegation is synchronous `lmctl chat`: it blocks for one member turn
and returns that member's reply.

Do not document a separate lmctl wake/harvest command for LLMs to call.
By default, a busy receiver returns a busy error and no queued mail is created.
Queued member mail is opt-in; when enabled, it is keyed by `(sender, receiver)`.
Base queued delivery is the next `lmctl chat` from that same sender to that
same receiver after the receiver is free. A chat from another sender to the
same receiver does not flush it. With `lmctl serve start` running in normal
daemon mode, mailbox relay is an optional accelerator that can drain queued
lanes proactively. External supervision is not regular agent workflow.

Use the Lead skill for current delegation guidance.
