---
name: background-wakeup
description: Obsolete lmctl wake-loop guidance retained as a compatibility note.
---

# Skill: Background wake-up

This skill is obsolete for lmctl 0.1.116 and later.

Do not use an lmctl wake command from an LLM session. `lmctl chat` is the live
surface: it is synchronous, blocks for one member turn, and returns that
member's reply.

lmctl is agnostic to foreground/background execution. Provider runtimes,
harnesses, shells, and external supervisors own concurrency and wake behavior.
Do not document a separate lmctl command for LLMs to call.

Use the Lead skill for current delegation guidance.
