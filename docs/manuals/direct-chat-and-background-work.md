---
title: Direct Chat & Background Work
sidebar_position: 3
---

# Direct chat & background work

lmctl has four common execution paths. Pick the one that matches how you
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
lmctl check --json
lmctl push --json
```

The lifecycle is `queued -> in-flight -> delivered with receipt`. Delivered
messages are marked with the target's response as a receipt. Delivery is
at-least-once: if a process dies after sending but before marking delivery, a
later `chat` or `push` may deliver the same queued message again.

`check` is instant and read-only: it reports this member's background jobs and
outbound queued lanes. `push` is blocking and sender-driven: it sequentially
delivers currently available outbound lanes whose receivers are idle, and skips
busy receivers for a later attempt. Neither command requires `lmctl serve`.

## Tracked background invocations

Use backgrounded blocking `lmctl chat` when an operator or Lead needs to fan out
member work without freezing on every long turn:

```bash
lmctl chat ./team.lmctl Coder "Run the long verification pass." &
lmctl wait ./team.lmctl --json
```

From inside a member session, `lmctl exec` can track local commands in the same
wait loop:

```bash
lmctl exec -- npm test &
lmctl wait --json
```

These commands create tracked invocations. `lmctl wait` is the wake primitive:
it blocks without spending model tokens and returns when the first invocation in
scope finishes or the scoped caller has a delivered queue receipt. Scope it
intentionally.
The default scope is the caller's own invocations and delivered receipts via
`LMCTL_SELF_SESSIONID`; a positional `<teamfile>` scopes wait to invocations
targeting that team. There is no system-wide wait scope and no id/all mode;
launch work in the background, then let `wait` return the first completion in
that caller/team scope.

`lmctl chat` and `lmctl exec` are blocking commands. lmctl has no native
detached mode; backgrounding is done by your harness or shell (`&`, Claude Code
`run_in_background`, or equivalent).

## The wait loop

When a Lead has **N** independent member jobs, the safe fan-out pattern is:

1. Launch all N jobs as tracked invocations.
2. Call `lmctl wait --json` in the correct scope.
3. If wait returns `status: "completed"`, inspect completed invocations and
   delivered queue receipts, dispatch follow-ups, and wait again.
4. If wait returns `status: "idle"`, run `lmctl check --json`, claim the next
   external/backlog item, or push eligible outbound lanes. One idle response means no tracked invocation is currently
   in flight in that scope; it does not mean the broader backlog is empty.

This keeps real parallelism without going blind. The blocking `wait` call is the
wake-up signal that brings the Lead back to harvest. See the raw
[background-wakeup skill](https://lmctl.com/skills/background-wakeup.md) for the
full loop.

`lmctl wait` exits `0` for both `completed` and `idle`; branch on the `status`
field. It exits `1` on timeout and `2` on usage or scope errors.

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
| Queue work for a busy member | member-run `lmctl chat`, then `lmctl check` / `lmctl push` |
| Fan out member work and wake on completion | backgrounded `lmctl chat` / `lmctl push` / `lmctl exec` plus scoped `lmctl wait` |
| Run a repeatable workflow pipeline | `lmctl workflow run` / `lmctl api submit-job` plus `lmctl serve` |
