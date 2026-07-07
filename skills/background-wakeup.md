---
name: background-wakeup
description: How an agent (Lead/meta-lead) avoids the "idle forever" trap — self-drive via the orchestration loop so you never stall after a turn or after compaction.
---

# Skill: Background wake-up (never idle, never stall)

## The runtime truth (verified across opencode, lmplayer, Claude Code)
**No harness wakes an idle LLM on a schedule. A turn starts ONLY on a new prompt.** After you finish a
turn — or after a **context compaction** — you go dormant and will **not** auto-resume. And
**fire-and-forget background work gives you no completion callback**: you never learn a job finished
unless you are re-prompted and choose to check. So if you delegate and then end your turn, the fleet
keeps running but you go blind and stall.

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
  your wake; drive members with `lmctl loop`.
- **codex / gemini** (poll-only, no push): they cannot push a completion — use lmctl's tracked background
  jobs and **poll + harvest each loop** (check `lmctl jobs`).

## After compaction
Compaction ends your turn → you go idle and will not auto-resume. So **before you would idle, arm your
wake** (a blocking harness-tracked call) or ensure a driver (`lmctl loop`, or the operator mailbox) will
re-prompt you. Never end a turn with outstanding work and no wake armed.

## The durable fix (coming)
lmplayer **background-submission** will inject a completion prompt back into your session on finish/error
(native wake) — then a lead can fire N and be woken per completion. Until then, this loop is the workaround.
