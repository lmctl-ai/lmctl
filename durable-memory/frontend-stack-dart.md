# Frontend stack: Dart compiled to JS (decided 2026-11-22)

**Decision: Dart.** `dart compile js` + `package:web`, driving ordinary DOM on pages that are
already complete static HTML. **No framework.** No Flutter on the web. The browser receives `.js`
and nothing else.

**Scope: the frontend for all of our sites** — lmctl.com, egtry.com, grepcent.com, lmctl.ai.
One language, one hydration toolchain, SPA or MPA.

## Why (operator's reasoning, which overrode the measured byte advantage)

1. **Payload size is not decisive, because it is one shared cached asset.** Millions of pages load
   the *same* `.js`. An immutable-cached site-wide bundle makes a 16 KB difference per cold load a
   rounding error against the cost of maintaining the alternative.
2. **Dart was designed as a frontend language.** That is the whole point: the client is its design
   centre, not a compile target bolted on.
3. **`lmcode` is not a reason to pick Java.** JavaScript can replace lmcode; user JavaScript methods
   interoperate with Dart's emitted `.js`; **`lmcode-js` already exists**. An `lmcode-dart` SDK would
   be straightforward if ever wanted — there is no need for it now.
4. **It keeps the mobile path open.** A future mobile client for lmctl.ai would use Flutter, which
   is the same language. Choosing Dart now means that is a continuation, not a second stack.

## What was measured first, so nobody re-litigates it

Three independent evaluations (codex `gpt-6-astra`, claude `claude-fable-5-2`, agy
`gemini-4-carbon-high`), each building the same three hydration jobs in both toolchains. Full
record: `/home/mma/repos/frontend-eval/CONSOLIDATED.md` plus the three raw votes.

- The published demos suggested TeaVM was ~5x heavier (195.6 KB gzip vs 39.3 KB). **That was an
  artefact**: the TeaVM demos embed the 43-class `lmcode-java` bytecode VM; `lmdart` does not.
- On minimal programs the ranking **inverts**: TeaVM ~4.4 KB gzip for the base-URL job against
  Dart's ~14.7 KB, and 9.2 KB vs 26 KB for all three jobs. Dart's ~14 KB floor is `dart2js`'s RTI
  and interceptor runtime and is irreducible; `package:web` itself costs 0 bytes.
- **But TeaVM's size is a cliff, not a slope.** One `String.split` -> 40 KB gzip; `String.format`
  -> 61 KB; `java.time` -> 93 KB; ordinary JDK-flavoured Java -> 172 KB (which is where the demos
  sit). Dart's worst case across everything thrown at it is bounded near 36 KB, unpoliced.
- **`teavm-jso-apis` 0.16.0 is 195 classes and lacks the modern web**: no `navigator.clipboard`,
  no `fetch`, no `URL`/`URLSearchParams`, no `AbortController`, no Intersection/Resize/Mutation
  observers; `Element` has no `.closest()`, `.matches()`, `.dataset`. So real DOM work in TeaVM
  means raw JavaScript inside `@JSBody` string literals, type-checked by nothing — further from
  "a real language, not patching JS" than Dart is. `package:web` is generated 1:1 from WebIDL.
- TeaVM's JSON boundary is unsound: a `@JSProperty String getTitle()` overlay on an entry with no
  `title` compiled cleanly and threw in the browser.

## Working code kept from the evaluation

`frontend-dart/` in this repo — browser-tested over CDP, not just compiled:

```
lib/job1.dart   base-URL repair
lib/job2.dart   copy-to-clipboard on <code> (ARIA, focus retention, live region)
lib/job3.dart   cross-reference section appended after static content (empty + error states)
jobs/*.dart     entry points
test/server.mjs, test/cdp.mjs   headless-Chrome harness
test/sizes.mjs                  gzip/brotli byte measurement
```

**Caveat on job 1, carried over from the evaluation:** it uses `history.replaceState` to add the
trailing slash, which fixes *subsequent* relative resolution but not assets the browser already
requested. A base-URL repair cannot be done from a deferred bundle at all — by then the CSS and
images have 404ed. The real fix is a server-side canonical redirect or correct links in the markup;
that is how `/tools/` was fixed (the catalog now emits `/tools/<tool>/index.html`), and it is why
job 1 should not be treated as a hydration task.
