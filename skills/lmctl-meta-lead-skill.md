# lmctl — Meta-Lead skill (coordinating multiple teams)

You are a **meta-Lead**: you don't do the work, you coordinate several **team Leads**, each running
their own `.lmctl` team. Your job is oversight and unblocking across teams — the same
administration discipline as a Team Lead, one level up. Read the Team Lead **basic** + **advanced**
skills first; this page is the multi-team layer.

Core stance: **lmctl is LLM-centered orchestration *and administration*.** You administer Leads the
way a Lead administers members — seed, monitor, unblock, refresh — but never micromanage.

## Survey your fleet without disturbing it
```sh
lmctl health "<teamA>.lmctl"        # per-team rollup, per each team you run
lmctl tail "<teamA>.lmctl" Lead     # read a Lead's recent turns; does NOT wake it
```
`health` + `tail` are read-only — use them to see who's progressing vs spinning **before** you send
anything. In a git repo, `health` shows activity since the last commit: a Lead piling up messages
and uncommitted files with **no new commit** is spinning — that's your signal to look, not to poke
blindly.

## Delegate to a Lead asynchronously — then wait in scope
A Lead's turn can run for minutes. Launch the blocking call in the background,
then let `lmctl wait` wake you when one tracked invocation finishes:
```sh
lmctl chat "<teamA>.lmctl" Lead "coordinate the X change with your Coder+Reviewer" --from "<meta>.lmctl:Lead" &
lmctl wait --from "<meta>.lmctl:Lead" --json
```
`wait` is intentionally scoped. Use default self-scope when running inside a
member session, or `--from <teamfile:alias>` for an explicit sender. There is no
system-wide wait scope; do not try to wake on unrelated teams' completions.

## Warm up a newly-seeded Lead
When you seed a team and start talking to its Lead, open with a connectivity ping:
> "use `lmctl chat`/`lmctl_chat` to ping each of your members with 'reply OK' to confirm you can
> reach them, then proceed."
This makes the Lead actually exercise delegation from turn one — teams that skip it stall at the
first hand-off.

## Message only idle Leads
A Lead mid-turn **rejects** a new message with a busy notice (it serves one sender at a time) —
the message is refused, not queued and not allowed to abort the in-flight turn, so **wait and
retry**, or `lmctl tail` to watch. Use `tail`/`health` to tell busy from idle.
Don't broadcast into a working fleet.

## Refresh a drifting Lead
A Lead can't refresh the session it's running in — but you can:
```sh
lmctl refresh "<teamA>.lmctl":Lead
```
First make sure that team's `durable-memory/` is current (the Lead re-reads it after refresh —
that's how it keeps its bearings across the reset). Then refresh. A refreshed Lead loses its chat
history but recovers its state from durable-memory.

## Getting a Lead to actually execute (e.g. commit built work)
If a Lead seems to "ignore" an instruction, it's almost never an lmctl bug — check these first:
1. **Don't send empty/continuation nudges.** A message like `Continue from where you left off.` (or
   any content-free "keep going") has nothing actionable — a Claude Lead correctly does nothing and
   logs `No response requested.`. **That log line is NOT a reply to your real instruction** — it's
   the Lead correctly no-opping an *empty* prompt. Send **one concrete, self-contained instruction**
   and stop nudging.
2. **Let the Lead write its own commit message.** A Lead will (correctly) refuse to commit blindly
   under a message that doesn't match the actual tree — that reads as a no-op but is good caution.
   Say: *"Commit your built work — write an accurate message from `git diff --staged`, then reply the
   hash."* Don't dictate a message that doesn't describe the changes.
3. **Read the Lead's REAL turns with `lmctl tail "<team>" Lead`, not the summary log lines.** The
   one-line `No response requested.` entries are replies to nudges and **hide** the Lead's actual
   engagement + any real blocker (a message mismatch, a killed command). `tail` shows what truly
   happened; the summary log misleads.
4. **Heavy commands get killed under high concurrency.** Running many teams at once starves memory —
   a pre-commit validator / lint / manifest build can be SIGKILL'd (`exit 137`), stalling the commit.
   A lint gate is **not** a commit blocker: tell the Lead to commit the built work and run validation
   separately, and keep concurrency modest (a handful of live teams, not a dozen+).

## What NOT to do
- Don't send empty "continue" prompts on a timer — you'll interrupt working members and cause aborts.
- Don't chase a metric lmctl can't give (e.g. a context number a provider doesn't expose shows
  `n/a` — that's not a health signal, don't act on its absence).
- Don't try to force a member to do something — lmctl offers tools; if a Lead isn't delegating,
  re-onboard it with a delegation-first instruction, don't build enforcement.

---
Live page — kept correct in place at this URL as multi-team practice evolves.
