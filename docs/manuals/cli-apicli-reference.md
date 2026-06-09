---
title: CLI / API Reference
sidebar_position: 2
---

# CLI / API reference

`lmctl-next` has top-level operator commands and an HTTP-backed `api` command
group. The `api` group talks to the running daemon.

## apicli

In these docs, **apicli** means the `lmctl-next api` command group. There is no
separate `apicli` binary.

## Setup and status

```bash
lmctl-next init
lmctl-next status
lmctl-next diagnose
lmctl-next serve > lmctl.log 2>&1 &
```

## Project, team, and workflow setup

```bash
lmctl-next project create my-project \
  --workflow image-qa \
  --team my-team \
  --local-path /tmp/my-project

lmctl-next team create my-team
lmctl-next team add-member my-team --alias QA --provider claude
lmctl-next team seed my-team

lmctl-next workflow load image-qa workflows/image-qa.compound.json
```

## API command nouns

```bash
lmctl-next api status
lmctl-next api projects
lmctl-next api projects <name>
lmctl-next api teams
lmctl-next api teams <name>
lmctl-next api workflows --json
lmctl-next api workflows <name>
lmctl-next api runs
lmctl-next api run <id>
lmctl-next api jobs
lmctl-next api job <id>
lmctl-next api daemon
lmctl-next api stats
lmctl-next api attentions
lmctl-next api sessions
lmctl-next api external-objects
lmctl-next api external-signals
```

Many list commands support `--json`. Prefer JSON when another program or agent
will parse the output.

## Submit jobs

```bash
lmctl-next api submit-job \
  --workflow image-qa \
  --project my-project \
  --inputs '{"image_path":"/tmp/my-project/sample.png","prompt":"describe this"}'
```

The command blocks until the workflow reaches a terminal state.

## Upload files

```bash
lmctl-next api upload /tmp/my-project/sample.png --project my-project --json
```

Uploads return structured metadata including path, size, and MIME type.

## Issues

```bash
lmctl-next api issues list my-project --status open --json
lmctl-next api issues show <id> --json
lmctl-next api issues create my-project --title "Title" --body "Body"
lmctl-next api issues close <id> --commit-hash <sha>
lmctl-next api issues reopen <id>
lmctl-next api issues claim <id> --assigned-run-id <run_id>
```

Use issues for failed QA chapters, bugs found during workflow runs, and
operator-visible follow-up work.

## API authentication

When the daemon requires auth, set:

```bash
export LMCTL_NEXT_API_URL=http://127.0.0.1:8787
export LMCTL_NEXT_API_TOKEN=<token>
```

The API command group sends the token as a bearer token to the daemon.
