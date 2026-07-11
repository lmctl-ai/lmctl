---
name: background-wakeup
description: Use lmctl wait as the wake primitive: background tracked lmctl invocations, wake on first completion or delivered queue receipt, harvest, and repeat.
---

# Skill: Background wake-up with `lmctl wait`

## The runtime truth

No harness wakes an idle LLM on a schedule. A turn starts only on a new prompt.
After you finish a turn, or after context compaction, you go dormant and will
not auto-resume. Fire-and-forget background work also gives you no completion
callback: you never learn a job finished unless something re-prompts you.

The fix is to keep one blocking primitive armed: `lmctl wait`. Its return is
your wake.

## The wait method

When you have N jobs, launch them as tracked background invocations, then block
on `lmctl wait`. It polls local tracked-invocation state, burns no model tokens,
and returns when the first invocation in scope reaches a terminal state or when
the scoped caller has a delivered queue receipt.

Tracked invocations are:

- a backgrounded blocking member call, for example
  `lmctl chat "<team>.lmctl" Coder "<task>" &`
- a backgrounded queue flush from inside a member session, for example
  `lmctl push --json &`
- a tracked command wrapper from inside a member session, for example
  `lmctl exec -- npm test &`

`lmctl chat`, `lmctl push`, and `lmctl exec` are blocking commands. lmctl wait
has no ids and no system-wide wait scope. Backgrounding is the harness or
shell's job (`&`, Claude Code `run_in_background`, or equivalent).

If you learned older lmctl async commands, use the migration table in the basic
Lead skill. This skill assumes the current surface: `chat`, `check`, `push`,
and `wait`.

Scope `wait` deliberately:

- default scope: the calling member's invocations and delivered receipts, inferred from
  `LMCTL_SELF_SESSIONID`
- positional teamfile scope: `lmctl wait "<team>.lmctl" --json` for
  invocations targeting that team

Normal users do not set `LMCTL_SELF_SESSIONID`; lmctl sets it for member
sessions it starts through `chat` and `terminal`, and child commands inherit it.
If `check`, `push`, `wait`, or `exec` reports that the marker is missing while you are
experimenting manually, see `/lmctl/docs/manual-invocation`.

Queue receipts are also wake events. The message lifecycle is:

```text
queued -> in-flight -> delivered with receipt
```

`lmctl check --json` is read-only and shows the calling member's outbound queued
lanes. `lmctl push --json` sequentially delivers currently available outbound
lanes for idle receivers and skips busy receivers. Neither command requires
`lmctl serve`. Delivery is at-least-once: after a crash, a queued message may be
delivered again rather than lost.

Use the right delivery primitive:

- `lmctl chat` drives a member turn and waits for a reply. From inside a member
  session, it queues if the target is busy.
- `lmctl check` reports your outbound queued lanes without mutating them.
- `lmctl push` sequentially flushes your outbound queued lanes for idle receivers.

## The loop

1. See N jobs and estimate durations.
2. Launch all N as tracked invocations by backgrounding blocking `lmctl chat`,
   `lmctl push`, or `lmctl exec` calls.
3. Block on `lmctl wait --json` in the right scope. It returns
   `status: "completed"` when one invocation finishes or a queue receipt is
   present. It returns `status: "idle"` when nothing is currently in flight and
   no receipt is pending.
4. On completed, harvest both finished invocations and delivered receipts. A
   receipt-only wake has no finished invocation; use the receipt text to decide
   the next step.
5. Still work in flight? Call `lmctl wait` again. It returns on the next
   completion in the same interactive first-return loop.
6. On idle, run `lmctl check --json`, push eligible outbound lanes, spawn a
   review or QA pass, or claim the next external/backlog item. A single idle result means no
   tracked invocation is running in this scope right now, not that the broader
   backlog is empty.
7. Overloaded: queue follow-up work and submit as capacity frees.
8. Operator input is just another queue item; do not block waiting on the
   operator.

This replaces the old `(N-1, 1)` hack. All N jobs can go to the background; the
dedicated foreground return point is `lmctl wait`.

## Robustness

- Phantom reclaim: if a background invocation's process dies without writing a
  finish row, `wait` detects the dead or stale holder and returns an error row
  instead of blocking forever. A reclaimed row means the tracker died; verify
  the actual output before treating the underlying work as successful.
- Appearance grace: `cmd & lmctl wait` has a race because the backgrounded
  process may insert its row just after `wait` starts. `wait` polls briefly
  before concluding idle, and the next pass can still adopt a late row.
- Timeout: `wait` exits `1` on timeout. Use `--timeout <seconds>` when the
  harness needs a bounded parking window.

## Arm the wake correctly for your harness

The blocking `lmctl wait` call must be one your harness can wake you from:

- Claude Code: wrap a blocking call in a harness-tracked background tool
  (`run_in_background:true`) or a subagent. The harness re-invokes you when it
  exits.
- opencode / lmplayer: use a run-based driver loop; a blocking `lmctl wait`
  return is the wake, then harvest, dispatch, and call `wait` again.
- codex / gemini: these are poll-only from lmctl's point of view. Background
  tracked `lmctl chat` / `lmctl push` / `lmctl exec`, then block in
  `lmctl wait`; there is no provider completion push.

Avoid a single shell command that backgrounds several children and then runs
`lmctl wait` while the outer shell itself is the harness-tracked process. Some
shells wait for their own background children before the harness sees the shell
exit, which can hide the first-return wake. Prefer separate harness-tracked
background invocations, or make sure the harness is tracking `lmctl wait`
itself.

## After compaction

Compaction ends your turn, so you go idle and will not auto-resume. Before you
would idle, arm your wake with a scoped blocking `lmctl wait`, or ensure a
driver/operator prompt will re-prompt you. Never end a turn with outstanding
tracked work and no wake armed.
