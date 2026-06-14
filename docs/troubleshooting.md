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

`lmctl status` is the operator-oriented view and can resolve project
context from the current working directory. `lmctl api status` is the
daemon status payload and requires the daemon API.

Use both when orienting:

```bash
lmctl status
lmctl api status
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

## A project seems stuck behind a lock

First check the active run and attentions:

```bash
lmctl status
lmctl api runs
lmctl api attentions --unacked
```

If you confirm the lock should be released:

```bash
lmctl project unlock <name>
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
