---
title: CLI Reference
sidebar_position: 2
---

# CLI reference

`lmctl` is a local command-line tool. It runs on your machine and works
directly against your local lmctl state (the SQLite profile under `~/.lmctl/`).
Nothing it does leaves your machine unless you opt into the cloud console.

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

For tracked background delegation, add `--detach` and inspect completion through
`lmctl jobs`:

```bash
lmctl chat ./team.lmctl Coder "Run the long verification pass." --detach
lmctl jobs list --team ./team.lmctl
lmctl jobs watch <job_id>
lmctl jobs result <job_id>
```

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
when to use synchronous `chat`, tracked chat delegations, or daemon workflow
jobs.

## Tracked delegation jobs

`lmctl jobs` is for chat delegations launched with `lmctl chat ... --detach`.
It is separate from `lmctl api jobs`, which lists workflow jobs in the local
workflow queue.

```bash
lmctl jobs list
lmctl jobs list --team ./team.lmctl
lmctl jobs list --from ./team.lmctl:Lead --status running --json
lmctl jobs watch <job_id>
lmctl jobs result <job_id>
lmctl jobs show <job_id> --json
lmctl jobs cancel <job_id>
```

When `--team` and `--from` are omitted, `jobs list` filters to the current
directory's single `.lmctl` Lead when exactly one teamfile exists there;
otherwise it lists all tracked delegation jobs.

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
lmctl nudge <teamfile>[:alias]
```

`lmctl nudge` delivers an idle Lead's completed-but-undelivered background
delegations — it re-invokes the target so it processes results from jobs it
launched with `chat --detach` but never got back (a Lead only processes those on
its next turn). It is a read-only no-op when nothing is pending and skips a
target that is mid-turn (busy), never interrupting it.

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
