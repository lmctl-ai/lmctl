# lmctl — Team Lead skill (advanced)

Advanced administration of your team's members: keeping sessions healthy, refreshing/swapping
them without losing work, and diagnosing a drifting member. Read the **basic** Team Lead skill
first. The load-bearing principle is unchanged:
**session = disposable cache; `durable-memory/` = canonical state.** Everything below relies on it.

## Refresh a bloated or drifting member
A long session accumulates context and can degrade. `refresh` gives a member a **fresh session**:
```sh
lmctl refresh "<teamfile>.lmctl":Coder
```
The new session starts **clean** and **re-reads `durable-memory/`**. That blankness is the point —
it's *why* you keep canonical context in durable-memory: refresh is then nearly free.
- There is deliberately **no automatic "carry the old chat forward"** — that would re-bloat the
  session you just cleared and risk lossy summarization. If context must survive, it belongs in
  `durable-memory/`, not in the session.
- Before refreshing: make sure `durable-memory/` is current (that's the member's memory across the
  refresh).
- You can't refresh the session you're *currently running in* (a Lead can refresh its members; a
  meta-Lead/operator can refresh a Lead).

## Model swap
To move a member to a different model: remove its `sessionid` from the teamfile line, optionally
change `model=`, then `lmctl seed`. Same rule — the fresh session re-reads durable-memory, so
capture anything important there first.

## The drift → recover procedure
When a member feels sluggish or off-track:
1. `lmctl health "<teamfile>.lmctl" Coder` — check its session/activity (informational).
2. Ensure `durable-memory/` reflects the current state of the work (update it if needed).
3. `lmctl refresh "<teamfile>.lmctl":Coder` — fresh session, re-reads durable-memory.
4. Optional: `lmctl tail "<teamfile>.lmctl" Coder` to confirm it came back cleanly.

## Read health like an administrator
`lmctl health "<teamfile>.lmctl"` is your monitoring surface (information only — it never blocks
or acts):
- **Messages since the last commit** climbing with **uncommitted files** and **no new commit** →
  the member is spinning; intervene (redirect, or refresh).
- **Context size** where the provider exposes it; `n/a` where it doesn't (not a health signal).
- Use it to decide *proactively* — refresh a member **before** it degrades, not after.

## Don't fight the busy-guard
A member serves one turn-driving sender at a time. If you `chat` a member that's mid-turn you'll get:
`<alias> is servicing <sender> … — pause and retry, or inspect without waking it: lmctl tail …`
That's expected. **Pause and retry**, or `lmctl tail` to watch — don't hammer it (a second inbound
operator chat can't jump the queue. From inside a member session, `chat` queues
for a busy target instead of interrupting it. Use `chat --detach` only when
fire-and-forget is intentional and your session has `LMCTL_SELF_SESSIONID`. Do
not hammer it; use `tail` or `health` to inspect without waking.

## Cross-team calls
A Lead can call a member of another team at runtime (cycle-protected automatically). The legacy
static `_CONNECT_` directive is a **deprecated no-op** — ignore it; cross-team reach is just a
normal runtime `lmctl chat` to the other team's member. From a member session,
busy cross-team targets follow the same sender-to-receiver lifecycle; detached
cross-team chat still returns the response to the sender.

## Warm up the channel
Right after seeding, ping each member once (`lmctl chat "<teamfile>" Coder "reply OK"`) before
assigning real work — it exercises the delegation path so the first real task lands cleanly.

---
Live page — corrected in place at this URL when field practice shows a gap.
