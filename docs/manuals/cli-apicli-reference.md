---
title: CLI / API Reference
sidebar_position: 2
---

# CLI / API reference

`lmctl` has top-level operator commands and an HTTP-backed `api` command
group. The `api` group talks to the running daemon.

## api command group

In these docs, the **HTTP client** means the `lmctl api` command group. It is a
CLI client over the `lmctl serve` HTTP surface; there is no separate binary.

## Setup and status

```bash
lmctl init
lmctl status
lmctl diagnose
lmctl serve > lmctl.log 2>&1 &
```

`lmctl serve` runs a single always-on daemon that listens over HTTP on
`127.0.0.1:8787` by default. The CLI and web UI are HTTP satellites of this
daemon.

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

## API command nouns

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

## API authentication

When the daemon requires auth, set:

```bash
export LMCTL_API_URL=http://127.0.0.1:8787
export LMCTL_API_TOKEN=<token>
```

The API command group sends the token as a bearer token to the daemon.
