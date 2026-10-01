# lmctl recovery guidance

This URL is retained for compatibility with older skill links. The current
public `lmctl` command surface does not include the former transcript-replay
command family, so do not copy recovery commands from older documentation.

For current recovery work, use [Troubleshooting lmctl](troubleshooting.md):

- keep important state in committed `durable-memory/`;
- inspect a member with `lmctl status`, `lmctl tail`, and provider-native
  session tools;
- reseed a drifting member by removing its `sessionid=` from the teamfile and
  running `lmctl seed` from outside that session.

Provider transcripts and version-control history remain provider- and
repository-specific recovery sources. lmctl does not currently expose a
public transcript-replay command.
