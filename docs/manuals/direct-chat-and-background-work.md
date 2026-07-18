---
title: Direct Chat & Background Work
sidebar_position: 3
---

# Direct chat & background work

Current command surface: `lmctl chat` sends work to one member. When the
receiver is idle it blocks for one member turn and returns the reply. From a
member session, when the receiver is busy, the same command queues the message
instead of dropping it.

## Synchronous direct chat

Use `lmctl chat` when you want one member to handle one prompt now:

```bash
lmctl chat ./team.lmctl Coder "Implement the smallest safe fix."
lmctl chat ./team.lmctl Reviewer "Review Coder's latest change."
```

This blocks until the provider turn finishes or errors. It is the right path
for handoffs, review requests, and operator answers where the shell should stay
attached to the result.

## Queued member messages

From inside a member session, `lmctl chat` can still put work into the
sender-to-receiver path when the target is busy. If it exits 0 with
`enqueued mailbox message N`, that means queued, not delivered yet. The
lifecycle remains:

```text
queued -> in-flight -> delivered with receipt
```

Delivery is at-least-once: after a crash, a queued message may be delivered
again rather than lost.

What delivers queued mail: your next `lmctl chat` to that same receiver. When
the receiver is free, that chat delivers the whole queued lane plus the new
message in one turn. No daemon is required for correctness; a daemon is only an
optional accelerator. If the receiver is still in a provider turn, or a human
is holding that member with `lmctl terminal`, the mail waits. Nothing is lost.
Run `lmctl status` to see pending outbound lanes and member busy/idle state.

## Daemon and supervisor tooling

`lmctl serve` starts local daemon and service integrations. It is not required
for queued member-mail correctness. Regular LLM agents should treat background
supervision as runtime/operator infrastructure, not as a separate command they
must call to harvest member replies.

## Quick choice

| Need | Use |
| --- | --- |
| Ask one member and receive the reply | `lmctl chat <teamfile> <alias> "<prompt>"` |
| Deliver queued member mail | Send the next `lmctl chat` to the same receiver after it is free |
| Inspect pending mailbox lanes | `lmctl status` |
| Run local services | `lmctl serve` |
