---
title: Manual Invocation
sidebar_position: 4
---

# Manual invocation

This page is for an experimental, not officially supported path. Normal lmctl
users never set a caller identity marker by hand.

lmctl identity is a logical team slot:

```text
<teamfile>:<alias>
```

It is not a model name. lmctl derives that slot from the session id in
`LMCTL_SELF_SESSIONID`.

lmctl sets `LMCTL_SELF_SESSIONID` automatically for member sessions it starts
through `lmctl chat` and `lmctl terminal`. Child lmctl commands inherit it, so
member-run `more` and `exec` know which member is acting. `chat` also uses this
marker when it needs to queue a message for a busy target.

If you run one of those commands manually outside a member session, lmctl may
print:

```text
lmctl <cmd>: LMCTL_SELF_SESSIONID is not set — it looks like you are running lmctl
manually, outside a member session that lmctl started. Running lmctl this way is
not officially supported.
To experiment with it manually: https://lmctl.com/lmctl/docs/manual-invocation
```

If you insist on experimenting, set `LMCTL_SELF_SESSIONID` to a member's
`sessionid=` value from that member's `_MEMBER_` line in the teamfile. This may
misattribute messages, may fail if the session is stale or unregistered, and may
change in a future release.

To answer "what model is member X?", use `lmctl health <teamfile> <alias>`.
Do not ask the member; models routinely hallucinate their own model name.
