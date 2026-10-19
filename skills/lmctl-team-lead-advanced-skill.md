# lmctl — Team Lead skill (advanced\)

Inspect session state, preserve knowledge, and replace sessions deliberately when recovery is necessary\.

## Delegate and inspect

Run `lmctl prompt "<teamfile>.lmctl" Coder "Implement the task and report evidence."` to delegate inline\. The command blocks for one member turn and returns its reply\. Delegation is an action: describing a handoff does not perform it\.

If the receiver `is busy; wait and retry`, inspect with `lmctl status "<teamfile>.lmctl" Coder` or `lmctl tail "<teamfile>.lmctl" Coder`, then retry later\. Do not resend work already accepted\. A human using `lmctl terminal` can legitimately keep a member busy\.

```
lmctl status "<teamfile>.lmctl" --details
lmctl tail "<teamfile>.lmctl" Coder
lmctl prompt "<teamfile>.lmctl" Coder --prompt-file task.md
```

Use an editor or file\-writing tool to create `task.md`; avoid shell expansion of backticks, `$VAR`, and `$(...)` in task text\. Never wrap lmctl in a shell timeout\. Read the reply and verify artifacts and tests: exit status alone is not proof that the task is complete\.

## Review and durable knowledge

Route implementation to Coder, then route the result to an independent Reviewer\. Send defects back for repair and re\-review\. Author must not equal reviewer\. Resolve disagreements from evidence; escalate unresolved decisions to the operator\. Publish only within the operator's authorization\.

Commit durable decisions, constraints and current status in `durable-memory/`, with an index\. Explicitly instruct a new member to read the relevant files: automatic durable\-memory onboarding is not guaranteed\. Session history is not a substitute for committed project knowledge\.

## Replace a session deliberately

Inspect `lmctl status "<teamfile>.lmctl" Coder` first\. Preserve current project knowledge and coordinate with the operator before replacing a running session\. From another session, remove only the target member's `sessionid=` field, optionally update `model=`, then run:

```
lmctl lint "<teamfile>.lmctl"
lmctl seed "<teamfile>.lmctl"
lmctl prompt "<teamfile>.lmctl" Coder "Read durable-memory/index.md and the task notes, then report your understanding."
```

Seed initializes missing or placeholder session ids; it does not replay the old conversation\. Keep other members' session fields intact\. Inspect provider\-specific model choices with `lmctl models --help` and `lmctl status "<teamfile>.lmctl" --details` rather than asking a model to identify itself\.

## Cross\-team work

Use an absolute teamfile path with the same prompt command to address another team\. Inspect status before sending\. A busy result is evidence to wait, not a reason to interrupt the current turn\.

## Related guidance

See [durable memory](</skills/durable-memory.md>) and the [Lead skill](</skills/lmctl-lead-skill.md>)\.
