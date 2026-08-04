---
title: ClaudeMock Mailbox Drain Fixture
sidebar_position: 5
---

# ClaudeMock mailbox drain fixture

Verified against `lmctl 0.1.248`.

Use this fixture when you need a no-cost, no-real-API reproduction of the
mailbox event chain:

```text
CREATE -> ENQUEUE -> MESSAGE_ACKNOWLEDGED
```

It seeds a throwaway `ClaudeMock` team, explicitly enables the opt-in mailbox
queue, creates one queued message while the receiver is genuinely busy, dry-runs
the reference drain script, then drains the message and verifies the final event
history.

## Safety rules

Use a throwaway DB under `/tmp`. Never run this recipe against
`~/.lmctl/state.db` or the live fleet DB.

The provider name is case-sensitive: use `provider=ClaudeMock`. Lowercase
`provider=claudemock` fails with:

```text
error: Lead: Invalid provider "claudemock"
```

The copy-paste recipe starts chat 1 in the background with an overlapping
`delayMs`, waits a moment, then sends chat 2. This creates the pending row that
the drain steps inspect and acknowledge. The `0.1.228` file-lock fix was
rechecked with both sequential-fire and concurrent chat shapes.

Since `lmctl 0.1.241`, mailbox queueing is off by default. This fixture is a
queue fixture, so it must opt in with `LMCTL_MAILBOX_QUEUE_ENABLED=true`.
Without that export, chat 2 returns a busy error and no pending row is created.

## Copy-paste fixture

Run this from any shell with `lmctl` on `PATH` and a local `lmctl-src` checkout
containing `scripts/relay-loop.pl`.

```bash
ROOT="$(mktemp -d /tmp/lmctl-mockdrain.XXXXXX)"
export LMCTL_ENABLE_MOCK_PROVIDER=1
export LMCTL_MAILBOX_QUEUE_ENABLED=true
export LMCTL_DB="$ROOT/state.db"
LMSRC="${LMSRC:-$HOME/repos/lmctl-src}"
TEAM="$ROOT/mock.lmctl"

mkdir -p "$ROOT/Lead" "$ROOT/Coder"
cat > "$TEAM" <<EOF
_TEAM_ name=MockDrain
_MEMBER_ alias=Lead provider=ClaudeMock sessiondir=$ROOT/Lead
_MEMBER_ alias=Coder provider=ClaudeMock sessiondir=$ROOT/Coder
EOF

lmctl lint "$TEAM"
lmctl seed "$TEAM"

LEAD_SESSION="$(sed -n 's/.*alias=Lead .*sessionid=\([^ ]*\).*/\1/p' "$TEAM")"
export LMCTL_SELF_SESSIONID="$LEAD_SESSION"

STORE="$ROOT/.lmctl-claude-mock/sessions.json"
node - "$STORE" <<'NODE'
const fs = require('fs');
const file = process.argv[2];
const store = JSON.parse(fs.readFileSync(file, 'utf8'));
store.scriptContains = Object.assign({}, store.scriptContains, {
  "slow busy turn": { text: "slow complete", delayMs: 7000 },
  "queued drain target": { text: "queued delivered", delayMs: 0 }
});
fs.writeFileSync(file, JSON.stringify(store, null, 2));
NODE

( lmctl chat "$TEAM" Coder "slow busy turn" > "$ROOT/chat1.out" 2> "$ROOT/chat1.err"; echo $? > "$ROOT/chat1.rc" ) &
CHAT1_PID=$!

sleep 1
lmctl chat "$TEAM" Coder "queued drain target" --json | tee "$ROOT/chat2.ndjson"

MSG_ID="$(node - "$ROOT/chat2.ndjson" <<'NODE'
const fs = require('fs');
const lines = fs.readFileSync(process.argv[2], 'utf8')
  .trim()
  .split(/\n+/)
  .filter(Boolean)
  .map(JSON.parse);
const row = lines.find((item) => item.message_id);
if (!row) {
  throw new Error('chat output did not include message_id');
}
process.stdout.write(row.message_id);
NODE
)"

lmctl mail pending --receiver "$TEAM:Coder" --json

perl "$LMSRC/scripts/relay-loop.pl" \
  --once \
  --mode drain \
  --dry-run \
  --verbose \
  --receiver "$TEAM:Coder" \
  --lock "$ROOT/relay.lock" \
  --lmctl "$(command -v lmctl)"

lmctl mail pending --receiver "$TEAM:Coder" --json

perl "$LMSRC/scripts/relay-loop.pl" \
  --once \
  --mode drain \
  --verbose \
  --receiver "$TEAM:Coder" \
  --lock "$ROOT/relay.lock" \
  --lmctl "$(command -v lmctl)"

lmctl mail pending --receiver "$TEAM:Coder" --json
lmctl mail history "$MSG_ID" --json

wait "$CHAT1_PID"
cat "$ROOT/chat1.out"
```

The recipe uses `LMCTL_DB` instead of passing `--db` through the relay script.
`relay-loop.pl --lmctl` expects only the executable path, not a shell command
with arguments.

## Expected evidence

The second chat should enqueue, not complete:

```json
{"status":"enqueued","path":"enqueued","id":1,"message_id":"msg_mbx_1","sender":"/tmp/lmctl-mockdrain.../mock.lmctl:Lead","receiver":"/tmp/lmctl-mockdrain.../mock.lmctl:Coder"}
```

Before the drain, `lmctl mail pending --receiver "$TEAM:Coder" --json` should
contain one queued message with `lifecycle_state: "queued"`.

The dry-run should find the message without acknowledging it:

```text
[relay-loop] 1 pending message(s)
would handle msg_mbx_1 -> /tmp/lmctl-mockdrain.../mock.lmctl:Coder
[relay-loop] pass complete; handled 0
```

After the real drain, pending should be empty:

```json
{"schema_version":1,"schema":"event-log-v1","filters":{"receiver":"/tmp/lmctl-mockdrain.../mock.lmctl:Coder","limit":100},"messages":[]}
```

Finally, `lmctl mail history "$MSG_ID" --json` should show this event sequence:

```text
CREATE -> ENQUEUE -> MESSAGE_ACKNOWLEDGED
```

`MESSAGE_ACKNOWLEDGED` should include a note like
`relay-loop.pl mode=drain`.

## What this proves

This fixture proves the isolated discover-read-ack path used by drain tooling:

- `lmctl chat --json` exposes the queued `message_id`.
- `mail pending --receiver ... --json` discovers the pending message from the
  event substrate.
- `relay-loop.pl --once --mode drain --dry-run` can inspect the backlog without
  changing state.
- `relay-loop.pl --once --mode drain` reads and acknowledges the message with
  `mail ack --terminalize-pending`.
- `mail history` records the durable acknowledgement.

It does not prove provider behavior for Claude, Codex, or other real providers.
`ClaudeMock` is a fixture gated by `LMCTL_ENABLE_MOCK_PROVIDER=1`.
