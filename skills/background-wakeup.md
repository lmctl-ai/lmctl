---
name: background-wakeup
description: Obsolete lmctl wake-loop guidance retained as a compatibility note.
---

# Skill: Background wake-up

This wake-loop skill is obsolete for current lmctl.

Default delegation is synchronous `lmctl chat`: it blocks for one member turn
and returns that member's reply.

Optional async delegation is `lmctl chat --detach` from a member session. It
requires `LMCTL_SELF_SESSIONID`; without that marker, lmctl rejects the call.
The message is relayed and the response returns to the sender.

Do not document a separate lmctl wake/harvest command for LLMs to call.
Queued member mail is delivered by the next `lmctl chat` to that same receiver
after the receiver is free. Supervisor notification tooling is
root/supervisor-only, not regular agent workflow.

Use the Lead skill for current delegation guidance.
