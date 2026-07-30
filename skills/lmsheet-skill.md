# lmsheet skill

Use lmsheet for small, durable spreadsheets in the authenticated lmctl user's
private namespace. Data is stored as strings in DynamoDB.

## Setup

Always set the deployed API Gateway stage URL explicitly:

```bash
export LMSHEET_API_URL='https://9zdvg8wfjh.execute-api.us-east-1.amazonaws.com/prod'
```

Use the shared lmctl appkey. The CLI resolves it from:

1. `LMCTL_APPKEY`
2. `LMCTL_APPKEY_FILE`
3. `~/.config/lmctl/appkey.json`

`lmsheet login` configures the shared default file. `lmsheet whoami` reports
the target and credential source without revealing the key. Never send an
owner ID: the API derives ownership from the verified appkey.

## Addressing and semantics

- Sheet names are flat ASCII-safe names.
- Columns are ordered and addressed `A`-`Z`, `AA`, `AB`, and onward.
- Row 1 is the first data row; headers are metadata, not row 1.
- Cells use A1 notation, such as `B3`.
- Every value is a string of at most 100 characters. Empty string is an empty
  cell value.
- Row update merges supplied cells; it does not replace unspecified cells.
- Clear-cell removes the named cell from the row.
- Deleted row numbers are not automatically reused.

## CLI

```bash
lmsheet create contacts --cols "Name,Email,Age"
lmsheet sheets
lmsheet add-column contacts Country

lmsheet add-row contacts \
  --set A=Ada \
  --set B=ada@example.com \
  --set C=30

lmsheet add-row contacts --row 10 --set A=Grace
lmsheet read contacts
lmsheet read contacts --after 10 --limit 100

lmsheet update-row contacts 1 --set B=new@example.com --set C=31
lmsheet set-cell contacts C1 32
lmsheet clear-cell contacts B1
lmsheet delete-row contacts 1
lmsheet delete-sheet contacts
```

Quote shell arguments containing spaces. Each `--set` is `LETTER=value`; the
value may contain additional `=` characters.

`read` prints a column-definition line, then tab-separated rows whose final
field is a JSON cell map. It ends with
`next_after=<row>\thas_more=<true|false>`. Pass `next_after` as `--after` to
continue.

All commands accept `--api URL`. Otherwise `LMSHEET_API_URL` is required.

## Raw HTTP

```bash
export LMCTL_APPKEY='replace-me'
auth=(-H "Authorization: Bearer $LMCTL_APPKEY")
json=(-H 'Content-Type: application/json')
```

Create:

```bash
curl -fsS -X POST "$LMSHEET_API_URL/sheets" \
  "${auth[@]}" "${json[@]}" \
  --data '{"name":"contacts","columns":["Name","Email"]}'
```

List sheets:

```bash
curl -fsS "$LMSHEET_API_URL/sheets" "${auth[@]}"
```

Add a column:

```bash
curl -fsS -X POST "$LMSHEET_API_URL/sheets/contacts/columns" \
  "${auth[@]}" "${json[@]}" --data '{"label":"Age"}'
```

Append a row:

```bash
curl -fsS -X POST "$LMSHEET_API_URL/sheets/contacts/rows" \
  "${auth[@]}" "${json[@]}" \
  --data '{"cells":{"A":"Ada","B":"ada@example.com","C":"30"}}'
```

Use `"row_num":10` in that body for explicit placement. An occupied row
returns `409 row_exists`.

Read:

```bash
curl -fsS "$LMSHEET_API_URL/sheets/contacts/rows?after=0&limit=100" "${auth[@]}"
```

The response includes sheet metadata, `rows`, `next_after`, and `has_more`.
Raw-HTTP clients must continue with `after=next_after` while `has_more` is true
and tolerate an empty final page, because DynamoDB can return a
`LastEvaluatedKey` for a full page even when no later rows exist. The cursor is
a DynamoDB scan high-water mark.

Update row cells:

```bash
curl -fsS -X PUT "$LMSHEET_API_URL/sheets/contacts/rows/1" \
  "${auth[@]}" "${json[@]}" \
  --data '{"cells":{"B":"new@example.com","C":"31"}}'
```

Set or clear one cell:

```bash
curl -fsS -X PUT "$LMSHEET_API_URL/sheets/contacts/cells/B1" \
  "${auth[@]}" "${json[@]}" --data '{"value":"new@example.com"}'

curl -fsS -X DELETE "$LMSHEET_API_URL/sheets/contacts/cells/B1" "${auth[@]}"
```

Delete a row or the entire sheet:

```bash
curl -fsS -X DELETE "$LMSHEET_API_URL/sheets/contacts/rows/1" "${auth[@]}"
curl -fsS -X DELETE "$LMSHEET_API_URL/sheets/contacts" "${auth[@]}"
```

Large sheet deletion is resumable. A response with `"deleted":false` means the
server completed its bounded batch and the same DELETE should be repeated.
The CLI performs these retries automatically.

## Errors

- `400`: invalid name, columns, row number, cell address, cell value, or page.
- `400 value_too_long`: at least one supplied cell exceeds 100 characters; no
  cells from that request were written.
- `401`: missing or invalid shared appkey.
- `404 sheet_not_found`: sheet is missing or deletion is in progress.
- `404 row_not_found`: the addressed row does not exist.
- `409 sheet_exists`: duplicate sheet creation.
- `409 row_exists`: explicit row number is occupied.
- `409 concurrent_update`: repeated concurrent mutation prevented completion.

Do not retry validation or authorization errors unchanged. Re-read before
recovering from a concurrent update.
