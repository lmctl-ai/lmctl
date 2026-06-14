---
title: Template Catalog
sidebar_position: 6
---

# Template catalog

This page is a reference for the two kinds of templates lmctl ships: the
**workflow definitions** in `workflows/*.compound.json`, and the **`.lmctl`
config templates** that lmctl scaffolds into a project.

Workflows are loaded into the local SQLite profile by name:

```bash
lmctl workflow load <name> workflows/<name>.compound.json
```

Config templates are scaffolding that lmctl writes into a project, which the
operator then edits. They cover a project's `ai-test/` chapters and its
`durable-memory/` knowledge layer.

## Workflow definitions

The 19 shipped workflow definitions in `workflows/`. Load any of them with
`lmctl workflow load <name> workflows/<name>.compound.json`, then submit a job
by workflow name.

| Workflow | Description |
| --- | --- |
| `bugfix-extended-v2` | Investigates a bug report, develops a fix through coder and reviewer turns, verifies, reports final status. |
| `bugfix-v2` | Takes a bug description, an agent diagnoses and fixes it in the project, then verifies and reports. |
| `bugfix-pr-fixer-v2` | Claims a bugfix project work item, fixes it with a coder/reviewer loop, prepares the project for PR follow-up. |
| `bugfix-pr-fixer-direct-v2` | Direct bugfix PR workflow for a known task, coder + reviewer agents produce and verify a change. |
| `bugfix-pr-fixer-autosubmit-v2` | Claims a bugfix task, repairs with review, prepares an autosubmitted pull request. |
| `pr-fix` | Claims one project issue, reads the failing test chapter, fixes with a coder/reviewer loop, commits, closes the issue. |
| `pr-followup-v2` | Follows up on PR feedback, applies changes, verifies, reports whether the PR is ready. |
| `triage-v2` | Triages incoming issues, filters duplicates/unclear reports, assesses fixability, produces candidate work items. |
| `qa-suite` | Runs project QA chapters, interprets failures, creates project issues for failing chapters, reports open issue count. |
| `image-qa` | Reviews image/visual output against expected criteria, produces a QA verdict with evidence. |
| `info-qa` | Information-oriented QA: checks project facts, evidence, and expected outcomes without modifying the project. |
| `document-creation` | Creates or revises a project document through agent drafting and review, writes the accepted document. |
| `newspaper` | Builds a newspaper-style summary from project/external inputs into a readable generated artifact. |
| `spec-driven-task` | Turns a written task specification into project changes through implementation, review, and verification. |
| `durable-memory-consolidation-v2` | Consolidates durable project memory from recent work so future sessions recover context quickly. |
| `provider-probe` | Checks whether configured AI providers and team members can respond in the current environment. |
| `example-v2` | Demonstrates a simple multi-step workflow (agent work + review) for smoke testing and as a template example. |
| `claim-check-spike-v2` | Explores whether project issue claiming and follow-up work queues behave correctly (small spike). |

Each definition is built from the compound archetypes described in
[Workflows & archetypes](./workflows-archetypes.md): Review, Consolidate,
Interactive, Loop, ShellStep, and AssertRepoClean.

## Config templates

The `.lmctl` scaffolding lmctl writes into a project. Edit these after they are
written; they are starting points, not fixed files.

### ai-test chapters

Scaffold a project's `ai-test/` directory. These chapters are consumed by the
`qa-suite` and `pr-fix` workflows.

| File | Purpose |
| --- | --- |
| `index.md` | The chapter index for the project's `ai-test/` directory. |
| `example-test.md` | A sample manual test chapter to copy and adapt. |

### durable-memory

Scaffold a project's `durable-memory/` directory. durable-memory is the
canonical knowledge layer, read on demand by agents.

| File | Purpose |
| --- | --- |
| `index.md` | The memory index for the project's `durable-memory/`. |
| `skills_general.md` | General skills chapter. |
| `skills_lmdebug.md` | Skills chapter for debugging with lmctl. |
| `skills_lmprobe.md` | Skills chapter for probing with lmctl. |
