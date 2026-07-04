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
lmctl jobs                          # background delegations in flight
```
`health` + `tail` are read-only — use them to see who's progressing vs spinning **before** you send
anything. In a git repo, `health` shows activity since the last commit: a Lead piling up messages
and uncommitted files with **no new commit** is spinning — that's your signal to look, not to nudge
blindly.

## Delegate to a Lead asynchronously — don't block
A Lead's turn can run for minutes. Submit and move on:
```sh
lmctl chat "<teamA>.lmctl" Lead "coordinate the X change with your Coder+Reviewer" --detach
lmctl jobs                 # what's in flight (tracked)
lmctl jobs watch <id>      # block until this one finishes + see the result
lmctl jobs result <id>     # just the final result later
```
`--detach` returns a job id immediately and is non-blocking. Submit, keep coordinating other teams,
and **pull** results with `lmctl jobs` when convenient — don't sit attached to a multi-minute run.
(If your provider has a native background tool — Claude `Bash run_in_background`, Copilot `bash
mode:async`, Agy `run_command`, Qwen `monitor` — you can instead background the *blocking*
`lmctl chat` and be notified natively.)

## Warm up a newly-seeded Lead
When you seed a team and start talking to its Lead, open with a connectivity ping:
> "use `lmctl chat`/`lmctl_chat` to ping each of your members with 'reply OK' to confirm you can
> reach them, then proceed."
This makes the Lead actually exercise delegation from turn one — teams that skip it stall at the
first hand-off.

## Message only idle Leads
A Lead mid-turn **rejects** a new message with a busy notice (it serves one sender at a time) —
the message is refused, not queued and not allowed to abort the in-flight turn, so **wait and
retry**, or `lmctl tail` to watch. Still, **nudge only Leads whose last activity shows a finished
turn** — use `tail`/`health` to tell busy from idle. Don't broadcast into a working fleet.

## Refresh a drifting Lead
A Lead can't refresh the session it's running in — but you can:
```sh
lmctl refresh "<teamA>.lmctl":Lead
```
First make sure that team's `durable-memory/` is current (the Lead re-reads it after refresh —
that's how it keeps its bearings across the reset). Then refresh. A refreshed Lead loses its chat
history but recovers its state from durable-memory.

## What NOT to do
- Don't auto-nudge on a timer — you'll interrupt working members and cause aborts.
- Don't chase a metric lmctl can't give (e.g. a context number a provider doesn't expose shows
  `n/a` — that's not a health signal, don't act on its absence).
- Don't try to force a member to do something — lmctl offers tools; if a Lead isn't delegating,
  re-onboard it with a delegation-first instruction, don't build enforcement.

---
Live page — kept correct in place at this URL as multi-team practice evolves.
