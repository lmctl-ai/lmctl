---
title: Troubleshooting
sidebar_position: 99
---

# Troubleshooting

Start with the diagnostic commands:

```bash
lmctl-next status
lmctl-next api attentions --unacked
lmctl-next diagnose
```

## API commands report an auth error

Set the daemon URL and bearer token:

```bash
export LMCTL_NEXT_API_URL=http://127.0.0.1:8787
export LMCTL_NEXT_API_TOKEN=<token>
```

Then retry:

```bash
lmctl-next api status
```

## `api status` and `status` show different output

`lmctl-next status` is the operator-oriented view and can resolve project
context from the current working directory. `lmctl-next api status` is the
daemon status payload and requires the daemon API.

Use both when orienting:

```bash
lmctl-next status
lmctl-next api status
```

## Workflow appears paused

List attentions and escalations:

```bash
lmctl-next api attentions --json
lmctl-next api escalations list --json
```

If an escalation is waiting for input, respond through the integrated command:

```bash
lmctl-next api escalations respond <attention_id> "Continue with option A."
```

## `api workflows` is hard to parse

Use JSON output:

```bash
lmctl-next api workflows --json
```

## Non-default serve port

If the daemon is running on a non-default port, update the API URL:

```bash
lmctl-next serve --port 8788 > lmctl.log 2>&1 &
export LMCTL_NEXT_API_URL=http://127.0.0.1:8788
lmctl-next api status
```

## A project seems stuck behind a lock

First check the active run and attentions:

```bash
lmctl-next status
lmctl-next api runs
lmctl-next api attentions --unacked
```

If you confirm the lock should be released:

```bash
lmctl-next project unlock <name>
```

## A submitted job failed

Inspect the run and then file or update an issue with concrete evidence:

```bash
lmctl-next api run <id>
lmctl-next api issues create my-project \
  --title "Workflow failed during status smoke" \
  --body "Expected success; observed terminal failure in run <id>." \
  --severity high
```
