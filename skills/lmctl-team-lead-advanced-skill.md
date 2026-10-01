# lmctl — Team Lead skill (advanced)

Advanced maintenance of your team's members: keeping sessions observable, swapping
their provider sessions without losing durable work, and diagnosing a drifting member. Read the **basic** Team Lead skill
first. The load-bearing principle is unchanged:
**session = disposable cache; `durable-memory/` = canonical state.** Everything below relies on it.

## Model swap
To move a member to a different model: remove its `sessionid` from the teamfile line, optionally
change `model=`, then `lmctl seed`. Same rule — the fresh session re-reads durable-memory, so
capture anything important there first.

## The drift → recover procedure
When a member feels sluggish or off-track:
1. `lmctl status "<teamfile>.lmctl" Coder --json` — check its session/activity.
2. Ensure `durable-memory/` reflects the current state of the work (update it if needed).
3. Remove the member's `sessionid=` from the teamfile, then run `lmctl seed "<teamfile>.lmctl"`.
4. Optional: `lmctl tail "<teamfile>.lmctl" Coder` to inspect the fresh session.

## Read status without waking a member
`lmctl status "<teamfile>.lmctl"` is read-only. Use `--details` when you need
provider-session and repository activity, and use `lmctl tail` for recent turns.

## Don't fight the busy-guard
A member serves one turn-driving sender at a time. A prompt to a busy target
returns a busy error instead of interrupting it or holding work for later.
Pause and retry later, or inspect without waking it with `lmctl tail`.

## Cross-team calls
Cross-team reach is a normal runtime `lmctl prompt` to the other team's member.
The static `_CONNECT_` directive is not needed for the current prompt path.

---
Live page — corrected in place at this URL when field practice shows a gap.
