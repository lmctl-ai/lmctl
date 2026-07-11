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
Use `lmctl check` and `lmctl push` when member-run `chat` queued work for a busy
target:

```sh
lmctl check --json
lmctl push --json
```

`check` is read-only: it shows your background jobs and outbound queued lanes.
`push` is blocking and sequentially delivers queued outbound lanes for idle
receivers, skipping busy receivers. Neither command requires `lmctl serve`. The
lifecycle is `queued -> in-flight -> delivered with receipt`. Delivery is
at-least-once, so duplicate delivery is possible after a crash; losing queued
work is worse.

## Don't go idle on long work — launch tracked work, then wait
A member's turn can take minutes. Launch the blocking call in the background,
then use `lmctl wait` as your wake:
```sh
lmctl chat "<teamfile>.lmctl" Coder "big task" &
lmctl wait --json
```
`wait` returns when the first tracked invocation in scope finishes or when a
delivered queue receipt is available. If it returns `status: "completed"`,
inspect finished invocations and receipts. If it returns `status: "idle"`, run
`lmctl check --json`, push queued lanes, or claim more work from your external
backlog/chatroom. From a member session, use `lmctl exec -- <command> &` for tracked
local commands, then wait in that same caller scope with `lmctl wait --json`.

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
