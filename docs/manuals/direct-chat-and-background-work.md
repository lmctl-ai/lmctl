---
title: Direct Chat & Background Work
sidebar_position: 3
---

# Direct chat & background work

Verified against `lmctl 0.1.248`.

Current command surface: `lmctl chat` sends work to one member. By default it
is synchronous: when the receiver is idle, it blocks for one member turn and
returns the reply; when the receiver is busy, it returns a busy error and
creates no queued mail row. The mailbox queue still exists, but it is opt-in:
set `mailbox_queue_enabled=true` in config or
`LMCTL_MAILBOX_QUEUE_ENABLED=true` when you intentionally want busy sends to
queue.

## Synchronous direct chat

Use `lmctl chat` when you want one member to handle one prompt now:

```bash
lmctl chat ./team.lmctl Coder "Implement the smallest safe fix."
lmctl chat ./team.lmctl Reviewer "Review Coder's latest change."
```

This blocks until the provider turn finishes or errors. It is the right path
for handoffs, review requests, and operator answers where the shell should stay
attached to the result.

For anything non-trivial, put the prompt in a file and use `--prompt-file`:

```bash
lmctl chat ./team.lmctl Coder --prompt-file task.md
lmctl chat ./team.lmctl Coder --prompt-file -
```

A positional prompt is built by your shell before lmctl sees it. Backticks,
`$(...)`, `$VAR`, and quotes can be expanded locally. `--prompt-file` avoids
that shell layer and is the safer form for review packages, command examples,
and long prompts. Write the prompt file with an editor or file-writing tool,
not with `echo` or a heredoc, because those still go through your shell. This
path is available in `@lmctl-ai/lmctl` 0.1.154 and was rechecked in 0.1.218.

## Default busy behavior

With the default queue setting, a busy receiver is immediate feedback to the
caller:

```text
{"status":"busy","message":"... holder_pid=739451, live ...","teamChatLogId":null}
```

The process exits non-zero and `lmctl mail pending` has no new row for that
send. The client owns retry, backoff, or inspection. Use `lmctl health
<teamfile> <alias> --json`, `lmctl status --json`, and the holder PID/liveness
details in the busy result before deciding whether the receiver is merely slow,
terminal-held, phantom-busy, or stalled.

## Opt-in queued member messages

The queued-mail lifecycle is retained for installations that explicitly enable
it with `mailbox_queue_enabled=true` or `LMCTL_MAILBOX_QUEUE_ENABLED=true`.
When lmctl can resolve a sender identity and queueing is enabled, `lmctl chat`
can put work into the sender-to-receiver path when the target is busy. If it
exits 0 with `enqueued mailbox message N`, that means queued, not delivered
yet. The lifecycle is:

```text
queued -> in-flight -> delivered with receipt
```

Delivery is at-least-once in queue-enabled mode: after a crash, a queued
message may be delivered again rather than lost.

If a provider process dies while holding an in-flight member lock, lmctl checks
holder PID liveness on later access and can reclaim stale locks automatically.
Treat that as normal self-healing; do not edit the DB by hand.

Base queued delivery does not require a daemon: the sender's next `lmctl chat`
to that same receiver delivers that sender's queued lane once the receiver is
free. Mail queued by a different sender is not affected; each `(sender,
receiver)` pair has its own lane. With `lmctl serve start` running in normal
daemon mode, mailbox relay is an optional accelerator that can drain queued
lanes proactively after the receiver goes idle. When queueing is off, there is
nothing for the relay to drain. If the receiver is still in a provider turn, or
a human is holding that member with `lmctl terminal`, queued mail waits.

Practical consequence in queue-enabled mode: if the sender is idle because it
is waiting for the queued reply, and nobody sends another `lmctl chat` from that
same sender to that receiver, the queued mail will not unblock itself unless
the optional relay drains it. Run `lmctl status` to see pending outbound lanes
and member busy/idle state. If queued mail is not moving and the receiver is
idle or phantom-busy from a dead holder PID, run `lmctl serve status`.

## Quick choice

| Need | Use |
| --- | --- |
| Ask one member and receive the reply | `lmctl chat <teamfile> <alias> "<prompt>"` |
| Busy target with default config | Treat the busy error as the result; inspect holder PID/liveness and retry later |
| Deliver opt-in queued member mail | Send the next `lmctl chat` from the same sender to the same receiver after it is free; keep `lmctl serve start` running when you want relay to drain queues proactively |
| Inspect pending mailbox lanes | `lmctl status` |
