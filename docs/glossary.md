---
title: Glossary
sidebar_position: 98
---

# Glossary

## project

A directory on disk bound to one team and one workflow. In normal use, the
workspace, project, and directory are the same unit.

## team / member

A team is a named set of members. A member is an agent alias backed by a native
provider CLI, optional model, and provider session directory.

## workflow / archetype

A workflow is a routed state machine. An archetype is a reusable primitive such
as Review, Consolidate, Interactive, Loop, ShellStep, or AssertRepoClean.

## job / run

A job is a queued request to execute a workflow. A run is the live execution
instance created from a job.

## attention

A persistent operator notification. Attentions cover workflow pauses, failures,
drift signals, and other conditions that need visibility.

## durable-memory

Provider-agnostic project knowledge stored with the project, typically as
markdown chapters. durable-memory survives fresh sessions and provider changes.

## ai-test chapter

A markdown test file under a project's `ai-test/` directory. QA workflows use
chapters to drive repeatable checks.

## lock

A workflow guard used to prevent conflicting active execution for a project.
If recovery is needed, use:

```bash
lmctl-next project unlock <name>
```

## session / sessiondir

The provider CLI's native conversation cache for one member. Sessions are useful
for continuity but are not the canonical project record.

## serve / API commands

`lmctl-next serve` starts the local daemon. `lmctl-next api ...` is the CLI
client for that HTTP surface.
