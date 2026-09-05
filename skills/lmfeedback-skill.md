# lmfeedback — embeddable website feedback, delivered as lmmail mail

Use lmfeedback when a website should collect feedback from its visitors and
deliver it to the site's AI owner. A host page embeds one script tag; the
snippet collects free-form text plus an optional screenshot and POSTs it to
the lmfeedback API. The Lambda turns each submission into an **lmmail
message** to the site owner's mailbox:

- body file `feedback.md` — markdown listing user id (or `anonymous`),
  domain, page URL, user agent, receipt timestamp, then the verbatim text;
- the screenshot rides as an image attachment;
- subject: `[feedback] <domain> — <user_id|anonymous>`.

lmfeedback stores no mail itself. Delivery is a client-side call into the
existing lmmail send flow (allocate → S3 upload → finalize), so feedback is
read with the normal lmmail tooling (`lmmail list/read`) from the owner's
mailbox.

## Authentication

Two tiers:

- **Public routes** (`POST /feedback`, `GET /feedback.js`) need **no
  credential** — end users' browsers call these. Abuse control is per-domain
  and per-IP daily counters (default cap 50/day, `429 rate_limited` past it)
  plus a 9 MiB request body cap.
- **Admin routes** (`/sites`) use the shared lmctl appkey:
  `Authorization: Bearer <appkey>`. Resolution order for the CLI:

```text
LMCTL_APPKEY -> LMCTL_APPKEY_FILE -> ~/.config/lmctl/appkey.json
```

The appkey is the identity; the server verifies it against the shared S3
appkey store. Never pass a user id to admin routes.

## API summary

```text
GET    /feedback.js        # public; the embeddable snippet (CORS *)
POST   /feedback           # public; submit feedback (rate-limited)
POST   /sites              # admin; register/upsert a domain
GET    /sites              # admin; list registrations
DELETE /sites/{domain}     # admin; remove a registration
```

Feedback text is limited to 8192 UTF-8 bytes; the optional image to 5 MB
decoded, content type png/jpeg/webp/gif. An unregistered `domain` gets
`404 domain_not_registered`. Error bodies are `{"error": "<code>"}`.

## CLI coverage

| API operation | CLI command |
| --- | --- |
| Register/upsert a domain | `lmfeedback sites add --domain D --owner site:team:alias [--mailbox m]` |
| List registrations | `lmfeedback sites list` |
| Remove a registration | `lmfeedback sites delete --domain D` |
| Submit feedback (public route) | `lmfeedback test --domain D --text "..." [--url U]` |
| Inspect target/credential source | `lmfeedback whoami` |

`--owner` is the owner's lmmail-style address `site:team:alias`. `--mailbox`
is optional: when omitted, the owner's mailbox is resolved from
`owner.site` via lmmail at delivery time (same appkey identity — v1
dogfooding assumes site owners share the operator's lmmail account).

## Raw HTTP

Set `LMFEEDBACK_API_URL` to the deployed API Gateway stage URL before using
these examples; there is no built-in default. The examples below use a fake
API id — substitute the deployed stage URL.

```sh
export API="https://<api-id>.execute-api.us-east-1.amazonaws.com/prod"
export KEY="<shared lmctl appkey>"
```

Register a site (admin, appkey required):

```sh
curl -sS -X POST "$API/sites" \
  -H "Authorization: Bearer $KEY" \
  -H "content-type: application/json" \
  -d '{
    "domain": "example.com",
    "owner": {"site": "my-site", "team": "my-team", "alias": "feedback"},
    "mailbox": "my-mailbox"
  }'
```

Submit feedback (public, no credential — this is what the snippet sends):

```sh
curl -sS -X POST "$API/feedback" \
  -H "content-type: application/json" \
  -d '{
    "domain": "example.com",
    "url": "https://example.com/page",
    "user_id": "user-123",
    "text": "the checkout button is misaligned",
    "image": {"name": "screenshot.png", "content_type": "image/png", "data_base64": "<base64>"}
  }'
```

Success returns `{"delivered": true, "seq": N}`. `user_id` and `image` are
optional.

## Build and test

```sh
cd cloud
npm install
npm run build
npm test
```

The default test command is hermetic and never contacts AWS. A separately
gated deployed-stack integration test drives the full flow — register a fixed
test domain, POST public feedback with a 1x1 PNG, poll the owner mailbox via
the lmmail API, verify body markdown and attachment bytes, then clean up:

```sh
export LMFEEDBACK_INTEGRATION=1
export LMFEEDBACK_API_URL="https://<api-id>.execute-api.us-east-1.amazonaws.com/prod"
# Optional; defaults to the lmmail deployment configured by the stack.
export LMMAIL_API_URL="https://<lmmail-api-id>.execute-api.us-east-1.amazonaws.com/prod"
# Optional override; the suite otherwise reuses and cleans it-lmfeedback-shared.
export LMFEEDBACK_TEST_MAILBOX="my-fixed-integration-mailbox"
# Credential: LMCTL_APPKEY, LMCTL_APPKEY_FILE, or ~/.config/lmctl/appkey.json
npm run test:integration
```

Run it only against a deployed stack you intend to test. The suite reuses
fixed resource names (domain `it-lmfeedback-test.example.com`, mailbox
`it-lmfeedback-shared`) and cleans the mailbox before each run. After a
successful delivery it deletes only that run's message to preserve concurrent
mail; if delivery never returns a message sequence, cleanup falls back to
clearing the mailbox. It never deletes the shared mailbox itself.

## Shared appkey

lmfeedback does not own a key system. It uses the same shared appkey identity
as lmmail and lmchat. If you already have an appkey from lmmail's or lmchat's
`login` flow, lmfeedback accepts it — there is no separate provisioning step
and no `lmfeedback login` command.
