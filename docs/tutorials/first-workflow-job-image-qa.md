---
title: First Lead-Run QA Pass
sidebar_position: 2
---

# First Lead-run QA pass: image review

The current public lmctl model is teamfile + members + `lmctl chat`. A
repeatable workflow is the prompt you give the Lead, plus any durable project
facts committed under `durable-memory/`.

## Create and seed a team

Use a `.lmctl` teamfile with a Lead, a QA member, and optionally a Reviewer:

```text
_MEMBER_ alias=Lead     provider=codex
_MEMBER_ alias=QA       provider=claude
_MEMBER_ alias=Reviewer provider=agy
```

Then lint and seed it:

```bash
lmctl lint ./team.lmctl
lmctl seed ./team.lmctl
```

Each team member has an alias and a provider. `seed` starts each provider CLI
once so lmctl can capture a native session id and snapshot the member prompt.

## Put the target image somewhere stable

Place the image in a path every member can read. For example:

```bash
mkdir -p /tmp/lmctl-image-qa
cp /path/to/local-image.png /tmp/lmctl-image-qa/sample.png
```

## Ask the Lead to run the pattern

Give the Lead one concrete instruction:

```bash
lmctl chat ./team.lmctl Lead "Run an image QA pass on /tmp/lmctl-image-qa/sample.png. Ask QA to describe the image, ask Reviewer to check the answer for missed details or hallucinations, then report the final verdict."
```

`lmctl chat` blocks for the Lead's turn and prints the reply. The Lead can
delegate to members with the same command. If a member-session target is busy,
lmctl queues the message in that `(sender, receiver)` lane. The next chat from
that same sender to that same receiver delivers the queued lane plus the new
message once the receiver is free.

## Check team/self status

```bash
lmctl status
```

Use `status` for the current caller/team view. It speaks teamfile, member,
delegation, and mailbox vocabulary.
