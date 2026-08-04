# Claude Code lmctl Lead skill

Use this when you are running an lmctl team Lead inside Claude Code, or inside
another harness with the same two properties:

- real background command execution that notifies you when the process exits
- an event/monitor primitive that can notify you when watched state changes

If your harness lacks those primitives, use the provider-agnostic
[`lmctl Lead`](lmctl-lead-skill.md) skill instead.

## Dispatch every chat in the background

Delegate with `lmctl chat`, but dispatch it through Claude Code's real
background execution path: the Bash tool with `run_in_background: true`.

Do not wrap `lmctl chat` in a shell `timeout`. Do not run a long delegation in
the foreground just to wait synchronously. A slow reply, busy result, or
queue-enabled send is not a failure state by itself, and killing `lmctl chat`
mid-delivery can interrupt the receiving member's live turn instead of failing
cleanly on your side.

Use prompt files for non-trivial work:

```sh
lmctl chat "/abs/path/team.lmctl" Coder --prompt-file /tmp/task.md
```

Write the prompt file with your file-writing tool. Do not use `echo` or heredoc
prompt construction for task text that contains quotes, backticks, `$VAR`,
`$(...)`, or command examples.

## Wake up and decide the next task when the harness notifies you

The background completion notification is a wake signal, not a retry signal.
When Claude Code notifies you that a background `lmctl chat` finished, that
notification's only job is to bring your turn back to life — it carries no
instruction of its own. What runs next is for you to decide from the result
you just got: dispatch the next unit of work, review, repair, or escalate.
Don't read this as "resend the same task" — the point is never to repeat the
prior dispatch, it's to act on where things actually stand now.

Do not end a turn with "I dispatched work and am waiting for both to complete"
unless you have also armed a harness wakeup. That pattern can leave the Lead
session idle with no wake mechanism: the process is blocked, no lmctl
activity happens, and the eventual database row can look like an ordinary
`done` reply even though the Lead made no progress for hours.

Operational rule:

1. Dispatch work in the background.
2. On notification, read the result.
3. Dispatch the next task, review, repair, or escalation immediately.
4. Stop only when there is no queued, running, or newly returned work to act on.

## You do not need to poll for inbound mail by default

Since `lmctl 0.1.241`, `mailbox_queue_enabled` defaults to `false`: a chat sent
to you is either delivered synchronously — handled inline, in the same call the
sender made — or the sender gets an immediate busy error. Neither case leaves
anything queued for you to discover later. There is no "mail arrived while you
were away" scenario to poll for under the default configuration, so do not arm
a Monitor loop against `mail pending` as a standing pattern.

### If your configuration explicitly enables queueing

Only relevant when `mailbox_queue_enabled = true` is explicitly set in
`config.toml` or via `LMCTL_MAILBOX_QUEUE_ENABLED=true` — an opt-in, not the
default. In that mode, a busy send can create a queued row instead of erroring,
and you do need a way to learn it arrived. Arm Claude Code's Monitor tool on a
small polling script rather than hand-polling or sleeping in your own turn; let
the harness deliver one notification when the script exits:

```sh
receiver="/abs/path/team.lmctl:Lead"
while :; do
  if lmctl mail pending --receiver "$receiver" --json \
    | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>process.exit((JSON.parse(s).messages||[]).length ? 0 : 1))'
  then
    exit 0
  fi
  sleep 10
done
```

Use the notification as a wakeup, then read and handle the mail:

```sh
lmctl status --json
lmctl mail read <message_id> --json
lmctl mail handle <message_id> --json
lmctl mail ack <message_id> --json
```

## Address teams by absolute path

Use absolute teamfile paths for cross-repo work:

```sh
lmctl chat "/home/mma/repos/other-team/other-team.lmctl" Lead --prompt-file /tmp/request.md
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
lmctl health "/abs/path/team.lmctl" Alias --json
lmctl mail sent --to "/abs/path/team.lmctl:Alias" --status queued --json
lmctl mail sent --to "/abs/path/team.lmctl:Alias" --status delivered --json
lmctl mail history <message_id> --json
```

Treat the queued-mail check as queue-enabled evidence, not as the default stall
contract. Since `lmctl 0.1.241`, default busy behavior is synchronous: no queued
row is created. When the receiver's configuration enables
`mailbox_queue_enabled` behavior, a busy send can create a queued row, and
`mail sent --status queued` tells you the work has not delivered yet. When
queueing is disabled, the equivalent signal is the immediate busy/held result
from `lmctl chat`; inspect that result, then use `status --json` and
`health --json` for the holder PID and last-activity evidence instead of
expecting a queued mail row to exist.

If `health --json` or the error text reports a holder PID, verify whether that
process is actually alive and doing work:

```sh
ps -p <pid> -o pid,stat,wchan:32,pcpu,time,etime,cmd
```

A live PID alone is not proof of progress. Near-zero accumulated CPU over a long
elapsed time, especially with `WCHAN=do_epoll_wait`, is evidence of a stalled
process. Combine that with lmctl's `agent_inflight`, `tracked_invocation`, and
mail evidence before deciding whether to wait, resend, refresh, or escalate.

If you have the sibling `lmctl-admin` tool available, use its read-only
diagnostics for the same question:

```sh
./bin/lmctl-admin check-liveness /abs/path/team.lmctl Alias --json
./bin/lmctl-admin diagnose-delivery <message_id> --json
```

Keep the conclusion narrow: say exactly what you checked, what is still
unknown, and what action you are taking next.
