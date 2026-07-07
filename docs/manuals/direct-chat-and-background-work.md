---
title: Direct Chat & Background Work
sidebar_position: 3
---

# Direct chat & background work

lmctl has three different execution paths. Pick the one that matches how you
need to wait, observe, and resume work.

## Synchronous direct chat

Use `lmctl chat` when you want one member to handle one prompt now:

```bash
lmctl chat ./team.lmctl Coder "Implement the smallest safe fix."
lmctl chat ./team.lmctl Reviewer "Review Coder's latest change." --from ./team.lmctl:Lead
```

This blocks until the provider turn finishes or errors. It is the right path
for short handoffs, review requests, and operator answers where the shell should
wait for the result.

## Tracked background delegation

Use `lmctl chat ... --detach` when a Lead needs to fan out member work without
freezing on every long turn:

```bash
lmctl chat ./team.lmctl Coder "Run the long verification pass." --detach
lmctl jobs list --team ./team.lmctl
lmctl jobs watch <job_id>
lmctl jobs result <job_id>
```

Detached chat creates a tracked delegation job. `lmctl jobs` is the portal for
that job: list it, watch it, fetch the final result, or cancel it. This is
different from plain shell backgrounding with `&`, which gives the caller no
lmctl job id or completion record.

Provider sessions do not wake themselves just because background work finished.
A Lead learns about completed detached work when it is prompted again, nudged,
or asked to inspect `lmctl jobs`.

## The (N-1,1) method

When a Lead has **N** independent member jobs, the safe fan-out pattern is:

1. Submit **N-1** longer jobs with `lmctl chat ... --detach`.
2. Keep **1** shortest useful job as a blocking `lmctl chat` call.
3. When that blocking call returns, inspect `lmctl jobs`, collect finished
   results, dispatch follow-ups, and repeat.

This keeps real parallelism without going blind. Detached jobs have ids and
results in `lmctl jobs`; the one blocking job is the wake-up signal that brings
the Lead back to harvest. See the raw
[background-wakeup skill](https://lmctl.com/skills/background-wakeup.md) for the
full loop.

If a Lead already went idle after launching detached work, use `lmctl nudge` to
deliver completed-but-undelivered results:

```bash
lmctl nudge ./team.lmctl
lmctl jobs list --team ./team.lmctl
```

## Daemon workflow jobs

Use workflow jobs for repeatable pipelines:

```bash
lmctl serve > lmctl.log 2>&1 &
lmctl workflow run --workflow image-qa --project my-project --inputs '{"image_path":"sample.png"}'
lmctl api jobs
lmctl api runs
lmctl api attentions
```

Workflow jobs are executed by `lmctl serve`. Inspect workflow queue state with
`lmctl api jobs`; inspect run state with `lmctl api runs` and `lmctl api run
<id>`. Human input, pauses, and failures surface as attentions.

## Quick choice

| Need | Use |
| --- | --- |
| Ask one member and wait | `lmctl chat <teamfile> <alias> "<prompt>"` |
| Fan out member work and track completion | `(N-1,1)`: `lmctl chat ... --detach` plus one blocking `lmctl chat` wake |
| Run a repeatable workflow pipeline | `lmctl workflow run` / `lmctl api submit-job` plus `lmctl serve` |
