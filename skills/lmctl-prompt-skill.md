# How to send a prompt to another agent

You can send a prompt to another agent and read its answer.

```sh
lmctl prompt <teamfile> <alias> "<your prompt>"
```

Example:

```sh
lmctl prompt ./my-team.lmctl Coder "Add a test for the retry path. Report the file you changed."
```

The command blocks until that agent replies, then prints the reply.

If it answers `Coder is busy; wait and retry`, nothing was sent and nothing is held
for you. Wait and run it again.

The alias is just a name in the teamfile. Every member is reached the same way.
