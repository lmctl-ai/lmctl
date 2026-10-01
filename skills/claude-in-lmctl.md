# Using lmctl from Claude Code

Use this when you are driving an lmctl team from inside Claude Code, or inside
another harness with the same two properties:

- real background command execution that notifies you when the process exits
- an event/monitor primitive that can notify you when watched state changes

If your harness lacks those primitives, use the provider-agnostic
[`lmctl Lead`](lmctl-lead-skill.md) skill instead.

## Dispatch every prompt in the background

Delegate with `lmctl prompt`, but dispatch it through Claude Code's real
background execution path: the Bash tool with `run_in_background: true`.

Don't wrap `lmctl prompt` in a shell `timeout` or wait on it synchronously in
the foreground. A slow provider turn is not evidence of failure; a busy result
is immediate and means you should inspect or retry.

Use prompt files for non-trivial work:

```sh
lmctl prompt "/abs/path/team.lmctl" Coder --prompt-file /tmp/task.md
```

Write the prompt file with your file-writing tool. Do not use `echo` or heredoc
prompt construction for task text that contains quotes, backticks, `$VAR`,
`$(...)`, or command examples.

## Wake up and decide the next task when the harness notifies you

The background completion notification is a wake signal, not a retry signal.
When Claude Code notifies you that a background `lmctl prompt` finished, that
notification's only job is to bring your turn back to life — it carries no
instruction of its own. What runs next is for you to decide from the result
you just got: dispatch the next unit of work, review, repair, or escalate.
Don't read this as "resend the same task" — the point is never to repeat the
prior dispatch, it's to act on where things actually stand now.

Don't end a turn saying you're waiting for work to complete unless you've also
armed a harness wakeup — otherwise the session goes idle with no way to
resume.

Operational rule:

1. Dispatch work in the background.
2. On notification, read the result.
3. Dispatch the next task, review, repair, or escalation immediately.
4. Stop only when there is no running or newly returned work to act on.

## Address teams by absolute path

Use absolute teamfile paths for cross-repo work:

```sh
lmctl prompt "/home/mma/repos/other-team/other-team.lmctl" Lead --prompt-file /tmp/request.md
```

Do not rely on fuzzy basename lookup or a global registry search. Current lmctl
resolves a relative teamfile path from your current working directory. If that
file does not exist there, the correct outcome is an error such as
`teamfile not found`.

## Read evidence before declaring a stall

Do not reassure yourself that a target is merely slow, and do not declare it
stuck, until you have checked the evidence.

Start with lmctl:

```sh
lmctl status --json
lmctl status "/abs/path/team.lmctl" Alias --json
lmctl tail "/abs/path/team.lmctl" Alias --json
```

The busy result from `lmctl prompt` is immediate. Use `status --json` for
holder and last-activity evidence, and `tail --json` to inspect the member's
recent provider messages without sending another prompt.

If `status --json` or the error text reports a holder PID, verify whether that
process is actually alive and doing work:

```sh
ps -p <pid> -o pid,stat,wchan:32,pcpu,time,etime,cmd
```

A live PID alone is not proof of progress. Near-zero accumulated CPU over a long
elapsed time, especially with `WCHAN=do_epoll_wait`, is evidence of a stalled
process. Combine that with the status evidence above and provider/harness
evidence before deciding whether to retry, reseed, or escalate.

If you have the sibling `lmctl-admin` tool available, use its read-only
diagnostics for the same question:

```sh
./bin/lmctl-admin check-liveness /abs/path/team.lmctl Alias --json
./bin/lmctl-admin diagnose-delivery <message_id> --json
```

Keep the conclusion narrow: say exactly what you checked, what is still
unknown, and what action you are taking next.
