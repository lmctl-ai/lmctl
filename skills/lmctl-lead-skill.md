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

`chat` drives one member turn, blocks, and returns the member reply. By
default, if the target is busy, `chat` returns a busy error and creates no
queued mail. The client owns retry, polling, or inspection. If the mailbox
queue is explicitly enabled (`mailbox_queue_enabled=true` or
`LMCTL_MAILBOX_QUEUE_ENABLED=true`) and lmctl can resolve your sender identity,
`chat` queues the message in your sender-to-receiver lane.

If your coding harness supports real background command execution that dispatches
a command now and notifies you when it completes, use that for `lmctl chat`
calls when you do not want to block your own turn. Do not wrap the dispatch in an
external timeout. A slow reply, busy result, or queue-enabled send is not a
failure state by itself, and killing the process mid-delivery can
cascade-interrupt the receiving member's live turn, not just fail cleanly on
your side. Let the command run to completion and rely on the harness completion
signal instead of an arbitrary deadline.

If you are instead backgrounding a raw shell job yourself (a plain `&`, not
your harness's own tracked background mechanism) to dispatch `lmctl chat` to
another member and plan to wait on it, be aware that job lives inside your
own interactive login session. On a systemd host with the common
`KillUserProcesses=yes` default, the *entire* session — including every
process it spawned, and any of your own `lmctl chat` client that is still
alive holding open for that dispatch's completion — gets killed together the
moment that login session ends, regardless of whether user lingering is
enabled (lingering only keeps your user service manager itself running after
logout; it does not protect a job launched directly inside a specific
session's own scope). Both sides then show up independently as a confirmed-
dead holder — a real, external kill, not an lmctl bug or cascade. Launch such
a dispatch under a session-independent scope instead, for example
`systemd-run --user --collect ... bash -lc 'lmctl chat ...'`, so it survives
the session that launched it.

`chat` also has its own built-in `--idle-timeout <duration>` (for example `2h`,
`30m`), separate from any external shell timeout. Its default is already a
generous 8 hours, specifically so a member that is still genuinely working —
just slow, or quiet between output chunks — is not mistaken for a stuck one.
Do not override it to a short duration (minutes, or even under a few hours) as
a way to "fail fast": a too-short idle timeout kills an in-process member that
is still actively producing output, not one that is actually stuck. If you
suspect a member really is stuck, inspect it with `lmctl tail`/`lmctl health`
first rather than lowering the timeout — and if you do set `--idle-timeout`
explicitly for some reason, keep it at 8 hours or longer.

Always give `--idle-timeout` an explicit unit suffix (`s`/`m`/`h`/`d`) — a bare
number with no suffix is interpreted as raw milliseconds, not seconds. A real
misdiagnosis this caused: `--idle-timeout 15` silently means 15 milliseconds,
which fires before any provider call can produce output at all, so the turn
comes back empty every time — indistinguishable at a glance from a genuine
transport or provider failure. lmctl now warns on this specific mistake, but
writing `15s` (not `15`) avoids it in the first place.

For non-trivial prompts, use `--prompt-file` so the shell cannot expand
backticks, `$(...)`, `$VAR`, or quotes before lmctl sees the text:

```sh
lmctl chat "<teamfile>.lmctl" Coder --prompt-file task.md
```

Write the prompt file with an editor or file-writing tool, not `echo` or a
heredoc.

For important sends, run `lmctl status` first to see receiver busy/idle state
and existing lanes. With the default queue setting, a busy result means no
queued row was created; inspect holder/liveness evidence and retry later when
appropriate. If queueing is enabled and the send queues, use
`lmctl mail sent --to "/abs/path/team.lmctl:Alias" --status queued --json` or
`--status delivered --json` for the precise delivery state; keep
`lmctl status --since 7d` as the broader team/activity view. Do not infer
delivery from exit code `0`.

Queued member mail, when enabled, is keyed by `(sender, receiver)`. Base queued
delivery is the next
`lmctl chat` from that same sender to that same receiver once the receiver is
free. A chat from another sender to the same receiver does not flush it. When
`lmctl serve start` runs with daemon loops enabled, its mailbox relay is an
optional accelerator that can drain queued lanes after the receiver is idle; no
triggering chat is required. When queueing is off, there is nothing for the
relay to drain. Terminal-held receivers are legitimately busy until the human
exits `lmctl terminal`.

Inspect without disturbing a member:

```sh
lmctl tail "<teamfile>.lmctl" Coder
lmctl health "<teamfile>.lmctl" Coder
lmctl health "<teamfile>.lmctl" --json
```

`tail` is read-only. `health` reports session/activity and, when the provider
exposes it, size information. Use `health` to know configured model details;
do not ask a model what model it is. `lmctl health "<teamfile>.lmctl" --json`
returns a full per-member busy/liveness rollup for that teamfile, even
cross-team; use it when you need to know whether another team's Lead is busy.

Inspect mail evidence when status is not enough:

```sh
lmctl mail sent --to "/abs/path/team.lmctl:Alias" --status queued --json
lmctl mail sent --to "/abs/path/team.lmctl:Alias" --status delivered --json
lmctl mail history <message_id>
lmctl mail read <message_id>
lmctl mail seen <message_id>
lmctl mail ack <message_id>
lmctl mail tree --since 3d --json
```

When queueing is enabled, before assuming a delivery problem is a bug, check
`lmctl mail sent --to "/abs/path/team.lmctl:Alias" --status queued --json`;
most stuck mail is a genuinely busy or terminal-held receiver. With default
synchronous behavior, busy sends do not create queued rows. Use `--status
delivered --json` for delivered messages and `lmctl mail history <message_id>` for the
event sequence behind one message when `lmctl status` is too coarse. Mail JSON
is the stable contract, while human text is not. Mail identity filters are exact;
use canonical absolute teamfile paths from `lmctl status` or `realpath`.

After you have read or acted on a message, record that active receipt with
`lmctl mail ack <message_id>`. `ack` appends an acknowledgement event; it is not
a read-only diagnostic. `ack`, `seen`, and answered are separate facts:
`seen` only answers whether this specific message id was observed in the
historical provider transcript.

If you are a terminal-held Lead, inbound mail addressed to you will not arrive
as an injected turn while the human terminal is live. That is intentional: lmctl
must not interrupt an interactive `lmctl terminal` session. Pull it explicitly:

```sh
lmctl status --json
lmctl mail read <message_id>
lmctl mail handle <message_id>
lmctl mail ack <message_id>
```

Use `mailbox.inbound_pending[]` in `status --json` to find queued message ids.
`mail read` is a pure query and bypasses busy/terminal-hold state because it is
not a delivery attempt. If you will send causally related follow-up work from
the terminal, run `mail handle` first so `mail tree` can attach those sends under
the message you read; the causal pointer expires after one hour. `ack` is
optional; use it only after you read or handle the message.

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

The refreshed member loses chat history and re-reads durable memory. A session
cannot refresh itself while it is running; refresh the target from a different
session, another member, or an operator shell.

## Details

- [Team Lead basic](lmctl-team-lead-basic-skill.md) expands the everyday
  delegation and review loop.
- [Team Lead advanced](lmctl-team-lead-advanced-skill.md) covers refresh,
  model swaps, health, and drift recovery.
- [Team Lead workflow](team-lead-workflow.md) is the short operating checklist.
- [Durable memory](durable-memory.md) explains what to persist and why.
