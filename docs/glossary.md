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

## cross-team call

A message from one team's Lead to a member of another team. Cross-team calls
work automatically at runtime over the chat / MCP path — no declaration is
needed. Runtime cycle protection stops only genuine runaway recursion. The old
`_CONNECT_` statement and `lmctl connect` command are legacy setup forms, not
the current public cross-team path; legacy `_CONNECT_` lines are ignored with a
lint deprecation warning.

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

## session / sessiondir

The provider CLI's native conversation cache for one member. Sessions are useful
for continuity but are not the canonical project record.

## serve / api commands

`lmctl serve` is the local daemon for daemon-backed workflow and service
integrations.
`lmctl api ...` are CLI commands that act on your local lmctl state directly.
