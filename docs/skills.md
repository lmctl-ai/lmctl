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
- Use `lmctl chat --json` and `lmctl status` to distinguish queued work from a
  finished member reply.
- Use `lmctl chat ... --prompt-file <path>` for non-trivial prompts. Positional
  prompts are built by the shell, so backticks, `$(...)`, `$VAR`, and quotes can
  change before lmctl sees them.
- Current seed text may mention the `lmctl_chat` MCP tool, but normal installs
  do not provide it. Switch to the CLI command immediately. The CLI is the
  supported path.
- Keep durable project knowledge in `durable-memory/` so a refreshed session or
  swapped provider keeps the same working memory.

Use the docs pages for human context. Use the raw skill files when you are an
agent being asked to do the work.

Start here:

- [Team Lead — basic](https://lmctl.com/skills/lmctl-team-lead-basic-skill.md)
  for the everyday Lead loop.
- [Verifying delegated work](./manuals/verifying-delegated-work.md) when you
  need to know whether a delegated turn actually finished.
- [MCP manual install](./mcp-manual-install.md) if seed text mentions
  `lmctl_chat` and no such tool exists in your session.

## lmctl team operation

| Skill | Use it when |
| --- | --- |
| [lmctl Lead](https://lmctl.com/skills/lmctl-lead-skill.md) | You are the Lead of one `.lmctl` team and need the core delegation/review loop. |
| [Team Lead — basic](https://lmctl.com/skills/lmctl-team-lead-basic-skill.md) | You need the everyday Lead checklist: delegate, review, keep durable memory current. |
| [Team Lead — advanced](https://lmctl.com/skills/lmctl-team-lead-advanced-skill.md) | You need refresh, model-swap, health, or drift-recovery guidance. |
| [Meta-Lead](https://lmctl.com/skills/lmctl-meta-lead-skill.md) | You coordinate several teams or Leads. |
| [Team Lead workflow](https://lmctl.com/skills/team-lead-workflow.md) | You need the shortest operating checklist for delegation and review. |
| [Durable memory](https://lmctl.com/skills/durable-memory.md) | You need to know what belongs in `durable-memory/` and why it is committed. |

## Tool skills

| Skill | Use it when |
| --- | --- |
| [lmprobe](https://lmctl.com/skills/lmprobe-skill.md) | You need structural code search: files, grep, definitions, references, or graph queries. |
| [lmchat](https://lmctl.com/skills/lmchat-skill.md) | You need shared file-room handoff outside lmctl team chat. |
| [lmbio](https://lmctl.com/skills/lmbio-skill.md) | You need local computational-biology helpers. |
| [lmfin](https://lmctl.com/skills/lmfin-skill.md) | You need local finance/market analytics helpers. |
| [lmsound](https://lmctl.com/skills/lmsound-skill.md) | You need text-to-speech output. |

The raw skills index is also available at
[lmctl.com/skills](https://lmctl.com/skills/).
