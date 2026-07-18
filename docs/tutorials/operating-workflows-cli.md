---
title: Operating Teams from the CLI
sidebar_position: 4
---

# Operating teams from the CLI

Operators use lmctl to inspect team state, send Lead/member prompts, and track
follow-up work. The current public command model is teamfile + members +
`lmctl chat`.

## Orient first

Start each operating session with:

```bash
lmctl status
```

`lmctl status` is team/SELF scoped. In a seeded member session it resolves the
caller from `LMCTL_SELF_SESSIONID` and reports that member's teamfile, member
state, delegation activity, and mailbox lanes. Outside a member session it
falls back to workspace scope with `identity: none`.

## Common requests

| Operator goal | Command |
| --- | --- |
| See what is happening | `lmctl status` |
| Read a member without waking it | `lmctl tail ./team.lmctl Lead` |
| Ask the Lead to coordinate QA | `lmctl chat ./team.lmctl Lead "Run the QA pass with Coder and Reviewer1, then report."` |
| List provider sessions | `lmctl ls` |
| Check a member session | `lmctl health ./team.lmctl Coder` |

## Reuse a team as a template

Use `clone` when you want to copy a `.lmctl` teamfile without carrying over the
source team's session ids:

```bash
lmctl clone ./backend/backend.lmctl ./backend-v2/backend-v2.lmctl
lmctl lint ./backend-v2/backend-v2.lmctl
lmctl seed ./backend-v2/backend-v2.lmctl
```

When one team needs to reach a member in another team, no setup is required:
cross-team calls work automatically at runtime, with runtime cycle protection
against runaway loops. See
[Cross-team calls](../manuals/teams-connect.md) for the semantics.

## File follow-up issues

Use issues for bugs, failed QA chapters, and follow-up work:

```bash
lmctl api issues create <scope> \
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
