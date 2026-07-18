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
lmctl api attentions --json
```

Use `lmctl status` for the human-readable team/SELF view. In a member session
it resolves the caller from `LMCTL_SELF_SESSIONID` and shows identity, teamfile,
member busy/idle state, recent delegation activity, and pending mailbox lanes.
Outside a member session it reports workspace scope with `identity: none`. Use
`lmctl api status` when you need the daemon status payload.

## What is waiting for me?

```bash
lmctl api attentions --json
lmctl api escalations list --json
```

Attentions are durable notifications. Escalations are workflow pauses waiting
for operator input.

Respond to an escalation:

```bash
lmctl api escalations respond <attention_id> "Use the smaller scope and continue."
```

Show one escalation when you need the exact prompt:

```bash
lmctl api escalations show <attention_id> --json
```

## What happened in a run?

List recent runs and inspect one:

```bash
lmctl api runs
lmctl api run <id>
```

List queued jobs:

```bash
lmctl api jobs
lmctl api job <id>
```

A job is the queued request. A run is the workflow execution created from the
job.

## Run a workflow

```bash
lmctl api submit-job \
  --workflow qa-suite \
  --project my-project \
  --inputs '{"project_name":"my-project"}'
```

`submit-job` waits for the run to reach a terminal state.

You can also use the top-level runner:

```bash
lmctl workflow run --workflow qa-suite --project my-project --inputs '{"project_name":"my-project"}' --json
```

## Diagnose a stuck run

Start with:

```bash
lmctl status
lmctl api run <id>
lmctl api run timeline <id>
lmctl api attentions --json
lmctl diagnose
```

If the run is paused for input, answer the escalation. If the run failed, use
the run detail and diagnostic bundle as evidence for an issue.

## Issue lifecycle

List open issues:

```bash
lmctl api issues list my-project --status open --json
```

Create an issue:

```bash
lmctl api issues create my-project \
  --title "Status smoke failed" \
  --body "Expected status data; observed a terminal failure in the workflow run." \
  --severity high
```

Close an issue after the fix is verified:

```bash
lmctl api issues close <id> --commit-hash <sha> --closed-run-id <run>
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

For optional async delegation from inside a member session, detach the chat:

```bash
lmctl chat ./team.lmctl:Coder "Run the long verification pass." --detach
```

`--detach` is unconditional enqueue/fire-and-forget. It requires
`LMCTL_SELF_SESSIONID`; without that marker, lmctl rejects the call because it
cannot identify the sender. The message is relayed and the response returns to
the sender.

From inside a member session, `chat` is also the queueing primitive. If the
target is busy, lmctl queues the message in the sender-to-receiver lane:

```bash
lmctl chat ./team.lmctl Coder "status note"
```

The delivery lifecycle is `queued -> in-flight -> delivered with receipt`.
Delivery is at-least-once; duplicate delivery can happen after a crash, but a
queued message should not be lost.

For an intentionally blind local shell wrapper, `timeout` still has the usual
shell semantics:

```bash
timeout 60 lmctl chat ./team.lmctl:Coder "..." >/dev/null 2>&1
```

**Interpreting blocking-chat exit codes:**

| Exit | Meaning |
|------|---------|
| `0` | The member finished its turn within the blocking chat call — delivered and done. |
| `124` | Your external `timeout` wrapper fired. Treat this as blind/background shell behavior owned by the wrapper, not lmctl. |
| `1` | Either **busy** (`<member> is servicing <sender> since <ts>` — it is mid-turn) **or** a real error. These look the same today. |

So `1` often means "busy, retry later" — do **not** blindly retry before checking
whether it was a busy/servicing rejection.

**Supervisor notification is not regular agent work.** `notify_all` is real only
as supervisor/root tooling: `admincli notify`, `admincli watch`, or standalone
`notify_all.py`. It is observe-only by default; `--wake` relays queued mail.
Regular LLM agents do not call it.

**Busy means "not ready yet."** From an operator shell, a busy target returns a
busy error and does not queue. From inside a member session, `chat` queues the
message for that sender/receiver lane. Use `--detach` only when you want
unconditional enqueue/fire-and-forget from a member identity.

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
