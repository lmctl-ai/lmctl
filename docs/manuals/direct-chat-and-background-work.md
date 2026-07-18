---
title: Direct Chat & Background Work
sidebar_position: 3
---

# Direct chat & background work

Current command surface: `lmctl chat` blocks for one member turn and returns
the member reply by default. Optional async delegation exists through
`lmctl chat --detach` from a member session.

`lmctl serve` is not just a workflow daemon. It also runs the mailbox relay
that delivers queued member mail after a busy receiver becomes available.

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
Do not pair it with a separate LLM-called harvest command; mailbox delivery is
owned by `lmctl serve` and supervisor/runtime processes, not by a command the
receiving agent has to remember.

## Queued member messages

From inside a member session, `lmctl chat` can still put work into the
sender-to-receiver path when the target is busy. The lifecycle remains:

```text
queued -> in-flight -> delivered with receipt
```

Delivery is at-least-once: after a crash, a queued message may be delivered
again rather than lost.

What delivers queued mail: the `lmctl serve` daemon's mailbox relay scans
pending lanes and delivers messages once the receiver is free. If the receiver
is still in a provider turn, or a human is holding that member with
`lmctl terminal`, the relay leaves the message queued and tries again later.
Run `lmctl status` to see pending outbound lanes and member busy/idle state.

## Supervisor notifications

`notify_all` is real only as supervisor/root tooling: `admincli notify`,
`admincli watch`, or standalone `notify_all.py`. It is observe-only by default;
`--wake` relays queued mail for supervisor-managed cases. Regular LLM agents do
not call it. For normal local queued member mail, keep `lmctl serve` running.

## Start the daemon

Start `serve` when you rely on queued member mail or daemon-backed workflow
jobs:

```bash
lmctl serve > lmctl.log 2>&1 &
```

`lmctl serve` starts the local HTTP API, queue daemon, terminal manager, agent
services, and mailbox relay.

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
| Keep queued member mail moving | `lmctl serve` for the mailbox relay daemon |
| Supervise down Leads / queued mail | root/supervisor tooling, not an LLM-called command |
| Run a repeatable workflow pipeline | `lmctl workflow run` / `lmctl api submit-job` plus `lmctl serve` |
