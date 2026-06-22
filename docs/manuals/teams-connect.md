---
title: Teams & Cross-Team Connections
sidebar_position: 2
---

# Teams & cross-team connections

lmctl teams can be stored as `.lmctl` teamfiles. A teamfile is a document made
of `_MEMBER_` lines: a Lead plus the members that work with that Lead.

## Intra-team wiring

Intra-team wiring is implicit. If a member appears as a `_MEMBER_` line in the
teamfile, that member is already connected to the team's Lead. You do not need
`_CONNECT_` lines for members of the same team.

## Cross-team edges

A `_CONNECT_` line is explicit cross-team wiring:

```text
_CONNECT_ alias=<M> teamfile=<T>
```

It means the source team's Lead may send to member `<M>` of another teamfile
`<T>`.

- `alias=` selects the target member and must name a member that exists in the
  target teamfile.
- `teamfile=` names the target team.
- `_CONNECT_` is cross-team only; a self-target where `teamfile` is the source
  team is rejected.
- Multiple `_CONNECT_` lines to the same target teamfile are allowed when they
  use different aliases.

## Authoring workflow

You can edit the teamfile directly or append a connection with `lmctl connect`:

```bash
lmctl connect ./frontend/frontend.lmctl ./backend/backend.lmctl Reviewer
lmctl lint ./frontend/frontend.lmctl
lmctl seed ./frontend/frontend.lmctl
```

`lmctl lint <teamfile.lmctl>` validates the teamfile and warns about stale or
placeholder session ids. `lmctl seed <teamfile.lmctl>` fills missing or
placeholder session ids by calling each member's configured native provider.

## Current send policy

Cross-team send policy is currently advisory: warn-only and fail-open. Do not
treat `_CONNECT_` as an enforced authorization boundary. The structural boundary
that matters today is that only the team's Lead has the send capability.
