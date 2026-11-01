# Tutorial infrastructure

Run `npm run check:lmscript-site` from the repository root. It recursively checks
page links (honoring each page's base URL), every displayed Script block, all
example sources, existing top-level output/diagram/error goldens, and eight
agentic recipes against the Output section of their pages. Live transcript
samples cannot satisfy an offline output assertion. Missing recipe pages fail.
Agentic checks run before the legacy native-host checks, so a pre-existing
native-host failure cannot hide missing or broken agentic fixtures.

`LMSCRIPT_BIN=/absolute/path/to/lmscript` selects the compiler under test. The
published compiler remains the default. The new recipes require the unreleased
LLM features described in SPEC6; old native-host tutorials may require migration
before the full check passes on the mono compiler. Host installation uses the
published compiler separately (`LMHTML_BOOTSTRAP_BIN` override), because the
mono package and published package have different version numbering. Set
`LMHTML=/absolute/path/to/lmhtml` to use an existing compatible lint host.

For focused checks:

```sh
python3 -m unittest discover -s scripts/lmscript-site -p 'test_*.py'
node --test scripts/lmscript-site/test_compile_mock.mjs
python3 scripts/lmscript-site/pages.py
LMSCRIPT_BIN=/absolute/path/to/lmscript python3 scripts/lmscript-site/agentic.py offline
```

Recipe discovery requires eight distinct pages with `Script: NAME.lms` headings
and an `Output` heading containing one `pre/samp`. Sources live in the sibling
examples directory. Helpers can have source-only pages; they are not executed.
Each recipe executes with no arguments in its own temporary working directory.
Recipes must create their own fixtures there and must support noninteractive
offline operation. Keep any external tool fixture requirements documented in
the recipe. The runner enforces a five-minute deadline per fixture.

The runner downloads lmmock v0.1.94 from GitHub and verifies its raw binary using
lmmock.lock on every use, including cached uses. Linux/macOS x64/arm64 are pinned
from the release's SHA256SUMS. Cache location is XDG_CACHE_HOME/lmctl-site or
~/.cache/lmctl-site. Updating the lock requires reviewing the release and hashes.
Downloads and executable fixture tools must be provisioned before claiming a
fully disconnected run. Model requests themselves use a loopback lmmock exec
server with a fake DeepSeek key; no upstream forwarding is configured.

Manual, billable live run (never called by CI):

```sh
LMSCRIPT_BIN=/absolute/path/to/lmscript bash scripts/lmscript-site/live.sh agentic
```

Supply OLLAMA_API_KEY through the environment. This selects
ollama-cloud/deepseek-v4.1-flash, removes any mock URL, prints model/date plus
per-recipe stdout, and redacts known credential environment values. It does not
rewrite pages: the author reviews and records transcripts. No publication or
remote writes are performed by this infrastructure.

The runner generates schema.json beside a temporary copy of mock-model.lms,
statically checks every example with LMSCRIPT_BIN, then compiles the fixture's
single _lmcode_ block with parseDslSchema/compileDsl from that compiler's
dist/dsl.js. It resolves the compiler executable's symlinks before locating the
module. For custom launcher layouts, set LMSCRIPT_DSL_MODULE to the absolute
path of the matching dist/dsl.js. Node must be on PATH. No separate historical
compiler is required. The runner starts lmmock exec --lmcode mock.dslb, avoiding
source mode and removed savedsl APIs. Schema JSON and bytecode stay temporary.
Offline stdin is closed and inherited AGENTIC_APPROVE is removed so the human
checkpoint cannot accidentally approve.
