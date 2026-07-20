---
title: Operations Runbook
sidebar_position: 4
---

# Operations runbook

This page maps common operator questions to the `lmctl` commands to run.
For the full command list, see the [CLI reference](./cli-reference.md).

## Start by orienting

```bash
lmctl status
lmctl diagnose
```

Use `lmctl status` for the human-readable team/SELF view. In a member session
it resolves the caller from `LMCTL_SELF_SESSIONID` and shows identity, teamfile,
member busy/idle state, recent delegation activity, and pending mailbox lanes.
Outside a member session it reports workspace scope with `identity: none`.
Use `@lmctl-ai/lmctl` 0.1.151 or newer for the `Waiting on:` section that keeps
old undelivered mail visible; this page was checked against 0.1.157.

## What is waiting for me?

```bash
lmctl status
lmctl tail ./team.lmctl Lead
```

`status` shows recent delegation activity in both directions and pending
mailbox lanes. Use `tail` when you need the exact recent transcript for a
member without waking it.

## Diagnose stuck delegation

Start with:

```bash
lmctl status
lmctl diagnose
```

If `status` shows pending outbound mail, check whether the receiver is busy. A
receiver can be busy because it is in a provider turn or because a human holds
it with `lmctl terminal`; that is correct behavior. Queued mail is keyed by
`(sender, receiver)`: send the next `lmctl chat` from the same sender to that
same receiver after it is free. That chat delivers that sender's queued lane
plus the new message in one turn. A chat from another sender to the same
receiver does not flush the lane. If the sender goes idle waiting for the
queued reply, this is a deadlock rather than normal delay.

## Issue lifecycle

List open issues:

```bash
lmctl api issues list <scope> --status open --json
```

Create an issue:

```bash
lmctl api issues create <scope> \
  --title "Status smoke failed" \
  --body "Expected status data; observed a terminal failure." \
  --severity high
```

Close an issue after the fix is verified:

```bash
lmctl api issues close <id> --commit-hash <sha>
```

## Teamfile maintenance

```bash
lmctl lint ./team.lmctl
lmctl seed ./team.lmctl
lmctl clone ./team.lmctl ./team-template.lmctl
```

Run `lint` before `seed` after editing a teamfile. Cross-team calls work
automatically at runtime — there is nothing to wire up.

## Driving members directly with `lmctl chat`

When you orchestrate by hand — or a meta-Lead drives several sub-teams — you send
work with `lmctl chat <teamfile>:<member> "<prompt>"`. Two behaviors to know:

**`chat` blocks for the whole turn by default.** `lmctl chat ...` waits until
the member finishes its turn and prints the full reply.

```bash
lmctl chat ./team.lmctl:Coder "Run the long verification pass."
```

When lmctl can resolve a sender identity, `chat` is also the queueing
primitive. If the target is busy, lmctl queues the message in the
sender-to-receiver lane:

```bash
lmctl chat ./team.lmctl Coder "status note"
```

Exit 0 with `enqueued mailbox message N` means queued, not delivered yet.
The delivery lifecycle is `queued -> in-flight -> delivered with receipt`.
Delivery is at-least-once; duplicate delivery can happen after a crash, but a
queued message should not be lost.

Queued member mail is keyed by `(sender, receiver)` and is delivered by the
next `lmctl chat` from the same sender to that same receiver. When the receiver
is free, that chat delivers that sender's queued lane plus the new message in
one turn. A chat from another sender to the same receiver does not flush the
lane. If the receiver is still in a provider turn, or a human is holding it
with `lmctl terminal`, the mail waits. If the sender is idle waiting for the
reply and never sends again, this is a deadlock rather than normal delay.

For an intentionally blind local shell wrapper, `timeout` still has the usual
shell semantics:

```bash
timeout 60 lmctl chat ./team.lmctl:Coder "..." >/dev/null 2>&1
```

**Interpreting blocking-chat results:**

| Result | Meaning |
|------|---------|
| Exit `0` with the member reply | The member turn ran and returned. |
| Exit `0` with `enqueued mailbox message N` | Queued, not delivered and not complete. |
| `--json` with `status: "enqueued"` and `path: "enqueued"` | Machine-readable queued contract. Track it with `lmctl status`. |
| Exit `1` with `--json` `status: "busy"` or a busy message | No queued lane was created for that call; commonly lmctl had no sender identity to attach to the message. Retry only after the receiver is free. |
| Exit `1` with `--json` `status: "error"` or other error text | Provider, delivery, or runtime error. Do not treat this as a busy retry without reading the error. |
| Exit `124` | Your external `timeout` wrapper fired. Treat this as blind/background shell behavior owned by the wrapper, not lmctl. |

Exit `0` alone does not prove delegated work is done. Prefer
`lmctl chat ... --json` when another program or agent needs to tell queued work
from a completed member reply, and to separate busy from real errors on exit
`1`. See [Verifying delegated work](./verifying-delegated-work.md).

**There is no LLM-called wake or harvest command.** Public agent guidance stops
at `lmctl chat`, `lmctl chat --json`, and `lmctl status`. Private supervisor
mechanisms are outside the lmctl product surface and are not regular agent
commands.

**Busy means "not ready yet."** Queueing depends on sender identity, not on
whether the command came from a shell or a member transcript. If lmctl can
resolve a sender identity, a busy receiver queues into that `(sender, receiver)`
lane. If there is no sender identity, there is no lane; the busy call returns a
busy error instead of queueing.

## A freshly-seeded session is not instantly chat-ready

`lmctl seed` returns once it has captured the session id, but the member then
runs a short priming round-trip and ACKs `ACK: teamfile context recorded` a
moment later. A `chat` sent in that window can fail with `rc=1`. Wait for the ACK
before onboarding:

```bash
lmctl seed ./team.lmctl
lmctl tail ./team.lmctl Lead      # poll until you see the priming ACK
lmctl chat ./team.lmctl:Lead "<onboarding prompt>"
```

## Recovering a hung member or Lead

If a member (or the Lead) stops responding — it receives messages but produces no
output — replace its provider session:

```bash
lmctl refresh ./team.lmctl Coder      # any member
lmctl refresh ./team.lmctl Lead       # the Lead, too
```

`refresh` clears the member's session id and re-seeds it. The refreshed member
loses its chat history but re-reads `durable-memory/`, so durable knowledge
survives a refresh, a provider swap, or moving the project. A member **cannot
refresh the session it is itself running in** — run the refresh from outside that
session (a meta-Lead, or you at the shell). That is the supported way to recover
a hung Lead.

If a member handoff fails or never lands, verify that the Lead actually ran
`lmctl chat` rather than only narrating its intent. A Lead that says "Coder is
getting the task now" but never executes the command has not delegated. Re-onboard
it with a delegation-first instruction such as "run `lmctl chat ...` now to give
Coder X", or hand the task to a backup member.

## When a member drifts (long sessions)

Over a long session a member can drift — output degrades or wanders off-track.
This is subjective; lmctl does not auto-detect it. The maintenance procedure:

1. **Check `durable-memory/`** — is the project's current state captured there?
2. **Update it if not** — have the member (or you) write what matters into
   `durable-memory/` so it survives a fresh session.
3. **Then refresh** the member: `lmctl refresh ./team.lmctl <member>`. The fresh
   session drops the drifted history but re-reads `durable-memory/`.

`lmctl health ./team.lmctl <member>` shows the session's size / token usage as a
rough signal that a session is getting large (a common precursor to drift). A
richer per-member liveness view may evolve from `lmctl health` later; for now the
judgment of "large and drifting → refresh" is yours.
