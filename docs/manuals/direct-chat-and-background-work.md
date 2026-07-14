---
title: Direct Chat & Background Work
sidebar_position: 3
---

# Direct chat & background work

lmctl 0.1.122 defaults to synchronous `lmctl chat`: it blocks for one member
turn and returns the member reply. Optional async delegation exists through
`lmctl chat --detach` from a member session.

## Synchronous direct chat

Use `lmctl chat` when you want one member to handle one prompt now:

```bash
lmctl chat ./team.lmctl Coder "Implement the smallest safe fix."
lmctl chat ./team.lmctl Reviewer "Review Coder's latest change."
```

This blocks until the provider turn finishes or errors. It is the right path
for handoffs, review requests, and operator answers where the shell should wait
for the result.

## Detached member delegation

Use `--detach` only from inside a member session:

```bash
lmctl chat ./team.lmctl Coder "Run the long verification pass." --detach
```

`--detach` is unconditional enqueue/fire-and-forget. It requires
`LMCTL_SELF_SESSIONID`; without that marker, lmctl rejects the call because it
cannot identify the sender. The message is relayed to the receiver and the
response returns to the sender.

Do not pair this with a separate lmctl harvest command. Provider runtimes,
shells, harnesses, and supervisors own wake/concurrency outside the chat call.

## Queued member messages

From inside a member session, `lmctl chat` can still put work into the
sender-to-receiver path when the target is busy. The lifecycle remains:

```text
queued -> in-flight -> delivered with receipt
```

Delivery is at-least-once: after a crash, a queued message may be delivered
again rather than lost. There is no separate LLM-called harvest command in
0.1.122; use synchronous `chat` by default, or `chat --detach` from a member
session when fire-and-forget is the right fit.

## Supervisor notifications

`notify_all` is real only as supervisor/root tooling: `admincli notify`,
`admincli watch`, or standalone `notify_all.py`. It is observe-only by default;
`--wake` relays queued mail. Regular LLM agents do not call it.

## Daemon workflow jobs

Use workflow jobs for repeatable pipelines:

```bash
lmctl serve > lmctl.log 2>&1 &
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
| Ask one member and wait | `lmctl chat <teamfile> <alias> "<prompt>"` |
| Fire-and-forget from a member session | `lmctl chat <teamfile> <alias> "<prompt>" --detach` |
| Supervise down Leads / queued mail | root/supervisor tooling, not an LLM-called command |
| Run a repeatable workflow pipeline | `lmctl workflow run` / `lmctl api submit-job` plus `lmctl serve` |
