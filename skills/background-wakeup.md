---
name: background-wakeup
description: Use lmctl wait as the wake primitive: background tracked lmctl invocations, wake on first completion or mailbox mail, harvest, and repeat.
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
the scoped caller has inbound mailbox mail.

Tracked invocations are:

- a backgrounded blocking member call, for example
  `lmctl chat "<team>.lmctl" Coder "<task>" &`
- a tracked command wrapper from inside a member session, for example
  `lmctl exec -- npm test &`

`lmctl chat` and `lmctl exec` are blocking commands. lmctl wait has no ids:
there is no `wait --id` and no system-wide wait scope. Backgrounding is the
harness or shell's job (`&`, Claude Code `run_in_background`, or equivalent).

Scope `wait` deliberately:

- default scope: the calling member's invocations and mailbox, inferred from
  `LMCTL_SELF_SESSIONID`
- positional teamfile scope: `lmctl wait "<team>.lmctl" --json` for
  invocations targeting that team

Normal users do not set `LMCTL_SELF_SESSIONID`; lmctl sets it for member
sessions it starts through `chat` and `terminal`, and child commands inherit it.
If `wait`, `recv`, or `exec` reports that the marker is missing while you are
experimenting manually, see `/lmctl/docs/manual-invocation`.

Mailbox messages are also wake events. `lmctl wait` peeks mail
non-destructively and returns previews in the `mail` array. It does not consume
messages; use `lmctl recv --json` from the receiving member session to drain and
remove them after you decide to handle them.

Use the right delivery primitive:

- `lmctl chat` drives a member turn and waits for a reply.
- `lmctl send` sends a mailbox note. With a live same-host target it returns
  quickly as `path: "enqueued"`; with a down same-host target it falls back to
  synchronous chat delivery as `path: "chat-delivered"`; if that fallback is
  refused or errors, it returns `path: "rejected"` with no queued mail left
  behind. Cross-host targets are enqueued.

## The loop

1. See N jobs and estimate durations.
2. Launch all N as tracked invocations by backgrounding blocking `lmctl chat`
   or `lmctl exec` calls.
3. Block on `lmctl wait --json` in the right scope. It returns
   `status: "completed"` when one invocation finishes or mailbox mail is
   present. It returns `status: "idle"` when nothing is currently in flight and
   no mail is pending.
4. On completed, harvest both `finished` and `mail`. A mail-only wake has
   `finished: []`. If mail is present, call `lmctl recv --json` for that same
   receiver before acting on it; `wait` only peeked.
5. Still work in flight? Call `lmctl wait` again. It returns on the next
   completion in the same interactive first-return loop.
6. On idle, generate work: check your mailbox/chatrooms for new asks, spawn a
   review or QA pass, or pull the next queue item. A single idle result means no
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
  tracked `lmctl chat` / `lmctl exec`, then block in `lmctl wait`; there is no
  provider completion push.

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
