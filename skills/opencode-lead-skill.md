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
the result — restricted to read-only `job` actions (`list` / `get` /
`output`; no `stop`). You don't need to check on the job yourself; the result
is already there when that turn starts. You can end your turn right after
dispatching the job — it keeps running, and the notification still arrives.

## Resubmission still drives your crew forward

That notification turn can only report what finished — it can't decide what
to do next or dispatch new work. To keep your team moving (review the result,
dispatch the next task, etc.), something external — a human, a meta-Lead, a
supervisor loop — has to resubmit `lmctl chat` to your session, exactly like
Claude Code or Codex. Nothing continues your work on its own past that
notification.

## Background job tool surface

- `shell({command, background: true, ...})` — start a background job.
- `job` tool: `list` / `get` / `output` / `stop` — inspect or manage jobs.
  The notification turn only gets `list` / `get` / `output`.
- Job lifecycle: `queued` → `starting` → `running` → `completed` / `failed` /
  `timed_out` / `cancelled` / `interrupted`.

## Open question

There's no confirmed way, from the client side, to tell a notification turn
apart from an ordinary one. Don't assume a signal exists.

## Everything else

For delegation basics, mail evidence, recovery, and cross-team addressing,
use the base [`lmctl Lead`](lmctl-lead-skill.md) skill alongside this page.
