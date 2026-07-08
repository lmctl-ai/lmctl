---
title: Direct Chat & Background Work
sidebar_position: 3
---

# Direct chat & background work

lmctl has three different execution paths. Pick the one that matches how you
need to wait, observe, and resume work.

## Synchronous direct chat

Use `lmctl chat` when you want one member to handle one prompt now:

```bash
lmctl chat ./team.lmctl Coder "Implement the smallest safe fix."
lmctl chat ./team.lmctl Reviewer "Review Coder's latest change." --from ./team.lmctl:Lead
```

This blocks until the provider turn finishes or errors. It is the right path
for short handoffs, review requests, and operator answers where the shell should
wait for the result.

## Tracked background invocations

Use backgrounded blocking `lmctl chat` or `lmctl exec` when a Lead needs to fan
out work without freezing on every long turn:

```bash
lmctl chat ./team.lmctl Coder "Run the long verification pass." --from ./team.lmctl:Lead &
lmctl exec --json -- npm test &
lmctl wait --from ./team.lmctl:Lead --json
```

These commands create tracked invocations. `lmctl wait` is the wake primitive:
it blocks without spending model tokens and returns when the first invocation in
scope finishes. Scope it intentionally. The default scope is the caller's own
invocations via `LMCTL_SELF_SESSIONID`; otherwise use `--from
<teamfile:alias>`, a positional `<teamfile>`, or `--id <id[,id...]>`. There is
no system-wide wait scope.

For commands where you need a zero-race handle, start with `lmctl exec --json`
and wait on the exact id it prints:

```bash
lmctl exec --json -- npm test &
lmctl wait --id <id> --json
```

## The wait loop

When a Lead has **N** independent member jobs, the safe fan-out pattern is:

1. Launch all N jobs as tracked invocations.
2. Call `lmctl wait --json` in the correct scope.
3. If wait returns `status: "completed"`, harvest the finished invocation,
   dispatch follow-ups, and wait again.
4. If wait returns `status: "idle"`, pull the next queue item or check the
   chatroom/mailbox. One idle response means no tracked invocation is currently
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
| Fan out member work and wake on completion | backgrounded `lmctl chat` / `lmctl exec` plus scoped `lmctl wait` |
| Run a repeatable workflow pipeline | `lmctl workflow run` / `lmctl api submit-job` plus `lmctl serve` |
