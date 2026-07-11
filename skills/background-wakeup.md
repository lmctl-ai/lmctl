---
name: background-wakeup
description: Use lmctl more as the wake primitive: background tracked lmctl invocations, flush queued mail, harvest finished work, and repeat.
---

# Skill: Background wake-up with `lmctl more`

## The runtime truth

No harness wakes an idle LLM on a schedule. A turn starts only on a new prompt.
After you finish a turn, or after context compaction, you go dormant and will
not auto-resume. Fire-and-forget background work also gives you no completion
callback: you never learn a job finished unless something re-prompts you.

The fix is to keep one blocking primitive armed: `lmctl more`. Its return is
your wake.

## The more method

When you have N jobs, launch them as tracked background invocations, then block
on `lmctl more`. It flushes queued outbound mail to idle receivers, shows your
jobs plus outbound queue, burns no model tokens while blocked, and returns
finished work: delivered receipts plus completed tracked jobs.

Tracked invocations are:

- a backgrounded blocking member call, for example
  `lmctl chat "<team>.lmctl" Coder "<task>" &`
- a tracked command wrapper from inside a member session, for example
  `lmctl exec -- npm test &`

`lmctl chat` and `lmctl exec` are blocking commands. `more`
has no ids and no system-wide scope. Backgrounding is the harness or
shell's job (`&`, Claude Code `run_in_background`, or equivalent).

If you learned older lmctl async commands, use the migration table in the basic
Lead skill. This skill assumes the current surface: `chat` and `more`.

Scope `more` deliberately:

- default scope: the calling member's invocations and delivered receipts, inferred from
  `LMCTL_SELF_SESSIONID`
- positional teamfile scope: `lmctl more "<team>.lmctl" --json` for
  invocations targeting that team

Normal users do not set `LMCTL_SELF_SESSIONID`; lmctl sets it for member
sessions it starts through `chat` and `terminal`, and child commands inherit it.
If `more` or `exec` reports that the marker is missing while you are
experimenting manually, see `/lmctl/docs/manual-invocation`.

Queue receipts are also wake events. The message lifecycle is:

```text
queued -> in-flight -> delivered with receipt
```

`lmctl more --json` sequentially delivers currently available outbound lanes for
idle receivers and skips busy receivers, then reports status and finished work.
It blocks if something is running but nothing has finished, and returns
immediately with nothing more when idle. Delivery is at-least-once: after a
crash, a queued message may be delivered again rather than lost.

Use the right delivery primitive:

- `lmctl chat` drives a member turn and waits for a reply. From inside a member
  session, it queues if the target is busy.
- `lmctl more` flushes outbound lanes, reports jobs/queue status, and returns
  finished receipts/jobs.

## The loop

1. See N jobs and estimate durations.
2. Launch all N as tracked invocations by backgrounding blocking `lmctl chat`,
   or `lmctl exec` calls.
3. Block on `lmctl more --json` in the right scope. It flushes queued outbound
   mail first, then returns when one invocation finishes or a queue receipt is
   present.
4. On finished work, harvest both finished invocations and delivered receipts. A
   receipt-only wake has no finished invocation; use the receipt text to decide
   the next step.
5. Still work in flight? Call `lmctl more` again. It returns on the next
   completion in the same interactive first-return loop.
6. Empty `more` means this scope is idle: spawn a review or QA pass, claim the
   next external/backlog item, or exit.
7. Overloaded: queue follow-up work and submit as capacity frees.
8. Operator input is just another queue item; do not block waiting on the
   operator.

This replaces the old `(N-1, 1)` hack. All N jobs can go to the background; the
dedicated foreground return point is `lmctl more`.

## Robustness

- Phantom reclaim: if a background invocation's process dies without writing a
  finish row, `more` detects the dead or stale holder and returns an error row
  instead of blocking forever. A reclaimed row means the tracker died; verify
  the actual output before treating the underlying work as successful.
- Appearance grace: `cmd & lmctl more` has a race because the backgrounded
  process may insert its row just after `more` starts. `more` polls briefly
  before concluding idle, and the next pass can still adopt a late row.

## Arm the wake correctly for your harness

The blocking `lmctl more` call must be one your harness can wake you from:

- Claude Code: wrap a blocking call in a harness-tracked background tool
  (`run_in_background:true`) or a subagent. The harness re-invokes you when it
  exits.
- opencode / lmplayer: use a run-based driver loop; a blocking `lmctl more`
  return is the wake, then harvest, dispatch, and call `more` again.
- codex / gemini: these are poll-only from lmctl's point of view. Background
  tracked `lmctl chat` / `lmctl exec`, then block in `lmctl more`; there is no
  provider completion push.

Avoid a single shell command that backgrounds several children and then runs
`lmctl more` while the outer shell itself is the harness-tracked process. Some
shells wait for their own background children before the harness sees the shell
exit, which can hide the first-return wake. Prefer separate harness-tracked
background invocations, or make sure the harness is tracking `lmctl more`
itself.

## After compaction

Compaction ends your turn, so you go idle and will not auto-resume. Before you
would idle, arm your wake with a scoped blocking `lmctl more`, or ensure a
driver/operator prompt will re-prompt you. Never end a turn with outstanding
tracked work and no wake armed.
