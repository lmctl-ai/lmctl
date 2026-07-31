---
title: Troubleshooting
sidebar_position: 99
---

# Troubleshooting

Start with the diagnostic commands:

```bash
lmctl status
lmctl diagnose
```

`lmctl diagnose` collects a support bundle (DB snapshot, recent events, and
config) that is useful when reporting a problem.

`lmctl status [--json] [--since <duration|ISO8601>]` uses
`LMCTL_SELF_SESSIONID` in a seeded member session to show the current identity,
teamfile, member busy/idle state, recent delegation activity in both
directions, and pending mailbox lanes. Outside a member session it falls back
to an operator team/activity view with `identity: none`.

## `lmctl seed` fails

`lmctl seed <teamfile.lmctl>` seeds missing or placeholder session ids in a
teamfile. Start with lint, then seed from the directory you expect:

```bash
pwd
lmctl lint ./team.lmctl
lmctl seed ./team.lmctl
```

`lmctl lint <teamfile.lmctl>` warns about stale or placeholder session ids. The
teamfile argument is resolved from where you invoke the command; explicit
relative `sessiondir=` values are resolved from the teamfile's directory. If the
path context is confusing, `cd` to the repo root or use an absolute teamfile path
before running `lint` and `seed`.

Common seed messages:

| Message | What to check |
| --- | --- |
| `usage: lmctl seed <teamfile.lmctl>` | Pass exactly one teamfile path. |
| `error: <teamfile>: <fs/canonical error>` | The teamfile path cannot be read or canonicalized from the current directory. Check `pwd` and the path. |
| `error: <alias>: Invalid provider "..."` | The member has a provider name lmctl does not recognize. |
| `error: <alias>: sessiondir is empty` | Add a writable `sessiondir=` for that member. |
| `warning: <alias>: sessionid is shorter than 5 chars; run lmctl seed to refresh it` | The recorded session id is stale or a placeholder; seed should refresh it. |
| `warning: <alias>: sessiondir <path> is not writable (seed would fail: EACCES) — fix permissions or set a writable sessiondir` | Fix directory permissions or choose a writable `sessiondir=`. |
| `warning: <alias>: existing sessionid preserved; skipping` | lmctl found an existing non-placeholder session id and left it unchanged. |
| `error: <alias>: seed failed: <provider error>` | The provider process failed; read the surfaced provider stderr. Provider login/auth problems show up here through provider output. |
| `error: <alias>: seed failed; provider did not report a sessionid; no new session was found for <cwd> (possible provider workspace/cwd mismatch)` | The provider ran, but lmctl could not extract a session id. Check `pwd`, `sessiondir=`, and whether the provider is using the same working directory. |

Provider binary checks from related preflights can also point at the root cause:

```text
provider "claude" binary 'claude' not installed
provider "claude" binary 'claude' found but `claude --version` failed to run cleanly
unknown provider "foo" — no binary mapping
```

Stale or deleted session directories may surface later during chat as:

```text
sessiondir missing: <path>
```

In that case, recreate the directory, fix `sessiondir=`, or re-seed from the
correct working directory.

## API commands report an auth error

Set the daemon URL and bearer token:

```bash
export LMCTL_API_URL=http://127.0.0.1:8787
export LMCTL_API_TOKEN=<token>
```

Then retry:

```bash
lmctl api status
```

## `api status` and `status` show different output

`lmctl status` speaks team vocabulary. From a seeded member session, lmctl
resolves the caller from `LMCTL_SELF_SESSIONID`; there is no `--project` or
`--web` selector. It shows identity, teamfile, member busy/idle state, recent
delegation activity in both directions, and pending mailbox lanes.
`lmctl api status` is the daemon status payload and requires the daemon API.

Passing a project flag to `status` fails:

```text
error: unknown option --project; lmctl status is team/SELF scoped now
```

Use both when orienting:

```bash
lmctl status
lmctl api status
```

## A queued member message never arrived

First confirm whether the message is still queued:

```bash
lmctl status
lmctl mail sent --to "/abs/path/team.lmctl:Coder" --status queued --json
```

Use `@lmctl-ai/lmctl` 0.1.151 or newer for the `Waiting on:` status section
that keeps old undelivered mail visible; this page was checked against 0.1.218.

Look at `Waiting on:` and `mailbox outbound`. A pending `(sender, receiver)`
lane means the message is queued; it has not disappeared. If the original
`chat` exited 0 with
`enqueued mailbox message N`, that also means queued, not delivered yet.

Base delivery does not require a daemon: the next `lmctl chat` from that same
sender to that same receiver delivers that sender's queued lane once the
receiver is free. A chat from another sender to the same receiver does not flush
your lane. With `lmctl serve start` running in normal daemon mode, mailbox relay
can drain queued lanes proactively after the receiver goes idle.

If `status` shows the receiver is busy, inspect its liveness:

```bash
lmctl health <teamfile.lmctl> <alias> --json
```

A receiver can be legitimately busy because a human is holding it with
`lmctl terminal`. That is correct behavior, not a stuck queue. While the
terminal lock is live, the same sender's next chat cannot deliver the queued
lane yet. It delivers after the human exits the terminal and the receiver is
free.
Terminal-held chat can surface as:

```text
<alias> is held by a terminal on <host> since <time>; retry later
```

If the busy state points at a holder PID that is no longer running, treat it as
a stale or phantom lock, not a live terminal hold. That can happen after a
reboot or killed provider process. Do not wait for a human who is not actually
holding the session.

Whenever queued mail is not moving — whether the receiver looks idle or
phantom-busy — check the daemon too:

```bash
lmctl serve status
```

If it is not running, start it:

```bash
setsid lmctl serve start > lmctl.log 2>&1 < /dev/null & disown
```

Base follow-up: send another `lmctl chat` from the same sender to the same
receiver. If the sender stops because it is waiting for the queued reply and no
relay drains the lane, the queued mail can sit indefinitely. Treat old
`Waiting on: queued` rows in `lmctl status` as work that needs daemon recovery,
an explicit same-sender follow-up, or operator escalation.

If one message needs more detail than `status` provides, inspect the event-log
evidence:

```bash
lmctl mail history <message_id> --json
lmctl mail read <message_id> --json
lmctl mail seen <message_id> --json
```

`mail history` shows the ordered event sequence for one message. `mail read`
returns content and pending state without delivery or state change. `mail seen`
answers only whether that message id was observed in historical provider
transcript evidence; ack, seen, and answered are separate facts.

For a no-cost isolated reproduction of the discover-read-ack drain path, use
the [ClaudeMock mailbox drain fixture](./manuals/claudemock-mailbox-drain-fixture.md).

## How do I know delegated work finished?

Do not use exit code `0` alone as proof. `lmctl chat` can exit `0` with a
completed member reply, or it can exit `0` with `enqueued mailbox message N`,
which means queued and not delivered yet.

For automation, use JSON:

```bash
lmctl chat ./team.lmctl Coder "Implement the fix." --json
```

If the response has `status: "enqueued"` and `path: "enqueued"`, the work is
waiting in the `(sender, receiver)` lane. Confirm completion with:

```bash
lmctl status
lmctl status --since 7d
lmctl tail ./team.lmctl Coder
```

See [Verifying delegated work](./manuals/verifying-delegated-work.md) for the
full contract.

## Non-default serve port

If the daemon is running on a non-default port, update the API URL:

```bash
setsid lmctl serve start --port 8788 > lmctl.log 2>&1 < /dev/null & disown
export LMCTL_API_URL=http://127.0.0.1:8788
lmctl api status
```

## Delegation seems stuck

First check the current team/self view, then inspect the member without waking
it:

```bash
lmctl status
lmctl tail ./team.lmctl Coder
```

Use `lmctl diagnose` when you need a sanitized support bundle.

## A teamfile has stale sessions or model warnings

Run lint, then seed missing or placeholder sessions:

```bash
lmctl lint ./team.lmctl
lmctl seed ./team.lmctl
```

## A member is running the wrong model

First upgrade to the current public binary:

```bash
npm install -g @lmctl-ai/lmctl@latest
lmctl --version
```

Model-routed teams should use 0.1.151 or newer; this page was checked against
0.1.218. Then verify the teamfile and the live member table:

```bash
lmctl lint ./team.lmctl
lmctl seed ./team.lmctl
lmctl health ./team.lmctl
```

Compare each `_MEMBER_ ... model=` value with the `MODEL` column. If they do
not match, do not ask the model what it is; trust the CLI output and fix the
teamfile, upgrade lmctl, or refresh/re-seed the member before assigning work.

## A delegated task failed

Inspect the member transcript and record the concrete evidence in your normal
tracker:

```bash
lmctl tail ./team.lmctl Coder
```

Legacy issue API subcommands may still dispatch for compatibility, but they are
not the normal current agent-facing way to drive lmctl.
