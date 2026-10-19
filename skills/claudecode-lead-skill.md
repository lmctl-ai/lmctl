# Claude Code lmctl Lead skill

Run an lmctl team from Claude Code using the same verified delegation and review contract as any provider\.

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

## Harness integration

If the active harness documents a tracked background\-command tool and completion notifications, it may run the blocking CLI call for you\. Read the returned result before deciding the next action\. Tool names and notification behavior depend on the installed harness; no particular Monitor or Bash option is required by this skill\. Use absolute teamfile paths for cross\-repository work\.

## Related guidance

See [durable memory](</skills/durable-memory.md>) and the [Lead skill](</skills/lmctl-lead-skill.md>)\.
