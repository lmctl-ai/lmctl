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

Look at `mailbox outbound`. A pending sender-to-receiver lane means the message
is queued; it has not disappeared. Queued member mail is delivered by the
`lmctl serve` daemon's mailbox relay, so make sure `serve` is running:

```bash
lmctl serve > lmctl.log 2>&1 &
```

If `status` shows the receiver is busy, inspect its liveness:

```bash
lmctl health <teamfile.lmctl> <alias> --json
```

A receiver can be legitimately busy because a human is holding it with
`lmctl terminal`. That is correct behavior, not a stuck queue. While the
terminal lock is live, mailbox relay leaves the message pending; it delivers
after the human exits the terminal and the receiver is free. Terminal-held chat
can surface as:

```text
<alias> is held by a terminal on <host> since <time>; retry later
```

## Workflow appears paused

List attentions and escalations:

```bash
lmctl api attentions --json
lmctl api escalations list --json
```

If an escalation is waiting for input, respond through the integrated command:

```bash
lmctl api escalations respond <attention_id> "Continue with option A."
```

## `api workflows` is hard to parse

Use JSON output:

```bash
lmctl api workflows --json
```

## Non-default serve port

If the daemon is running on a non-default port, update the API URL:

```bash
lmctl serve --port 8788 > lmctl.log 2>&1 &
export LMCTL_API_URL=http://127.0.0.1:8788
lmctl api status
```

## A run seems stuck

First check the current team/self view, then the run, timeline, and attentions:

```bash
lmctl status
lmctl api runs
lmctl api run timeline <id>
lmctl api attentions --unacked
```

Use `lmctl diagnose` or `lmctl diagnose-prompt <prompt_id>` when you need a
sanitized support bundle or a focused prompt-pending diagnostic.

## A teamfile has stale sessions or model warnings

Run lint, then seed missing or placeholder sessions:

```bash
lmctl lint ./team.lmctl
lmctl seed ./team.lmctl
```

## A submitted job failed

Inspect the run and then file or update an issue with concrete evidence:

```bash
lmctl api run <id>
lmctl api issues create my-project \
  --title "Workflow failed during status smoke" \
  --body "Expected success; observed terminal failure in run <id>." \
  --severity high
```
