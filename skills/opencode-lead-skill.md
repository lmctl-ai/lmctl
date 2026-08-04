---
title: opencode lmctl Lead skill
---

# opencode lmctl Lead skill

Use this when you are running an lmctl team Lead on opencode (the
`lmctlhq/opencode` fork with session-scoped background job submission via
`shell({background: true})`). The dispatch pattern here is the *same* as
[`claudecode-lead-skill.md`](claudecode-lead-skill.md): dispatch a background
job, end your turn, and rely on an external resubmit to keep moving. This page
covers only where opencode's background-job mechanics differ in the details.

## Resubmission is required here too — nothing auto-continues you

Whoever/whatever ends up driving your Lead's next turn — a human, a meta-Lead,
a supervisor loop — has to resubmit `lmctl chat` to this session to keep it
moving, exactly as on Claude Code or Codex. There is no daemon or background
process watching your session independently of a live connection: once your
process exits, any in-process wake registration is gone with it, and nothing
resumes on its own. Skip the resubmit and the session goes dark, same as any
other harness.

Do not build your workflow around "opencode wakes itself, so I never need to
be resubmitted" — that is not how it works. The one thing that *is*
opencode-specific is described below, and it saves you a polling step, not the
resubmit itself.

## What opencode actually does differently: no need to poll for a fast job

If a background job you submitted finishes **while your session's connection
is still alive** — the window `holdOpen` protects, from when you dispatched it
until your turn ends and the connection closes — opencode's own runtime can
surface that job's result into a new turn automatically, without you polling
`job get`/`job output` in a loop to find out what happened. That turn is
deliberately restricted to a read-only subset of the `job` tool (`list` /
`get` / `output`; `stop` is excluded), so it can report what finished — it
cannot decide what's next or dispatch new work on your behalf.

**Polling is what this replaces, not resubmission.** In a naive model you'd
loop on `job get`/`job output` to detect and retrieve a background job's
result. opencode's notification mechanism replaces that specific step — when
your session gets resubmitted (by whatever external driver is running your
crew), if the job already finished, its result is already surfaced in that
turn without a manual detection step first. It does not replace the
resubmission itself: nothing drives your session forward on its own once its
process has exited.

## Why holdOpen matters

Ending your turn used to close the ACP connection immediately, which could
kill a background job you had just submitted before it had a chance to finish
— a real bug, fixed in `@lmctl-ai/lmctl@0.1.248`. lmctl's `holdOpen` mechanism
now keeps your session's ACP connection open for as long as you have
outstanding dispatched work (a nested `lmctl chat`, or any tool call reporting
`rawInput.background === true`), bounded by a short grace period for the work
to register and a hard ceiling so nothing hangs forever. This protects the job
itself from being killed early — it has no bearing on whether your session
gets resubmitted afterward.

## Background job tool surface

- `shell({command, background: true, ...})` — submits a session-scoped
  background job and returns immediately, without waiting for the command to
  finish.
- `job` tool, actions `list` / `get` / `output` / `stop` — inspect or manage
  jobs in the current session. `stop` requires a permission ask in a normal
  turn; the restricted variant available inside an unattended/notification
  turn only exposes `list` / `get` / `output`.
- Job lifecycle: `queued` → `starting` → `running` → a terminal state
  (`completed` / `failed` / `timed_out` / `cancelled` / `interrupted`). Each
  state carries a `notification_state` that governs whether and when the
  unattended-turn wake fires. That wake mechanism degrades after repeated
  failed attempts and recovers via the next real resubmitted turn — it is a
  latency optimization on top of resubmission, not a replacement for it.

## What we don't yet know

There is currently no confirmed way to tell, from the client/caller side, that
a given turn was an autonomous unattended/notification turn rather than an
ordinary one. If you need to distinguish these (for logging, for deciding
whether a turn's output represents a fresh request vs. a background-job
follow-up), don't assume a signal exists — this is unconfirmed and may need a
protocol-level answer before it can be documented here.

## Everything else

For delegation basics, mail evidence, recovery, and cross-team addressing that
are not opencode-specific, use the base [`lmctl Lead`](lmctl-lead-skill.md)
skill alongside this page — this page only covers where opencode's background-
job model differs from the general pattern.
