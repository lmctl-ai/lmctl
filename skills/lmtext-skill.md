# lmtext — speech → text for LLM agents

**What this is.** lmtext turns an audio file into a transcript using AWS Transcribe — the
reverse of lmsound. You upload an audio file (mp3/wav/flac/ogg/webm/amr/m4a/mp4) directly to S3
with a presigned POST, kick off transcription, then poll for the transcript. Plain HTTP, one
opaque API key — exactly like calling an LLM API. No SDK, no websocket.

Use it to give any agent ears: transcribe a voice memo, a meeting snippet, a podcast clip.

---

## What you need
- **API base URL** — the lmtext execute-api URL (see deployment outputs; set it as `API` below)
- **An API key** — one opaque token, sent on **every** request:
  ```
  Authorization: Bearer <API_KEY>
  ```
  A human creates and revokes keys on the lmctl.ai website; an LLM just receives the key. The
  **same key works across all lmctl services** (lmchat, lmsound, lmmail, …).

```sh
export API="<lmtext api base url>"   # e.g. https://<id>.execute-api.us-east-1.amazonaws.com/prod
export KEY="<your api key>"
```

---

## The flow (4 steps)

### 1. Allocate an upload — `POST /transcriptions`
```sh
resp="$(curl -s -X POST "$API/transcriptions" -H "Authorization: Bearer $KEY" \
  -H "content-type: application/json" \
  -d '{"file_name":"memo.mp3"}')"
printf '%s\n' "$resp" | jq .

id="$(jq -r '.transcription_id' <<<"$resp")"
upload_url="$(jq -r '.upload_url' <<<"$resp")"
```
Response:
```json
{
  "transcription_id": "3f9a…-uuid",
  "upload_url": "https://lmtext-audio-….s3.amazonaws.com/",
  "upload_fields": {"key":"audio/<user>/<id>/memo.mp3","Content-Type":"audio/mpeg","X-Amz-…":"…"},
  "expires_in": 300
}
```
Body fields:
| field | default | notes |
|-------|---------|-------|
| `file_name` | — | Extension selects the media format: `.mp3 .wav .flac .ogg .webm .amr .m4a/.mp4`. Unsupported → `400`. |
| `content_type` | from extension | Must match the upload's `Content-Type` (presign condition). |
| `language_code` | `en-US` | e.g. `es-US`, `fr-FR`, `de-DE`. Invalid shape → `400`; unsupported by Transcribe → fails at finalize. |

### 2. Upload the audio — presigned POST to S3
```sh
mapfile -t form_fields < <(
  jq -r '.upload_fields | to_entries[] | "-F\n\(.key)=\(.value)"' <<<"$resp"
)
curl -s -X POST "$upload_url" \
  "${form_fields[@]}" \
  -F "file=@memo.mp3"
```
(Every `upload_fields` entry must be a form field, then the file last.) Max size **25 MB**,
link valid **300 s**. Over 25 MB → S3 rejects the POST.

### 3. Start transcription — `POST /transcriptions/{id}/finalize`
```sh
curl -s -X POST "$API/transcriptions/$id/finalize" -H "Authorization: Bearer $KEY"
```
Verifies the upload exists, probes duration, starts the AWS Transcribe job.
Errors: `409 not_uploaded` (step 2 not done), `400 audio_invalid` (unparseable audio),
`413 audio_too_large`. Idempotent — calling it again returns current status.

### 4. Poll for the result — `GET /transcriptions/{id}`
```sh
curl -s "$API/transcriptions/$id" -H "Authorization: Bearer $KEY"
```
```json
{
  "transcription_id": "3f9a…-uuid",
  "status": "completed",
  "file_name": "memo.mp3",
  "language_code": "en-US",
  "media_format": "mp3",
  "duration_ms": 2640,
  "size": 20361,
  "created_at": "…", "started_at": "…", "completed_at": "…",
  "transcript": "hello lmtext, your build is green."
}
```
`status`: `uploading` → `in_progress` → `completed` | `failed` (with `failure_reason`).
`transcript` is present once `completed`. Poll every few seconds; typical short clips finish
in well under a minute.

---

## List and delete

- `GET /transcriptions?status=completed&limit=20&after=<cursor>` — your transcriptions, newest
  first. `status`: `uploading|in_progress|completed|failed` (omit for all). Response:
  `{transcriptions:[…], next_after, has_more, truncated}` — pass `next_after` as `after` for the
  next page. `truncated` is `true` when the service reaches its 1,000-object scan ceiling, so the
  response may omit older matching records even after following `next_after`.
- `DELETE /transcriptions/{id}` — removes audio, meta, and transcript objects and makes a
  best-effort attempt to delete the Transcribe job record. A running job is not cancelled and may
  write transcript output afterwards; that late output is left behind in v1.

You only ever see your own transcriptions; other users' ids return `404 transcription_not_found`.

---

## CLI

```sh
npm run build && export PATH="$PWD/cloud/dist/src/cli:$PATH"   # or link cloud/dist/src/cli/lmtext.js
export LMTEXT_API_URL="$API"

lmtext transcribe memo.mp3 --wait        # upload → finalize → poll → print transcript
lmtext list --status completed
lmtext get 3f9a…-uuid
lmtext delete 3f9a…-uuid
```
Credentials resolve like every lmctl tool: `LMCTL_APPKEY`, `LMCTL_APPKEY_FILE`, or the shared
appkey location (`@lmctl-ai/appkey`).

---

## Errors and limits

- `401/403` — missing/invalid API key.
- `404 transcription_not_found` — no such id **for you**.
- `429 daily_limit_exceeded` — daily usage quota hit (`used_micro`/`limit_micro` in the body).
- Quotas: shared lmctl daily cost limits; transcription is metered at the AWS Transcribe list
  price (~$0.024/minute) once duration is known at finalize.
