---
title: Verifying Delegated Work
sidebar_position: 4
---

# Verifying delegated work

`lmctl chat` starts or queues a member turn. Its process exit code is not a
completion contract for the delegated task.

The important distinction:

- Exit `0` with a member reply means the member turn ran and returned.
- Exit `0` with `enqueued mailbox message N` means the prompt is queued, not
  delivered or complete.
- Exit `1` can mean a busy response or a real error. Use `--json` or read the
  message text before deciding whether retry is appropriate.

For machine-readable automation, call `chat` with `--json`:

```bash
lmctl chat ./team.lmctl Coder "Implement the fix." --json
```

An enqueued response looks like:

```json
{
  "status": "enqueued",
  "path": "enqueued",
  "id": 123,
  "sender": {"teamfile": "/abs/path/team.lmctl", "alias": "Lead"},
  "receiver": {"teamfile": "/abs/path/team.lmctl", "alias": "Coder"}
}
```

`status: "enqueued"` is the contract: the work is waiting in the
`(sender, receiver)` lane. It is not finished.

## How to confirm completion

Use `lmctl status`:

```bash
lmctl status
lmctl status --since 7d
```

Check:

- `Waiting on:` for queued or no-reply work.
- `activity from me:` for recent `QUEUED`, `RUNNING`, or `DONE` chat records.
- `mailbox outbound:` for pending sender-to-receiver lanes.

Use `tail` when you need the transcript without waking a member:

```bash
lmctl tail ./team.lmctl Coder
```

Completion is the member reply, a `DONE` activity row, or transcript evidence
that the requested work finished. It is not just exit code `0`.

## Queueing depends on identity

Queued mail is keyed by `(sender, receiver)`.

When lmctl can resolve a sender identity, a chat to a busy receiver queues in
that lane and can still exit `0`. In a normal seeded member session, identity
comes from `LMCTL_SELF_SESSIONID`. Some console/operator invocations may also
carry a real identity.

When lmctl has no sender identity, there is no lane to queue into. A busy
receiver returns a busy error instead of silently creating anonymous mail. In
JSON, `status: "busy"` is retryable after the receiver is free; `status:
"error"` is not the same condition.

Queued mail is delivered by the next `lmctl chat` from the same sender to that
same receiver after the receiver is free. Mail queued by another sender is not
affected.
