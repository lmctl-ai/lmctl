# lmctl

> A provider-agnostic control plane for teams of AI coding agents.

[**lmctl.com**](https://lmctl.com) · [**Documentation**](https://lmctl.com/lmctl) · [**npm**](https://www.npmjs.com/package/@lmctl-ai/lmctl) · [**lmprobe**](https://lmctl.com/lmprobe)

AI agents shouldn't be locked to one provider, one workflow, or one context
window. **lmctl** is a local-first control plane for running *teams* of AI
coding agents — across providers, with adversarial cross-provider review and
durable memory, composed in plain text.

It's not an IDE and not another chatbot. lmctl coordinates the agent CLIs you
already use (Claude Code, Codex, Copilot CLI, Qwen Code, Antigravity, and more),
so a Claude *lead* can hand coding to *Qwen* or *Codex* and have another
provider review it — the reviewer a different provider *and* model from the
author, not the same model in a different hat.

```bash
npm install -g @lmctl-ai/lmctl
```

## Why lmctl — the three lock-ins

Every agentic tool wants to be the whole platform. That leaves you with three
kinds of lock-in. lmctl is built to remove each one:

- **Provider lock-in.** Most "AI code review" is really *self-review* — one
  model grading its own work in a different hat, which rubber-stamps its own
  blind spots. lmctl makes review **adversarial**: the reviewer is a different
  provider *and* model from the author, so the check is genuinely independent of
  the work — different models have different (uncorrelated) blind spots, and that
  diversity is the point: a varied team catches what one model, or its clones,
  can't. And "provider-agnostic" is literal — alongside the major CLIs, the
  first-class CLIs include Claude Code, Codex, Copilot CLI, Qwen Code, and
  Antigravity, while the OpenCode provider reaches **any model, local (Ollama)
  or remote** (DeepSeek, Qwen, OpenRouter, Copilot's GPT/Claude/Gemini, …);
  pick any collection and put them in one team, not one model at a time.
- **Workflow lock-in.** When most tools say "multi-agent," one provider
  auto-spawns the agents and you just watch. lmctl puts **you** in charge: you
  divide the work and build the team in plain text (a lead talks to its members;
  teams connect to other teams), choose which provider and model plays each role
  — top-tier for design, leaner models for routine coding — and tune how they
  interact. Agents from different providers, orchestrated by you, not clones of
  one.
- **Context-window lock-in.** A bigger window still eventually loses to a
  long-running project, and a session is bound to one provider and one folder.
  lmctl spreads work across specialized agents (planning, coding, review) and
  keeps a provider- and directory-agnostic **durable-memory** — the team's
  shared brain. If a session fills up or breaks, start a fresh one; nothing is
  lost.

## How it works

- **Teams in plain text.** Define a team in a `.lmctl` file — members, the
  provider/model each one uses, and the role each member plays. No DSL to learn;
  it reads like a list.
- **durable-memory.** Every member, whatever its provider, reads
  `durable-memory/` as shared context. Knowledge survives fresh sessions and
  swapped-in agents.
- **Workflows you can run from a URL.** Orchestrations are plain JSON. Run a
  hosted one directly:

  ```bash
  lmctl run https://lmctl.com/workflows/research.compound.json
  ```

## Get started

1. Install: `npm install -g @lmctl-ai/lmctl`
2. Follow [**Install & first run**](https://lmctl.com/lmctl/docs/tutorials/install-first-run)
   and the other [**tutorials**](https://lmctl.com/lmctl/docs/category/tutorials)
   to define your first team and run it.
3. Browse the [**CLI reference**](https://lmctl.com/lmctl/docs/manuals/cli-reference)
   and [**glossary**](https://lmctl.com/lmctl/docs/glossary) for the full command
   and teamfile reference.

## About this repository

This repo is the source of **lmctl.com** — the homepage and the documentation
site (plus the runnable `workflows/`, `skills/`, and `examples/` catalogs hosted
on the site). The lmctl CLI itself is distributed on npm as
[`@lmctl-ai/lmctl`](https://www.npmjs.com/package/@lmctl-ai/lmctl).

The companion code-search CLI **lmprobe** is documented at
[lmctl.com/lmprobe](https://lmctl.com/lmprobe), distributed as
[`@lmctl-ai/lmprobe`](https://www.npmjs.com/package/@lmctl-ai/lmprobe), and has
an agent-facing skill at
[skills/lmprobe-skill.md](./skills/lmprobe-skill.md).
The hosted lmprobe manual is sourced from the public lmprobe repo, normally
checked out at `../lmprobe`, and published to the
`s3://lmctl-website-prod/lmprobe/` prefix via
[`scripts/deploy-lmprobe.sh`](./scripts/deploy-lmprobe.sh).
Do not deploy from `../lmprobe-src/site`; that staging tree is stale.

To work on the docs locally and deploy the site, see [`DEPLOY.md`](./DEPLOY.md):

```bash
npm ci
npm run start
```
