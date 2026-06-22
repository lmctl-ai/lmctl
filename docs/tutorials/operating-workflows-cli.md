---
title: Operating Workflows from the CLI
sidebar_position: 4
---

# Operating workflows from the CLI

Operators use lmctl to inspect state, start workflows, answer escalations, and
track issues through `lmctl` commands.

## Orient first

Start each operating session with:

```bash
lmctl status
lmctl api attentions --json
```

`lmctl status` is context-aware. When you run it inside a project
directory, it reports that project. Outside a project, it still reports profile,
provider, run, and attention information.

## Common requests

| Operator goal | Command |
| --- | --- |
| See what is happening | `lmctl status` |
| See open attentions | `lmctl api attentions --json` |
| Run QA for a project | `lmctl api submit-job --workflow qa-suite --inputs '{"project_name":"my-project"}' --project my-project` |
| List open issues | `lmctl api issues list my-project --status open --json` |
| Read one run | `lmctl api run <id>` |
| List recent runs | `lmctl api runs` |

## Reuse a team as a template

Use `clone` when you want to copy a `.lmctl` teamfile without carrying over the
source team's session ids:

```bash
lmctl clone ./backend/backend.lmctl ./backend-v2/backend-v2.lmctl
lmctl lint ./backend-v2/backend-v2.lmctl
lmctl seed ./backend-v2/backend-v2.lmctl
```

Use `connect` when one team needs an explicit cross-team edge to a member in
another team:

```bash
lmctl connect ./frontend/frontend.lmctl ./backend/backend.lmctl Reviewer
lmctl lint ./frontend/frontend.lmctl
lmctl seed ./frontend/frontend.lmctl
```

`connect` appends a team-level `_CONNECT_` entry to the source teamfile. See
[Teams & cross-team connections](../manuals/teams-connect.md) for the semantics.

## Answer workflow escalations

Some workflows pause for human input. List pending escalations:

```bash
lmctl api escalations list --json
```

Respond to one escalation by id:

```bash
lmctl api escalations respond <attention_id> "Use the smaller scope and continue."
```

The integrated escalation command handles the workflow response and attention
acknowledgement together.

## File project issues

Use issues for bugs, failed QA chapters, and follow-up work:

```bash
lmctl api issues create my-project \
  --title "Status endpoint returned 500" \
  --body "Expected status data, received HTTP 500 during the smoke test." \
  --severity high \
  --labels '["api","smoke"]' \
  --ai-test-path "ai-test/api-status-ok.md"
```

Close an issue after the fix is verified:

```bash
lmctl api issues close <id> --commit-hash <sha>
```
