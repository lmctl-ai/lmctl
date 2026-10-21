# LMScript authoring wishlist

This note records authoring friction observed while exercising the published lmdraw quickruns and reviewing the LMScript tutorial work on 2026-10-21. These are proposals; no LMScript implementation is implied.

## Help text and API status

The command lmscript help savedsl describes the function as EXPERIMENTAL (lmctlhq/poc-web), even though savedsl is used by published host tutorials and the lmdraw example book. The internal prototype label makes it unclear whether authors should rely on the function.

Proposed fix: remove the prototype label from user-facing help, or clearly separate any experimental mode from the supported savedsl contract. State that the output path is interpreted from the current working directory and that the host's own output rules still apply.

## Host install declarations

The lmdraw script uses the install declaration github:lmctl-ai/lmdraw@latest. The first compile may fetch a release, later runs use the local cache, and the resolved host binary is used to run bytecode without adding it to PATH. This distinction was easy to miss while confirming what “host” meant; it also made “public host” sound like an HTTP service when the actual operation is a local native CLI.

Proposed fix: give install declarations a short lifecycle description in lmscript help, including first-run network access, cache reuse, release resolution and that the host is not installed globally. In tutorials, call these native host programs and describe remote distribution separately from local execution. Prefer an explicit version pin in reproducible examples, with the latest tag labeled as an update-following choice.

## Prompt and reference consistency

The quickrun task said “public lmdraw host” while the linked API guide says lmdraw performs no network access. The Lead spent part of the run resolving whether there was a public rendering service before choosing the documented CLI workflow.

The getting-started page also used lmctl quickrun, which current lmctl help identifies as a deprecated alias for autorun. That means an example can still work while teaching a command that the CLI asks users to leave behind.

Proposed fix: keep generated task text aligned with the linked guide and use current command names in examples. The lmdraw task now directs agents to use the native host in their authored drawing script; the getting-started page distinguishes the orchestration scripts run with autorun from the agent-authored drawing script, which uses the native DSL declaration to render locally.
