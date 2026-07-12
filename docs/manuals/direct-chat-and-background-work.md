---
title: Direct Chat & Background Work
sidebar_position: 3
---

# Direct chat & background work

lmctl has a few common execution paths. Pick the one that matches how you
need to wait, observe, and resume work.

## Synchronous direct chat

Use `lmctl chat` when you want one member to handle one prompt now:

```bash
lmctl chat ./team.lmctl Coder "Implement the smallest safe fix."
lmctl chat ./team.lmctl Reviewer "Review Coder's latest change."
```

This blocks until the provider turn finishes or errors. It is the right path
for short handoffs, review requests, and operator answers where the shell should
wait for the result.

## Queued member messages

From inside a member session, `lmctl chat` also handles asynchronous queueing.
If the target is idle, it delivers a normal blocking turn. If the target is
busy, lmctl queues the message in the sender-to-receiver lane:

```bash
lmctl chat ./team.lmctl Coder "status note"
lmctl notify_me --json
```

The lifecycle is `queued -> in-flight -> delivered with receipt`. Delivered
messages are marked with the target's response as a receipt. Delivery is
at-least-once: if a process dies after sending but before marking delivery, a
later `chat` or `notify_me` may deliver the same queued message again.

`notify_me` is the member wake loop: it flushes queued outbound mail to idle
receivers, shows this member's jobs plus outbound queue, and returns delivered
receipts plus finished tracked jobs. It blocks if something is running but
nothing has finished, and returns immediately with nothing more when idle. It
does not require `lmctl serve`.

## Tracked background invocations

Use backgrounded blocking `lmctl chat` when an operator or Lead needs to fan out
member work without freezing on every long turn:

```bash
lmctl chat ./team.lmctl Coder "Run the long verification pass." &
lmctl notify_me ./team.lmctl --json
```

From inside a member session, `lmctl exec` can track local commands in the same
`notify_me` loop:

```bash
lmctl exec -- npm test &
lmctl notify_me --json
```

These commands create tracked invocations. `lmctl notify_me` is the wake
primitive: "I'm done with this round; my delegations are all running in the
background; take a break — notify me when something lands." Call it in the
FOREGROUND; it holds your process and returns when a member finishes. Scope it
intentionally.
The default scope is the caller's own invocations and delivered receipts via
`LMCTL_SELF_SESSIONID`; a positional `<teamfile>` scopes `notify_me` to invocations
targeting that team. There is no system-wide id/all mode; launch work in the
background, then let `notify_me` return the first completion in
that caller/team scope.

`lmctl chat` and `lmctl exec` are blocking commands. lmctl has no native
detached mode; backgrounding is done by your harness or shell (`&`, Claude Code
`run_in_background`, or equivalent).

## The notify_me loop

When a Lead has **N** independent member jobs, the safe fan-out pattern is:

1. Launch all N jobs as tracked invocations.
2. Call `lmctl notify_me --json` in the correct scope.
3. If `notify_me` returns finished jobs or delivered receipts, inspect them,
   dispatch follow-ups, and call `notify_me` again.
4. If `notify_me` returns no finished work, the scope is idle: claim the next
   external/backlog item or exit.

This keeps real parallelism without going blind. The blocking `notify_me` call is the
wake-up signal that brings the Lead back to harvest. See the raw
[background-wakeup skill](https://lmctl.com/skills/background-wakeup.md) for the
full loop.

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
| Queue work for a busy member | member-run `lmctl chat`, then `lmctl notify_me` |
| Fan out member work and wake on completion | backgrounded `lmctl chat` / `lmctl exec` plus scoped `lmctl notify_me` |
| Run a repeatable workflow pipeline | `lmctl workflow run` / `lmctl api submit-job` plus `lmctl serve` |
