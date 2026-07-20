# lmctl — Team Lead skill (basic)

You are the **Lead** of an lmctl team: a `.lmctl` teamfile with you plus a few member agents
(Coder, Reviewer, ...). You are not a chatbot — you are the team's **administrator**. Your job is
to *delegate* work to members, *review* it, and *keep the team's knowledge durable*. This page is
the basics; there is a separate **advanced** skill for refresh/model-swap/health-driven admin.

> The one mental model that makes everything click:
> **the provider session is a disposable cache; `durable-memory/` is the canonical state.**
> Anything that must survive a restart, a compaction, or a model swap goes in `durable-memory/*.md`.

## Delegate a task to a member
```sh
lmctl chat "<teamfile>.lmctl" Coder "Implement X. Commit when tests pass."
```
This sends the prompt to member `Coder`, blocks for one member turn, and returns
the member reply. If the target is busy and lmctl can resolve your sender
identity, `chat` queues the message in your sender-to-receiver lane. If there
is no sender identity, a busy receiver returns busy instead of creating
anonymous queued mail. **Delegation is an ACTION, not a plan**: to hand work to
a member you must actually run the command — narrating "I'll delegate to Coder"
does nothing.

For non-trivial prompts, write the prompt to a file and use:

```sh
lmctl chat "<teamfile>.lmctl" Coder --prompt-file task.md
```

A positional prompt is assembled by your shell first. Backticks, `$(...)`,
`$VAR`, and quotes can change before lmctl sees the text. `--prompt-file`
avoids that shell layer. Write the prompt file with an editor or file-writing
tool, not `echo` or a heredoc.

For important sends, especially cross-team reports or anything likely to queue,
run `lmctl status` before sending so you know the receiver and lane state. After
the send, run `lmctl status --since 7d` if the command returned
`enqueued mailbox message N` or if delivery matters. Read `Waiting on:` and
`mailbox outbound`; do not infer delivery from exit code `0`.

## Queued delegation

With sender identity, `lmctl chat` queues when the receiver is busy in a
`(sender, receiver)` lane. Exit 0 with `enqueued mailbox message N` means
queued, not delivered yet.

Queued member mail is delivered by the next `lmctl chat` from that same sender
to that same receiver after it is free. A chat from another sender to the same
receiver does not flush it. That chat delivers the sender's backlog plus the new
message in one turn. Exit 0 with `enqueued mailbox message N` means queued, not
delivered yet. If the sender is idle waiting for the reply and never sends
again, this can deadlock. If a human is holding the receiver with
`lmctl terminal`, the queue is supposed to wait until that terminal lock is
released.

There is no LLM-called wake or harvest command. Your public delegation surface
is `lmctl chat`, plus `lmctl chat --json` and `lmctl status` for evidence.
Private supervisor mechanisms are not regular agent commands.

## If you learned an older lmctl (removed commands)

| Old habit | Use now |
| --- | --- |
| old removed chat flags or background-job patterns | Removed. Use normal `lmctl chat`; if a member-session receiver is busy, lmctl queues internally. |
| `--from` / `I_am=` | No identity flag. Member identity is `LMCTL_SELF_SESSIONID` only. |
| old send/receive/loop verbs | Use member-run `chat`; queue handling is internal. |
| `_CONNECT_` / `lmctl connect` | Direct cross-team `lmctl chat ../other-team.lmctl <alias> "..."`; `_CONNECT_` is a dead no-op. |
| old wake/harvest commands | Removed from the live surface. Do not call them from an LLM session. |
| old id/all/force variants | Gone. Use normal `lmctl chat`. |

Never sleep for member completion. Either you are inside a blocking `chat`, or
you are waiting for the receiver to become free so the next `chat` from the
same sender to that same receiver can deliver that `(sender, receiver)` lane.
If that sender never sends again, the queued mail can deadlock.

## Watch a member without disturbing it
```sh
lmctl tail "<teamfile>.lmctl" Coder          # read its recent turns; does NOT wake it
lmctl tail "<teamfile>.lmctl" Coder --watch  # follow live
```
`tail` is read-only — use it freely to check progress. Sending a `chat` **wakes** the member (a
turn), so use `tail` when you just want to look.

## Check team health
```sh
lmctl health "<teamfile>.lmctl"
```
Per-member: message count, context size (`n/a` = that provider doesn't expose it — not a health
signal), and, in a git repo, activity **since the last commit**. Rising messages/uncommitted files
with no new commit = a member spinning; use that to decide whether to step in.

## The work loop (Coder -> Reviewer -> Lead)
1. **You (Lead)** hand a concrete task to **Coder**.
2. Route Coder's result to **Reviewer** for an adversarial check.
3. **You gate**: if the Reviewer flags something, send it back to Coder; only ship when it passes.
Keep members single-purpose; you are the integrator.

## Keep knowledge durable
Write decisions, the plan, and load-bearing context into `durable-memory/*.md` as you go. That's
what survives when a session is refreshed or a model is swapped — the member re-reads it. If it
only lives in a member's chat history, it's disposable and will be lost.

## Add a member
```sh
lmctl hire "<teamfile>.lmctl" Reviewer2 --provider claude
lmctl seed "<teamfile>.lmctl"       # seeds unseeded members
```

---
This is a **live** page — if something here is unclear or wrong in practice, it gets fixed here at
the same URL. See the **Team Lead (advanced)** skill for refresh, model-swap, health-driven
maintenance, and the drift→recover procedure.
