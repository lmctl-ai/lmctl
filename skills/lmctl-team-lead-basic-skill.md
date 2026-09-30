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
lmctl prompt "<teamfile>.lmctl" Coder "Implement X. Commit when tests pass."
```
This sends the prompt to member `Coder`, blocks for one member turn, and returns
the member reply. By default, if the target is busy, `prompt` returns a busy
error and creates no queued mail. If the mailbox queue is explicitly enabled
(`mailbox_queue_enabled=true` or `LMCTL_MAILBOX_QUEUE_ENABLED=true`) and lmctl
can resolve your sender identity, `prompt` queues the message in your
sender-to-receiver lane. **Delegation is an ACTION, not a plan**: to hand work
to a member you must actually run the command — narrating "I'll delegate to
Coder" does nothing.

For non-trivial prompts, write the prompt to a file and use:

```sh
lmctl prompt "<teamfile>.lmctl" Coder --prompt-file task.md
```

A positional prompt is assembled by your shell first. Backticks, `$(...)`,
`$VAR`, and quotes can change before lmctl sees the text. `--prompt-file`
avoids that shell layer. Write the prompt file with an editor or file-writing
tool, not `echo` or a heredoc.

For important sends, especially cross-team reports, run `lmctl status` before
sending so you know the receiver and lane state. With the default queue setting,
a busy result means no queued row was created. In queue-enabled setups, run
`lmctl status --since 7d` if the command returned `enqueued mailbox message N`
or if delivery matters. Read `Waiting on:` and `mailbox outbound`; do not infer
delivery from exit code `0`.

## Queued delegation

Queued delegation is opt-in. With sender identity and
`mailbox_queue_enabled=true` or `LMCTL_MAILBOX_QUEUE_ENABLED=true`, `lmctl prompt`
queues when the receiver is busy in a `(sender, receiver)` lane. Exit 0 with
`enqueued mailbox message N` means queued, not delivered yet. With the default
queue setting, a busy receiver returns a busy error instead.

Base queued rule: the next `lmctl prompt` from that same sender to that same
receiver delivers that sender's queued lane once the receiver is free. A prompt
from another sender to the same receiver does not flush it. That prompt delivers
the sender's backlog plus the new message in one turn. With `lmctl serve start`
running in normal daemon mode, mailbox relay is an optional accelerator: it can
drain queued lanes proactively after the receiver goes idle. If queueing is
off, there is nothing for the relay to drain. If the sender is idle waiting for
the reply and no relay drains the lane, delivery can deadlock. If a human is
holding the receiver with `lmctl terminal`, queued mail waits until that
terminal lock is released.

There is no LLM-called wake or harvest command. Your public delegation surface
is `lmctl prompt`, plus `lmctl prompt --json` and `lmctl status` for evidence.
Private supervisor mechanisms are not regular agent commands.

## If you learned an older lmctl (older command habits)

| Old habit | Use now |
| --- | --- |
| old detached/background-job patterns | Current public agent-facing guidance is normal `lmctl prompt`; busy returns an error by default, and queueing is opt-in. |
| `--from` / `I_am=` | No identity flag. Member identity is `LMCTL_SELF_SESSIONID` only. |
| old send/receive/loop verbs | Use member-run `prompt`; queue handling is internal. |
| `_CONNECT_` / `lmctl connect` | Direct cross-team `lmctl prompt ../other-team.lmctl <alias> "..."`; `_CONNECT_` is legacy metadata, not current public cross-team setup. |
| old wake/harvest commands | Not the current public agent-facing surface. Do not call them from an LLM session. |
| old id/all/force variants | Not current public agent-facing guidance. Use normal `lmctl prompt`. |
| `lmctl chat` | Phased out; use `lmctl prompt` (same behavior). |

Never sleep for member completion. Either you are inside a blocking `prompt`, or
you use `lmctl status` / `lmctl mail` to inspect state. In queue-enabled setups,
base delivery is the next `prompt` from the same sender to that same receiver; a
running daemon relay may drain the lane sooner.

## Watch a member without disturbing it
```sh
lmctl tail "<teamfile>.lmctl" Coder          # read its recent turns; does NOT wake it
lmctl tail "<teamfile>.lmctl" Coder --watch  # follow live
```
`tail` is read-only — use it freely to check progress. Sending a `prompt` **wakes** the member (a
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
only lives in a member's session history, it's disposable and will be lost.

## Add a member
```sh
lmctl hire "<teamfile>.lmctl" Reviewer2 --provider claude
lmctl seed "<teamfile>.lmctl"       # seeds unseeded members
```

---
This is a **live** page — if something here is unclear or wrong in practice, it gets fixed here at
the same URL. See the **Team Lead (advanced)** skill for refresh, model-swap, health-driven
maintenance, and the drift→recover procedure.
