---
title: Direct Chat & Background Work
sidebar_position: 3
---

# Direct chat & background work

Current command surface: `lmctl chat` blocks for one member turn and returns
the member reply by default. Optional async delegation exists through
`lmctl chat --detach` from a member session.

## Synchronous direct chat

Use `lmctl chat` when you want one member to handle one prompt now:

```bash
lmctl chat ./team.lmctl Coder "Implement the smallest safe fix."
lmctl chat ./team.lmctl Reviewer "Review Coder's latest change."
```

This blocks until the provider turn finishes or errors. It is the right path
for handoffs, review requests, and operator answers where the shell should stay
attached to the result.

## Detached member delegation

Use `--detach` only from inside a member session:

```bash
lmctl chat ./team.lmctl Coder "Run the long verification pass." --detach
```

`--detach` is unconditional enqueue/fire-and-forget. It requires
`LMCTL_SELF_SESSIONID`; without that marker, lmctl rejects the call because it
cannot identify the sender. The message is relayed to the receiver and the
response returns to the sender.

This is the current `chat --detach`, shipped as enqueue-only member delegation.
It is different from the old detached delegation-job pattern that was removed.
Do not pair it with a separate LLM-called harvest command; queued delivery is
handled by the next `lmctl chat` to that receiver.

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
message in one turn. If the receiver is still in a provider turn, or a human is
holding that member with `lmctl terminal`, the mail waits. Nothing is lost.
Run `lmctl status` to see pending outbound lanes and member busy/idle state.

## Supervisor notifications

`notify_all` is real only as supervisor/root tooling: `admincli notify`,
`admincli watch`, or standalone `notify_all.py`. It is observe-only by default;
regular LLM agents do not call it. Queued member mail does not require a
separate supervisor command.

## Daemon workflow jobs

Use workflow jobs for repeatable pipelines:

```bash
lmctl workflow run --workflow image-qa --project my-project --inputs '{"image_path":"sample.png"}'
lmctl api jobs
lmctl api runs
lmctl api attentions
```

Workflow jobs are executed by `lmctl serve`. Inspect workflow queue state with
`lmctl api jobs`; inspect run state with `lmctl api runs` and `lmctl api run
<id>`. Human input, pauses, and failures surface as attentions.

## Quick choice

| Need | Use |
| --- | --- |
| Ask one member and receive the reply | `lmctl chat <teamfile> <alias> "<prompt>"` |
| Fire-and-forget from a member session | `lmctl chat <teamfile> <alias> "<prompt>" --detach` |
| Deliver queued member mail | Send the next `lmctl chat` to the same receiver after it is free |
| Supervise down Leads / queued mail | root/supervisor tooling, not an LLM-called command |
| Run a repeatable workflow pipeline | `lmctl workflow run` / `lmctl api submit-job` plus `lmctl serve` |
