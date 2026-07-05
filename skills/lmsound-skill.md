# lmsound — text → speech for LLM agents

**What this is.** lmsound turns text into an audio file using AWS Polly. You `POST` some text
(plain or SSML), the server synthesizes speech, stores the audio, and hands you back a short-lived
**presigned download URL** for the `mp3` (or `ogg`/`pcm`). Plain HTTP, one opaque API key — exactly
like calling an LLM API. No SDK, no websocket, no schema dance.

Use it to give any agent a voice: narrate a summary, read out an alert, produce a spoken reply.

---

## What you need
- **API base URL** — `https://lmctl.ai/tools/lmsound`
- **An API key** — one opaque token, exactly like an LLM API key. Send it on **every** request:
  ```
  Authorization: Bearer <API_KEY>
  ```
  A human creates and revokes keys on the lmctl.ai website; an LLM just receives the key. The **same
  key works across all lmctl services** (lmchat, lmsound, …) — one valid key, every service.

```sh
export API="https://lmctl.ai/tools/lmsound"
export KEY="<your api key>"
```

---

## Synthesize speech — `POST /speak`

```sh
curl -s -X POST "$API/speak" -H "Authorization: Bearer $KEY" \
  -H "content-type: application/json" \
  -d '{"text":"Hello from lmsound. Your build is green."}'
```
Response:
```json
{
  "id": "3f9a…-uuid",
  "voice_id": "Joanna",
  "engine": "neural",
  "format": "mp3",
  "text_type": "text",
  "char_count": 42,
  "size": 20361,
  "duration_ms": 2640,
  "sample_rate": 24000,
  "bitrate": 48000,
  "download_url": "https://…s3…?X-Amz-Expires=300&…"
}
```
`duration_ms`, `sample_rate` (Hz) and `bitrate` (bps) are measured from the synthesized audio — no
need to re-probe with `ffprobe`. They're handy for aligning narration to video/animation beats. (For
`pcm`, which has no container header, these media stats may be omitted.)
Fetch the audio (the `download_url` is a presigned GET, valid **≤ 300s**):
```sh
curl -sL "$(… .download_url)" -o hello.mp3
```

### Body fields (all but `text` optional)
| field       | default  | notes |
|-------------|----------|-------|
| `text`      | —        | 1–3000 characters. Empty → `400 invalid_text`; over 3000 → `400 text_too_long`. |
| `voice_id`  | `Joanna` | Any Polly voice — see `GET /voices`. Unknown/incompatible → `400 invalid_voice`. |
| `engine`    | `neural` | `standard` \| `neural` \| `long-form` \| `generative`. `neural` is great quality broadly; `generative`/`long-form` are the highest quality but only some voices support them (the error lists which). |
| `format`    | `mp3`    | `mp3` \| `ogg_vorbis` \| `pcm`. |
| `text_type` | auto     | `text` or `ssml`. Omitted → auto-detected (`ssml` if the text starts with `<speak`). |
| `sample_rate` | Polly default | Hz as a string. `mp3`/`ogg_vorbis`: `8000`\|`16000`\|`22050`\|`24000`; `pcm`: `8000`\|`16000`. Invalid for the format → `400 invalid_sample_rate`. |
| `ttl`       | `300`    | Lifetime (seconds) of the returned `download_url`, `60`–`3600`. Out of range → `400 invalid_ttl`. Bump it for batch pipelines that generate many clips before assembling. |

### SSML — fine-grained control
```sh
curl -s -X POST "$API/speak" -H "Authorization: Bearer $KEY" \
  -H "content-type: application/json" -d '{
    "voice_id":"Matthew","engine":"neural",
    "text":"<speak>Deploy <break time=\"300ms\"/> <emphasis>succeeded</emphasis>.</speak>"
  }'
```
Set `text_type:"ssml"` explicitly, or just start the text with `<speak>` and it's detected.
Malformed SSML → `400 {"error":"invalid_ssml"}`.

---

## Pick a voice — `GET /voices`
```sh
curl -s "$API/voices" -H "Authorization: Bearer $KEY"
# -> {"voices":[{"id":"Joanna","name":"Joanna","language_code":"en-US",
#      "gender":"Female","supported_engines":["standard","neural","generative"]}, …]}
```
Filter to the voices you can actually use with an engine/language:
```sh
curl -s "$API/voices?engine=generative&language=en-US" -H "Authorization: Bearer $KEY"
```
Use `supported_engines` to choose a valid `voice_id` × `engine` pair before calling `/speak`.

---

## Re-download later — `GET /speak/{id}`
The `download_url` from `/speak` expires in 5 minutes. To get a **fresh** link for an audio you
already made, hit its id — the server `302`-redirects to a new presigned URL:
```sh
curl -sL "$API/speak/3f9a…-uuid" -H "Authorization: Bearer $KEY" -o hello.mp3
# fresh link with a longer lifetime: add ?ttl=<60..3600> (default 300s)
curl -sL "$API/speak/3f9a…-uuid?ttl=1800" -H "Authorization: Bearer $KEY" -o hello.mp3
```
Ids are scoped to your key — someone else's id returns `404 not_found`.

## List your recent audio — `GET /speak`
```sh
curl -s "$API/speak" -H "Authorization: Bearer $KEY"
# -> {"items":[{"id":"3f9a…","format":"mp3","size":20361,"created_at":"…"}, …]}  # newest first
```

## Check your monthly spend — `GET /usage`
There's a per-user **monthly Polly spend cap**. Check where you stand:
```sh
curl -s "$API/usage" -H "Authorization: Bearer $KEY"
# -> {"month":"2026-07","used_usd":0.0123,"cap_usd":10,"remaining_usd":9.9877}
```
When a `POST /speak` would push you over the cap it's rejected with
`429 {"error":"monthly_cap_exceeded","cap_usd":10,"used_usd":…}` **before** any audio is synthesized
(so you're never billed past the cap). Cost is estimated from characters × the engine's Polly rate;
the counter resets at the start of each UTC month.

---

## Notes
- **Errors** are JSON `{"error":"<code>"}` with the matching HTTP status: `invalid_text`,
  `text_too_long`, `invalid_engine`, `invalid_format`, `invalid_voice`, `invalid_ssml`,
  `invalid_text_type`, `invalid_sample_rate`, `invalid_ttl`, `not_found`, and `monthly_cap_exceeded` (429).
- **Limits:** `text` is 1–3000 characters per call (no auto-chunking — split longer text yourself and
  synthesize per block). Pick `voice_id` from `GET /voices`; `engine`∈`standard|neural|long-form|generative`;
  `format`∈`mp3|ogg_vorbis|pcm`. A valid key grants every lmctl service (no per-service subscription gate).
- **Audio is disposable** — objects expire after 7 days. Re-synthesize or re-download before then.
- **Never returns raw bytes through the API** — always a presigned S3 URL, so large audio is fine.
- One key = one user's scope. `char_count` counts Unicode codepoints (what Polly bills).

That's the whole skill: `POST /speak` to synthesize (text or SSML), `GET /voices` to choose a
narrator, `GET /speak/{id}` for a fresh link, `GET /speak` to list — all with one
`Authorization: Bearer <API_KEY>`.
