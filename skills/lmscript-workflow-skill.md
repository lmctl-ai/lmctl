# lmscript workflow skill

Use this skill when you need to author a published lmctl **workflow** — a parameterised `.lms` (lmscript\) file a developer downloads, fills in a request form for, and runs unattended to drive multiple agent turns toward a result (for example: research an issue, propose a fix, have an independent reviewer check it, land it\)\.

## Workflow execution

An LMScript workflow is executable code that can sequence agent calls, inspect replies and enforce review gates\. A skill page is guidance; it does not itself dispatch a turn\. Choose human approval boundaries explicitly for the task\. Do not assume any external shared step library is installed\.

`parallel([call(), call()])` starts direct calls concurrently and returns their results in input order\. The example below uses explicit worker/reviewer calls\. Author must not equal reviewer; verify artifacts rather than trusting a success label\.

## What a workflow is

A workflow takes one argument: a path to a request\-form JSON file\. It never hardcodes who runs it or what it runs against — that's what makes it reusable by someone who didn't write it, not just a personal script\.

There are three rungs, and it's worth knowing which one you're on: doing a job by hand, turn by turn, is fine once and a smell by the third time; a script with paths and participants baked in is still tied to its author; a script driven entirely by a request form is a workflow anyone can run against their own repo\.

A **participant** in that form is one of two shapes, never mixed:

- `{ "teamfile": "...", "alias": "..." }` — an existing seeded team member, dispatched with `lm_prompt(teamfile, alias, prompt, {})`\.
- `{ "provider": "...", "model": "..." }` — an ad\-hoc session, no teamfile, dispatched with `lm_agent(member, prompt, {})`\. `lm_agent` writes the resulting `sessionid` back into the member map in place, so reusing the same map across calls continues the same session — that's how you get multi\-turn memory without a teamfile\.

Branch on the shape in a helper that **returns** — assigning a variable inside an `if` and reading it afterward is rejected as an undeclared variable, and it's the first thing a new author gets wrong:

```
fn dispatch(p, prompt) {
  tf = str(get(p, "teamfile", ""));
  if (tf != "" && tf != "null") {
    return lm_prompt(tf, str(get(p, "alias", "")), prompt, {});
  }
  return lm_agent(p, prompt, {});
}
```

There's no deep equality on maps, so compare a label instead of the maps themselves:

```
fn participant_label(p) {
  tf = str(get(p, "teamfile", ""));
  if (tf != "" && tf != "null") { return tf + ":" + str(get(p, "alias", "?")); }
  return str(get(p, "provider", "?")) + "/" + str(get(p, "model", "default"));
}
```

You don't bind tools in lmscript — providers inject their own capabilities (shell, file editing\) and you request them in prose\. What's actually available depends on the provider and its mode, so asking for something doesn't guarantee it happens\.

## Rules that must be enforced, not just followed

**1\. Validate the entire form before dispatching anything, and report every error at once\.** Unattended means a bad field found at turn 3 has already spent two agent turns\.

**2\. Write every turn to disk before you judge it\.** Output not yet on disk did not happen — a long run died at the end and lost everything it had produced\.

**3\. `status == "ok"` does not mean there is an answer\.** A provider can return ok with an empty reply\. Treat an empty reply as a failure, not as consent — and check the raw value before coercing it to a string, since `str(null)` is itself the 4\-character string `"null"`\.

**4\. Ask for a state line, then enforce it\.** End each prompt with an explicit instruction, such as *"end your reply with exactly one of DONE / BLOCKED / OTHER on its own final line,"* and read it back with a small helper that returns the word or `null`\. If it's `null`, the turn's outcome is unknown — stop, don't feed it forward\. Detecting a violation and continuing anyway is the same fail\-open mistake as rule 3\.

**5\. Author must not equal reviewer, and enforce it structurally\.** A model reviewing its own work in its own context is not a review — refuse to run if the two resolve to the same participant\. When a review matters, also pick a *different provider* for it, not just a different model: independent context helps expose different failure modes\.

Beyond the script itself: run your own tests before you push, and get a peer to review the workflow — author \!= reviewer applies to its author too\.

## A complete example

Words and a skeleton only teach shape\. This is the smallest thing that is still a real, runnable workflow — one participant, one turn, every guard that matters\. Read both files top to bottom in one sitting; that's the point of it\. Everything larger is this plus more steps\.

Prerequisite: you need at least one AI provider CLI installed and configured — `lmctl init` detects installed provider CLIs and writes configuration, and `lmctl ratelimit` shows you which ones are currently working on your machine\. Without that, this example (and any workflow\) has nothing to dispatch to\.

`minimal.lms`:

```
if (len(args) < 1) { println("usage: lmctl script minimal.lms <request.json>"); lm_exit(2); }
if (!file_exists(args[0])) { lm_error("no request form at " + args[0]); lm_exit(2); }
req = json_parse_safe(read_file(args[0]), null);
if (req == null) { lm_error(args[0] + " is not valid JSON"); lm_exit(2); }

// validate the WHOLE form before spending a turn, and report every fault at once
bad = [];
question = str(get(req, "question", ""));
if (question == "" || question == "null") { push(bad, "missing: question"); }
worker = get(req, "worker", null);
if (worker == null) { push(bad, "missing: worker"); }
acceptance = get(req, "acceptance", null);
if (acceptance == null) { push(bad, "missing: acceptance -- say what a good answer must contain"); }
out = str(get(req, "out", "/tmp/minimal"));
if (len(bad) > 0) {
  lm_error("request form is not usable -- nothing was dispatched:");
  for (i = 0; i < len(bad); i = i + 1) { lm_error("  - " + bad[i]); }
  lm_exit(2);
}

// build the prompt: the question, the bar, and the contract
criteria = "";
for (i = 0; i < len(acceptance); i = i + 1) {
  criteria = criteria + "  " + str(i + 1) + ". " + str(acceptance[i]) + "\n";
}
prompt = question
  + "\n\nYour answer must satisfy ALL of these. Address each by number, and give evidence for "
  + "each -- a command you ran, a file and line. Not an assurance.\n\n" + criteria
  + "\nEnd your reply with exactly one of DONE / BLOCKED / OTHER on its own final line.";

// one turn
println("asking " + str(get(worker, "provider", "?")) + "/" + str(get(worker, "model", "default")));
r = lm_agent(worker, prompt, {});

// persist BEFORE judging: output not yet on disk did not happen
raw = get(r, "reply", null);
reply = str(raw);
if (raw == null) { reply = ""; }
write_file(out + "-answer.md", reply);

// guards. each one closes a way a turn can look successful while being useless.
if (str(get(r, "status", "?")) != "ok") { lm_error("turn failed: " + str(get(r, "error", ""))); lm_exit(70); }
if (len(trim(reply)) == 0) { lm_error("empty reply with status=ok -- failure, not consent"); lm_exit(70); }
state = last_line_as_status(reply);
if (state == null) { lm_error("no state line -- outcome unknown, so not proceeding"); lm_exit(70); }
if (state == "BLOCKED") { lm_error("worker reported BLOCKED -- read " + out + "-answer.md"); lm_exit(75); }

// a verdict the human can check cheaply
write_file(out + "-VERDICT.md",
  "# " + question + "\n\nstate: " + state + "\n\n## Check each criterion yourself\n\n" + criteria
  + "\nThe answer claims to satisfy these. Verify the EVIDENCE it gave, not the claim.\n\n"
  + "## The answer\n\n" + reply + "\n");
println("done (" + state + ") -- verdict: " + out + "-VERDICT.md");
```

`minimal.json`:

```
{
  "question": "In this repository, how many .lms files exist and which is the largest by line count?",
  "worker": { "provider": "<your-provider>", "model": "<a-model-it-offers>" },
  "acceptance": [
    "states an exact count of .lms files in this repository",
    "names the largest file and its line count",
    "shows the command used to determine both"
  ],
  "out": "/tmp/minimal-demo"
}
```

Replace `<your-provider>` and `<a-model-it-offers>` with a provider you have configured — run `lmctl ratelimit` to see which ones are working on your machine, and leave `model` out entirely to use that provider's default\. There's no substitution step in a workflow request form (unlike a teamfile template, where `quickrun` expands `${Provider1}`\-style placeholders before use\) — `minimal.lms` reads this file and hands `worker` straight to the provider, so a placeholder here needs to already be a name the provider registry recognizes, or a real one you fill in by hand\.

Run it against your own checkout with `lmctl script minimal.lms minimal.json`\.

The failure path is as important as the success path, so here it is too — this is the real output from an empty `{}` as the request form: nothing is dispatched, and every problem is named at once rather than one at a time across three wasted turns\.

```
error: request form is not usable -- nothing was dispatched:
error:   - missing: question
error:   - missing: worker
error:   - missing: acceptance -- say what a good answer must contain
```

That's also why acceptance criteria are required — the workflow refuses to run without them\. With no criteria, the only thing left to judge an answer against is its own account of itself\.

## A larger request form

The shape above scales to more participants\. A two\-turn review workflow's form looks like this:

```
{ "title": "fix-flaky-test",
  "repo":  "/path/to/your/repo",
  "issue": "/path/to/issue.md",
  "author":   { "provider": "<your-provider>", "model": "<a-model-it-offers>" },
  "reviewer": { "provider": "<a-different-provider>", "model": "<a-model-it-offers>" },
  "land": false }
```

`title`, `repo`, and either `issue` (a file path\) or an inline `issue_text` describe the job\. `author` and `reviewer` are participants in either shape above, and must resolve to different participants — pick two providers you actually have configured, the same way as above\. `land` says whether the reviewer is allowed to commit and push once it's satisfied\.

## Common gotchas

| Thing | Reality |
| --- | --- |
| `lmctl script --check file.lms` | A static pass that catches undefined functions and arity mismatches before you spend a turn\. Always run it\. |
| ternary `a ? b : c` | Supported; only the selected branch is evaluated\. |
| regex | JavaScript `RegExp` syntax — `\\s`, not `[[:space:]]`\. |
| `push(arr, x)` | Mutates the array in place **and** returns it\. Write `push(a, x)` on its own line rather than `a = push(a, x)`\. |
| defaults | `get(map, key, fallback)`\. There's no `?.` or `??`, and no deep `==` on maps\. |
| built\-ins | `json_parse_safe(s, fallback)` returns parsed data or the fallback on a parse failure\. `read_file(path)` returns UTF\-8 text\. `trim(s)` strips whitespace from both ends\. |
| `lm_error` / `lm_exit` | `lm_error(msg)` writes to stderr and records the message for the final summary; normal completion then exits 1\. `lm_exit(code)` takes precedence, even `0`, and stops ordinary execution; owned resources are cleaned up during scope unwinding\. |
| variables & scope | First assignment creates a binding; a binding made inside a branch isn't visible after it ends\. Declare a variable before an `if` if you need to update it from inside\. `let` shadows within the current block; `var` is unsupported\. |
| strings | Concatenate with `+`\. Use formatted strings such as `f"value {x}"` for interpolation; an ordinary string does not interpolate\. |
| shell timeouts | Never wrap `lmctl` in a shell `timeout` — it SIGTERMs mid\-turn, regardless of which `lmctl` subcommand it wraps\. |
| parsing lmctl's own data | Don't hand\-roll a teamfile parser\. `lm_members(teamfile)` returns `{alias, provider, model, sessionid}` directly, and hand\-rolled parsers have shipped real defects\. |
| library files | Imports are ordered source includes; top\-level declarations and statements are permitted\. Keep imports explicit and use only trusted sources\. |

## Checking a workflow before you run it

Run `lmctl script --check yourworkflow.lms` before every turn you'd otherwise spend debugging live — it's a static pass, so it costs nothing and catches undefined functions and arity mismatches for free\.

Finish a run with a verdict file the human can check quickly: what changed, whether the tree actually matches what the agent claims, and whether each new test was actually seen to fail before the fix — that last claim is the easiest one to fake and the most valuable one to check\. That file is the sanity check this whole page keeps coming back to: you're gated at the decision, not driving every step\.
