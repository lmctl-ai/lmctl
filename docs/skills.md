---
title: Skills
sidebar_position: 96
---

# Skills

Skills are agent-facing instructions. The [skills catalog](https://lmctl.com/skills/)
groups utility guides and lmctl orchestration guidance. HTML is the only skill format.
Use `/skills/<name>.html`, or the Lead alias `/skills/lmctl-lead.html`.
Former `.md` URLs temporarily serve a one-paragraph text notice pointing to HTML;
the operator will remove these notices after the transition.

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
`npm run build:skills` to decorate the HTML pages and regenerate the grouped HTML
index. Run `npm run check:skills` and `npm run check:skills:selftest` before committing.
The lmhtml-hosted script checks the HTML contract, coordination invariants and
stale HTML decoration and index changes. CI uses the same commands.

Cross-skill body links use absolute https://lmctl.com/skills/NAME.html URLs, preserving fragments. Absolute index
links work at both `/skills` and `/skills/`. There is no format converter or
Markdown drift check. The checker also validates `lmctl` commands against a
checked-in subcommand list; refresh it with
`python3 scripts/tools/update-lmctl-subcommands.py`, which parses `lmctl --help`.
See `durable-memory/skills-audit.md` for source evidence and intentional corrections.

## Plain structure for agents

Use headings, paragraphs, lists, tables and command blocks. No decorative strong/em or inline code; even paths and flags are plain prose. HTML-decode is rarely needed: text escapes only ampersands and less-than signs, attributes only ampersands and double quotes. Literal UTF-8 punctuation needs no entities. Write each paragraph on one source line; preserve command continuations in pre blocks. Diagram images with alt text and video provide the visual layer.

For example, write “Run lmctl status to inspect the member.” as plain prose, not with code or bold wrappers. Put copyable commands in a pre/code block. Run build:skills to normalize and check:skills to enforce the profile.

Command placeholders are TEAMFILE.lmctl, API_ID, API_KEY, APP_KEY, PROVIDER, MODEL, OTHER_PROVIDER, PATH, NAME, ID, USER, CURSOR and REQUEST.json. Replace these with real values; they are not shell variables. SSML tags and less-than operators remain literal syntax and therefore still require the less-than escape in HTML source. Body cross-skill links use absolute https://lmctl.com/skills/NAME.html URLs, including anchors, so pasted or downloaded skills remain navigable.

The index begins each entry with a Use when trigger, derived from that skill's description metadata. The chooser distinguishes a single-team Lead, Claude Code Lead, multiple-team meta-Lead, everyday basic loop, advanced recovery and executable workflows.
