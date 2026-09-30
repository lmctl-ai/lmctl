# lmscript workflow skill

Use this skill when you need to author a published lmctl **workflow** — a
parameterised `.lms` (lmscript) file a developer downloads, fills in a request
form for, and runs unattended to drive multiple agent turns toward a result
(for example: research an issue, propose a fix, have an independent reviewer
check it, land it).

## Why a workflow, not a skill or a spec

A coding-tool skill is provider-specific, is one step per invocation, and a
human triggers each step with a slash command. Spec-driven development
produces a document — nothing runs, and the human still executes it end to
end. An lmscript workflow is provider-agnostic, actually executes, and
carries a job across many steps in a single unattended run. A skill doc and
a spec are static; a workflow turns them into a living, executable process.

That is not a human approving each cycle or unblocking each turn from
inside the iteration — that's exactly what a skill or a spec forces. The
human sits at two boundaries, and nowhere in between:

- **human** — designs the loop
- **metalead** — implements that design as an executable process
- **the loop** — runs; no human inside it
- **human** — reviews what it produced

Both boundaries are real mechanics, not aspirations. At the front, a design
phase runs and stops: it writes a design plus an independent review of it,
changes no files, and exits — a separate invocation implements. The human
decides in the gap between those two runs, because an unattended script
can't judge an approval and shouldn't be asked to. At the end, every run
finishes by writing one verdict document naming exactly what to check:
whether the tree matches what the agent claims, and whether each new test
was seen to fail before the change — that last claim is the easiest one to
fake and the most valuable one to check, which is why it's named explicitly
rather than left to the reader.

The front boundary is where the real cost sits, and it's worth paying: one
real enhancement went through four design-and-review rounds before any code
was written, and three of the requirements corrected in those rounds had
been put there wrongly by the human in the first place. That's the design
boundary doing its job, at a cost of minutes per round instead of a day
spent implementing the wrong design and reverting it.

One real run makes the case for "provider-agnostic" concretely: an author on
one vendor's model and a reviewer on another's, unattended, four turns
across two sessions. Partway through, the reviewer's provider was swapped
out after it twice skipped the file it had been told was highest priority —
the swap was a one-line change to the request form, not a rewrite. That's
what provider-agnostic buys. The output was accepted and merged by the team
that owned the repository.

Steps themselves are reusable components in a shared library, not copies
pasted into each workflow — a step returns a prompt and doesn't know who
will answer it, since the request form binds the participant. So a variant
of a workflow is a different assembly of steps, not a forked file.

## What a workflow is

A workflow takes one argument: a path to a request-form JSON file. It never
hardcodes who runs it or what it runs against — that's what makes it
reusable by someone who didn't write it, not just a personal script.

There are three rungs, and it's worth knowing which one you're on: doing a
job by hand, turn by turn, is fine once and a smell by the third time; a
script with paths and participants baked in is still tied to its author; a
script driven entirely by a request form is a workflow anyone can run
against their own repo.

A **participant** in that form is one of two shapes, never mixed:

* `{ "teamfile": "...", "alias": "..." }` — an existing seeded team member,
  dispatched with `lm_prompt(teamfile, alias, prompt, {})`.
* `{ "provider": "...", "model": "..." }` — an ad-hoc session, no teamfile,
  dispatched with `lm_agent(member, prompt, {})`. `lm_agent` writes the
  resulting `sessionid` back into the member map in place, so reusing the
  same map across calls continues the same session — that's how you get
  multi-turn memory without a teamfile.

Branch on the shape in a helper that **returns** — assigning a variable
inside an `if` and reading it afterward is rejected as an undeclared
variable, and it's the first thing a new author gets wrong:

```
fn dispatch(p, prompt) {
  tf = str(get(p, "teamfile", ""));
  if (tf != "" && tf != "null") {
    return lm_prompt(tf, str(get(p, "alias", "")), prompt, {});
  }
  return lm_agent(p, prompt, {});
}
```

There's no deep equality on maps, so compare a label instead of the maps
themselves:

```
fn participant_label(p) {
  tf = str(get(p, "teamfile", ""));
  if (tf != "" && tf != "null") { return tf + ":" + str(get(p, "alias", "?")); }
  return str(get(p, "provider", "?")) + "/" + str(get(p, "model", "default"));
}
```

You don't bind tools in lmscript — providers inject their own capabilities
(shell, file editing) and you request them in prose. What's actually
available depends on the provider and its mode, so asking for something
doesn't guarantee it happens.

## Rules that must be enforced, not just followed

**1. Validate the entire form before dispatching anything, and report every
error at once.** Unattended means a bad field found at turn 3 has already
spent two agent turns.

**2. Write every turn to disk before you judge it.** Output not yet on disk
did not happen — a long run died at the end and lost everything it had
produced.

**3. `status == "ok"` does not mean there is an answer.** A provider can
return ok with an empty reply. Treat an empty reply as a failure, not as
consent — and check the raw value before coercing it to a string, since
`str(null)` is itself the 4-character string `"null"`.

**4. Ask for a state line, then enforce it.** End each prompt with an
explicit instruction, such as *"end your reply with exactly one of DONE /
BLOCKED / OTHER on its own final line,"* and read it back with a small
helper that returns the word or `null`. If it's `null`, the turn's outcome
is unknown — stop, don't feed it forward. Detecting a violation and
continuing anyway is the same fail-open mistake as rule 3.

**5. Author must not equal reviewer, and enforce it structurally.** A model
reviewing its own work in its own context is not a review — refuse to run
if the two resolve to the same participant. When a review matters, also
pick a *different provider* for it, not just a different model: one
provider twice skipped the file it was told was highest priority and
reported DONE both times; switching providers found a real defect in ten
minutes.

Beyond the script itself: run your own tests before you push, and get a
peer to review the workflow — author != reviewer applies to its author too.

## A minimal request form

```json
{ "title": "fix-flaky-test",
  "repo":  "/path/to/your/repo",
  "issue": "/path/to/issue.md",
  "author":   { "provider": "${Provider1}", "model": "${Model1}" },
  "reviewer": { "provider": "${Provider2}", "model": "${Model2}" },
  "land": false }
```

`title`, `repo`, and either `issue` (a file path) or an inline `issue_text`
describe the job. `author` and `reviewer` are participants in either shape
above, and must resolve to different participants. `land` says whether the
reviewer is allowed to commit and push once it's satisfied.

## Common gotchas

| Thing | Reality |
|---|---|
| `lmctl script --check file.lms` | A static pass that catches undefined functions and arity mismatches before you spend a turn. Always run it. |
| ternary `a ? b : c` | Does not exist. Use `if`/`else`. |
| regex | JavaScript `RegExp` syntax — `\\s`, not `[[:space:]]`. |
| `push(arr, x)` | Mutates the array in place **and** returns it. Write `push(a, x)` on its own line rather than `a = push(a, x)`. |
| defaults | `get(map, key, fallback)`. There's no `?.` or `??`, and no deep `==` on maps. |
| built-ins | `json_parse_safe(s, fallback)` returns parsed data or the fallback on a parse failure. `read_file(path)` returns UTF-8 text. `trim(s)` strips whitespace from both ends. |
| `lm_error` / `lm_exit` | `lm_error(msg)` writes to stderr and records the message for the final summary; normal completion then exits 1. `lm_exit(code)` takes precedence, even `0`, and stops execution before cleanup runs. |
| variables & scope | First assignment creates a binding; a binding made inside a branch isn't visible after it ends. Declare a variable before an `if` if you need to update it from inside. `let` shadows within the current block; `var` is unsupported. |
| strings | Concatenate with `+`. There's no string interpolation — no `${x}` inside a string literal. |
| shell timeouts | Never wrap `lmctl` in a shell `timeout` — it SIGTERMs mid-turn. Use `--idle-timeout 0` instead. |
| parsing lmctl's own data | Don't hand-roll a teamfile parser. `lm_members(teamfile)` returns `{alias, provider, model, sessionid}` directly, and hand-rolled parsers have shipped real defects. |
| library files | A library may only declare functions — a top-level assignment in an imported file is rejected with "libraries must only declare functions". A shared constant has to be a nullary function instead. |
| first session on some providers | A fresh session on some providers needs a first turn in permissive mode before it works reliably — check your provider's own notes before assuming a first call will behave like later ones. |

## Checking a workflow before you run it

Run `lmctl script --check yourworkflow.lms` before every turn you'd
otherwise spend debugging live — it's a static pass, so it costs nothing
and catches undefined functions and arity mismatches for free.

Finish a run with a verdict file the human can check quickly: what changed,
whether the tree actually matches what the agent claims, and whether each
new test was actually seen to fail before the fix — that last claim is the
easiest one to fake and the most valuable one to check. That file is the
sanity check this whole page keeps coming back to: you're gated at the
decision, not driving every step.
