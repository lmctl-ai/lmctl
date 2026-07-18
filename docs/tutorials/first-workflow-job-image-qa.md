---
title: Your First Workflow Job
sidebar_position: 2
---

# Your first workflow job: image-qa

This walkthrough creates a project, creates a team, loads the `image-qa`
workflow, starts the daemon, and submits a job.

Use a real directory you own for `--local-path`. The examples below use
`/tmp/my-project`.

## Create a project

```bash
lmctl project create my-project \
  --workflow image-qa \
  --team my-team \
  --local-path /tmp/my-project
```

A project binds a directory to one default workflow and one team.

## Create and seed a team

```bash
lmctl team create my-team
lmctl team add-member my-team --alias QA --provider claude
lmctl team seed my-team
```

Each team member has an alias and a provider. Workflows refer to members by
alias, not by provider name. `team seed` starts each provider CLI once so lmctl
can capture a native session id and snapshot the member prompt.

You can use a different provider if that CLI is installed and authenticated:

```bash
lmctl team add-member my-team --alias QA --provider codex
```

lmctl supports mixed-provider teams. A common pattern is to let one provider do
the work and another review it, which catches different failure modes than a
single-model loop.

## Load the workflow

```bash
lmctl workflow load image-qa workflows/image-qa.compound.json
```

The workflow definition is stored in the local SQLite workspace database.

## Start the daemon

```bash
lmctl serve > lmctl.log 2>&1 &
```

The daemon is the process that `lmctl api ...` commands talk to. It
listens on `127.0.0.1:8787` by default.

## Place a sample image

Before submitting the job, put an image at the path used by the workflow input.
For example, copy an existing local image:

```bash
cp /path/to/local-image.png /tmp/my-project/sample.png
```

If you do not have a sample image handy, create a tiny placeholder PNG:

```bash
mkdir -p /tmp/my-project
base64 -d > /tmp/my-project/sample.png <<'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=
EOF
```

## Submit a job

`image-qa` expects an image path and a prompt:

```bash
lmctl api submit-job \
  --workflow image-qa \
  --project my-project \
  --inputs '{"image_path": "/tmp/my-project/sample.png", "prompt": "What is in this image?"}'
```

`submit-job` waits until the run reaches a terminal state and prints structured
result data.

## Check team/self status and attentions

```bash
lmctl status
lmctl api attentions
```

Use `status` for the current caller/team view. It does not resolve a project
from the current directory; it speaks teamfile, member, delegation, and mailbox
vocabulary. Use `api attentions` to list persistent notifications such as
workflow pauses, failures, or drift signals.
