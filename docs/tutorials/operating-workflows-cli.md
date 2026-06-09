---
title: Operating Workflows from the CLI
sidebar_position: 4
---

# Operating workflows from the CLI

Operators use lmctl to inspect state, start workflows, answer escalations, and
track issues through `lmctl-next` commands.

## Orient first

Start each operating session with:

```bash
lmctl-next status
lmctl-next api attentions --json
```

`lmctl-next status` is context-aware. When you run it inside a project
directory, it reports that project. Outside a project, it still reports profile,
provider, run, and attention information.

## Common requests

| Operator goal | Command |
| --- | --- |
| See what is happening | `lmctl-next status` |
| See open attentions | `lmctl-next api attentions --json` |
| Run QA for a project | `lmctl-next api submit-job --workflow qa-suite --inputs '{"project_name":"my-project"}' --project my-project` |
| List open issues | `lmctl-next api issues list my-project --status open --json` |
| Read one run | `lmctl-next api run <id>` |
| List recent runs | `lmctl-next api runs` |

## Answer workflow escalations

Some workflows pause for human input. List pending escalations:

```bash
lmctl-next api escalations list --json
```

Respond to one escalation by id:

```bash
lmctl-next api escalations respond <attention_id> "Use the smaller scope and continue."
```

The integrated escalation command handles the workflow response and attention
acknowledgement together.

## File project issues

Use issues for bugs, failed QA chapters, and follow-up work:

```bash
lmctl-next api issues create my-project \
  --title "Status endpoint returned 500" \
  --body "Expected status data, received HTTP 500 during the smoke test." \
  --severity high \
  --labels '["api","smoke"]' \
  --ai-test-path "ai-test/api-status-ok.md"
```

Close an issue after the fix is verified:

```bash
lmctl-next api issues close <id> --commit-hash <sha>
```
