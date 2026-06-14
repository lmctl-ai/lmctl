---
title: CLI Reference
sidebar_position: 2
---

# CLI reference

`lmctl` is a local command-line tool. It runs on your machine and works
directly against your local lmctl state (the SQLite profile under `~/.lmctl/`).
Nothing it does leaves your machine unless you opt into the cloud console.

Its commands come in two shapes, both part of the same CLI:

- **top-level commands** — `lmctl init`, `lmctl status`, `lmctl serve`,
  `lmctl project`, `lmctl team`, `lmctl workflow`, `lmctl diagnose`, and so on.
- **the `lmctl api <noun>` group** — inspect and act on jobs, runs, attentions,
  and issues. `api` is just the name of a command group; it is not a separate
  binary or a remote client.

## Setup and status

```bash
lmctl init
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

## Inspecting state

These `lmctl api <noun>` commands read and act on your local lmctl state:

```bash
lmctl api status
lmctl api projects
lmctl api projects <name>
lmctl api teams
lmctl api teams <name>
lmctl api workflows --json
lmctl api workflows <name>
lmctl api runs
lmctl api run <id>
lmctl api jobs
lmctl api job <id>
lmctl api daemon
lmctl api stats
lmctl api attentions
lmctl api sessions
lmctl api external-objects
lmctl api external-signals
```

Many list commands support `--json`. Prefer JSON when another program or agent
will parse the output.

## Submit jobs

```bash
lmctl api submit-job \
  --workflow image-qa \
  --project my-project \
  --inputs '{"image_path":"/tmp/my-project/sample.png","prompt":"describe this"}'
```

The command blocks until the workflow reaches a terminal state.

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

## Connecting to a remote daemon (advanced)

By default `lmctl` uses your local daemon and needs no auth. To point the CLI
at a different or remote daemon — for example a shared host — set:

```bash
export LMCTL_API_URL=http://127.0.0.1:8787
export LMCTL_API_TOKEN=<token>
```

`lmctl` then sends the token as a bearer token to that daemon. Most setups
never need this.
