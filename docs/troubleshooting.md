---
title: Troubleshooting
sidebar_position: 99
---

# Troubleshooting

Start with the diagnostic commands:

```bash
lmctl status
lmctl api attentions --unacked
lmctl diagnose
```

`lmctl diagnose` collects a support bundle (DB snapshot, recent events, and
config) that is useful when reporting a problem.

`lmctl status` is zero-arg. In a seeded member session it uses
`LMCTL_SELF_SESSIONID` to show the current identity, teamfile, member busy/idle
state, recent delegation activity in both directions, and pending mailbox
lanes. Outside a member session it falls back to workspace scope with
`identity: none`.

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

Passing a removed project flag now fails:

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
```

Use `@lmctl-ai/lmctl` 0.1.151 or newer for the `Waiting on:` status section
that keeps old undelivered mail visible; this page was checked against 0.1.152.

Look at `Waiting on:` and `mailbox outbound`. A pending sender-to-receiver lane
means the message is queued; it has not disappeared. If the original `chat`
exited 0 with
`enqueued mailbox message N`, that also means queued, not delivered yet. The
next `lmctl chat` from that same sender to that same receiver delivers that
sender's queued lane plus the new message in one turn, once the receiver is
free. A chat from another sender to the same receiver does not flush your lane:

```bash
lmctl chat <teamfile.lmctl> <alias> "Continue with this queued work."
```

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

Deadlock case: if the sender stops because it is waiting for the queued reply,
and nothing ever sends another `lmctl chat` from that same sender to that same
receiver, the queued mail can sit indefinitely. Treat old `Waiting on: queued`
rows in `lmctl status` as work that needs an explicit same-sender follow-up or
operator escalation.

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
lmctl serve --port 8788 > lmctl.log 2>&1 &
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
0.1.152. Then verify the teamfile and the live member table:

```bash
lmctl lint ./team.lmctl
lmctl seed ./team.lmctl
lmctl health ./team.lmctl
```

Compare each `_MEMBER_ ... model=` value with the `MODEL` column. If they do
not match, do not ask the model what it is; trust the CLI output and fix the
teamfile, upgrade lmctl, or refresh/re-seed the member before assigning work.

## Seed told me to use `lmctl_chat`, but the tool is missing

Some older seed text may mention an MCP tool named `lmctl_chat`. That tool is
not registered in normal installs, and lmctl cleanup can remove stale bridge
entries named `lmctl` or `lmctl0`. Do not repair delegation by chasing MCP
registration; use the CLI instead:

```bash
lmctl chat "<teamfile>" <alias> "your task"
```

The public docs deliberately prefer the CLI. Treat unavailable `lmctl_chat` as
a stale seed instruction, not as a reason to stop delegation.

## A delegated task failed

Inspect the member transcript and then file or update an issue with concrete
evidence:

```bash
lmctl tail ./team.lmctl Coder
lmctl api issues create <scope> \
  --title "Status smoke failed" \
  --body "Expected success; observed terminal failure." \
  --severity high
```
