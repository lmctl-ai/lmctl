---
title: Verifying Delegated Work
sidebar_position: 4
---

# Verifying delegated work

Verified against `lmctl 0.1.248`.

`lmctl chat` starts a member turn. With the default queue setting, a busy
receiver returns a busy error immediately and no queued mail row is created.
The opt-in mailbox queue can still queue busy sends, so the process exit code
is not a completion contract for the delegated task.

The important distinction:

- Exit `0` with a member reply means the member turn ran and returned.
- Exit `0` with `enqueued mailbox message N` means the opt-in mailbox queue
  accepted the prompt; it is queued, not delivered or complete.
- Exit `1` can mean a busy response or a real error. Use `--json` or read the
  message text before deciding whether retry is appropriate.

For machine-readable automation, call `chat` with `--json`:

```bash
lmctl chat ./team.lmctl Coder "Implement the fix." --json
```

Verified against `lmctl 0.1.223`: when the receiver is free and the synchronous
turn is accepted, `chat --json` emits newline-delimited JSON. The first line is
available as soon as the message is durably created; the final line arrives when
the member turn finishes. Both lines carry the same `message_id`:

```text
{"status":"accepted","message_id":"msg_tcl_10919"}
{"status":"ok","replyText":"OK","teamChatLogId":10919,"message_id":"msg_tcl_10919"}
```

Do not write automation that assumes a synchronous accepted send emits exactly
one JSON line. Capture the early `message_id` if you need to track the message
while the provider turn is still running. Use that `message_id` directly with
`lmctl mail read` or `lmctl mail history` for inspection, and with
`lmctl mail ack` when you intentionally acknowledge handling.

With `mailbox_queue_enabled=true` or `LMCTL_MAILBOX_QUEUE_ENABLED=true`, an
enqueued response looks like:

```json
{
  "status": "enqueued",
  "path": "enqueued",
  "id": 123,
  "message_id": "msg_mbx_123",
  "sender": {"teamfile": "/abs/path/team.lmctl", "alias": "Lead"},
  "receiver": {"teamfile": "/abs/path/team.lmctl", "alias": "Coder"}
}
```

`status: "enqueued"` is the opt-in queued contract: the work is waiting in the
`(sender, receiver)` lane. It is not finished. With the default synchronous
behavior, a busy receiver returns `status: "busy"` instead.

## How to confirm completion

Use `lmctl status`:

```bash
lmctl status
lmctl status --since 7d
```

Check:

- `Waiting on:` for opt-in queued or no-reply work.
- `activity from me:` for recent `QUEUED`, `RUNNING`, or `DONE` chat records.
- `mailbox outbound:` for pending sender-to-receiver lanes.

Use `tail` when you need the transcript without waking a member:

```bash
lmctl tail ./team.lmctl Coder
```

Completion is the member reply, a `DONE` activity row, or transcript evidence
that the requested work finished. It is not just exit code `0`.

## Queueing depends on identity

Queued mail, when enabled, is keyed by `(sender, receiver)`.

By default, a chat to a busy receiver returns busy and the caller owns retry or
inspection. When lmctl can resolve a sender identity and the mailbox queue is
enabled, a chat to a busy receiver queues in that lane and can still exit `0`.
In a normal seeded member session, identity comes from `LMCTL_SELF_SESSIONID`.
Some console/operator invocations may also carry a real identity.

When lmctl has no sender identity, there is no lane to queue into. A busy
receiver returns a busy error instead of silently creating anonymous mail. In
JSON, `status: "busy"` is retryable after the receiver is free; `status:
"error"` is not the same condition.

Base queued delivery is the next `lmctl chat` from the same sender to that same
receiver after the receiver is free. Mail queued by another sender is not
affected. With `lmctl serve start` running in normal daemon mode, mailbox relay
can drain queued lanes proactively. If the sender goes idle waiting for that
queued reply and no relay drains the lane, delivery can deadlock. With default
synchronous behavior there is no queued lane; handle the busy result directly.
