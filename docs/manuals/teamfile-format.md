---
title: Teamfile Format
sidebar_position: 1.5
---

# Teamfile format

If you just ran `lmctl plan` (or `lmctl quickrun`), you have a new `<name>.lmctl`
file. This page explains what's in it and how to change it.

**That file is an example, not a fixed contract.** `lmctl plan` makes a
reasonable starting point based on what you asked for — it isn't the "correct"
team for your project. Add members, remove them, swap providers, rename
aliases. Nothing about the file is precious.

## What a teamfile is

A teamfile is a plain text file — no YAML, no JSON, no special editor needed.
Every line that starts with `_MEMBER_` declares one team member. Everything
else in the file (headers, blank lines, notes to yourself) is free-form text.
It isn't parsed, so you can write yourself reminders or instructions to the
Lead anywhere outside a `_MEMBER_` line.

## The `_MEMBER_` line

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

## Adding a member

Copy an existing `_MEMBER_` line, give it a new `alias=`, and pick a
`provider=`. Don't set `sessionid=` — `lmctl seed` creates one the next time
you run it.

```
_MEMBER_ alias=QA provider=codex
```

## Removing a member

Delete the line. That's the whole procedure — there's nothing else to clean
up elsewhere.

## Renaming or reassigning a member

Edit the `alias=` or `provider=` value in place. If you change `provider=`
for a member that already has a `sessionid=`, delete the `sessionid=` too —
it belongs to the old provider's session and won't work with a different one.
`lmctl seed` will create a fresh one.

## A full example

```
# Backend team
# Lead plans and delegates. Coder implements. Reviewer checks the Coder's
# work before anything ships.

_MEMBER_ alias=Lead     provider=claude
_MEMBER_ alias=Coder    provider=codex model="gpt-5.6-luna"
_MEMBER_ alias=Reviewer provider=claude
```

## After you edit the file

```
lmctl lint ./team.lmctl   # check the syntax and provider/model names are valid
lmctl seed ./team.lmctl   # create provider sessions for any member missing a sessionid
lmctl chat ./team.lmctl   # start talking to your team
```

See the [CLI reference](./cli-reference) for what each command does, and
[Concepts & glossary](./concepts-glossary) for the bigger picture of teamfiles,
teams, and members.
