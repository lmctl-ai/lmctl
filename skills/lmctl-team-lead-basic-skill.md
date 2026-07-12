# lmctl — Team Lead skill (basic)

You are the **Lead** of an lmctl team: a `.lmctl` teamfile with you plus a few member agents
(Coder, Reviewer, …). You are not a chatbot — you are the team's **administrator**. Your job is
to *delegate* work to members, *review* it, and *keep the team's knowledge durable*. This page is
the basics; there is a separate **advanced** skill for refresh/model-swap/health-driven admin.

> The one mental model that makes everything click:
> **the provider session is a disposable cache; `durable-memory/` is the canonical state.**
> Anything that must survive a restart, a compaction, or a model swap goes in `durable-memory/*.md`.

## Delegate a task to a member
```sh
lmctl chat "<teamfile>.lmctl" Coder "Implement X. Commit when tests pass."
```
This sends the prompt to member `Coder` and returns its reply. A plain operator
shell can use this flagless form for direct blocking chat. From inside your
member session, if the target is busy, `chat` queues the message in your
sender-to-receiver lane. **Delegation is an ACTION, not a plan**: to hand work
to a member you must actually run the command — narrating "I'll delegate to
Coder" does nothing.

## Manage queued outbound work
Use `lmctl notify_me` when member-run `chat` queued work for a busy target:

```sh
lmctl notify_me --json
```

`notify_me` flushes queued outbound mail to idle receivers, shows your jobs plus
outbound queue, and returns delivered receipts plus finished tracked jobs. If
work is running but nothing has finished, it blocks. If idle, it returns
immediately with nothing more. The lifecycle is
`queued -> in-flight -> delivered with receipt`. Delivery is at-least-once, so
duplicate delivery is possible after a crash; losing queued work is worse.

## Don't go idle on long work — launch tracked work, then notify_me
A member's turn can take minutes. Launch the blocking call in the background,
then use `lmctl notify_me` as your wake:
```sh
lmctl chat "<teamfile>.lmctl" Coder "big task" &
lmctl notify_me --json
```
Think: "I'm done with this round; my delegations are all running in the
background; take a break — notify me when something lands." Call it in the
FOREGROUND; it holds your process and returns when a member finishes.
`notify_me` also flushes outbound queued mail and shows your current jobs/queue.
Empty `notify_me` means this scope is idle: claim more work from your external
backlog/chatroom or exit. From a member session, use
`lmctl exec -- <command> &` for tracked local commands, then call
`lmctl notify_me --json` in that same caller scope.

## If you learned an older lmctl (removed commands)

The surface collapsed because fewer commands are less confusing: use `chat` to
put work in, then use `notify_me` to flush, inspect, and harvest.

| Old habit | Use now |
| --- | --- |
| `chat --detach` + `lmctl jobs` | Background normal `lmctl chat ... &` or `lmctl exec -- ... &`, then `lmctl notify_me --json`. |
| `--from` / `I_am=` | No identity flag. Member identity is `LMCTL_SELF_SESSIONID` only. |
| `lmctl send` / `lmctl recv` / `lmctl loop` | Member-run `chat` auto-queues a busy target; `notify_me` flushes lanes, shows status, and returns finished work. |
| `_CONNECT_` / `lmctl connect` | Direct cross-team `lmctl chat ../other-team.lmctl <alias> "..."`; `_CONNECT_` is a dead no-op. |
| `check` / `push` / `wait` | Removed; the CLI says `use lmctl notify_me`. |
| `more` | Removed/renamed; use `notify_me`. |
| `wait --id` / `wait --all` / `chat --force` | Gone. `notify_me` is scoped, state-based, first-return. |

Never sleep to wait on a member; `notify_me` answers finished and shows busy state.

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

## The work loop (Coder → Reviewer → Lead)
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
