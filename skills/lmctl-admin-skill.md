# lmctl-admin skill

Use this skill when you need read-only diagnostics over lmctl team state:
delivery classification, liveness/lock reconciliation, or orphaned mailbox row
scans. `lmctl-admin` is a sibling project to lmctl, currently at
`/home/mma/repos/lmctl-admin`.

`lmctl-admin` is diagnostic only. Its current commands do not write state, call
`lmctl chat`, or acknowledge mail.

## Setup

`lmctl-admin` depends on a built sibling `lmctl-src` checkout.

```sh
cd /home/mma/repos/lmctl-src
npm install
npm run build

cd /home/mma/repos/lmctl-admin
npm install
npm run build
```

Run it from the `lmctl-admin` repo:

```sh
./bin/lmctl-admin <command> [args]
```

It reads the same DB path lmctl resolves by default, currently
`~/.lmctl/state.db`. To inspect a copied or non-default DB, set `LMCTL_DB`:

```sh
LMCTL_DB=/tmp/state-copy.db ./bin/lmctl-admin orphan-scan --json
```

## Commands

Classify one message from durable event history:

```sh
./bin/lmctl-admin diagnose-delivery msg_mbx_451 --json
```

Use this when timestamps or summary status are ambiguous. The JSON includes
`classification`, `reason`, ordered `timeline`, and `trigger`. Classifications
are `daemon-delivered`, `manually-acked`, `still-queued`, `legacy-orphan`, and
`not-found`.

Compare lmctl health/liveness with raw `agent_inflight` locks:

```sh
./bin/lmctl-admin check-liveness /path/to/team.lmctl --json
./bin/lmctl-admin check-liveness /path/to/team.lmctl Lead --json
```

Use this when a member, Lead, or cross-team target appears busy/idle
incorrectly. The JSON includes `rows[]`, each with `health`, raw
`agent_inflight`, and `holderPidCheck` so a dead local PID can be separated from
a live terminal or in-flight turn.

Scan for undelivered legacy mailbox rows without event-log pending coverage:

```sh
./bin/lmctl-admin orphan-scan --json
./bin/lmctl-admin orphan-scan /path/to/team.lmctl --json
```

Use this proactively when a delivery lane looks stuck or after mailbox/relay
maintenance. The JSON groups by lane and message type, with
`undelivered_count`, `covered_by_pending`, `legacy_orphans`, and
`pending_missing_with_events`.

## Operating rules

- Prefer `--json` and inspect the documented fields; text output is for humans.
- Treat these commands as diagnostics, not fixes. They identify the evidence you
  need before choosing an lmctl action.
- Do not run mutating lmctl commands from this skill. If a result suggests a
  repair, report the evidence and use the normal team/operator process.
- If a documented output field does not match the live command, report that as a
  docs or tool drift bug; do not guess from timestamps.

Canonical local manual: `/home/mma/repos/lmctl-admin/README.md`.
