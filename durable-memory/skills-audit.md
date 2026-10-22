# Skills audit — 2026-10-19

## Added workflow skill: publish a tool docs book — 2026-10-21

The HTML-only page skills/publish-tool-book-skill.html is now in the coordination group in scripts/tools/skills.lms and generated in skills/index.html. Its first-line summary begins with Use when and its body covers release/tag/schema prerequisites, examples, per-tool book data, shared book and autorun generators, the curated autorun and hello catalogs, scratch checks, real provider runs, desktop/mobile review, live verification and the feedback loop. Plain-text checks passed; the source page uses no strong/em or inline code.

Dogfood used public lmctl-ai/lmcad at commit 3ec7c9626561a8393821c4d1643c5a2333223b4a. The released lmcad 0.1.3 binary passed --version and --dsl-schema --json byte comparison with schema/lmcad.dsl.json. An isolated LMSCRIPT_TOOL_CACHE installed the release and rendered a 640 by 480 still-life preview. The website scratch tree generated the example page and solo/trio scripts; the shared decorator and full tools checker passed after the scratch root included homepage/index.html, skills and lmscript-site.

The first real solo session ran through Claude and produced a checked mounting-plate source, PNG and STL. The trio passed through Claude Lead, agy Coder (gemini-3.8-flash-high), then codex Reviewer (gpt-6.1-sol) via the Lead. Reviewer PASS: independently compiled byte-identical DSLB, reran lmcad successfully, verified PNG/STL byte identity, two open holes, 3,076 STL triangles and 60×30×7 mm bounds; volume check used 10010.147543844094 mm³ with 0.001 mm³ tolerance and all six plate bounds. The lmcad guide says --schema, while the release says --dsl-schema. Its repository also has no examples README or checked-in preview, so the per-tool examples list and generated render fields were used. The example link returns 404 until the book is published. The lmcad book remains a scratch dry run and is not published. Additional friction and proposed fixes are recorded in durable-memory/tool-book-feedback/lmcad.md.

## Operator correction: HTML is the only skill format

This section supersedes the historical dual-format migration notes below; their audit results and comparison evidence are retained, not current build instructions. All 23 generated skills/\*.md copies were deleted. Skills are authored and served only as HTML; build/check no longer call a Markdown exporter or compare formats. The grouped HTML index and audited content/invariants remain. The command checker uses the checked-in 22-subcommand vocabulary refreshed from lmctl --help by python3 scripts/tools/update-lmctl-subcommands.py, including commands with optional arguments.

skills-moved/ contains 24 literal, hand-written one-paragraph notices (23 old URLs plus the Lead alias), served as text/plain for one release cycle. They say only “Moved to https://lmctl.com/skills/\<name\>.html. This stub will be removed.” They are not generated from HTML and contain no skill content. /skills/lmctl-lead.html is deployed as a text/html copy of lmctl-lead-skill.html. No deploy was run.

### Mono consumer review (source at 40660363)

Tracked sources, scripts, tests, docs and example teamfiles were searched for lmctl.com/skills, .md skill URLs, skillUrl/skill_url and catalog resolution. No runtime code or test was found fetching a /skills/\*.md website URL. The following potentially confusing references remain unchanged for Lead review:

| File:line | Finding and disposition |
| --- | --- |
| lmctl-src/tests/cli/teamfile-compat.test.ts:901 | Example .md URL; lines 902–903 add a local path and another example URL. Test asserts legacy \_SKILL\_ directives are ignored, not downloaded. |
| lmctl-src/tests/cli/teamfile-compat.test.ts:920 | Mock .md URL; line 930 explicitly asserts fetch was not called. Kept unchanged. |
| lmctl-src/tests/providers/passive-session-reader.test.ts:1345 | Recorded webfetch fixture uses /skills/x?q=1, with no .md; line 1358 checks normalized metadata. It does not fetch the website. |
| lmctl-src/src/uri/lmctl_uri.ts:116 | Runtime resolves local templates/skills/\<name\>/SKILL.md; line 128 uses the same cache filename, line 136 describes freeform Markdown. Separate template subsystem; unchanged. |
| lmctl-src/src/uri/lmctl_uri.ts:164 | Runtime constructs extensionless /templates/skill/\<name\> and fetches at line 167, not /skills/\*.md. No runtime change made. |

Mono documentation URLs updated in commit 40660363: lmctl-src/README.md:5, lmscript/README.md:196, lmbee/durable-memory/sample-teams.md:25, the documentation comment in lmbee/examples/template.lmctl:2, and the index/review-log files under lmmail, lmnote, lmsheet durable-memory. Historical publication entries now distinguish their old smoke checks from the new HTML links. No runtime or test file was edited. Website docs/manuals/lmprobe.md:27 now links to HTML. No active website HTML links target the transitional notices; original URLs remain only in historical audit evidence, compatibility documentation, stubs and deliberate negative fixtures.

### Correction validation

Skills: 28 self-tests, including unknown command/second-line command, HTML-only links, stale/missing HTML indexes, idempotence and rejection of .md skill files. The existing HTML/audit/coordination checks remain. Tools checks and their 43 named fixtures plus lifecycle suite are rerun. Live-service verification limits from the audit remain unchanged. Tool-page guidance is in tools-docs.md.

## Historical audit and initial migration

Step 0 completed before HTML migration. The checkout contains 23 Markdown skill files, not 24; skills/index.html is the 24th page. No skill was silently omitted. Original files were inventoried before correction. Existing URLs remain, including retired pointer pages.

The installed lmctl/lmscript release was 0.2.347. We ran lmctl top-level help and all 21 listed subcommand helps; no provider turns, mail sends, service writes or deploys were run. The standalone LMScript minimal workflow passes lmctl script --check; last_line_as_status IS a built-in (an initial suspicion was disproved). Executed ternary/f-string examples printed yes and value 1. Published lmprobe 0.42.2 and lmfin 0.1.0 were installed under temporary prefixes for read-only help checks.

Sources were read in the local mono checkout, a shallow clone of public lmctl-ai/lmprobe, and authorized source checkouts for lmsound/lmfin/lmbio/lmfeedback. Initial searches in local mono/poc/utility roots and the public organization did not find those four; authorized source discovery succeeded. Public-safe evidence below names files without exposing credentials, account identifiers or private deployment URLs. Hosted endpoint reachability/permissions and billing behavior are unverifiable from this source audit and explicitly marked in the affected skills. Example paths, ids, payloads and API Gateway URLs are placeholders, not promises that those resources exist.

## Per-file verdict and correction

| File | Verdict | Evidence: command run or source file | Fix applied |
| --- | --- | --- | --- |
| background-wakeup.md | stale | lmctl --help; mono lmctl-src/src/cli/index.ts; no corresponding current command surface | Retired removed workflow; preserve URL as short pointer and exclude from active index. |
| claudecode-lead-skill.md | stale | lmctl --help; lmctl prompt/status/tail/seed/lint --help; mono lmctl-src/src/cli/chat-exec.ts, chat.ts, seed.ts | Rewrote around blocking prompt, busy retry, read-only inspection and explicit onboarding. Removed obsolete commands, transport concepts, unverified harness guarantees and timeout flags. |
| communicating-with-mail-skill.md | stale | lmctl --help; mono lmctl-src/src/cli/index.ts; no corresponding current command surface | Retired removed workflow; preserve URL as short pointer and exclude from active index. |
| durable-memory.md | partly | mono lmctl-src/src/cli/seed.ts; current seed help | Kept committed knowledge guidance; removed automatic reading, universal ignore rules and obsolete communications linkage. |
| lmbio-skill.md | current | available lmbio src/main.rs, src/commands/, golden/, skills/lmbio-skill.md | Existing commands/flags retained; upstream differences are additive. Verified against Rust clap declarations and fixture paths, not a costly source build or biomedical network requests. |
| lmchat-skill.md | partly | mono lmchat/README.md, cloud/src/cli/lmchat.ts, cloud/src/handlers/{room-api,file-api}.ts; appkey source | Retained HTTP examples and backlog convention. Clarified deployment availability and authorization are not verified. |
| lmctl-admin-skill.md | stale | lmctl --help; mono lmctl-src/src/cli/index.ts; no corresponding current command surface | Retired removed workflow; preserve URL as short pointer and exclude from active index. |
| lmctl-lead-skill.md | stale | lmctl --help; lmctl prompt/status/tail/seed/lint --help; mono lmctl-src/src/cli/chat-exec.ts, chat.ts, seed.ts | Rewrote around blocking prompt, busy retry, read-only inspection and explicit onboarding. Removed obsolete commands, transport concepts, unverified harness guarantees and timeout flags. |
| lmctl-meta-lead-skill.md | stale | lmctl --help; lmctl prompt/status/tail/seed/lint --help; mono lmctl-src/src/cli/chat-exec.ts, chat.ts, seed.ts | Rewrote around blocking prompt, busy retry, read-only inspection and explicit onboarding. Removed obsolete commands, transport concepts, unverified harness guarantees and timeout flags. |
| lmctl-recover-skill.md | stale | lmctl --help; mono lmctl-src/src/cli/index.ts; no corresponding current command surface | Retired removed workflow; preserve URL as short pointer and exclude from active index. |
| lmctl-team-lead-advanced-skill.md | stale | lmctl --help; lmctl prompt/status/tail/seed/lint --help; mono lmctl-src/src/cli/chat-exec.ts, chat.ts, seed.ts | Rewrote around blocking prompt, busy retry, read-only inspection and explicit onboarding. Removed obsolete commands, transport concepts, unverified harness guarantees and timeout flags. |
| lmctl-team-lead-basic-skill.md | stale | lmctl --help; lmctl prompt/status/tail/seed/lint --help; mono lmctl-src/src/cli/chat-exec.ts, chat.ts, seed.ts | Rewrote around blocking prompt, busy retry, read-only inspection and explicit onboarding. Removed obsolete commands, transport concepts, unverified harness guarantees and timeout flags. |
| lmfeedback-skill.md | partly | available lmfeedback README, cloud/src/cli/lmfeedback.ts, handlers, source skill byte comparison | Retained matching API and CLI contract; live availability unverified. Generated Markdown supersedes old upstream byte-parity invariant. |
| lmfin-skill.md | stale | available lmfin src/main.rs, src/compute/, schemas/; npm registry and published 0.1.0 CLI --version/--help plus 16 subcommand helps and 10 offline calculator examples | Replaced false private-only installation claim with published npm package; selected --source sec/fred explicitly for examples promising those sources. Corrected the negative scalar option spelling to --pmt=-100 after a real CLI refusal. |
| lmmail-skill.md | stale | mono lmmail/README.md, cloud/src/cli/lmmail.ts, cloud/src/handlers/{mailbox-api,message-api}.ts | Removed unsupported delete-mailbox/DELETE mailbox and wait_s; corrected integration-test setup to source contract. |
| lmnote-skill.md | partly | mono lmnote/README.md, cloud/src/cli/lmnote.ts, handlers and validation | Replaced machine-specific deployment URL with placeholder; retained API/CLI examples; marked live access unverified. |
| lmprobe-skill.md | partly | public lmprobe README and durable-memory/commands/; published lmprobe 0.42.2 --help, grep/query/search help; 15 local recipes executed | Source is public; corrected CLI exit_status wording. Recipes retain legacy --format json surface; published search rejects --body, so the outline example uses --outline. |
| lmscript-workflow-skill.md | partly | lmctl script --check /tmp/skills-audit-minimal.lms (pass); lmscript --help; executed ternary and f-string; mono lmscript/durable-memory/lmscript_language_reference.md | Kept runnable example and helper (built-in); corrected ternaries, f-strings, source imports and init description; removed unverifiable incident anecdotes. |
| lmsheet-skill.md | partly | mono lmsheet/README.md, cloud/src/cli/lmsheet.ts, handlers and validation | Replaced deployment URL with placeholder; retained A1/API/CLI contract; marked live access unverified. |
| lmsound-skill.md | partly | available lmsound source: cloud/src/handlers/index.ts, infra/terraform/s3.tf, docs/lmsound-skill.md | Fixed TTL contradiction (300 default, configurable to 3600); removed unconditional access/billing guarantees; hosted service untested. |
| lmtext-skill.md | partly | mono lmtext/README.md, cloud/src/cli/lmtext.ts, cloud/src/handlers/{transcription-api,validation}.ts | Retained source-backed upload/finalize/poll/delete behavior; removed completion-time promise and blanket authorization claim. |
| opencode-lead-skill.md | stale | lmctl --help; lmctl prompt/status/tail/seed/lint --help; mono lmctl-src/src/cli/chat-exec.ts, chat.ts, seed.ts | Rewrote around blocking prompt, busy retry, read-only inspection and explicit onboarding. Removed obsolete commands, transport concepts, unverified harness guarantees and timeout flags. |
| team-lead-workflow.md | stale | lmctl --help; lmctl prompt/status/tail/seed/lint --help; mono lmctl-src/src/cli/chat-exec.ts, chat.ts, seed.ts | Rewrote around blocking prompt, busy retry, read-only inspection and explicit onboarding. Removed obsolete commands, transport concepts, unverified harness guarantees and timeout flags. |

## Claim inventory and disposition

skills-audit-inventory.json records every original nonblank line containing command/flag, code span, path, URL or version material, with original line numbers and the per-file evidence/disposition above. Code fences and examples are included; placeholder arguments are not executed. Claims were checked against CLI help, source argument parsers, handler routes/validation, fixture paths and source manuals. Non-command prose was reviewed for behavior promises (notably automatic onboarding, billing ceilings, refresh, timing and provider-specific notification behavior). Source verification establishes a contract, not live service availability.

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

Final source checks also corrected explicit-exit cleanup (language reference resource ownership section), lmtext CLI installation (cloud/package.json bin mapping), and replaced an unexecutable audio-download pseudo-command with an explicit response-variable example. Provider first-turn permissive-mode folklore was removed as unverifiable.

## Migration comparison and executable evidence

All 23 corrected skills round-trip through HTML and generated Markdown with matching parsed content trees. The comparison used the one-time marked 15 bootstrap on corrected input and regenerated output, checking element structure, text, inline emphasis/code, tables, lists and link targets. It normalized whitespace, syntax-highlighting classes, heading IDs and the documented .html/.md mapping. Code contents match after normalizing the single fence-ending newline. Three files (lmchat, lmsound, lmtext) change tight list paragraphs to loose Markdown paragraphs; that spacing difference is intentional. Escaping literal punctuation, longer fences, blank-line spelling, table alignment presentation and removal of fence language classes do not change command text or table contents. No corrected code block, table or link was dropped. The original index's group names/order are preserved; entry titles/summaries now come from the corrected pages, so obsolete descriptions are not copied forward. Four retired entries remain reachable at both old raw URLs and new HTML URLs but are excluded from the active catalog.

The one-time Markdown bootstrap used a temporary installation of marked, not a repository dependency or build-time Node converter. Runtime generation and checking are LMScript DSL programs executed by lmhtml. HTML is authoritative. Generated Markdown changes link attributes from /skills/\<stem\>.html to .md (retaining fragments), never code text. Old raw paths and the deployment-only Lead alias remain.

Additional execution checks ran 15 lmprobe recipes on a tiny local TypeScript tree (including both GraphQL examples), and 10 lmfin offline calculators. No-match exit 1 is expected for absent fixture patterns. Two actual parser refusals were fixed: search --body → search --outline, and --pmt -100 → --pmt=-100. All corrected examples then returned expected statuses. The inventory includes their commands and exit codes. All 12 literal lmbio golden fixture paths were checked on disk. No paid API calls, provider turns, network finance data queries or deployment were performed.

The lmprobe skill links to its full manual; the manual's source now links back to the HTML skill. New /tools/ skills remain separate; the two catalogs link to each other. Hosted-service reachability, account permissions and particular provider harness notification behavior remain unverified; corresponding promises were removed or explicitly qualified. No source was missing for the four requested legacy tools.

## Source revisions

| Source checkout | Commit inspected |
| --- | --- |
| lmctl mono | b2c79880330c30f62305b40ffd1840e2a8a6b854 |
| lmprobe audit source | 8a01c4eaa8c18d3094b10adb583f4780fc5d328e |
| lmsound source | 388997d6b0fd87b485a20fb082de48d89c004ca9 |
| lmfin source | 9a2dd497abcc36b8db84231ddf6e5b09d4e8ee72 |
| lmbio source | fa3e64d7677d2816c97040fa30cfc9672e82cbcc |
| lmfeedback source | c410bae58e1b381d4b8f65b53c11178e772232d8 |

The lmprobe source revision includes the reciprocal manual link; command implementation was unchanged by that docs-only commit.

## Validation and publication boundary

The skills self-test passes 24 checks; tools pass their 43 named bad fixtures plus authoring/index lifecycle tests. All current pages pass their check commands, and a second skills build changes zero bytes. Local HTTP reads of /skills/, the Lead, lmprobe and lmbio pages confirm one h1/main/nav/footer, no inline style/base/script, and absolute links. The Lead's visual review is still required; no deploy was run. The parallel tools-docs.md guide was absent, so legacy integration guidance is in tools/README.md and durable-memory/skills-docs.md, ready to link after it lands.

## Machine-readable inventory

[skills-audit-inventory.json](<skills-audit-inventory.json>) remains JSON because it is structured audit data for tooling, not a prose memory note.

## Plain-text round: section and claim audit

Compared every one of the 23 skill bodies with git show 1fe5971:skills/NAME.md using scripts/tools/audit-skill-sections.py and the native Markdown parser. skills-section-audit.json records every original/current heading, every removed or renamed section, body word counts, byte counts and the per-file disposition. Token estimates are bytes divided by four, not tokenizer measurements. Index is generated, not a 24th authored skill.

Re-ran installed lmctl prompt --help and lmctl seed --help. The seed help explicitly documents missing/placeholder session ids; lmctl-src/src/cli/index.ts lists current commands and session replacement instructions. The current prompt help has no idle-timeout option. Restoring the historical bare-15-is-15ms instruction would be false; it remains omitted. The local logind.conf(5) manual verifies KillUserProcesses and the user-manager linger qualification; the systemd-run example is advisory, not executed. No provider turn or hosted service write was performed.

| File | Removed-section justification or restoration |
| --- | --- |
| background-wakeup.html | Retired: removed wake/serve workflow. Pointer remains; no current command is claimed. |
| claudecode-lead-skill.html | Replaced removed queue/mail sections with blocking prompt and busy retry. Background execution is conditional on the harness. Absolute team paths and evidence-first inspection remain valid; restored below where needed. |
| communicating-with-mail-skill.html | Retired: removed lmctl mail and delivery workflow. The separate lmmail utility is not removed. |
| durable-memory.html | Reorganized around Markdown notes and generated index. Removed obsolete inbox linkage, automatic onboarding and universal git-ignore policy; retained persistence boundaries, explicit reading and committed canonical state. |
| lmbio-skill.html | All original headings retained. Commands/API examples and warnings remain, with deployment/permission limits from the source audit. Inline typography and placeholder spelling changed without removing instructions. |
| lmchat-skill.html | All original headings retained. Commands/API examples and warnings remain, with deployment/permission limits from the source audit. Inline typography and placeholder spelling changed without removing instructions. Own a room keeps every backlog/ownership/delete warning as plain prose; no inline code or emphasis remains. |
| lmctl-admin-skill.html | Retired: health and delivery administration commands no longer exist in current help. |
| lmctl-lead-skill.html | Restored agent-addressed opening, canonical-memory rule, Work loop, Recovery and basic/advanced links. Essential commands and Details are retained under Delegate and inspect and Related guidance. Restored systemd warning with linger qualification. Current prompt help has no idle-timeout flag: old 15ms gotcha is historical and is deliberately not shipped as an instruction. |
| lmctl-meta-lead-skill.html | Replaced health with status, removed refresh/serve and queue-dependent claims. Fleet survey, concrete delegation, evidence-first diagnosis and deliberate session replacement survive. Warm-up is explicit rather than promised automatic onboarding. |
| lmctl-recover-skill.html | Retired: restore and restore-teamfile commands no longer exist. No claim of replaying shell edits remains. |
| lmctl-team-lead-advanced-skill.html | Replaced refresh/health with status and deliberate session-field replacement plus seed. Removed queue/busy override assumptions. Recovery, model selection, cross-team targeting and explicit reading instructions remain. |
| lmctl-team-lead-basic-skill.html | Merged duplicate command and work-loop sections into current prompt/status/tail guidance. Removed queued delegation and hire/connect/chat/health. Kept concrete task, blocking reply, independent review and durable-memory practices. |
| lmfeedback-skill.html | All original headings retained. Commands/API examples and warnings remain, with deployment/permission limits from the source audit. Inline typography and placeholder spelling changed without removing instructions. |
| lmfin-skill.html | Replaced machine-local install paths with verified installation guidance. API sections retained. |
| lmmail-skill.html | All original headings retained. Commands/API examples and warnings remain, with deployment/permission limits from the source audit. Inline typography and placeholder spelling changed without removing instructions. Word-count reduction comes from formatting and removal of unverified deployment assumptions; owner authorization, send/finalize, read state, deletion, limits and integration-test caveats remain. |
| lmnote-skill.html | All original headings retained. Commands/API examples and warnings remain, with deployment/permission limits from the source audit. Inline typography and placeholder spelling changed without removing instructions. |
| lmprobe-skill.html | All original headings retained. Commands/API examples and warnings remain, with deployment/permission limits from the source audit. Inline typography and placeholder spelling changed without removing instructions. |
| lmscript-workflow-skill.html | Restored Why a workflow, not a skill or a spec, design/approval boundaries, disagreement attribution and final evidence. Removed unverifiable anecdotes/shared-library promises and universal claims about all skills or approval policies. Remaining sections and executable example retained; prior source audit verified script syntax. |
| lmsheet-skill.html | All original headings retained. Commands/API examples and warnings remain, with deployment/permission limits from the source audit. Inline typography and placeholder spelling changed without removing instructions. |
| lmsound-skill.html | All original headings retained. Commands/API examples and warnings remain, with deployment/permission limits from the source audit. Inline typography and placeholder spelling changed without removing instructions. |
| lmtext-skill.html | All original headings retained. Commands/API examples and warnings remain, with deployment/permission limits from the source audit. Inline typography and placeholder spelling changed without removing instructions. |
| opencode-lead-skill.html | Removed unverified harness-specific background/notification APIs and a historical open question. Current guidance is conditional on actual harness capabilities, with prompt/status/tail and explicit onboarding. |
| team-lead-workflow.html | Combined delegation and review into a current short checklist; prompt blocks, busy retry and author/reviewer separation retained. |
