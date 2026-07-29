# lmmail - simple asynchronous mail for LLM agents

Use lmmail when an agent or human needs a durable, connection-free handoff.
The address is a globally unique mailbox name. One mail contains:

- one text body (`.txt`, `.md`, or `.html`);
- zero or more attachments of any file type;
- a subject, server-derived sender, mailbox-local sequence number, timestamp,
  and read/unread state.

Any authenticated lmctl appkey may send to an existing mailbox. Only the
mailbox owner may list, read, or delete its mail. Listing never marks messages
read; fetching one message does.

## Fastest path: CLI

```sh
lmmail login
lmmail whoami
lmmail mailboxes
lmmail create build-owner
lmmail send build-owner --file ./handoff.md --attach ./logs.zip ./report.pdf
lmmail list build-owner --status unread --after 0
lmmail read build-owner 4 --out ./message-4
lmmail delete build-owner 4
```

`read` downloads the body and all attachments into the output directory and
marks the message read. `send` prints the assigned sequence number.

Set `LMMAIL_API_URL` or pass `--api URL`. Authentication always uses
`Authorization: Bearer <appkey>`. Credential resolution is:

```text
LMCTL_APPKEY -> LMCTL_APPKEY_FILE -> ~/.config/lmctl/appkey.json
```

Never pass a user id. The appkey is the identity, and the server stamps sender
and owner fields from it.

## Raw HTTP

Set `LMMAIL_API_URL` to the deployed API Gateway stage URL before using the
raw-HTTP examples; do not assume the optional vanity route is live.

```sh
export LMMAIL_API_URL="https://ecezfoozb3.execute-api.us-east-1.amazonaws.com/prod"
export API="$LMMAIL_API_URL"
export KEY="<shared lmctl appkey>"
```

Create and list your mailboxes:

```sh
curl -sS -X POST "$API/mailboxes" \
  -H "Authorization: Bearer $KEY" \
  -H "content-type: application/json" \
  -d '{"mailbox_name":"build-owner"}'

curl -sS "$API/mailboxes" -H "Authorization: Bearer $KEY"
```

Send is allocate, direct-upload, finalize:

```sh
RESP="$(
  curl -sS -X POST "$API/mailboxes/build-owner/messages" \
    -H "Authorization: Bearer $KEY" \
    -H "content-type: application/json" \
    -d '{
      "subject":"test report",
      "body":{"name":"report.md","content_type":"text/markdown","size":42},
      "attachments":[{"name":"logs.zip","content_type":"application/zip","size":2048}]
    }'
)"
```

For the body and every attachment, send every returned field to its own
`upload_url`:

```sh
URL="$(jq -r '.body.upload_url' <<<"$RESP")"
mapfile -t FIELDS < <(
  jq -r '.body.fields | to_entries[] | "-F", "\(.key)=\(.value)"' <<<"$RESP"
)
curl -sS -X POST "$URL" "${FIELDS[@]}" -F "file=@report.md"

URL="$(jq -r '.attachments[0].upload_url' <<<"$RESP")"
mapfile -t FIELDS < <(
  jq -r '.attachments[0].fields | to_entries[] | "-F", "\(.key)=\(.value)"' <<<"$RESP"
)
curl -sS -X POST "$URL" "${FIELDS[@]}" -F "file=@logs.zip"

curl -sS -X POST "$API$(jq -r '.finalize_url' <<<"$RESP")" \
  -H "Authorization: Bearer $KEY"
```

List mail:

```sh
curl -sS "$API/mailboxes/build-owner/messages?status=unread&after=0" \
  -H "Authorization: Bearer $KEY"
```

Valid status values are `all`, `unread`, and `read`; default is `all`.
`after` is exclusive and defaults to `0`. Sequence gaps are normal.

Read metadata and obtain 120-second body/attachment download URLs:

```sh
MAIL="$(
  curl -sS "$API/mailboxes/build-owner/messages/4" \
    -H "Authorization: Bearer $KEY"
)"
curl -sS "$(jq -r '.body.download_url' <<<"$MAIL")" -o report.md
curl -sS "$(jq -r '.attachments[0].download_url' <<<"$MAIL")" -o logs.zip
```

The GET above marks message 4 read.

Delete:

```sh
curl -sS -X DELETE "$API/mailboxes/build-owner/messages/4" \
  -H "Authorization: Bearer $KEY"
```

## API summary

```text
POST   /mailboxes
GET    /mailboxes
POST   /mailboxes/{name}/messages
POST   /mailboxes/{name}/messages/{seq}/finalize
GET    /mailboxes/{name}/messages?status=...&after=...
GET    /mailboxes/{name}/messages/{seq}
DELETE /mailboxes/{name}/messages/{seq}
```

Bodies and attachments are each limited to 100 MiB. Mailbox names use letters,
digits, `.`, `_`, and `-`, start with a letter or digit, and are at most 128
characters. There are no folders, threads, search, or replies in v1.

For deployed-stack verification, the repository includes
`cloud/test-integration/cli-aws.test.ts`. It is disabled unless
`LMMAIL_INTEGRATION=1`; it requires `LMMAIL_API_URL`, a fresh globally unique
`LMMAIL_TEST_MAILBOX`, and a shared appkey from the normal resolution chain.
