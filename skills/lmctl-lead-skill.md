# Moved

There is no "Lead skill". `Lead`, `Coder` and `Reviewer` are aliases you choose in a
teamfile; lmctl gives none of them any capability the others lack, and a freshly seeded
agent is told only to establish its session — it does not know lmctl exists.

What used to be on this page is now split in two:

- **[How to send a prompt to another agent](lmctl-prompt.md)** — the one thing you give
  an agent to let it talk to another. Paste it into any member's session; the alias does
  not matter.
- **[Troubleshooting lmctl](troubleshooting.md)** — busy errors, timeouts, background
  execution, long prompts, inspecting an agent, reseeding a drifted one, durable memory.

For anything repeatable, prefer `lmctl script` (LMScript) over teaching an agent to
coordinate other agents.
