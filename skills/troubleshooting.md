# Troubleshooting lmctl

Everything here was previously bundled into one long "Lead skill" page. It is kept
because it is all still true; it is separated because most of it does not apply to
most jobs. Read the part that matches your symptom.

To send a prompt at all, see [How to send a prompt to another agent](lmctl-prompt-skill.md).

## "<alias> is busy; wait and retry"

Nothing was sent. The send did not happen, nothing is held, so you must wait and retry. You can also give the work to a different member.

Check before an important send:

```sh
lmctl status ./my-team.lmctl Coder
```

An agent held open in `lmctl terminal` is legitimately busy until the human exits.

Do not infer delivery from exit code `0` alone. Read the reply itself.

## The call seems to hang, or dies instantly

`lmctl prompt` blocks until the agent replies, and a real turn can take many minutes.

`--idle-timeout` needs an explicit unit (`s`, `m`, `h`, `d`). **A bare number is
milliseconds**, so `--idle-timeout 15` means 15ms and the call appears to fail at once.
The default is 8 hours. Do not lower it to "fail fast" on an agent that is still
working — idle means no output, not slow.

## I don't want to block my own turn

lmctl has no background flag; use your own harness's background execution for the same
command.

A plain `&` is not enough. On a systemd host with `KillUserProcesses=yes` a raw
backgrounded job dies with your login session. Launch it session-independently:

```sh
systemd-run --user --collect bash -lc 'lmctl prompt ./my-team.lmctl Coder "Implement X."'
```

## My prompt is long, or contains quotes and backticks

Pass a file instead of a shell argument:

```sh
lmctl prompt ./my-team.lmctl Coder --prompt-file task.md
```

Write that file with an editor or a file-writing tool, **not** `echo` or a heredoc —
a shell will expand backticks and `$` inside your prompt before lmctl ever sees it.

## I want to look at an agent without disturbing it

```sh
lmctl tail ./my-team.lmctl Coder
lmctl status ./my-team.lmctl Coder
lmctl status ./my-team.lmctl --details
```

`tail` is read-only. `status <teamfile> <alias>` reports liveness, token totals, and
terminal-lock/in-flight holder info. `--details` additionally probes each live provider
session for its observed model, message count and context size — use it when you need
to know which model a member is actually running. Do not ask a model what model it is.

`status` with no teamfile, from a plain operator shell, gives a DB-wide team and
activity summary.

## An agent has drifted, gone sluggish, or lost the plot

1. Check `lmctl status ./my-team.lmctl <alias>`.
2. Make sure `durable-memory/` captures the current state first.
3. Give it a fresh session **from outside that member**: delete that member's
   `sessionid=` line from the teamfile, then run `lmctl seed ./my-team.lmctl`. Only
   members missing a `sessionid=` are reseeded, so the rest of the roster is untouched.

The reseeded agent loses its accumulated session history and re-reads durable memory.
A session cannot reseed itself while running — do it from another member or an
operator shell.

## Work is being lost between sessions

The provider session is a disposable cache; `durable-memory/` is the canonical state.
Anything that must survive compaction, a reseed, a provider swap, or a fresh session
belongs in `durable-memory/*.md`.

## A sequence of agents needs coordinating

You drive it. Prompt each member in turn — for example hand a task to one, send its
result to a reviewer, route findings back, then gate the outcome yourself.

Aliases carry no power, so no member does this on your behalf unless you first give it
[How to send a prompt to another agent](lmctl-prompt-skill.md).

For anything repeatable, prefer `lmctl script` (LMScript): it orchestrates
deterministically and calls an agent only where judgement is actually needed. An agent
coordinating other agents is a slow, expensive way to run a fixed procedure.

## See also

- [Team Lead basic](lmctl-team-lead-basic-skill.md) — everyday delegation and review
- [Team Lead advanced](lmctl-team-lead-advanced-skill.md) — session recovery, model
  swaps, status monitoring
- [Team Lead workflow](team-lead-workflow.md) — short operating checklist
- [Durable memory](durable-memory.md) — what to persist and why
