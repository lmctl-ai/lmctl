---
title: Mail Inspection
sidebar_position: 3
---

# Mail inspection

Verified against `lmctl 0.1.227`.

`lmctl mail` inspects event-log messages, delivery evidence, and causal
lineage. Use it when `lmctl status` tells you a message is queued or delivered
but you need the message-level evidence.

For every subcommand, `--json` is the stable, versioned external contract.
Human-readable output is for people and is intentionally not a stable machine
interface.

## Sent mail

```bash
lmctl mail sent --to "/abs/path/team.lmctl:Coder" --status queued --json
lmctl mail sent --to "/abs/path/team.lmctl:Coder" --status delivered --json
lmctl mail sent --since 3d --limit 50 --json
```

`mail sent` lists `CREATE` / `RESPONSE_CREATE` streams sent from `SELF`.
`--status queued` selects messages still present in `message_pending`;
`--status delivered` selects terminal messages. JSON includes
`schema_version=1`, `schema=event-log-v1`, identity, filters, messages, and
`next_cursor`.

Check `mail sent --status queued` before assuming a delivery problem is a bug:
most stuck mail is a genuinely busy receiver or a receiver held by
`lmctl terminal`.

Mail identity filters are exact. Use the canonical absolute teamfile identity
shown by `lmctl status` or `realpath ./team.lmctl`; relative identities such as
`./team.lmctl:Coder` can return an empty result even when matching mail exists.

## One message

```bash
lmctl mail history <message_id> --json
lmctl mail read <message_id> --json
lmctl mail seen <message_id> --json
```

`mail history` returns the ordered event stream for one message. Use it when
`lmctl status` is not enough detail.

`mail read` returns content and pending state without delivery, dispatch,
compare-and-swap, or any other state change.

`mail seen` combines event-log delivery evidence with historical provider
transcript evidence. Keep the terms separate: ack is not seen, seen is not
answered, and ack is not answered. `seen` answers the narrow question "was this
specific `message_id` observed in the transcript?"

## Acknowledge handled mail

```bash
lmctl mail ack <message_id> --json
lmctl mail ack <message_id> --terminalize-pending --note "handled from terminal" --json
```

By default, `ack` is record-only: it appends an acknowledgement event that this
actor read or acted on the message. `--terminalize-pending` additionally
retires a still-queued, unclaimed message. If an in-flight delivery claim
exists, that claim wins.

## Causal trees

```bash
lmctl mail tree --since 3d --json
lmctl mail tree --root "/abs/path/team.lmctl:Lead" --since 3d --limit 100 --json
```

`mail tree` returns causal roots, orphan policy, and an incomplete-capture note
so you can inspect how sends and responses relate without inventing lineage
from timestamps.

## Causal handling and relay delivery

These are low-level composition primitives. They are useful when a terminal-held
Lead or external relay reads mail directly and then sends follow-up work outside
the normal delivered-message turn.

```bash
lmctl mail handle <message_id> --json
lmctl mail deliver <message_id> --json
```

`mail handle` declares that `SELF` is about to act because of this message. It
appends `MESSAGE_HANDLING_STARTED` and sets the caller's causal pointer, so
later outbound sends can be linked under the handled message in `mail tree`.
The pointer persists across multiple outbound sends for one hour; older pointers
are ignored so stale terminal work does not attach unrelated future sends. A
later `handle` replaces it, and a matching `mail ack` clears it. It requires
`LMCTL_SELF_SESSIONID` to resolve to one registered member. A repeated handle by
the same actor returns `appended: false` while refreshing the causal pointer.

`mail deliver` attempts one real provider delivery for exactly one queued
message. Unlike daemon lane batching, one `deliver` call sends only the named
message; relay code owns ordering, retry, and batching. Delivery-attempt JSON
uses an `outcome` field such as `delivered`, `skipped_busy`,
`skipped_terminal`, or `error`. Unknown, terminal, or already-claimed messages
return the standard error envelope; for example, a terminal message returns
`errorKind: "invalid_state"`.

## Relay and infra discovery

```bash
lmctl mail pending --limit 50 --json
lmctl mail pending --receiver "/abs/path/team.lmctl:Lead" --limit 50 --json
```

In `lmctl 0.1.227`, bare `mail pending` defaults to `SELF` in a member session.
From an operator shell with no resolved `SELF`, it remains fleet-scoped and
lists pending mail for every receiver in the local event-log projection. To
avoid ambiguity in scripts and relay tooling, pass the receiver explicitly:

```bash
lmctl mail pending --receiver "/abs/path/your-team.lmctl:Lead" --json
```

This is intentionally called out because older public-preview builds were
asymmetric: `mail sent` self-scoped while `mail pending` was fleet-scoped. Use
an explicit `--receiver` whenever the receiver identity matters.

`mail pending` is useful for relay or infrastructure discovery. It is not the
normal Lead command for delegation. The reference script in `lmctl-src`,
`scripts/relay-loop.pl`, composes `mail pending`, `mail read`, and
`mail ack --terminalize-pending`, and can be adapted to use `mail deliver` or
custom handling. It is a reference script, not a core `lmctl` command and not
part of this website repository.

For a complete no-cost fixture that exercises `CREATE -> ENQUEUE ->
MESSAGE_ACKNOWLEDGED`, see
[ClaudeMock mailbox drain fixture](./claudemock-mailbox-drain-fixture.md).
