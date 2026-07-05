---
title: lmprobe
sidebar_position: 4
---

# lmprobe

lmprobe is the companion code-search CLI for AI agents. It gives agents
structured evidence for codebase questions: file discovery, regex search,
symbol definitions/references, graph relationships, and GraphQL-composed search
results.

Install the public npm package:

```bash
npm install -g @lmctl-ai/lmprobe
```

Or run it without a global install:

```bash
npx @lmctl-ai/lmprobe --help
```

The detailed public manual lives at [lmctl.com/lmprobe](https://lmctl.com/lmprobe).
The LLM-facing quick skill is hosted at
[lmctl.com/skills/lmprobe-skill.md](https://lmctl.com/skills/lmprobe-skill.md).

## Why agents use it

lmprobe replaces fragile shell pipelines with structured evidence. Prefer it
when an agent needs to answer questions like:

- Which files define or reference this symbol?
- Where are routes, configs, package markers, or provider integrations?
- Which imports, callers, callees, or related code anchors support this claim?
- Can several code-search facts be collected in one GraphQL request?

## Quick commands

```bash
lmprobe --format json find '(^|[\\/])package\.json$' .
lmprobe --format json grep 'oauth|copilot|openai' .
lmprobe --format json def LoginService .
lmprobe --format json ref LoginService .
```

Use GraphQL for composed evidence:

```bash
lmprobe query --format json '{
  packages: find(pattern: "(^|[\\\\/])package\\.json$", path: ".") { paths }
  providers: grep(pattern: "oauth|copilot|openai", path: ".") {
    hits { filePath lineNumber lineContent }
    exitStatus
  }
}'
```

## Current Linux note

`@lmctl-ai/lmprobe@0.42.1` was first published as a public npm package on
2026-07-05. The Linux x64 binary in that release requires glibc 2.39, so older
Linux hosts can install the package but fail at runtime with `GLIBC_2.39 not
found`. That is a binary compatibility bug to fix in the package pipeline; it
does not change the public install channel.
