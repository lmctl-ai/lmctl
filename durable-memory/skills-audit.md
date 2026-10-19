# Skills audit — 2026-10-19

Step 0 completed before HTML migration. The checkout contains **23 Markdown skill files**, not 24; `skills/index.html` is the 24th page. No skill was silently omitted. Original files were inventoried before correction. Existing URLs remain, including retired pointer pages.

The installed lmctl/lmscript release was 0.2.347. We ran lmctl top-level help and all 21 listed subcommand helps; no provider turns, mail sends, service writes or deploys were run. The standalone LMScript minimal workflow passes `lmctl script --check`; `last_line_as_status` IS a built-in (an initial suspicion was disproved). Executed ternary/f-string examples printed `yes` and `value 1`. Published lmprobe 0.42.2 and lmfin 0.1.0 were installed under temporary prefixes for read-only help checks.

Sources were read in the local mono checkout, a shallow clone of public `lmctl-ai/lmprobe`, and authorized source checkouts for lmsound/lmfin/lmbio/lmfeedback. Initial searches in local mono/poc/utility roots and the public organization did not find those four; authorized source discovery succeeded. Public-safe evidence below names files without exposing credentials, account identifiers or private deployment URLs. Hosted endpoint reachability/permissions and billing behavior are **unverifiable from this source audit** and explicitly marked in the affected skills. Example paths, ids, payloads and API Gateway URLs are placeholders, not promises that those resources exist.

## Per-file verdict and correction

| File | Verdict | Evidence: command run or source file | Fix applied |
| --- | --- | --- | --- |
| `background-wakeup.md` | stale | `lmctl --help`; mono `lmctl-src/src/cli/index.ts`; no corresponding current command surface | Retired removed workflow; preserve URL as short pointer and exclude from active index. |
| `claudecode-lead-skill.md` | stale | `lmctl --help`; `lmctl prompt/status/tail/seed/lint --help`; mono `lmctl-src/src/cli/chat-exec.ts`, `chat.ts`, `seed.ts` | Rewrote around blocking prompt, busy retry, read-only inspection and explicit onboarding. Removed obsolete commands, transport concepts, unverified harness guarantees and timeout flags. |
| `communicating-with-mail-skill.md` | stale | `lmctl --help`; mono `lmctl-src/src/cli/index.ts`; no corresponding current command surface | Retired removed workflow; preserve URL as short pointer and exclude from active index. |
| `durable-memory.md` | partly | mono `lmctl-src/src/cli/seed.ts`; current seed help | Kept committed knowledge guidance; removed automatic reading, universal ignore rules and obsolete communications linkage. |
| `lmbio-skill.md` | current | available lmbio `src/main.rs`, `src/commands/`, `golden/`, `skills/lmbio-skill.md` | Existing commands/flags retained; upstream differences are additive. Verified against Rust clap declarations and fixture paths, not a costly source build or biomedical network requests. |
| `lmchat-skill.md` | partly | mono `lmchat/README.md`, `cloud/src/cli/lmchat.ts`, `cloud/src/handlers/{room-api,file-api}.ts`; `appkey` source | Retained HTTP examples and backlog convention. Clarified deployment availability and authorization are not verified. |
| `lmctl-admin-skill.md` | stale | `lmctl --help`; mono `lmctl-src/src/cli/index.ts`; no corresponding current command surface | Retired removed workflow; preserve URL as short pointer and exclude from active index. |
| `lmctl-lead-skill.md` | stale | `lmctl --help`; `lmctl prompt/status/tail/seed/lint --help`; mono `lmctl-src/src/cli/chat-exec.ts`, `chat.ts`, `seed.ts` | Rewrote around blocking prompt, busy retry, read-only inspection and explicit onboarding. Removed obsolete commands, transport concepts, unverified harness guarantees and timeout flags. |
| `lmctl-meta-lead-skill.md` | stale | `lmctl --help`; `lmctl prompt/status/tail/seed/lint --help`; mono `lmctl-src/src/cli/chat-exec.ts`, `chat.ts`, `seed.ts` | Rewrote around blocking prompt, busy retry, read-only inspection and explicit onboarding. Removed obsolete commands, transport concepts, unverified harness guarantees and timeout flags. |
| `lmctl-recover-skill.md` | stale | `lmctl --help`; mono `lmctl-src/src/cli/index.ts`; no corresponding current command surface | Retired removed workflow; preserve URL as short pointer and exclude from active index. |
| `lmctl-team-lead-advanced-skill.md` | stale | `lmctl --help`; `lmctl prompt/status/tail/seed/lint --help`; mono `lmctl-src/src/cli/chat-exec.ts`, `chat.ts`, `seed.ts` | Rewrote around blocking prompt, busy retry, read-only inspection and explicit onboarding. Removed obsolete commands, transport concepts, unverified harness guarantees and timeout flags. |
| `lmctl-team-lead-basic-skill.md` | stale | `lmctl --help`; `lmctl prompt/status/tail/seed/lint --help`; mono `lmctl-src/src/cli/chat-exec.ts`, `chat.ts`, `seed.ts` | Rewrote around blocking prompt, busy retry, read-only inspection and explicit onboarding. Removed obsolete commands, transport concepts, unverified harness guarantees and timeout flags. |
| `lmfeedback-skill.md` | partly | available lmfeedback README, `cloud/src/cli/lmfeedback.ts`, handlers, source skill byte comparison | Retained matching API and CLI contract; live availability unverified. Generated Markdown supersedes old upstream byte-parity invariant. |
| `lmfin-skill.md` | stale | available lmfin `src/main.rs`, `src/compute/`, `schemas/`; npm registry and published 0.1.0 CLI --version/--help plus 16 subcommand helps and 10 offline calculator examples | Replaced false private-only installation claim with published npm package; selected --source sec/fred explicitly for examples promising those sources. Corrected the negative scalar option spelling to --pmt=-100 after a real CLI refusal. |
| `lmmail-skill.md` | stale | mono `lmmail/README.md`, `cloud/src/cli/lmmail.ts`, `cloud/src/handlers/{mailbox-api,message-api}.ts` | Removed unsupported delete-mailbox/DELETE mailbox and wait_s; corrected integration-test setup to source contract. |
| `lmnote-skill.md` | partly | mono `lmnote/README.md`, `cloud/src/cli/lmnote.ts`, handlers and validation | Replaced machine-specific deployment URL with placeholder; retained API/CLI examples; marked live access unverified. |
| `lmprobe-skill.md` | partly | public lmprobe README and `durable-memory/commands/`; published `lmprobe 0.42.2 --help`, grep/query/search help; 15 local recipes executed | Source is public; corrected CLI exit_status wording. Recipes retain legacy --format json surface; published search rejects --body, so the outline example uses --outline. |
| `lmscript-workflow-skill.md` | partly | `lmctl script --check /tmp/skills-audit-minimal.lms` (pass); `lmscript --help`; executed ternary and f-string; mono `lmscript/durable-memory/lmscript_language_reference.md` | Kept runnable example and helper (built-in); corrected ternaries, f-strings, source imports and init description; removed unverifiable incident anecdotes. |
| `lmsheet-skill.md` | partly | mono `lmsheet/README.md`, `cloud/src/cli/lmsheet.ts`, handlers and validation | Replaced deployment URL with placeholder; retained A1/API/CLI contract; marked live access unverified. |
| `lmsound-skill.md` | partly | available lmsound source: `cloud/src/handlers/index.ts`, `infra/terraform/s3.tf`, `docs/lmsound-skill.md` | Fixed TTL contradiction (300 default, configurable to 3600); removed unconditional access/billing guarantees; hosted service untested. |
| `lmtext-skill.md` | partly | mono `lmtext/README.md`, `cloud/src/cli/lmtext.ts`, `cloud/src/handlers/{transcription-api,validation}.ts` | Retained source-backed upload/finalize/poll/delete behavior; removed completion-time promise and blanket authorization claim. |
| `opencode-lead-skill.md` | stale | `lmctl --help`; `lmctl prompt/status/tail/seed/lint --help`; mono `lmctl-src/src/cli/chat-exec.ts`, `chat.ts`, `seed.ts` | Rewrote around blocking prompt, busy retry, read-only inspection and explicit onboarding. Removed obsolete commands, transport concepts, unverified harness guarantees and timeout flags. |
| `team-lead-workflow.md` | stale | `lmctl --help`; `lmctl prompt/status/tail/seed/lint --help`; mono `lmctl-src/src/cli/chat-exec.ts`, `chat.ts`, `seed.ts` | Rewrote around blocking prompt, busy retry, read-only inspection and explicit onboarding. Removed obsolete commands, transport concepts, unverified harness guarantees and timeout flags. |

## Claim inventory and disposition

`skills-audit-inventory.json` records every original nonblank line containing command/flag, code span, path, URL or version material, with original line numbers and the per-file evidence/disposition above. Code fences and examples are included; placeholder arguments are not executed. Claims were checked against CLI help, source argument parsers, handler routes/validation, fixture paths and source manuals. Non-command prose was reviewed for behavior promises (notably automatic onboarding, billing ceilings, refresh, timing and provider-specific notification behavior). Source verification establishes a contract, not live service availability.

No live API credentials were used. lmbio was source-checked because compiling the Rust analytics dependencies was unnecessary for the CLI declaration/fixture audit. Claude Code/opencode notification semantics for particular harness versions could not be verified; those promises were removed in favor of conditional harness guidance. Historical recovery/admin/integration commands were removed rather than guessed at. Old snapshots remain in Git history.

## Non-trivial old → corrected differences

- Seven coordination skills now use synchronous prompt/status/tail and explicit durable-memory reading. Unsupported commands/configuration and repeated obsolete delivery descriptions are removed, not translated mechanically.
- Four removed-workflow pages become compatibility pointers and leave the active index.
- Durable memory no longer promises automatic reading or universal teamfile ignore rules.
- Workflow code blocks remain intact and static-check successfully; outdated language statements and unverifiable incident anecdotes are corrected/removed.
- lmmail no longer advertises unsupported mailbox deletion or wait_s. Its remaining raw HTTP/CLI examples match the available implementation.
- lmfin installation and explicitly selected data sources are corrected; lmprobe source visibility and JSON field naming are corrected.
- Deployment URLs become placeholders where not verifiable; utility authentication, timing, TTL and billing promises are narrowed to source-backed behavior.
- HTML migration must preserve every corrected code block, table and link. Markdown spelling/whitespace changes are harmless only after structural comparison; migration results are recorded below when completed.

Final source checks also corrected explicit-exit cleanup (language reference resource ownership section), lmtext CLI installation (`cloud/package.json` bin mapping), and replaced an unexecutable audio-download pseudo-command with an explicit response-variable example. Provider first-turn permissive-mode folklore was removed as unverifiable.

## Migration comparison and executable evidence

All **23 corrected skills** round-trip through HTML and generated Markdown with
matching parsed content trees. The comparison used the one-time `marked` 15
bootstrap on corrected input and regenerated output, checking element structure,
text, inline emphasis/code, tables, lists and link targets. It normalized whitespace,
syntax-highlighting classes, heading IDs and the documented `.html`/`.md` mapping.
Code contents match after normalizing the single fence-ending newline. Three files
(lmchat, lmsound, lmtext) change tight list paragraphs to loose Markdown paragraphs;
that spacing difference is intentional. Escaping literal punctuation, longer fences,
blank-line spelling, table alignment presentation and removal of fence language
classes do not change command text or table contents. No corrected code block,
table or link was dropped. The original index's group names/order are preserved;
entry titles/summaries now come from the corrected pages, so obsolete descriptions
are not copied forward. Four retired entries remain reachable at both old raw URLs
and new HTML URLs but are excluded from the active catalog.

The one-time Markdown bootstrap used a temporary installation of `marked`, not a
repository dependency or build-time Node converter. Runtime generation and checking
are LMScript DSL programs executed by lmhtml. HTML is authoritative. Generated
Markdown changes link attributes from `/skills/<stem>.html` to `.md` (retaining
fragments), never code text. Old raw paths and the deployment-only Lead alias remain.

Additional execution checks ran 15 lmprobe recipes on a tiny local TypeScript tree
(including both GraphQL examples), and 10 lmfin offline calculators. No-match exit 1
is expected for absent fixture patterns. Two actual parser refusals were fixed:
`search --body` → `search --outline`, and `--pmt -100` → `--pmt=-100`. All corrected
examples then returned expected statuses. The inventory includes their commands and
exit codes. All 12 literal lmbio golden fixture paths were checked on disk. No paid
API calls, provider turns, network finance data queries or deployment were performed.

The lmprobe skill links to its full manual; the manual's source now links back to
the HTML skill. New `/tools/` skills remain separate; the two catalogs link to each
other. Hosted-service reachability, account permissions and particular provider
harness notification behavior remain unverified; corresponding promises were removed
or explicitly qualified. No source was missing for the four requested legacy tools.

## Source revisions

| Source checkout | Commit inspected |
| --- | --- |
| lmctl mono | `b2c79880330c30f62305b40ffd1840e2a8a6b854` |
| lmprobe audit source | `8a01c4eaa8c18d3094b10adb583f4780fc5d328e` |
| lmsound source | `388997d6b0fd87b485a20fb082de48d89c004ca9` |
| lmfin source | `9a2dd497abcc36b8db84231ddf6e5b09d4e8ee72` |
| lmbio source | `fa3e64d7677d2816c97040fa30cfc9672e82cbcc` |
| lmfeedback source | `c410bae58e1b381d4b8f65b53c11178e772232d8` |

The lmprobe source revision includes the reciprocal manual link; command implementation was unchanged by that docs-only commit.
