# MPA architecture: immutable HTML + Dart front tier + API over Postgres (2026-11-22)

**lmctl.ai is an SPA. Every other site is an MPA** — lmctl.com, egtry.com, grepcent.com.

## The shape

```
S3 static .html        plain HTML, one permanent URL per page, SEO-friendly.
                       IMMUTABLE in practice -- see "why" below.
   + one shared .js    Dart-compiled front tier, immutable-cached. At runtime it
                       turns each page into an individual application.
   + API server        new component, backed by Postgres (t4g1 primary / t4g2 replica),
                       with S3 for bulk blobs and Valkey for caching.
```

**All frontend change lands in the `.js` and the data — never in the S3 HTML objects.**

## Why the HTML must stay immutable

**Re-uploading millions of S3 objects is expensive**, in time and risk more than dollars.
neochart alone is >750k objects and over 5M case pages; a full re-render-and-reupload is hours of
pipeline behind a single deploy lock, plus a CloudFront invalidation. So we do not ship frontend
changes by rewriting S3 HTML. Adding a cross-reference section to a page does **not** touch that
page's object.

This is also why payload size stopped being the deciding factor for
[the Dart choice](frontend-stack-dart.md): there is exactly one cached `.js` for millions of pages.

## The pattern is already in production on neochart — and it proves the design

neochart's live client already does exactly this. `docroot/cited_by.js` and `docroot/search.js`
fetch from an API Gateway endpoint at runtime and inject results into pages whose HTML is never
rewritten:

```js
API_BASE = "https://lsyl9dwkgj.execute-api.us-east-1.amazonaws.com"
url = `${API_BASE}/?mode=cited_by&id=${encodeURIComponent(cite)}&limit=50`
```

So "add cross-reference data without changing the S3 page" is not speculative; it is deployed.
What changes under this decision is the language of the front tier (Dart) and the backing store
(Postgres instead of the current Lambda's source).

## Two live defects found while probing it (2026-11-22)

Measured against the live endpoint:

```
?mode=cited_by&id=us/384/436&limit=3   -> 200 in 0.22s, {"count": 0, "results": []}
?mode=cited_by&id=us/541/1001&limit=3  -> 200,            {"count": 0, "results": []}
?mode=citation&q=miranda               -> 500 after 3.6s, Internal Server Error
?mode=citation&q=brown                 -> 500 after 3.5s
?mode=citation&q=roe                   -> 500 after 3.3s
```

1. **`mode=citation` is systematically broken** — every query 500s after ~3.5 s.
2. **`mode=cited_by` answers 200 with `count: 0` for everything**, including `us/384/436`
   (Miranda v. Arizona), which should have thousands of citers.

Meanwhile the citation data **does exist**, rebuilt the same day:

```
docroot/case_citations.json     2,098.7 MB   4,906,703 entries
docroot/statute_cited_by.json      80.4 MB
```

Two observations about that file, neither yet confirmed as the live cause — the Lambda reads its
own store, not this build intermediate (`deploy_changed.sh` says these are "big build
intermediates ... NOT served live"), so I have not established which layer drops the data:

- **Key format differs from the query.** `/us/384/436` is a key; `us/384/436` — what the client
  sends — is not. `/us/541/1001` is absent entirely.
- **The shape is forward citations, not reverse.** Values are
  `{cites_cases, cites_statutes, date, name, url}`, i.e. what a case cites. `cited_by` needs the
  inverse index.

**This is the strongest argument for the Postgres API tier:** a 2.1 GB JSON file is not a query
substrate. Cross-references at 4.9M entries belong in an indexed relational store answering
`cited_by` directly, which is precisely the component this architecture adds.

## Where it goes next (operator, 2026-11-22)

Future evolution is to **integrate MPA pages with lmctl.ai**, so a user reading a page can ask an
AI question *in the context that page presents*. The MPA page becomes both a document and an entry
point into the assistant, with the page's own data as the context. Design implication to keep in
view now: the API that serves a page's data should be able to describe that page's context to
lmctl.ai, not only render it.
