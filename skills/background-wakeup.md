---
name: background-wakeup
description: Use lmctl wait as the wake primitive: launch tracked invocations, wake on completions or mailbox mail, harvest, and repeat.
---

# Skill: Background wake-up with `lmctl wait`

## The runtime truth (verified across opencode, lmplayer, Claude Code)
**No harness wakes an idle LLM on a schedule. A turn starts ONLY on a new prompt.** After you finish a
turn — or after a **context compaction** — you go dormant and will **not** auto-resume. And
**fire-and-forget background work gives you no completion callback**: you never learn a job finished
unless you are re-prompted and choose to check. So if you delegate and then end your turn, the fleet
keeps running but you go blind and stall.

## The wait method

When you have **N jobs**, launch all N as tracked invocations, then block on
`lmctl wait`. Its return is your wake. It polls local tracked-invocation state,
burns no model tokens, and returns when the first invocation in scope reaches a
terminal state or when the scoped caller has inbound mailbox mail.

Tracked invocations are:

- a backgrounded blocking member call, for example
  `lmctl chat "<team>.lmctl" Coder "<task>" --from "<team>.lmctl:Lead" &`
- a tracked command wrapper, for example
  `lmctl exec --json -- npm test &`

Scope `wait` deliberately. There is no system-wide wait scope. Use the default
caller scope from `LMCTL_SELF_SESSIONID`, or pass `--from <teamfile:alias>`,
`<teamfile>`, or `--id <id[,id...]>`.

Mailbox messages are also wake events. `lmctl wait` **peeks** mail
non-destructively and returns previews in the `mail` array. It does not consume
messages; use `lmctl recv --from <teamfile:alias> --json` to drain and remove
them after you decide to handle them.

Use the right delivery primitive:

- `lmctl chat` drives a member turn and waits for a reply.
- `lmctl send` sends a mailbox note. With a live same-host target it returns
  quickly as `path: "enqueued"`; with a down same-host target it falls back to
  synchronous chat delivery as `path: "chat-delivered"`; if that fallback is
  refused or errors, it returns `path: "rejected"` with no queued mail left
  behind. Cross-host targets are enqueued.

## The loop — do this every round
1. **See N jobs**; estimate durations.
2. **Launch all N as tracked invocations** with `lmctl chat ... &` or
   `lmctl exec ... &`.
3. **Block on `lmctl wait --json`** in the right scope. It returns
   `status: "completed"` when one invocation finishes or mailbox mail is
   present. It returns `status: "idle"` when nothing is currently in flight and
   no mail is pending.
4. **On completed → HARVEST:** inspect both `finished` and `mail`. A mail-only
   wake has `finished: []`. If mail is present, call `lmctl recv --json` for
   that same receiver before you act on it; `wait` only peeked.
5. **On idle → GENERATE work:** check your mailbox/chatrooms for new asks; spawn
   a review or QA pass. A single idle result means "no tracked invocation in this
   scope right now", not "all possible work is done".
6. **Overloaded → QUEUE** (hold tasks; submit as capacity frees — backpressure).
7. **Operator input is just another queue item — never wait on the operator.**

## Arm the wake correctly for YOUR harness
The blocking `lmctl wait` call must be one your harness can wake you from:
- **Claude Code:** wrap a **blocking** call in a harness-tracked background tool — `Bash(…, run_in_background:true)`
  or a subagent. The harness **re-invokes you when it exits** (that's your wake). Do **NOT** fire-and-forget
  an external command — the harness holds no handle and cannot wake you.
- **opencode / lmplayer / codex / gemini:** call `lmctl wait` as the blocking
  step in your driver loop. Its return is the wake; then harvest, dispatch, and
  call `wait` again.

## After compaction
Compaction ends your turn → you go idle and will not auto-resume. So **before you would idle, arm your
wake** with a scoped blocking `lmctl wait`, or ensure a driver/operator prompt
will re-prompt you. Never end a turn with outstanding tracked work and no wake
armed.
