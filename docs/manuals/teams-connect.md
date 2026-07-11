---
title: Cross-team calls
sidebar_position: 2
---

# Cross-team calls

lmctl teams can be stored as `.lmctl` teamfiles. A teamfile is a document made
of `_MEMBER_` lines: a Lead plus the members that work with that Lead.

## Intra-team wiring

Intra-team wiring is implicit. If a member appears as a `_MEMBER_` line in the
teamfile, that member is already connected to the team's Lead. You do not need
to declare anything else for members of the same team.

## Cross-team calls

Cross-team calls work automatically at runtime. A team's Lead can call a member
of another team over the chat path without any declaration in the
teamfile — there is nothing to wire up or maintain. Address the target member of
the other team and the message is delivered.

## Runtime cycle protection

Because cross-team calls are unrestricted, lmctl applies runtime cycle
protection so a runaway loop cannot spin forever. A cross-team call is stopped
when its target is already an active ancestor in the live call chain **and**
either:

- it recurs within ~60 seconds (rapid-loop guard), or
- it has been revisited more than twice.

Legitimate back-and-forth (up to two slow revisits) and fan-out / diamond
patterns — two teams independently calling a shared third team — are allowed.
Only genuine runaway recursion is stopped.

When a call is stopped, the agent receives an error like:

```text
cross-team cycle detected (a.lmctl:Lead → b.lmctl:Coder → a.lmctl:Lead); stopping to prevent a runaway loop.
```

## Deprecated: `_CONNECT_` and `lmctl connect`

The static `_CONNECT_` teamfile statement and the `lmctl connect` command have
been removed. You no longer declare cross-team edges. Legacy teamfiles that
still contain `_CONNECT_` lines are not broken: the lines are parsed as a no-op
and ignored, and `lmctl lint <teamfile.lmctl>` prints a deprecation warning
suggesting you delete them.

`lmctl lint <teamfile.lmctl>` validates the teamfile and warns about stale or
placeholder session ids. `lmctl seed <teamfile.lmctl>` fills missing or
placeholder session ids by calling each member's configured native provider.
