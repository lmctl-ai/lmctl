---
title: Skills
sidebar_position: 96
---

# Skills

Skills are agent-facing instructions. The [skills catalog](https://lmctl.com/skills/)
groups utility guides and lmctl orchestration guidance. HTML is the authored source;
each page also has a generated `.md` URL for agents. Existing raw URLs, including
`/skills/lmctl-lead.md`, remain available.

Start with the [Lead skill](https://lmctl.com/skills/lmctl-lead-skill.html) or
[Team Lead — basic](https://lmctl.com/skills/lmctl-team-lead-basic-skill.html).
Delegate inline with `lmctl prompt "<teamfile>.lmctl" Coder "Implement the task and report evidence."`.
It blocks for one member turn. If the receiver `is busy; wait and retry`, inspect
`lmctl status` or `lmctl tail` before retrying. Read the reply and verify artifacts;
exit status alone does not establish task completion. For substantial prompts,
write a file with an editor and use `--prompt-file` to avoid shell expansion.

Keep committed project knowledge in `durable-memory/` and explicitly ask new
members to read it. Automatic onboarding is not guaranteed. An independent
reviewer checks the author's work before publication.

The catalog includes lmprobe, lmchat, lmmail, lmfeedback, lmnote, lmsheet, lmbio,
lmfin, lmsound and lmtext. Their API syntax was checked against available source;
service availability and account permissions must be verified with the operator.
The four retired coordination workflows remain short compatibility pointers.

New tool documentation lives in the [tools catalog](https://lmctl.com/tools/),
including LMScript, lmcad, lmhtml and the C++ DSL SDK. Legacy skills and new tool
skills coexist; neither needs to duplicate the other's content.

## Editing and generation

Edit `skills/<name>.html` using plain content tags inside `<main>`. Run
`npm run build:skills` to decorate the pages and regenerate Markdown and the grouped
index. Run `npm run check:skills` and `npm run check:skills:selftest` before committing.
The lmhtml-hosted script checks the HTML contract, coordination invariants and
byte-for-byte generated-file drift. CI uses the same commands.

Local cross-skill HTML links use `/skills/<name>.html`; Markdown generation maps
those link attributes to `/skills/<name>.md`, preserving fragments. Code examples
are never rewritten. Absolute index links work at both `/skills` and `/skills/`.
See `durable-memory/skills-audit.md` for source evidence and intentional corrections.
