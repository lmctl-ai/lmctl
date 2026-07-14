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
lmctl chat ./team.lmctl Reviewer "Review Coder's latest change."
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

By default, `chat` remains synchronous:

```bash
lmctl chat ./team.lmctl Coder "Run the long verification pass."
```

From inside a member session, the same `chat` command is also the queueing
primitive. If the target is idle, `chat` drives a normal blocking turn. If the
target is busy, lmctl queues the message in that sender-to-receiver lane:

```bash
lmctl chat ./team.lmctl Coder "status note"
```

For optional async delegation from a member session, use `--detach`:

```bash
lmctl chat ./team.lmctl Coder "Run the long verification pass." --detach
```

`--detach` is unconditional enqueue/fire-and-forget. It requires
`LMCTL_SELF_SESSIONID`; without that marker, lmctl rejects the call because it
cannot identify the sender. The message is relayed to the receiver and the
response returns to the sender. A plain operator shell can drive direct
synchronous `chat`, but it cannot detach as a member unless it is running inside
a member identity. Workflow jobs still use `lmctl serve`.

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
when to use synchronous `chat`, detached member delegation, or daemon
workflow jobs.

## Foreground/background ownership

`lmctl chat` blocks and returns a member reply by default. `chat --detach` is
the optional lmctl async path for member sessions: it enqueues and returns
without waiting for the member reply.

`notify_all` is real only as supervisor/root tooling: `admincli notify`,
`admincli watch`, or the standalone `notify_all.py`. It is observe-only by
default; `--wake` relays queued mail. Regular LLM agents do not call it.

## Queued delivery

The member-to-member lifecycle is:

```text
queued -> in-flight -> delivered with receipt
```

Delivery is sender-driven. From inside a member session, `chat` queues when the
target is busy and delivers directly when the target is idle. When a delivery
turn runs, the queued lane is sent as one provider turn and the target response
is recorded as the receipt. Delivery is at-least-once: if a process dies
after sending but before marking rows delivered, lmctl may deliver the same
queued message again. A duplicate is preferable to losing work.

There is no separate LLM-called harvest command in 0.1.122. Use synchronous
`chat` for the default path, or `chat --detach` from a member session when you
want fire-and-forget delegation.

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
```

`terminal --size` reports message count, transcript bytes, and a local token
estimate. It does not compact or change the session.

## Device and MCP

```bash
lmctl device init
lmctl device id
lmctl device prompt --root ./team.lmctl --text "Summarize current status"
```

The `lmctl mcp` bridge exists for optional manual experiments, but lmctl no
longer installs or relies on it by default. See
[MCP manual install](/lmctl/docs/mcp-manual-install).

## Debug logs

Debug output goes to `~/.lmctl/debug-*.log`, not the terminal. Set
`LMCTL_DEBUG=1` before a command, then inspect the newest debug file if you need
provider or transport diagnostics.

## Connecting to a remote daemon (advanced)

By default `lmctl` uses your local daemon and needs no auth. To point the CLI
at a different or remote daemon — for example a shared host — set:

```bash
export LMCTL_API_URL=http://127.0.0.1:8787
export LMCTL_API_TOKEN=<token>
```

`lmctl` then sends the token as a bearer token to that daemon. Most setups
never need this.
