---
title: Direct Chat & Background Work
sidebar_position: 3
---

# Direct chat & background work

Current command surface: `lmctl chat` sends work to one member. When the
receiver is idle it blocks for one member turn and returns the reply. When
lmctl can resolve a sender identity and the receiver is busy, the same command
queues the message instead of dropping it.

## Synchronous direct chat

Use `lmctl chat` when you want one member to handle one prompt now:

```bash
lmctl chat ./team.lmctl Coder "Implement the smallest safe fix."
lmctl chat ./team.lmctl Reviewer "Review Coder's latest change."
```

This blocks until the provider turn finishes or errors. It is the right path
for handoffs, review requests, and operator answers where the shell should stay
attached to the result.

For anything non-trivial, put the prompt in a file and use `--prompt-file`:

```bash
lmctl chat ./team.lmctl Coder --prompt-file task.md
lmctl chat ./team.lmctl Coder --prompt-file -
```

A positional prompt is built by your shell before lmctl sees it. Backticks,
`$(...)`, `$VAR`, and quotes can be expanded locally. `--prompt-file` avoids
that shell layer and is the safer form for review packages, command examples,
and long prompts. Write the prompt file with an editor or file-writing tool,
not with `echo` or a heredoc, because those still go through your shell. This
path is available in `@lmctl-ai/lmctl` 0.1.154 and was rechecked in 0.1.157.

## Queued member messages

When lmctl can resolve a sender identity, `lmctl chat` can still put work into
the sender-to-receiver path when the target is busy. If it exits 0 with
`enqueued mailbox message N`, that means queued, not delivered yet. The
lifecycle remains:

```text
queued -> in-flight -> delivered with receipt
```

Delivery is at-least-once: after a crash, a queued message may be delivered
again rather than lost.

What delivers queued mail: the sender's next `lmctl chat` to that same
receiver. Mail queued by a different sender is not affected; each `(sender,
receiver)` pair has its own lane. When the receiver is free, that chat delivers
that sender's queued lane plus the new message in one turn. If the receiver is
still in a provider turn, or a human is holding that member with
`lmctl terminal`, the mail waits. Nothing is lost.

Practical consequence: this can deadlock. If the sender is idle because it is
waiting for the queued reply, and nobody sends another `lmctl chat` from that
same sender to that receiver, the queued mail will not unblock itself. Run
`lmctl status` to see pending outbound lanes and member busy/idle state.
Use `@lmctl-ai/lmctl` 0.1.151 or newer for the `Waiting on:` visibility that
keeps old queued mail from aging out of the status view; this page was checked
against 0.1.157.

## Quick choice

| Need | Use |
| --- | --- |
| Ask one member and receive the reply | `lmctl chat <teamfile> <alias> "<prompt>"` |
| Deliver queued member mail | Send the next `lmctl chat` from the same sender to the same receiver after it is free |
| Inspect pending mailbox lanes | `lmctl status` |
