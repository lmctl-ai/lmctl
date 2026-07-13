---
title: Direct Chat & Background Work
sidebar_position: 3
---

# Direct chat & background work

lmctl 0.1.116 has one live member-delegation command for Leads: `lmctl chat`.
It is synchronous, blocks for one member turn, and returns the member reply.

## Synchronous direct chat

Use `lmctl chat` when you want one member to handle one prompt now:

```bash
lmctl chat ./team.lmctl Coder "Implement the smallest safe fix."
lmctl chat ./team.lmctl Reviewer "Review Coder's latest change."
```

This blocks until the provider turn finishes or errors. It is the right path
for handoffs, review requests, and operator answers where the shell should wait
for the result.

## Foreground/background is outside lmctl

lmctl is agnostic to foreground/background execution. If you need concurrency,
use the provider runtime, shell, harness, or supervisor that is driving the
process. For example, an outer harness may run several synchronous `chat` calls
in its own background jobs and wake when those jobs finish.

Do not teach an LLM to call a separate lmctl-managed wake command. Those commands are not
part of the 0.1.116 public surface.

Future `notify_all` is a daemon/supervisor for down Leads with unharvested
work. It is not an LLM-called command.

## Queued member messages

From inside a member session, `lmctl chat` can still put work into the
sender-to-receiver path when the target is busy. The lifecycle remains:

```text
queued -> in-flight -> delivered with receipt
```

Delivery is at-least-once: after a crash, a queued message may be delivered
again rather than lost. There is no LLM-called command for harvesting queued
receipts in 0.1.116; use synchronous `chat` and let the surrounding runtime own
wake/concurrency.

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
| Coordinate parallel member work | provider runtime / shell / harness / supervisor |
| Run a repeatable workflow pipeline | `lmctl workflow run` / `lmctl api submit-job` plus `lmctl serve` |
