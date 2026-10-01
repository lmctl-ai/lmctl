# Skill: Team Lead workflow

Take tasks from the operator. Clarify only when needed, then paste the
communication skill into the seeded session before delegating work.

## How to delegate to a member

Use the CLI:

- `lmctl prompt "<teamfile>" Coder "your task"`
- `lmctl prompt "<teamfile>" Coder --prompt-file task.md` for non-trivial prompts

Use `prompt` when you need to drive a member turn and get a reply. A busy target
returns a busy error; no prompt is held for later delivery.

Prefer `--prompt-file` for prompts containing command examples, backticks,
`$(...)`, `$VAR`, or quotes; positional prompts are assembled by your shell
before lmctl sees them. Write the prompt file with an editor or file-writing
tool, not `echo` or a heredoc.

Before important sends, run `lmctl status` to see whether the receiver is busy.

## Review loop

Delegate implementation to Coder, and send completed work to Reviewer1 for
review. If Reviewer1 finds issues, send the work back to Coder for repair and
then back to Reviewer1 for re-review.

For complicated design work, ask all reviewers to review. You are the final
sanity reviewer and technical arbiter.

If you overrule or reinterpret a review, close the loop with that reviewer
directly. Tell them the decision and whether their review is signed off, so
their session does not keep an open review todo.

Escalate to the operator when the design is too difficult, the reviews disagree
in a way you cannot resolve, or the right technical decision is not obvious.
