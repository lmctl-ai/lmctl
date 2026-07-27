---
title: Daemon & Session Inspection
sidebar_position: 4
---

# Daemon and session inspection

Verified against `lmctl 0.1.218`.

## Local daemon

Use `lmctl serve --help` for the installed help. Do not use
`lmctl serve start --help`; that form currently exits with an unknown-argument
error.

```bash
lmctl serve <start|status|stop> [options]
```

Bare `lmctl serve` exits with an error because a subcommand is required.

### Start

```bash
lmctl serve start --port 8787 --bind 127.0.0.1
```

`serve start` runs in the foreground and blocks until `SIGTERM` or `SIGINT`.
It records `<dir of state.db>/serve.pid`. It does not detach itself; for a
terminal-launched daemon, detach it from the terminal session:

```bash
setsid lmctl serve start > lmctl.log 2>&1 < /dev/null & disown
```

Plain shell backgrounding can still leave the daemon tied to the terminal that
started it. For long-lived service operation, use `setsid` or an external
supervisor; `disown` removes the shell job reference in interactive shells.

Do not wrap delegating `lmctl chat` calls in a shell-level `timeout`. Current
`lmctl chat` keeps the caller's turn open while its own dispatched work settles;
a fixed shell timeout can kill that in-flight work underneath lmctl. Bound your
own scripts around status checks or queue inspection instead of forcibly
terminating `lmctl chat`.

Options:

- `--port`
- `--bind`
- `--no-daemon`
- `--insecure-no-auth`
- `--webui [DIR]`

Example isolated foreground start:

```bash
lmctl --db /tmp/lmctl-serve-doc-test/state.db serve start \
  --port 18787 \
  --bind 127.0.0.1 \
  --insecure-no-auth \
  --no-daemon
```

### Status

```bash
lmctl serve status
lmctl --db /tmp/lmctl-serve-doc-test/state.db serve status
```

`serve status` reports whether the daemon is running for the resolved DB, plus
pid, start time, port, and DB. It exits `0` for both running and not-running.
If `/api/daemon/state` cannot be read, it can still report running with health
unknown.

When queued mail is not moving and the receiver is idle or phantom-busy from a
dead holder PID, check `serve status`.
Base delivery is the same sender's next `lmctl chat` to that same receiver once
it is free; no daemon is required for correctness. With `serve start` running in
normal daemon mode, mailbox relay is an optional accelerator that can drain
queued lanes proactively after the receiver goes idle.

### Stop

```bash
lmctl serve stop
lmctl --db /tmp/lmctl-serve-doc-test/state.db serve stop
```

`serve stop` sends `SIGTERM` to the recorded pid, waits for exit, and removes
the pidfile. It is idempotent.

## Provider session inspection

`lmctl session` is a low-level provider-session inspection contract. It is not
compact team status; use `lmctl status` for that.

The help currently prints JSON usage:

```json
{"schema_version":1,"usage":"usage: lmctl session --query-file <path>  (- reads JSON from stdin)"}
```

Accepted query targets:

```json
{"teamfile":"/path/team.lmctl","alias":"Lead"}
```

```json
{"provider":"codex","sessionId":"..."}
```

Use exactly one target form. Save the query JSON in a file:

```json
{"teamfile":"/path/team.lmctl","alias":"Lead"}
```

Then pass that file to `session`:

```bash
lmctl session --query-file session-query.json
```

`--query-file -` reads JSON from stdin when another program is producing the
query.

Missing or unreadable query files return JSON errors. Successful inspection
returns JSON with fields such as `schema_version`, `provider`, `sessionId`,
`modifiedAt`, `lastPrompt`, `lastPromptTruncated`, `handled`,
`handledSignal`, `tokens`, `toolCalls`, `authorship`, and `coverage`.
