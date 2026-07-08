---
title: CLI Reference
sidebar_position: 2
---

# CLI reference

`lmctl` is a local command-line tool. It runs on your machine and works
directly against your local lmctl state (a SQLite workspace database, normally
under `~/.lmctl/`). The lmctl database, daemon, and workflow state are local by
default. Provider CLIs still use their own configured services when they run
model turns, and the optional cloud console is an explicit opt-in.

Its commands come in two shapes, both part of the same CLI:

- **top-level commands** — `lmctl status`, `lmctl serve`,
  `lmctl project`, `lmctl team`, `lmctl workflow`, `lmctl diagnose`, and so on.
- **the `lmctl api <noun>` group** — inspect and act on jobs, runs, attentions,
  and issues. `api` is just the name of a command group; it is not a separate
  binary or a remote client.

## Setup and status

```bash
lmctl status
lmctl diagnose
lmctl serve > lmctl.log 2>&1 &
```

`lmctl serve` runs the local always-on daemon that *executes* queued work —
jobs and runs are carried out by this background process. Start it once and
leave it running. The optional [lmctl.ai](https://lmctl.ai) web console (a
free/premium subscription) connects to this same local daemon.

## Project, team, and workflow setup

```bash
lmctl project create my-project \
  --workflow image-qa \
  --team my-team \
  --local-path /tmp/my-project

lmctl team create my-team
lmctl team add-member my-team --alias QA --provider claude
lmctl team seed my-team

lmctl workflow load image-qa workflows/image-qa.compound.json
```

Verified usage:

```text
lmctl project create <name> --local-path P --workflow W --team T
lmctl team add-member <team-name> --alias A --provider P [--model M] [--role R] [--sessiondir D]
lmctl workflow load <name> <path-to-json | lmctl://workflow/<name>>
```

## Teamfiles, clone, lint, seed

`.lmctl` teamfiles are editable team documents. Use `clone` to copy a teamfile
without carrying over session ids:

```bash
lmctl clone ./backend/backend.lmctl ./backend-v2/backend-v2.lmctl
lmctl lint ./backend-v2/backend-v2.lmctl
lmctl seed ./backend-v2/backend-v2.lmctl
```

Cross-team calls work automatically at runtime — there is no command to wire
them up. See [Cross-team calls](./teams-connect.md).

`lmctl lint <teamfile.lmctl>` validates teamfile syntax, session placeholders,
and configured models. `lmctl seed <teamfile.lmctl>` fills missing or
placeholder session ids by calling the configured native providers.

Generate a starter team document for a directory:

```bash
lmctl plan ./backend --provider codex
```

## Direct member chat

Use `lmctl chat` when an operator or Lead needs to drive a specific member
directly. The common teamfile forms are:

```bash
lmctl chat ./team.lmctl:Coder "Implement the smallest safe fix."
lmctl chat ./team.lmctl Coder "Implement the smallest safe fix."
lmctl chat ./team.lmctl Reviewer "Review Coder's latest change." --from ./team.lmctl:Lead
```

`chat` is synchronous by default: it sends one prompt and blocks until that
provider turn finishes or errors. It returns the provider result on success and
exits non-zero on delivery, provider, busy, or runtime errors. For raw provider
sessions, use one of:

```bash
lmctl chat <sessionid> "Prompt text" --provider codex
lmctl chat --provider codex --session <sessionid> "Prompt text"
```

To answer a paused managed run:

```bash
lmctl chat --run <id> "Operator answer" --done
```

For tracked background work, run blocking member calls in the background and use
`lmctl wait` as the wake primitive:

```bash
lmctl chat ./team.lmctl Coder "Run the long verification pass." --from ./team.lmctl:Lead &
lmctl wait --from ./team.lmctl:Lead --json
```

For asynchronous peer coordination, use the mailbox commands:

```bash
lmctl send ./team.lmctl Coder --from ./team.lmctl:Lead "status note"
lmctl wait --from ./team.lmctl:Coder --json
lmctl recv --from ./team.lmctl:Coder --json
```

`send` is liveness-aware: live same-host targets get queued mail
(`path: "enqueued"`), down same-host targets fall back to synchronous chat
delivery (`path: "chat-delivered"`), and cross-host targets are queued. If chat
fallback is refused or errors, `send` returns `path: "rejected"` without leaving
queued mail behind. `wait` reports mailbox previews without consuming them;
`recv` drains and removes the receiver's pending messages.

## Inspecting state

These `lmctl api <noun>` commands read and act on your local lmctl state:

```bash
lmctl api status
lmctl api projects
lmctl api teams
lmctl api workflows --json
lmctl api runs
lmctl api run <id>
lmctl api jobs
lmctl api job <id>
lmctl api daemon state
lmctl api daemon cycle
lmctl api stats run-throughput
lmctl api attentions
lmctl api external-objects
lmctl api external-signals
```

Many list commands support `--json`. Prefer JSON when another program or agent
will parse the output.

## Submit jobs

Workflow jobs are the daemon-executed async path for repeatable workflows. Keep
`lmctl serve` running, submit the job, then inspect jobs/runs and attentions.

```bash
lmctl api submit-job \
  --workflow image-qa \
  --project my-project \
  --inputs '{"image_path":"/tmp/my-project/sample.png","prompt":"describe this"}'
```

The command blocks until the workflow reaches a terminal state.

The top-level workflow runner exposes the same shape:

```bash
lmctl workflow run --workflow image-qa --project my-project --inputs '{"image_path":"/tmp/my-project/sample.png","prompt":"describe this"}'
```

See [Direct chat vs background work](./direct-chat-and-background-work.md) for
when to use synchronous `chat`, tracked invocations with `wait`, or daemon
workflow jobs.

## Tracked invocation wait

`lmctl wait` blocks until the first tracked invocation in scope finishes or the
scoped caller has inbound mailbox mail. It is separate from `lmctl api jobs`,
which lists workflow jobs in the local workflow queue.

```bash
lmctl wait --json
lmctl wait ./team.lmctl --json
lmctl wait --from ./team.lmctl:Lead --json
lmctl wait --timeout 300 --interval 5 --json
```

Default scope is the calling member's own invocations, inferred from
`LMCTL_SELF_SESSIONID`. Use `--from` for an explicit sender, a teamfile
positional for invocations targeting that team, or default self scope from
inside a member session. For caller scopes, `wait` also wakes when the caller
has inbound mailbox mail and includes non-destructive previews in the `mail`
array. There is intentionally no system-wide wait scope and no `wait --id`; the
model is interactive first-return over the scoped queue.

Exit codes are `0` for completed or idle (inspect `status` in the output), `1`
for timeout, and `2` for usage or scope errors.

`lmctl exec` runs any local command as a tracked invocation so `lmctl wait` can
wake on it. `exec` is blocking, so background one or more invocations with your
harness or shell, then call `wait` in the same scope and loop until no work
remains:

```bash
lmctl exec --from ./team.lmctl:Lead -- npm test &
lmctl exec --from ./team.lmctl:Lead -- sh -lc 'npm test && npm run build' &
lmctl wait --from ./team.lmctl:Lead --json
```

There is no lmctl-native `--detach` path for `chat` or `exec`; backgrounding is
outside lmctl (`&`, Claude Code `run_in_background`, or equivalent).

## Mailbox send and receive

`lmctl send` delivers one message to a team member:

```bash
lmctl send ./team.lmctl Coder "status note"
lmctl send ./team.lmctl Coder --from ./team.lmctl:Lead "status note" --json
```

If the target has a live same-host carrier, `send` enqueues mailbox mail and
returns immediately. If the same-host target is down, `send` falls back to
synchronous `chat` delivery so the message is not stranded. If that fallback is
refused or errors, `send` returns `path: "rejected"` without leaving queued mail
behind. Cross-host targets are enqueued.

`lmctl recv` drains the calling member's mailbox:

```bash
lmctl recv --from ./team.lmctl:Coder --json
lmctl recv --json
```

Without `--from`, `recv` uses `LMCTL_SELF_SESSIONID` to infer the caller. It
refuses to guess when the caller cannot be inferred. A successful drain removes
the returned messages; a second `recv` returns an empty list until new mail
arrives.

## Upload files

```bash
lmctl api upload /tmp/my-project/sample.png --project my-project --json
```

Uploads return structured metadata including path, size, and MIME type.

## Attentions

```bash
lmctl api attentions
lmctl api attentions --unacked
lmctl api attention ack <id>
```

An attention is a persistent operator notification. Use `--unacked` to list the
ones still awaiting acknowledgement, then ack them by id.

## Issues

```bash
lmctl api issues list my-project --status open --json
lmctl api issues show <id> --json
lmctl api issues create my-project --title "Title" --body "Body"
lmctl api issues close <id> --commit-hash <sha>
lmctl api issues reopen <id>
lmctl api issues claim <id> --assigned-run-id <run_id>
```

Use issues for failed QA chapters, bugs found during workflow runs, and
operator-visible follow-up work.

## Sessions and managed runs

```bash
lmctl ls
lmctl ls --runs --limit 10
lmctl terminal <teamfile>:<alias>
lmctl terminal --run <id>
lmctl terminal --project my-project --team my-team --alias QA --size --json
lmctl tail <session-id> --provider codex
lmctl tail ./team.lmctl Coder
lmctl tail --session <session-id> --provider codex
lmctl tail --run <id> --watch
lmctl health <teamfile>
lmctl health ./team.lmctl Coder
lmctl health <session-id> --provider codex
lmctl health --run <id>
lmctl wait --json
lmctl wait --from ./team.lmctl:Lead --json
```

`terminal --size` reports message count, transcript bytes, and a local token
estimate. It does not compact or change the session.

## Device and MCP

```bash
lmctl device init
lmctl device id
lmctl device prompt --root ./team.lmctl --text "Summarize current status"
lmctl mcp
```

`lmctl mcp` starts the stdio MCP bridge backed by local API config.

## Connecting to a remote daemon (advanced)

By default `lmctl` uses your local daemon and needs no auth. To point the CLI
at a different or remote daemon — for example a shared host — set:

```bash
export LMCTL_API_URL=http://127.0.0.1:8787
export LMCTL_API_TOKEN=<token>
```

`lmctl` then sends the token as a bearer token to that daemon. Most setups
never need this.
