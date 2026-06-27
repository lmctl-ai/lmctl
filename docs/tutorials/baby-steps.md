---
title: Baby-step introduction
sidebar_position: 2
---

# Baby steps: discover lmctl one step at a time

You don't have to adopt lmctl all at once. Each step below adds value on its own,
with almost no commitment — you can stop at any rung and still come out ahead.
This is the gentle path for developers who already live in a native AI CLI.

## Step 1 — Just look at your sessions (≈1% of lmctl)

You already use a native AI CLI — Claude Code, Codex, Gemini, and so on. Without
writing a teamfile or changing anything, lmctl can give you **one read-only
window over all of those sessions**. You don't even have to install it — try it
with `npx` (needs Node 24.15+):

```bash
npx @lmctl-ai/lmctl ls      # no install — list your sessions across providers
```

Or, once installed (`npm install -g @lmctl-ai/lmctl`):

```bash
lmctl ls                    # list native provider sessions, across providers
lmctl info <sessionid>      # one session's state + token usage
lmctl tail --session <id>   # read its messages (add --watch to follow live)
```

`lmctl ls` prints one line per session, across Claude, Codex, Gemini, and the
rest — in one place. That's it: you've used lmctl. No setup, no lock-in, just a
better lens on the sessions you already have. (`lmctl ls --runs` shows lmctl's own
runs instead, once you have any.)

## Step 2 — Give sessions human-friendly names

Raw sessionids are cryptic. Here's the nice part: `lmctl ls` already prints
`_MEMBER_` lines in teamfile format, so you don't write a teamfile from scratch —
you **paste its output into a `.lmctl` file and just fill in `alias=`**:

```md
_MEMBER_ alias=Coder    provider=codex
_MEMBER_ alias=Reviewer provider=claude
```

Then seed it so lmctl captures (or confirms) each underlying session:

```bash
lmctl seed ./team.lmctl       # starts each provider once, captures the session id
lmctl tail ./team.lmctl Coder # now address by alias, not a cryptic id
lmctl info ./team.lmctl Reviewer
```

Now you work with names — `Coder`, `Reviewer` — instead of copying sessionids
around. See [Concepts & glossary](../manuals/concepts-glossary.md) for the
teamfile format.

## Step 3 — Stop copy-pasting between sessions

The usual chore: a Coder makes a change, and you hand-copy it into a Reviewer's
chat. Let the **Lead** do that routing for you — message a member and the Lead
relays the relevant context:

```bash
lmctl chat ./team.lmctl Reviewer "Review Coder's latest change and flag anything risky."
```

The first member in the teamfile is the Lead; it talks to its members, and can
even reach members of other teams — automatically, at runtime, with built-in
cycle protection. You've gone from "two chat windows I shuttle text between" to
"a team that hands work off for me." And because the Reviewer is a *different
provider and model* than the Coder, that review is genuinely independent — see
[Adversarial review](../why/adversarial-review.md).

## Step 4 — Capture the pattern, and keep its memory

Once a back-and-forth stabilizes, freeze it as a **workflow** so it runs the same
way every time, and add **durable-memory** so the team's knowledge survives fresh
sessions, provider swaps, and even moving the project to a new folder:

```bash
lmctl run https://lmctl.com/workflows/research.compound.json
```

Browse the [built-in workflows](../manuals/templates-catalog.md), and read why
this scales to long projects in
[Context & durable memory](../why/context-and-durable-memory.md).

---

Each rung is independently useful. Look → name → route → capture: adopt exactly
as much lmctl as pays for itself, and no more.
