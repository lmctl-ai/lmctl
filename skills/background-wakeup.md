---
name: background-wakeup
description: Obsolete lmctl wake-loop guidance retained as a compatibility note.
---

# Skill: Background wake-up

This wake-loop skill is obsolete for current lmctl.

Default delegation is synchronous `lmctl chat`: it blocks for one member turn
and returns that member's reply.

Do not document a separate lmctl wake/harvest command for LLMs to call.
Queued member mail is keyed by `(sender, receiver)` and delivered by the next
`lmctl chat` from that same sender to that same receiver after the receiver is
free. A chat from another sender to the same receiver does not flush it. If the
sender is idle waiting for the reply and never sends again, this can deadlock.
External supervision is not regular agent workflow.

Use the Lead skill for current delegation guidance.
