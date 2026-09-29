---
title: Teamfile Format
sidebar_position: 1.5
---

# Teamfile format

If you just ran `lmctl plan` (or `lmctl quickrun`), you have a new `<name>.lmctl`
file and a comment inside it pointed you here. This page covers the whole
loop: **generate → edit → lint → seed** — what you have, what it means, how
to change it, and the two commands you run before talking to your team.

## Generate: what `lmctl plan` gave you

`lmctl plan` writes a starting point, not a finished team. It's a real,
loadable teamfile — valid the moment it's generated — but it's built from
whatever pattern or flags you asked for, not from your actual project. Add
members, remove them, swap providers, rename aliases. Nothing about the file
is precious, and nothing downstream cares that you changed it.

## Edit: what's in the file

A teamfile is a plain text file — no YAML, no JSON, no special editor needed.
Every line that starts with `_MEMBER_` declares one team member. Everything
else in the file (headers, blank lines, notes to yourself) is free-form text.
It isn't parsed, so you can write yourself reminders or instructions to the
Lead anywhere outside a `_MEMBER_` line.

### The `_MEMBER_` line

A member line looks like this:

```
_MEMBER_ alias=Coder provider=claude model="claude-opus-5"
```

It's a space-separated list of `key=value` pairs. Wrap a value in double
quotes if it contains spaces (`model="claude opus 5"`); otherwise quotes
aren't needed.

| Field | Required? | What it means |
| --- | --- | --- |
| `alias` | yes | The name you'll call this member by — `Lead`, `Coder`, `Reviewer`, anything. Must be unique within the file. |
| `provider` | yes (or `teamfile`, see below) | Which AI provider CLI runs this member. See the list below. |
| `model` | no | A specific model for that provider, e.g. `model="claude-opus-5"`. Leave it out to use the provider's default. |
| `effort` | no | A reasoning-effort/tier variant, for providers that support one. |
| `sessionid` | no | Filled in automatically by `lmctl seed`. Leave it blank when you add a member by hand — don't invent one. |
| `sessiondir` | no | Run this member from a different directory than the teamfile's own directory. |
| `teamfile` | no | An alternative to `provider=` — points this member at another team's Lead instead of an AI provider. Rare; see [Cross-team calls](./teams-connect) if you need it. |

**Valid `provider=` values**: `claude`, `codex`, `gemini`, `copilot`,
`opencode`, `qwen`, `agy`, `kimi`, `dsh`, `hermes`, `pi`, `lmplayer`.

### Adding a member

Copy an existing `_MEMBER_` line, give it a new `alias=`, and pick a
`provider=`. Don't set `sessionid=` — `lmctl seed` creates one the next time
you run it.

```
_MEMBER_ alias=QA provider=codex
```

### Removing a member

Delete the line. That's the whole procedure — there's nothing else to clean
up elsewhere.

### Renaming or reassigning a member

Edit the `alias=` or `provider=` value in place. If you change `provider=`
for a member that already has a `sessionid=`, delete the `sessionid=` too —
it belongs to the old provider's session and won't work with a different one.
`lmctl seed` will create a fresh one.

### A full example

```
# Backend team
# Lead plans and delegates. Coder implements. Reviewer checks the Coder's
# work before anything ships.

_MEMBER_ alias=Lead     provider=claude
_MEMBER_ alias=Coder    provider=codex model="gpt-5.6-luna"
_MEMBER_ alias=Reviewer provider=claude
```

## Lint: check the file before seeding

```
lmctl lint ./team.lmctl
```

`lint` checks the file's syntax and, where it can, validates provider/model
names against a known catalog. Run it after every hand-edit, before you seed
— it catches typos and bad provider/model names before you spend a real
provider session on them.

Output looks like this:

```
notice: checking teamfile and models ...
warning: [Lead] model "not-a-real-model-xyz" not found in lmprice catalog for provider "claude" (214 known); provider may still accept it
ok
```

**Warnings are advisory — `lint` still exits `0` and prints `ok`.** A warning
means "this might be wrong" (usually a model name lint doesn't recognize),
not "this is broken." The provider may accept it anyway — lint's own catalog
can be stale. If you want warnings to fail the command too (useful in a
script or CI), add `--strict`.

**Errors are different — they mean the file itself is malformed**, and
`lint` exits `1` with no trailing `ok`:

```
notice: checking teamfile and models ...
error: Lead: Invalid provider "cladue"
```

An error means fix the file before doing anything else with it — a typo'd
`provider=`, a duplicate `alias=`, a line lint couldn't parse at all. Fix
what it names and run `lint` again.

## Seed: create the actual provider sessions

```
lmctl seed ./team.lmctl
```

Seeding is what turns the file from a plan into a real team: for every
member whose `sessionid=` is missing, `seed` starts that member's provider
CLI, creates a real session, and writes the resulting `sessionid=` (and a
resolved `sessiondir=`) back into the file. **Only members missing a
`sessionid=` are touched** — a member that already has one is left exactly
as it is.

That last point is also how you replace one member without disturbing the
rest of the team: delete that member's `sessionid=` line value and run
`lmctl seed` again. Only that member gets a fresh session; everyone else's
`sessionid=` is untouched.

```
_MEMBER_ alias=Coder provider=codex model="gpt-5.6-luna"
```
(no `sessionid=` — the next `lmctl seed` fills in only this member)

Seeding a member is a real provider call and can take a few seconds each;
`seed` prints progress to stderr as it goes (a "still launching" line every
5 seconds is normal, not a hang).

## After seeding

Once every member has a `sessionid=`, talk to your team:

```
lmctl prompt ./team.lmctl Lead "hello"
```

See the [CLI reference](./cli-reference) for the full command set, and
[Concepts & glossary](./concepts-glossary) for the bigger picture of
teamfiles, teams, and members.
