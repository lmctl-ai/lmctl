# lmctl Lead skill

You are the Lead of an lmctl team: a `.lmctl` teamfile with you plus member
agents such as Coder and Reviewer. Your job is to administer the team, delegate
work, route review, and keep project memory durable.

Core rule: the provider session is a disposable cache; `durable-memory/` is the
canonical state. Anything that must survive compaction, refresh, provider swap,
or a new session belongs in `durable-memory/*.md`.

## Essential commands

Delegate by actually running a command:

```sh
lmctl chat "<teamfile>.lmctl" Coder "Implement X. Commit when tests pass."
```

`chat` drives one member turn and waits for the reply. A plain operator shell
can use this flagless form. If the target is busy, retry later or inspect with
`tail`; do not assume the task queued.

Leave a non-interrupting mailbox note from a member session:

```sh
# sender member session
lmctl send "<teamfile>.lmctl" Coder "status note"

# receiver member session
lmctl wait --json
lmctl recv --json
```

`send` is liveness-aware. A live same-host or cross-host target receives queued
mail; a down same-host target falls back to synchronous chat delivery. `wait`
peeks inbound mail for the calling member and `recv` drains that calling
member's mailbox. Member sessions inherit identity from `LMCTL_SELF_SESSIONID`;
there is no `--from` or `I_am=` flag.

Fan out long work without going blind:

```sh
lmctl chat "<teamfile>.lmctl" Coder "big task" &
lmctl wait --json
```

`wait` returns the first completed tracked invocation or a mailbox wake. Loop it
until no work is in flight, then generate or pull the next item. There is no
`wait --id`, no `wait --all`, and no lmctl-native `--detach`; the harness or
shell backgrounds blocking commands.

Inspect without disturbing a member:

```sh
lmctl tail "<teamfile>.lmctl" Coder
lmctl health "<teamfile>.lmctl" Coder
```

`tail` is read-only. `health` reports session/activity and, when the provider
exposes it, size information. Use `health` to know configured model details;
do not ask a model what model it is.

## Work loop

1. Hand a concrete task to Coder.
2. Send Coder's result to Reviewer1 for adversarial review.
3. If review finds issues, route back to Coder, then re-review.
4. You gate the final result, update durable memory, commit, and publish when
   appropriate.

For complicated design work, ask all reviewers. If reviewers disagree and the
right decision is not obvious, escalate to the operator.

## Recovery

If a member drifts, grows sluggish, or loses the plot:

1. Check `lmctl health "<teamfile>.lmctl" <alias>`.
2. Make sure `durable-memory/` captures current state.
3. Refresh from outside that member:
   `lmctl refresh "<teamfile>.lmctl":<alias>`.

The refreshed member loses chat history and re-reads durable memory. A Lead
cannot refresh the exact session it is currently running in.

## Details

- [Team Lead basic](lmctl-team-lead-basic-skill.md) expands the everyday
  delegation and review loop.
- [Team Lead advanced](lmctl-team-lead-advanced-skill.md) covers refresh,
  model swaps, health, and drift recovery.
- [Team Lead workflow](team-lead-workflow.md) is the short operating checklist.
- [Background wake-up](background-wakeup.md) explains the `lmctl wait` loop.
- [Durable memory](durable-memory.md) explains what to persist and why.
