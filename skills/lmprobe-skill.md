# lmprobe skill

Use this skill when you need codebase evidence: finding files, grepping text,
locating definitions/references, mapping imports/callers/callees, or collecting
structured search results for another agent.

Canonical manual: https://lmctl.com/lmprobe

This skill is the fast path. If exact syntax, output formats, GraphQL fields,
mutation safety, history commands, secrets scanning, or command reference
details matter, open the manual and use it as the source of truth. The manual
sections are: Start, Install, Search, Graphs, History, Safe changes, Formats,
GraphQL, Secrets, Recipes, and Reference.

## Install

```sh
npm install -g @lmctl-ai/lmprobe
```

Use the global install for repeated agent batches; `npx @lmctl-ai/lmprobe ...`
re-resolves the package on each invocation and can add seconds per call. Use
`npx` for one-off runs or when you cannot install globally.

Linux x64 `0.42.2` was retested successfully on glibc 2.34 hosts. If a package
installs but fails before startup with a glibc loader error, report that as a
package/runtime issue; do not switch public instructions to `cargo build`.

## Default workflow

1. Start with JSON unless the user asked for another format:

   ```sh
   lmprobe --format json <verb> ...
   ```

2. Prefer lmprobe over ad hoc `find | grep | awk` chains when the task is about
   code evidence. It returns structured paths, line numbers, diagnostics, and
   evidence envelopes that are easier for agents to cite.

3. Use raw `find`/`grep` only when lmprobe is unavailable, blocked by the Linux
   runtime caveat, or the user explicitly asks for shell primitives. Say so in
   the result.

4. Read `warnings`, `diagnostics`, and `exitStatus`. A no-match, regex warning,
   unsupported language, or partial result is evidence; do not silently ignore it.

5. For non-basic commands, check https://lmctl.com/lmprobe before running:
   `history`, `ast-diff`, `impact`, `context`, `trace`, `fix`, `secrets`,
   alternate output formats, and GraphQL composition have detailed examples
   there.

## Fast recipes

Find project markers:

```sh
lmprobe --format json find '(^|[\\/])package\.json$' .
lmprobe --format json find '(^|[\\/])(Cargo\.toml|pyproject\.toml|go\.mod)$' .
```

Find source files by extension:

```sh
lmprobe --format json find '\.(rs|ts|tsx|js|jsx|pl|pm)$' .
```

Search raw content:

```sh
lmprobe --format json grep 'login|signin|authenticate' .
lmprobe --format json grep -i 'todo|fixme' .
lmprobe --format json grep 'process\.env\.[A-Z0-9_]+' --path apps/web --path packages/shared
```

Add context for human-reviewable evidence:

```sh
lmprobe --format json grep -C 3 'login' apps/web
lmprobe --format json grep --parents --body 'handler|route' src
```

Use symbol-aware verbs for identifiers:

```sh
lmprobe --format json def LoginService .
lmprobe --format json def --body LoginService .
lmprobe --format json ref LoginService .
lmprobe --format json search --name Login .
```

`def` skeletonizes declaration bodies by default. Add `--body` when the
implementation body matters.

## GraphQL recipes

Use GraphQL when you need several evidence streams in one process or want only
selected fields.

```sh
lmprobe query --format json '{
  packages: find(pattern: "(^|[\\\\/])package\\.json$", path: ".") {
    paths
    exitStatus
  }
  auth: grep(pattern: "login|signin|authenticate", path: ".", around: 2) {
    hits { filePath lineNumber lineContent }
    warnings { code message hint }
    exitStatus
  }
}'
```

Find directories with a marker file and then grep only under those directories:

```sh
lmprobe query --format json '{
  grepDirsWith(
    markerPattern: "(^|[\\\\/])package\\.json$",
    pattern: "oauth|copilot|openai",
    path: ".",
    around: 2,
    parents: true
  ) {
    hits {
      filePath
      lineNumber
      lineContent
      parents { kind name lineStart lineEnd }
    }
    exitStatus
  }
}'
```

## Safety and reporting

- Treat lmprobe as read-only unless using explicit mutation verbs such as
  `fix`, `trace`, or `untrace`.
- Include exact file paths and line numbers in your answer.
- Summarize diagnostics or warnings that affect confidence.
- Do not claim complete repository coverage if the command had partial results,
  unsupported language warnings, or path exclusions.
- Public install channel is `@lmctl-ai/lmprobe`; the source repo is closed.
