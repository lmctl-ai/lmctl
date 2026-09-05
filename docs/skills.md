---
title: Skills
sidebar_position: 96
---

# Skills

You were just seeded, read this first.

Skills are short, agent-facing instructions. They are written for the agent
that is already inside a provider session and needs to know the local operating
contract without crawling the whole docs site.

The current public lmctl contract is simple:

- Delegate with synchronous `lmctl chat <teamfile> <alias> "<prompt>"`.
- Treat `lmctl chat` exit status as transport status, not task completion.
- By default, a busy receiver returns a busy error and creates no queued mail.
  The mailbox queue is opt-in with `mailbox_queue_enabled=true` or
  `LMCTL_MAILBOX_QUEUE_ENABLED=true`.
- Use `lmctl chat --json` and `lmctl status` to distinguish a busy result,
  opt-in queued work, and a finished member reply.
- Use `lmctl chat ... --prompt-file <path>` for non-trivial prompts. Positional
  prompts are built by the shell, so backticks, `$(...)`, `$VAR`, and quotes can
  change before lmctl sees them. Write the prompt file with an editor or
  file-writing tool, not `echo` or a heredoc.
- Run `lmctl status` before important sends. In queue-enabled setups, run
  `lmctl status --since 7d` after queued sends and read `Waiting on:` /
  `mailbox outbound`; exit `0` can still mean queued.
- Keep durable project knowledge in `durable-memory/` so a refreshed session or
  swapped provider keeps the same working memory.

Use the docs pages for human context. Use the raw skill files when you are an
agent being asked to do the work.

Start here:

- [Team Lead — basic](https://lmctl.com/skills/lmctl-team-lead-basic-skill.md)
  for the everyday Lead loop.
- [Verifying delegated work](./manuals/verifying-delegated-work.md) when you
  need to know whether a delegated turn actually finished.
- [Mail inspection](./manuals/mail.md) when `status` is not enough detail for
  queued or delivered messages.

## lmctl team operation

| Skill | Use it when |
| --- | --- |
| [lmctl Lead](https://lmctl.com/skills/lmctl-lead.md) | You are the Lead of one `.lmctl` team and need the core delegation/review loop. |
| [Claude Code lmctl Lead](https://lmctl.com/skills/claudecode-lead-skill.md) | You are running an lmctl Lead inside Claude Code and need background dispatch, notification, Monitor, and stall-evidence discipline. |
| [opencode lmctl Lead](https://lmctl.com/skills/opencode-lead-skill.md) | You are running an lmctl Lead on opencode and need background CLI run, notification, and resubmission guidance. |
| [lmctl-admin](https://lmctl.com/skills/lmctl-admin-skill.md) | You need read-only delivery, liveness, or orphan mailbox diagnostics over lmctl state. |
| [Team Lead — basic](https://lmctl.com/skills/lmctl-team-lead-basic-skill.md) | You need the everyday Lead checklist: delegate, review, keep durable memory current. |
| [Team Lead — advanced](https://lmctl.com/skills/lmctl-team-lead-advanced-skill.md) | You need refresh, model-swap, health, or drift-recovery guidance. |
| [lmctl disaster recovery](https://lmctl.com/skills/lmctl-recover-skill.md) | A project directory, `.lmctl` teamfile, or files got deleted and you need to reconstruct them from local event history and provider session transcripts. |
| [Meta-Lead](https://lmctl.com/skills/lmctl-meta-lead-skill.md) | You coordinate several teams or Leads. |
| [Team Lead workflow](https://lmctl.com/skills/team-lead-workflow.md) | You need the shortest operating checklist for delegation and review. |
| [Durable memory](https://lmctl.com/skills/durable-memory.md) | You need to know what belongs in `durable-memory/` and why it is committed. |

## Tool skills

| Skill | Use it when |
| --- | --- |
| [lmprobe](https://lmctl.com/skills/lmprobe-skill.md) | You need structural code search: files, grep, definitions, references, or graph queries. |
| [lmchat](https://lmctl.com/skills/lmchat-skill.md) | You need shared file-room handoff outside lmctl team chat. |
| [lmmail](https://lmctl.com/skills/lmmail-skill.md) | You need durable asynchronous mailboxes with message bodies and attachments. |
| [lmfeedback](https://lmctl.com/skills/lmfeedback-skill.md) | You need to embed website feedback and deliver submissions to an owner's lmmail mailbox. |
| [lmnote](https://lmctl.com/skills/lmnote-skill.md) | You need private per-user notebook files for durable agent notes. |
| [lmsheet](https://lmctl.com/skills/lmsheet-skill.md) | You need simple per-user spreadsheets with Excel-style A1 addressing. |
| [lmbio](https://lmctl.com/skills/lmbio-skill.md) | You need local computational-biology helpers. |
| [lmfin](https://lmctl.com/skills/lmfin-skill.md) | You need local finance/market analytics helpers. |
| [lmsound](https://lmctl.com/skills/lmsound-skill.md) | You need text-to-speech output. |
| [lmtext](https://lmctl.com/skills/lmtext-skill.md) | You need speech-to-text transcription for audio files. |

The raw skills index is also available at
[lmctl.com/skills](https://lmctl.com/skills/).
