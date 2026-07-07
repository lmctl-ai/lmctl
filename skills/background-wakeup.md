---
name: background-wakeup
description: The (N-1,1) method for avoiding the "idle forever" trap: background N-1 jobs, keep 1 shortest blocking job as your wake, then harvest.
---

# Skill: Background wake-up — the (N-1,1) method

## The runtime truth (verified across opencode, lmplayer, Claude Code)
**No harness wakes an idle LLM on a schedule. A turn starts ONLY on a new prompt.** After you finish a
turn — or after a **context compaction** — you go dormant and will **not** auto-resume. And
**fire-and-forget background work gives you no completion callback**: you never learn a job finished
unless you are re-prompted and choose to check. So if you delegate and then end your turn, the fleet
keeps running but you go blind and stall.

## The (N-1,1) method

When you have **N jobs**, submit **N-1** as tracked background work and keep
**1** job — the shortest useful one — as a blocking call. In lmctl team chat,
tracked background work means `lmctl chat ... --detach` plus `lmctl jobs`; avoid
plain shell `&` when you need a job id or completion record. The blocking call
is your wake. When it returns, harvest the background jobs, dispatch follow-ups,
and repeat.

This is the core anti-stall rule: **N-1 parallel jobs, 1 wake job**.

## The loop — do this every round
1. **See N jobs**; estimate durations.
2. **Background the N−1 longer jobs** (detached subprocesses / async members) — real parallelism.
3. **Keep the single SHORTEST job as a BLOCKING call.** A blocking call is **free** (you spend no tokens
   while it runs) and **its return is your wake.** Because it's the shortest, you return fast — on the
   surface you never sleep; underneath the fleet runs in parallel.
4. **On return → HARVEST:** quick, non-blocking peeks at the background jobs (`git log` / file / `lmctl
   jobs`). Anything finished → collect the result, dispatch its follow-up.
5. **Out of work → GENERATE work:** check your mailbox/chatrooms for new asks; spawn a review or QA pass.
   Never run dry.
6. **Overloaded → QUEUE** (hold tasks; submit as capacity frees — backpressure).
7. **Operator input is just another queue item — never wait on the operator.**

## Arm the wake correctly for YOUR harness
The "short blocking call" must be one your harness can wake you from:
- **Claude Code:** wrap a **blocking** call in a harness-tracked background tool — `Bash(…, run_in_background:true)`
  or a subagent. The harness **re-invokes you when it exits** (that's your wake). Do **NOT** fire-and-forget
  an external command — the harness holds no handle and cannot wake you.
- **opencode / lmplayer** (run-based): a **blocking** `run` / `lmctl chat` whose return is
  your wake; drive members with blocking `lmctl chat` calls or tracked
  `lmctl chat --detach` jobs plus `lmctl jobs`.
- **codex / gemini** (poll-only, no push): they cannot push a completion — use lmctl's tracked background
  jobs and **poll + harvest each loop** (check `lmctl jobs`).

## After compaction
Compaction ends your turn → you go idle and will not auto-resume. So **before you would idle, arm your
wake** (a blocking harness-tracked call) or ensure a driver (operator prompt,
tracked `lmctl jobs` polling, or the operator mailbox) will re-prompt you. Never
end a turn with outstanding work and no wake armed.
