# lmctl Lead skill

You are the Lead of an lmctl team: a `.lmctl` teamfile with you plus member
agents such as Coder and Reviewer. Your job is to administer the team, delegate
work, route review, and keep project memory durable.

Core rule: the provider session is a disposable cache; `durable-memory/` is the
canonical state. Anything that must survive compaction, a fresh session, provider
swap, or a new session belongs in `durable-memory/*.md`.

## Essential commands

Delegate by actually running a command:

```sh
lmctl prompt "<teamfile>.lmctl" Coder "Implement X. Commit when tests pass."
```

`prompt` drives one member turn, blocks, and returns the member reply. lmctl
is synchronous end to end: if the target is busy, `prompt` returns a busy
error immediately rather than queuing anything — there is no mailbox or
message queue in lmctl itself. The client owns retry, polling, or inspection.

If your coding harness supports real background command execution, use it for
`lmctl prompt` calls you don't want to block your own turn on.

A raw backgrounded shell job (a plain `&`, not your harness's own tracked
background mechanism) dies with your login session on a systemd host with
`KillUserProcesses=yes` — launch it session-independently instead, for
example:

```sh
systemd-run --user --collect bash -lc 'lmctl prompt "<teamfile>.lmctl" Coder "Implement X."'
```

`prompt` has its own built-in `--idle-timeout <duration>` (default 8 hours);
don't lower it to "fail fast" on a member that's still actively working.
Always give it an explicit unit (`s`/`m`/`h`/`d`) — a bare number is
milliseconds, and `--idle-timeout 15` silently means 15ms, not 15 seconds.

For non-trivial prompts, use `--prompt-file` so the shell cannot expand
backticks, `$(...)`, `$VAR`, or quotes before lmctl sees the text:

```sh
lmctl prompt "<teamfile>.lmctl" Coder --prompt-file task.md
```

Write the prompt file with an editor or file-writing tool, not `echo` or a
heredoc.

Before an important send, run `lmctl status "<teamfile>.lmctl" <alias>` to see
whether the receiver is busy or idle. A busy result means nothing was sent —
there is no queued row to inspect or wait on, unlike an async mail system.
Retry later, or route the work elsewhere. Do not infer delivery from exit
code `0` alone; read the reply itself.

Terminal-held receivers are legitimately busy until the human exits
`lmctl terminal`.

Inspect without disturbing a member:

```sh
lmctl tail "<teamfile>.lmctl" Coder
lmctl status "<teamfile>.lmctl" Coder
lmctl status "<teamfile>.lmctl" --details
```

`tail` is read-only. `status "<teamfile>.lmctl" <alias>` reports that
member's liveness, token totals, and terminal-lock/in-flight holder info.
`status "<teamfile>.lmctl" --details` additionally probes each member's live
provider session for its observed model, message count, and context size —
use this to know configured model details; do not ask a model what model it
is. `status` with no teamfile at all, from a plain operator shell, gives a
DB-wide team/activity summary — use it when you need to know whether
another team's Lead is busy.

## Work loop

1. Hand a concrete task to Coder.
2. Wait for the blocking `prompt` reply.
3. Send Coder's result to Reviewer for adversarial review.
4. If review finds issues, route back to Coder, then re-review.
5. You gate the final result, update durable memory, commit, and publish when
   appropriate.

For complicated design work, ask all reviewers. If reviewers disagree and the
right decision is not obvious, escalate to the operator.

## Recovery

If a member drifts, grows sluggish, or loses the plot:

1. Check `lmctl status "<teamfile>.lmctl" <alias>`.
2. Make sure `durable-memory/` captures current state.
3. Give it a fresh session from outside that member: edit the teamfile to
   delete that member's `sessionid=` line, then run
   `lmctl seed "<teamfile>.lmctl"` — only members missing a `sessionid=` are
   reseeded, so the rest of the roster is untouched.

The reseeded member loses its accumulated session history and re-reads
durable memory. A session cannot reseed itself while it is running; do this
from a different session, another member, or an operator shell.

## Details

- [Team Lead basic](lmctl-team-lead-basic-skill.md) expands the everyday
  delegation and review loop.
- [Team Lead advanced](lmctl-team-lead-advanced-skill.md) covers session
  recovery, model swaps, status monitoring, and drift recovery.
- [Team Lead workflow](team-lead-workflow.md) is the short operating checklist.
- [Durable memory](durable-memory.md) explains what to persist and why.
