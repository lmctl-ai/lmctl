---
title: CLI Reference
sidebar_position: 2
---

# CLI reference

`lmctl` is a local command-line tool. It runs on your machine and works
directly against your local lmctl state (a SQLite workspace database, normally
under `~/.lmctl/`). Provider CLIs still use their own configured services when
they run model turns, and the optional cloud console is an explicit opt-in.

Its commands come in two shapes, both part of the same CLI:

- **top-level commands** — `lmctl status` for team/SELF state, `lmctl chat`,
  `lmctl team`, `lmctl seed`, `lmctl refresh`, `lmctl diagnose`, and so on.
- **the `lmctl api <noun>` group** — call the local HTTP API or direct DAL
  endpoints. `api` is just the name of a command group; it is not a separate
  binary or a remote client.

## Setup and status

```bash
lmctl status
lmctl diagnose
lmctl serve > lmctl.log 2>&1 &
```

`lmctl status` is zero-arg. In a seeded member session it identifies the caller
from `LMCTL_SELF_SESSIONID` and reports identity, teamfile, member busy/idle
state, recent delegation activity, and mailbox lanes. Outside a member session
it reports workspace scope with `identity: none`. `--project` and `--web` are
not `status` options; `--json` returns full unbounded status data.

`lmctl serve` starts the local HTTP API, web UI, queue daemon, terminal manager,
and agent services for local service integrations. The optional
[lmctl.ai](https://lmctl.ai) web console (a free/premium subscription) connects
to this same local daemon.

## DB teams

```bash
lmctl team create <name>
lmctl team list
lmctl team show <name>
lmctl team add-member <team-name> --alias A --provider P [--model M] [--role R] [--sessiondir D]
lmctl team seed <team-name> [--alias A]
lmctl team refresh <team-name> --alias A
```

## Teamfiles, clone, lint, seed

`.lmctl` teamfiles are editable team documents. Use `clone` to copy a teamfile
without carrying over session ids:

```bash
lmctl clone ./backend/backend.lmctl ./backend-v2/backend-v2.lmctl
lmctl lint ./backend-v2/backend-v2.lmctl
lmctl seed ./backend-v2/backend-v2.lmctl
```

Cross-team calls work automatically at runtime — there is no command to wire
them up. See [Cross-team calls](./teams-connect.md).

`lmctl lint <teamfile.lmctl>` validates teamfile syntax, session placeholders,
and configured models. `lmctl seed <teamfile.lmctl>` fills missing or
placeholder session ids by calling the configured native providers.

Generate a starter team document for a directory:

```bash
lmctl plan ./backend --provider codex
```

## Direct member chat

Use `lmctl chat` when an operator or Lead needs to drive a specific member
directly. The common teamfile forms are:

```bash
lmctl chat ./team.lmctl:Coder "Implement the smallest safe fix."
lmctl chat ./team.lmctl Coder "Implement the smallest safe fix."
lmctl chat ./team.lmctl Reviewer "Review Coder's latest change."
```

`chat` is synchronous by default: it sends one prompt and blocks until that
provider turn finishes, queues, or errors. Exit code alone is not a completion
contract: a busy receiver with a sender identity can enqueue the prompt and
exit `0`. For raw provider sessions, use one of:

```bash
lmctl chat <sessionid> "Prompt text" --provider codex
lmctl chat --provider codex --session <sessionid> "Prompt text"
```

For safe input, especially prompts that contain command examples, backticks,
shell variables, or quotes, use `--prompt-file`:

```bash
lmctl chat ./team.lmctl Coder --prompt-file task.md
lmctl chat ./team.lmctl Coder --prompt-file -
```

With a positional prompt, your shell expands backticks, `$(...)`, `$VAR`, and
quotes before lmctl sees the text. `--prompt-file` bypasses that shell
construction step. Write the prompt file with an editor or file-writing tool,
not with `echo` or a heredoc, because those still go through your shell.

By default, `chat` remains synchronous:

```bash
lmctl chat ./team.lmctl Coder "Run the long verification pass."
```

When lmctl can resolve a sender identity, the same `chat` command is also the
queueing primitive. If the target is idle, `chat` drives a normal blocking turn.
If the target is busy, lmctl queues the message in that sender-to-receiver lane:

```bash
lmctl chat ./team.lmctl Coder "status note"
```

Exit 0 with `enqueued mailbox message N` means the prompt is queued, not
delivered yet. The next `lmctl chat` from that same sender to that same receiver
delivers that sender's queued lane plus the new message in one turn once the
receiver is free. A chat from another sender to the same receiver does not
flush the lane. A receiver held by `lmctl terminal` is legitimately busy, so
mail waits rather than failing.

Use `lmctl chat ... --json` for automation. The queued contract is
`status: "enqueued"` with `path: "enqueued"`. See
[Verifying delegated work](./verifying-delegated-work.md).

## Inspecting state

These `lmctl api <noun>` commands call the local lmctl API or selected direct
DAL endpoints:

```bash
lmctl api status
lmctl api teams
lmctl api daemon state
lmctl api daemon cycle
lmctl api attentions
lmctl api external-objects
lmctl api external-signals
```

Many list commands support `--json`. Prefer JSON when another program or agent
will parse the output.

## Foreground/background ownership

`lmctl chat` blocks and returns a member reply when it can drive the receiver
now. With sender identity, the same command queues if the receiver is busy.
Without sender identity, a busy receiver returns busy instead of creating
anonymous queued mail. lmctl does not expose a separate LLM-called harvest
command.

## Queued delivery

The member-to-member lifecycle is:

```text
queued -> in-flight -> delivered with receipt
```

With sender identity, `chat` queues when the target is busy and delivers
directly when the target is idle. If `chat` exits 0 with
`enqueued mailbox message N`, that means queued, not delivered yet. When a
delivery turn runs, the queued lane is sent as one provider turn and the target
response is recorded as the receipt.
Delivery is at-least-once: if a process dies after sending but before marking
rows delivered, lmctl may deliver the same queued message again. A duplicate is
preferable to losing work.

What delivers queued mail: the next `lmctl chat` from that same sender to that
same receiver. When the receiver is free, that chat delivers that sender's
queued lane plus the new message in one turn. Mail queued by a different sender
is not affected; each `(sender, receiver)` pair has its own lane. If the
receiver is still in a provider turn, or a human is holding that member with
`lmctl terminal`, the mail waits. If the sender is idle waiting for the reply
and never sends again, this is a deadlock rather than normal delay. There is no
separate LLM-called harvest command.

## Upload files

`lmctl api upload` is not part of the current public quick path. Use
`lmctl api --help` and the local daemon documentation for API-specific upload
experiments.

## Attentions

```bash
lmctl api attentions
lmctl api attentions --unacked
lmctl api attention ack <id>
```

An attention is a persistent operator notification. Use `--unacked` to list the
ones still awaiting acknowledgement, then ack them by id.

## Issues

```bash
lmctl api issues list my-project --status open --json
lmctl api issues show <id> --json
lmctl api issues create my-project --title "Title" --body "Body"
lmctl api issues close <id> --commit-hash <sha>
lmctl api issues reopen <id>
```

Use issues for bugs, QA findings, and operator-visible follow-up work.

## Sessions

```bash
lmctl ls
lmctl ls --runs --limit 10
lmctl terminal <teamfile>:<alias>
lmctl tail <session-id> --provider codex
lmctl tail ./team.lmctl Coder
lmctl tail --session <session-id> --provider codex
lmctl health <teamfile>
lmctl health ./team.lmctl Coder
lmctl health <session-id> --provider codex
```

`terminal --size` reports message count, transcript bytes, and a local token
estimate. It does not compact or change the session.

## Device and MCP

```bash
lmctl device init
lmctl device id
lmctl device prompt --root ./team.lmctl --text "Summarize current status"
```

The `lmctl mcp` bridge exists for optional manual experiments, but lmctl no
longer installs or relies on it by default. See
[MCP manual install](../mcp-manual-install.md).

## Debug logs

Debug output goes to `~/.lmctl/debug-*.log`, not the terminal. Set
`LMCTL_DEBUG=1` before a command, then inspect the newest debug file if you need
provider or transport diagnostics.

## Connecting to a remote daemon (advanced)

By default `lmctl` uses your local daemon and needs no auth. To point the CLI
at a different or remote daemon — for example a shared host — set:

```bash
export LMCTL_API_URL=http://127.0.0.1:8787
export LMCTL_API_TOKEN=<token>
```

`lmctl` then sends the token as a bearer token to that daemon. Most setups
never need this.
