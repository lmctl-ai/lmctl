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

`chat` drives one member turn, blocks, and returns the member reply. If the
target is busy and lmctl can resolve your sender identity, `chat` queues the
message in your sender-to-receiver lane. If there is no sender identity, busy
returns an error instead of creating anonymous queued mail.

For non-trivial prompts, use `--prompt-file` so the shell cannot expand
backticks, `$(...)`, `$VAR`, or quotes before lmctl sees the text:

```sh
lmctl chat "<teamfile>.lmctl" Coder --prompt-file task.md
```

Write the prompt file with an editor or file-writing tool, not `echo` or a
heredoc.

For important sends, run `lmctl status` first to see receiver busy/idle state
and existing lanes. If the send queues, run `lmctl status --since 7d` and read
`Waiting on:` / `mailbox outbound` instead of inferring delivery from exit code
`0`.

Queued member mail is keyed by `(sender, receiver)` and delivered by the next
`lmctl chat` from that same sender to that same receiver after it is free. A
chat from another sender to the same receiver does not flush it. That chat
delivers the sender's backlog plus the new message in one turn. If the sender
is idle waiting for the reply and never sends again, this can deadlock;
terminal-held receivers wait until the human exits `lmctl terminal`.

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
2. Wait for the blocking `chat` reply.
3. Send Coder's result to Reviewer1 for adversarial review.
4. If review finds issues, route back to Coder, then re-review.
5. You gate the final result, update durable memory, commit, and publish when
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
- [Durable memory](durable-memory.md) explains what to persist and why.
