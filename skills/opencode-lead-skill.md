---
title: opencode lmctl Lead skill
---

# opencode lmctl Lead skill

Use this when running an lmctl team Lead on opencode (the `lmctlhq/opencode`
fork). For Claude Code, use
[`claudecode-lead-skill.md`](claudecode-lead-skill.md) instead.

## Background CLI run + notification

opencode supports running a CLI command in the background:
`shell({command, background: true, ...})` returns immediately without waiting
for the command to finish.

When that job finishes, opencode starts a new turn on your session reporting
the result, with your full normal toolset available — it can act on the
result (commit, dispatch the next task, etc.), not just report it. You don't
need to check on the job yourself; the result is already there when that turn
starts. You can end your turn right after dispatching the job — it keeps
running, and the notification still arrives.

## Resubmission still drives your crew forward

A notification turn can act on what finished, but nothing drives your session
forward once its process exits — the same as Claude Code or Codex. Once that
turn also ends with no more work queued, something external — a human, a
meta-Lead, a supervisor loop — has to resubmit `lmctl chat` to pick things
back up.

## Background job tool surface

- `shell({command, background: true, ...})` — start a background job.
- `job` tool: `list` / `get` / `output` / `stop` — inspect or manage jobs;
  the full set is available during a notification turn too.
- Job lifecycle: `queued` → `starting` → `running` → `completed` / `failed` /
  `timed_out` / `cancelled` / `interrupted`.

## Open question

There's no confirmed way, from the client side, to tell a notification turn
apart from an ordinary one. Don't assume a signal exists.

## Everything else

For delegation basics, mail evidence, recovery, and cross-team addressing,
use the base [`lmctl Lead`](lmctl-lead-skill.md) skill alongside this page.
