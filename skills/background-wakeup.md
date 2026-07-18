---
name: background-wakeup
description: Obsolete lmctl wake-loop guidance retained as a compatibility note.
---

# Skill: Background wake-up

This wake-loop skill is obsolete for current lmctl.

Default delegation is synchronous `lmctl chat`: it blocks for one member turn
and returns that member's reply.

Do not document a separate lmctl wake/harvest command for LLMs to call.
Queued member mail is delivered by the next `lmctl chat` to that same receiver
after the receiver is free. Supervisor notification tooling is
root/supervisor-only, not regular agent workflow.

Use the Lead skill for current delegation guidance.
