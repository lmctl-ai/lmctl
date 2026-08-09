---
name: lmctl-recover
description: Disaster recovery for a lost lmctl project — reconstruct a missing .lmctl teamfile from local event history, then replay a provider session's file writes/edits back onto disk.
---

# Skill: lmctl disaster recovery (`restore-teamfile` + `restore`)

Use this when a project directory, a `.lmctl` teamfile, or individual files got deleted, and you need to
get them back. Recovery works entirely from data lmctl already has on this machine — the provider's own
session transcript, and (optionally) lmctl's local event log. Nothing is fetched from a server and nothing
requires the original files to still exist anywhere.

There are two independent commands. Use one, the other, or both depending on what was actually lost.

| What you lost | Command | Depends on |
| --- | --- | --- |
| The `.lmctl` teamfile itself (renamed away, deleted, directory gone) | `lmctl restore-teamfile` | lmctl's local event history — **best-effort, optional** |
| The project's actual files (source, notes, whatever a member wrote) | `lmctl restore` | The provider's own session transcript — **this is the essential, load-bearing recovery path** |

If you lost both (the whole project directory, teamfile included), run `restore-teamfile` first to get a
teamfile back, then `restore` against the alias it reconstructs. If you only lost files but the teamfile is
still there, skip straight to `restore` — it does not need `restore-teamfile` at all.

**Order matters, not blocking.** `restore-teamfile` is a convenience layer over lmctl's own bookkeeping and
can come back empty on an older lmctl version, a machine with a rolled-off event log, or a member that was
declared but never actually used. `restore` never depends on that bookkeeping — it reads straight from the
provider's session file, so it works even when `restore-teamfile` finds nothing at all. If a teamfile
already exists (you just lost files, not the teamfile), you do not need `restore-teamfile`.

---

## `lmctl restore-teamfile` — reconstruct a missing teamfile

```
lmctl restore-teamfile <name-or-path> [--force] [--json]
```

- A bare name (e.g. `myproj`) matches against the recorded teamfile's basename. If more than one registered
  path shares that basename, the command refuses and lists every candidate path with its evidence counts —
  pass the exact path to disambiguate. It never guesses which one you meant.
- Reconstructs one `_MEMBER_` line per alias that has **actual recorded usage** (an invocation or a team
  chat message really happened against that alias, on that exact teamfile path). An alias that was declared
  in the original teamfile but never actually used leaves no trace anywhere and is silently **not**
  reconstructed — there is nothing left to recover it from, and the command will not invent one.
- Only the essential identity fields are restored: `alias`, `provider`, `model` (omitted when never
  recorded), `sessionid`. Anything else the original teamfile line may have carried (`sessiondir`, custom
  `key=value` extras, comments) is not reconstructed — `lmctl restore` does not need `sessiondir` either; it
  resolves the working directory straight from the session transcript, so this gap does not block file
  recovery.
- Refuses to overwrite an existing file unless `--force` is given — it will never silently clobber a
  teamfile that's actually there.
- Never runs automatically as a side effect of any other command (`lint`, `status`, `chat`, …). You always
  have to name the team and invoke it yourself.

Real output shape (`--json`):

```json
{
  "schema_version": 1,
  "action": "restored",
  "restored_path": "/path/to/team.lmctl",
  "overwrote_existing": false,
  "members_restored": 1,
  "bytes_written": 110,
  "latest_evidence_at": "2026-08-07T15:32:14.943Z",
  "evidence_age_ms": 34272,
  "evidence": {
    "source": "tracked_invocation",
    "corroboration": "team_chat_log",
    "tracked_invocation_count": 1,
    "team_chat_log_count": 1
  },
  "members": [
    {
      "alias": "Worker",
      "provider": "claude",
      "model": "claude-haiku-4-5",
      "sessionid": "562a2d86-daea-4b4f-8f3e-ff619776fbf0",
      "line": "_MEMBER_ alias=Worker provider=claude model=\"claude-haiku-4-5\" sessionid=562a2d86-daea-4b4f-8f3e-ff619776fbf0",
      "evidence": { "tracked_invocation_id": 5515, "started_at": "...", "team_chat_log_count": 1 }
    }
  ],
  "ignored_aliases": [],
  "staleness_note": "Best effort: local event history may be incomplete across lmctl versions; each emitted member uses its latest tracked invocation and unreconstructable aliases are omitted."
}
```

### Troubleshooting `restore-teamfile`

- **`error: ambiguous teamfile name "X"; specify one exact path: ...`** — two or more registered teamfiles
  share that basename in different directories. Re-run with the exact path shown for the one you want.
- **Zero members restored / command reports nothing to reconstruct** — no usage evidence exists locally for
  that path. This is not a bug to work around; it means either the team was truly never used, the local
  event history has rolled off, or you're on a version of lmctl that didn't record it yet. Fall back to
  whatever out-of-band information you have about the original members (the operator, a chat log, a
  README) and hand-author the `_MEMBER_` lines instead. `lmctl restore` only ever takes a
  `<teamfile> <alias>` (or `<teamfile>:<alias>`) pair, never a bare session id — so if you at least know the
  `sessionid`, hand-write a minimal `_MEMBER_` line carrying it (`provider=`, `sessionid=`, and `alias=`
  whatever you name it) into a teamfile yourself, then run `restore` against that alias.
- **A restored member is missing `model=`** — that means the evidence never recorded a model value (the
  member likely never had one set). This is not a bug; omit it or set it yourself if you know it.
- **You need a field this command doesn't restore** (`sessiondir`, custom extras) — add it by hand after
  restoring; those fields aren't recoverable from usage evidence and the command does not guess at them.

---

## `lmctl restore` — replay a session's file writes back onto disk

This is the command that actually gets your files back. It treats a provider's session transcript as a
transaction log: every write and edit the member made during that session, in order, with a real timestamp
per operation. It replays that log onto disk.

```
lmctl restore <teamfile> <alias> [--target <dir>] [--force] [--dry-run] [--json]
lmctl restore <teamfile>:<alias> [--target <dir>] [--force] [--dry-run] [--json]
```

### What gets replayed

Three sources feed one ordered recovery, in the session's own chronological order:

1. **Structured Write/Edit tool calls** — the provider's own file-editing tools. This is the strongest
   source; coverage is `"full"` for Claude, Kimi, OpenCode, and lmplayer.
2. **Shell commands that carry their own file content** — heredocs, `echo`/`printf` redirects (`>`, `>>`),
   pipes into `tee`, plus `rm`/`mv`/`cp`/`touch`. This is always `"best_effort"`: anything with a shell
   variable, command substitution (`$(...)`/backticks), a glob, or a form the scanner doesn't recognize is
   **never guessed** — it is reported as an explicit gap instead of being silently skipped or approximated.
3. **Codex `apply_patch` payloads** — `Add File`, `Delete File`, `Move to`, and `Update File` hunks all
   replay. Coverage is `"partial"` for Codex: the patch mechanism itself is fully handled, but Codex sessions
   can also carry other tool-call shapes this command doesn't parse.

These three sources are combined into a single, correct end state per file — an `Add File` patch followed by
several `Update File` hunks, or a structured `Write` followed by several `Edit` calls, produces the true
final content, not just the last operation seen in isolation.

**Files the session itself deleted are never resurrected**, and this command never deletes anything on disk
— it only writes files the session wrote.

**If a file was mutated in a way that can't be reconstructed** (a `sed -i`, a `python3 -c` one-liner that
rewrites the file, `awk -i inplace`, or any other command this scanner doesn't recognize as safely
reconstructable but that plausibly touched a file already in play) — that file is refused as
`unreplayable`, naming the responsible command, **rather than being written with stale pre-mutation
content and reported as a clean recovery.** This is the core safety guarantee of the whole command: a gap is
always reported honestly; wrong content is never served silently.

### The three placement/overwrite rules

- **Timestamps are preserved.** A recovered file's mtime is set to the session's own write timestamp for
  that file — not "now". Re-running `restore` twice on an untouched target is idempotent (the second run
  sees matching mtimes and skips everything).
- **Newer-wins.** A file missing on disk is always recovered. An existing file is only overwritten when the
  session's recorded write is strictly newer than the file's current disk mtime — equal timestamps count as
  "already there," not "needs overwrite," so recovery never clobbers real, current work by default.
- **`--force`** overwrites regardless of the newer-wins comparison.
- **`--dry-run`** reports the exact same per-file plan (`written` becomes `would_write`) without touching
  disk at all — always run this first when you're not sure what a recovery will do.
- **`--target <dir>`** re-roots recovered files under a different directory instead of the session's
  original working directory. Session paths that would resolve outside that directory are refused
  (`outside_target`) rather than written — including paths that only escape through a mid-path `..` segment
  (e.g. `a/../../outside/x`) or through a symlink inside the target that points elsewhere (`symlink_path`).
  Without `--target`, files are restored in place at their original absolute session paths with no
  containment check — use `--target` whenever you don't fully trust the session you're recovering from, or
  want to inspect the result before it lands in the real project location.

### Reading the output

```json
{
  "schema_version": 2,
  "provider": "claude",
  "sessionId": "...",
  "sessionCwd": "/original/working/dir",
  "target": null,
  "dryRun": false,
  "force": false,
  "coverage": {
    "toolCalls": "full",
    "structuredReplay": "full",
    "shellScan": "best_effort",
    "shellNote": "shell reconstruction is best-effort from command text; programmatic file writes (interpreters, unknown tools) are not detectable from transcripts"
  },
  "summary": {
    "files": 2, "written": 2, "wouldWrite": 0, "skipped": 0,
    "unreplayable": 0, "unreplayedCalls": 0, "warnings": 0
  },
  "files": [
    {
      "path": "/original/working/dir/todo.py",
      "sessionPath": "todo.py",
      "ops": 3,
      "sources": ["structured"],
      "action": "written",
      "reason": "missing_on_disk",
      "detail": null,
      "sessionMtime": "2026-08-07T15:32:35.596Z",
      "diskMtime": null
    }
  ],
  "unreplayedCalls": [],
  "warnings": []
}
```

**`coverage`** tells you, per session, how much of it this command could actually see — read this before
trusting a recovery as complete:
- `toolCalls`: how completely this provider's tool calls were parsed at all (shared with `lmctl session`).
- `structuredReplay`: whether this provider's own Write/Edit tools are fully understood —
  `"full"` (Claude, Kimi, OpenCode, lmplayer), `"partial"` (Codex, Agy), or `"none"` (Gemini, Copilot, Qwen —
  these providers' structured file tools aren't modeled here yet; only shell-command reconstruction applies).
- `shellScan`: `"best_effort"` for every provider with a shell tool at all (Claude, Kimi, OpenCode, lmplayer,
  Codex, Copilot, Qwen, Agy) — never `"full"`, by design; a shell scanner can never promise it caught
  everything a shell can do.

**Exit code is `1` whenever recovery is known-incomplete** (`unreplayable > 0`, `unreplayedCalls > 0`, or
`warnings > 0`) and `0` otherwise. Always check the exit code (or `summary` in `--json` mode) — do not assume
success just because the command didn't crash.

### Per-file `action`/`reason` reference — what to do about each one

| action | reason | Meaning | What to do |
| --- | --- | --- | --- |
| `written` / `would_write` | `missing_on_disk` | File didn't exist, recovered clean. | Nothing — this is the normal case. |
| `written` / `would_write` | `session_newer` | File existed but the session's write is newer; overwritten. | Check `diskMtime` vs `sessionMtime` if this is surprising. |
| `written` / `would_write` | `forced` | `--force` overwrote a file that would otherwise have been skipped. | Confirm this was intended — `--force` bypasses the newer-wins safety check. |
| `skipped` | `disk_newer_or_equal` | Disk file is already as new or newer than the session's write; left alone. | This is the safety rule working as intended. Use `--force` only if you're sure the session version should win. |
| `skipped` | `deleted_in_session` | The session itself deleted this file later on; not resurrected. | Nothing — this is correct behavior, not a gap. |
| `skipped` | `outside_target` | With `--target`, this session path would resolve outside the target directory. | Expected when recovering an untrusted/corrupted session into an isolated `--target`. If you expected this file, check the session path for `..` segments or an absolute-path mismatch. |
| `unreplayable` | `symlink_path` | The resolved write path passes through a symlink, or `--target` itself contains one. | Investigate the symlink before proceeding — this is a safety refusal, not a parsing failure. |
| `unreplayable` | `unresolvable_path` | Couldn't determine the session's working directory to resolve a relative path against. | Usually means a malformed or unusually old session transcript. |
| `unreplayable` | `edit_base_missing` | The session has edits for this file but no Write/content to found a base on (and nothing on disk to fall back to). | The file's true final content cannot be derived; you'll need the original by other means. |
| `unreplayable` | `edit_mismatch` | An edit's expected old content didn't match what the replay had built up — the edit couldn't be applied. | The session likely diverged from what actually happened on disk at the time; treat this file as unrecoverable via replay. |
| `unreplayable` | `not_reconstructable` | A shell command mutated this file in a way the scanner can't reconstruct (`sed -i`, a script rewrite, an unrecognized command touching a tracked file). | Check `detail` for the exact responsible command — that's your best lead for recovering the content some other way (shell history, a backup, memory of what the command did). |
| `unreplayable` | `patch_context_mismatch` | A Codex `apply_patch` hunk's surrounding context didn't match — the patch can't be safely applied. | The file likely diverged from what the patch expected; not safely recoverable via this patch. |
| `unreplayable` | `move_source_unknown` | A shell `mv`/`cp` carried this file in from a source path whose content the replay never tracked. | The destination's true content was never observed in this session; look for the source file's own history elsewhere, or accept it's not recoverable from this session alone. |

**`unreplayedCalls`** (a separate top-level list, not per-file) — tool calls the session-reading layer
recognized as file operations but that this command's replay logic didn't turn into a file result at all.
A non-empty list here means the recovery may be missing something beyond what the per-file table shows —
treat it the same as any other incompleteness signal.

**`warnings`** — non-fatal notices, e.g. a glob-based `rm` in the session (`rm -rf build/*`) that might have
deleted files this replay can't see and therefore can't correctly mark as `deleted_in_session`.

---

## Multi-agent teams: sweep every alias, don't stop at one

**Known limitation, real-world-tested.** A live recovery pilot on a real 8-member team (Lead + several
coders + advisors) recovered **0 files out of ~900 combined file-touching operations** when only one alias
was tried. Root cause: `restore` replays one alias's session at a time. In the standard Lead/Coder split, a
file is routinely created by one alias and edited by a different one in its own separate session — the
editing alias's session then has no base to apply that edit against (`edit_base_missing`), even though the
file's real history exists across the team. **Do not conclude a team's files are unrecoverable from one
alias's `0 recovered` result.** Run `restore --dry-run` against every alias in the team and look at each
one's plan — the alias that happens to hold the last full write of a given file is the one that can recover
it, and that isn't always the alias you'd guess (often the Lead, but not always). This is being actively
worked on as a real fix (session-stitching across a team's members); until it lands, sweeping every alias by
hand is the reliable path.

## `sed`/`awk -i`/interpreter edits are a permanent, easy-to-miss blind spot

If a member does real file editing via raw shell (`sed -i`, `awk -i inplace`, a `python3 -c` rewrite) instead
of the provider's own Edit tool, every one of those edits is **unreconstructable by design** — `restore`
correctly refuses rather than guessing, but it isn't obvious this happened until you inspect results
file-by-file. **If disaster recoverability matters to you, prefer the structured Edit tool over raw shell
text-editing commands** for anything you'd want back after a data-loss event. This is not a bug to report —
it's an inherent limit of transcript-based recovery — but it's worth planning around before you need it, not
after.

---

## End-to-end recovery checklist

1. Confirm what's actually missing: just files, just the teamfile, or both.
2. If the teamfile is gone: `lmctl restore-teamfile <name>`. If it reports nothing, you may still be able to
   proceed if you already know the provider/sessionid some other way — hand-author a minimal `_MEMBER_` line.
3. `lmctl restore <teamfile> <alias> --dry-run --json` — always look at the plan before writing anything.
   **For a multi-member team, do this for every alias, not just one** — see the warning above.
4. Read `coverage` first. If `structuredReplay` is `"none"` or `"partial"` for this provider, expect real
   gaps and don't be surprised by a non-zero `unreplayable`/`unreplayedCalls` count.
5. If the dry-run plan looks right, re-run without `--dry-run`. Use `--target` instead of restoring in place
   if you want to inspect the result first, or don't fully trust the session.
6. Check the real exit code / `summary` after the run — `0` means everything replayed cleanly; `1` means go
   read the per-file `unreplayable` entries and `unreplayedCalls` and decide what to do about each one
   individually. A `1` exit does not mean the run failed — it means the run was honest about what it could
   not recover.
7. For any file marked `unreplayable`, the `detail` field (when present) names the exact responsible
   command or condition — that's where to start looking for the real content elsewhere.

---

## What this cannot do

- Recover a file whose *entire* content was produced by a programmatic write this scanner can't see into
  (an interpreter script, a compiled program, a tool not in the shell-scan list) — there was never a
  transcript record of the actual bytes written, only that some command ran.
- Recover anything if the provider's own session file itself is gone. This command's floor is the session
  transcript; if that's deleted too, there's nothing left to replay from.
- Guess. Every ambiguous or unreconstructable case is reported as an explicit gap, never filled in with a
  best guess presented as fact.

---
Live page — corrected in place at this URL when field practice shows a gap.
