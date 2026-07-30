# lmnote skill

Use lmnote to keep durable named files in the authenticated lmctl user's
private notebook.

## Setup

Set the deployed API Gateway stage URL explicitly before using either the CLI
or raw HTTP:

```bash
export LMNOTE_API_URL='https://vijni9tfxh.execute-api.us-east-1.amazonaws.com/prod'
```

Authenticate with the same shared lmctl appkey used by lmchat, lmmail, and
lmsound. The CLI searches, in order:

1. `LMCTL_APPKEY`
2. the file named by `LMCTL_APPKEY_FILE`
3. `~/.config/lmctl/appkey.json`

Run `lmnote login` to configure the shared default file. Never print, log, or
send the appkey anywhere except the lmnote API's `Authorization` header.
`lmnote whoami` safely reports the selected API and credential source without
revealing the secret.

The server derives notebook ownership from the verified appkey. Do not include
a user or owner ID in requests.

## Preferred interface: CLI

```bash
lmnote push research.md --file ./research.md
lmnote list
lmnote list --after research.md --limit 100
lmnote read research.md
lmnote read research.md --out ./research.md
lmnote update research.md --file ./revised.md
lmnote delete research.md
```

`push` creates and returns an error if the name already exists. `update` only
works for an existing note. Notes may be any file type. The CLI recognizes
common extensions and uses `application/octet-stream` for unknown ones.

`list` prints tab-separated note metadata followed by
`next_after=<name>\thas_more=<true|false>`. If `has_more` is true, pass
`next_after` back as `--after`.

Without `--out`, `read` writes note text to stdout. With `--out`, it creates the
parent directory as needed and saves the file.

Every command accepts `--api URL`; otherwise it requires `LMNOTE_API_URL`.
There is no assumed default endpoint.

## Raw HTTP

Set an appkey only for the shell process that needs it:

```bash
export LMCTL_APPKEY='replace-me'
auth=(-H "Authorization: Bearer $LMCTL_APPKEY")
```

### Create

Allocate a note:

```bash
size="$(wc -c < ./research.md)"
curl -fsS -X POST "$LMNOTE_API_URL/notes" \
  "${auth[@]}" \
  -H 'Content-Type: application/json' \
  --data "{\"name\":\"research.md\",\"content_type\":\"text/markdown\",\"size\":$size}"
```

The response contains:

```json
{
  "name": "research.md",
  "content_type": "text/markdown",
  "size": 123,
  "upload_url": "https://...",
  "fields": {"key": "...", "...": "..."},
  "finalize_url": "/notes/research.md/finalize",
  "operation_token": "...",
  "expires_in_seconds": 120
}
```

Upload directly to `upload_url` as multipart form data. Include every returned
entry from `fields` unchanged, then add the file field last. After S3 returns
success, finalize:

```bash
curl -fsS -X POST "$LMNOTE_API_URL/notes/research.md/finalize" \
  "${auth[@]}" \
  -H 'Content-Type: application/json' \
  --data '{"operation_token":"..."}'
```

The note does not appear in normal lists until finalization succeeds. Repeating
the same finalize call is safe.

### List

```bash
curl -fsS "$LMNOTE_API_URL/notes?after=&limit=100" "${auth[@]}"
```

The response is:

```json
{
  "notes": [
    {
      "name": "research.md",
      "content_type": "text/markdown",
      "size": 123,
      "created_at": "2026-07-29T12:00:00.000Z",
      "updated_at": "2026-07-29T12:00:00.000Z"
    }
  ],
  "next_after": "research.md",
  "has_more": false
}
```

If `has_more` is true, request the next page with `after=next_after`. The
cursor is a scan high-water mark and is safe even when transient rows were
filtered out.

### Read

```bash
metadata="$(
  curl -fsS "$LMNOTE_API_URL/notes/research.md" "${auth[@]}"
)"
```

The response includes a short-lived `download_url` pinned to the note's stored
S3 version. Fetch it without the appkey header:

```bash
curl -fsS '<download_url>'
```

### Update

Allocate an update with `PUT`:

```bash
size="$(wc -c < ./revised.md)"
curl -fsS -X PUT "$LMNOTE_API_URL/notes/research.md" \
  "${auth[@]}" \
  -H 'Content-Type: application/json' \
  --data "{\"content_type\":\"text/markdown\",\"size\":$size}"
```

Upload and finalize exactly like create, using the returned form fields and
token. Updating preserves `created_at`, advances `updated_at`, and makes a new
S3 version current.

### Delete

```bash
curl -fsS -X DELETE "$LMNOTE_API_URL/notes/research.md" "${auth[@]}"
```

Delete removes the metadata and the exact stored S3 `VersionId`. A missing
note returns `404 {"error":"note_not_found"}`.

## Error handling

Treat these responses as expected application outcomes:

- `400`: invalid name, content type, size, cursor, limit, or request body.
- `401`: missing or invalid shared appkey.
- `404 note_not_found`: note does not exist in this authenticated user's space.
- `409 note_exists`: create used an existing name.
- `409 note_busy`: another update/delete is in progress.
- `409 not_uploaded`: finalize ran before the S3 object was available.
- `409 finalize_mismatch`: the finalize token is stale or wrong.

Do not retry validation or authorization errors unchanged. A short retry is
reasonable for `not_uploaded`; re-read state before recovering from `note_busy`.
