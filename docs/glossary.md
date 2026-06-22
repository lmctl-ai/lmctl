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

## _CONNECT_

An explicit cross-team edge in a `.lmctl` teamfile. `_CONNECT_ alias=<M>
teamfile=<T>` lets the source team's Lead send to member `<M>` of another team
`<T>`.

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

`lmctl serve` is the local always-on daemon that executes queued work.
`lmctl api ...` are CLI commands that act on your local lmctl state directly.
