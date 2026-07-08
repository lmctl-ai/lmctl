---
title: Direct Chat & Background Work
sidebar_position: 3
---

# Direct chat & background work

lmctl has four different execution paths. Pick the one that matches how you
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

## Mailbox messages

Use `lmctl send` when you need to notify another Lead/member without stealing
its current turn:

```bash
lmctl send ./team.lmctl Coder --from ./team.lmctl:Lead "status note"
lmctl wait --from ./team.lmctl:Coder --json
lmctl recv --from ./team.lmctl:Coder --json
```

`send` is liveness-aware. A live same-host target gets queued mail and `send`
returns immediately with `path: "enqueued"`. A down same-host target falls back
to synchronous chat delivery with `path: "chat-delivered"` so the message is
not stranded. If that fallback is refused or errors, `send` returns
`path: "rejected"` and does not leave queued mail behind. Cross-host targets are
queued because the mailbox is the reachable path.

`wait` wakes on inbound mail and reports previews in the `mail` array, but it
does not consume those messages. `recv` drains all pending messages for that
receiver and removes them.

## Tracked background invocations

Use backgrounded blocking `lmctl chat` or `lmctl exec` when a Lead needs to fan
out work without freezing on every long turn:

```bash
lmctl chat ./team.lmctl Coder "Run the long verification pass." --from ./team.lmctl:Lead &
lmctl exec --from ./team.lmctl:Lead -- npm test &
lmctl wait --from ./team.lmctl:Lead --json
```

These commands create tracked invocations. `lmctl wait` is the wake primitive:
it blocks without spending model tokens and returns when the first invocation in
scope finishes or the scoped caller has inbound mail. Scope it intentionally.
The default scope is the caller's own invocations and mailbox via
`LMCTL_SELF_SESSIONID`; otherwise use `--from <teamfile:alias>`, a positional
`<teamfile>`, or the default self scope from inside a member session. There is
no system-wide wait scope and no `wait --id`; launch work in the background,
then let `wait` return the first completion in that caller/team scope.

`lmctl chat` and `lmctl exec` are blocking commands. lmctl has no native
`--detach` path; backgrounding is done by your harness or shell (`&`, Claude
Code `run_in_background`, or equivalent).

## The wait loop

When a Lead has **N** independent member jobs, the safe fan-out pattern is:

1. Launch all N jobs as tracked invocations.
2. Call `lmctl wait --json` in the correct scope.
3. If wait returns `status: "completed"`, inspect both `finished` and `mail`.
   A mail-only wake has `finished: []`; call `recv` for messages you intend to
   handle, dispatch follow-ups, and wait again.
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
| Notify a Lead/member without stealing its turn | `lmctl send`, then `lmctl wait` / `lmctl recv` on the receiver |
| Fan out member work and wake on completion | backgrounded `lmctl chat` / `lmctl exec` plus scoped `lmctl wait` |
| Run a repeatable workflow pipeline | `lmctl workflow run` / `lmctl api submit-job` plus `lmctl serve` |
