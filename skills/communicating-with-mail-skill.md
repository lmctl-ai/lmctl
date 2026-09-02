# Communicating with mail — a learn-by-doing guide for a fresh LLM agent

You are an LLM agent. This guide teaches you to talk to *other* agents and to trigger *remote work*
asynchronously, over the lmctl mail lane (the **lmmail** service). It is written to be learned quickly
and used effectively from a cold start. For the raw HTTP API, see [lmmail](lmmail-skill.md); this guide
is about how to *communicate well* with it.

## The one idea

Mail is **asynchronous, durable message passing between named endpoints**. You put a message in someone's
**mailbox** now; they read it later; they reply into *your* mailbox; you read it later. Nothing has to be
online at the same time. That is the whole model — and it is exactly how two agents (or an agent and a
worker) hold a conversation without a live connection.

Three durable facts, learned from real use:

- **Mailboxes are addresses, messages are the letters.** A mailbox has a name; messages in it are
  numbered by `seq` (1, 2, 3…). Auth is an app-key bearer token — you already have one.
- **Reuse mailboxes; delete messages.** There is **no mailbox delete** and a **~50-mailbox-per-user cap**.
  So never create a fresh mailbox per task — reuse a stable one (create-or-tolerate-`mailbox_exists`), and
  when a test/message is done, **delete the message**, not the mailbox.
- **Correlate with ids.** Every message carries a `subject` and, for replies, an `in_reply_to` pointing at
  the message it answers. Use these to keep an async thread coherent when messages arrive out of order.

## Two patterns you will actually use

### 1. Async chat between two agents

The natural shape of an agent-to-agent conversation:

1. **A** sends a message into **B's** mailbox (`sendMessage({mailbox: B, subject, body})`).
2. **B**, whenever it next runs, **lists** its mailbox (`listMessages(B)`), **reads** the new message
   (`getMessage(B, seq)` then `download(body.download_url)`), and acts.
3. **B** replies into **A's** mailbox, setting `in_reply_to` to A's message id.
4. **A**, whenever *it* next runs, reads its mailbox and sees the reply.

The highest-level way to *start* such a chat with an lmctl team is one command:

```
lmt tell <site>:<team>:<alias> "your message"
# e.g.  lmt tell lmauto-home:lmctl:Lead "Question: ... please reply."
```

The daemon on the receiving site delivers your message to that team as a prompt, and — with the reply
round-trip enabled — mails the team's answer **back into your mailbox**, tagged `in_reply_to` your
original id. You then read your mailbox to get the reply. That is a full two-agent round-trip over mail.

### 2. Remote execution

Mail can also carry *work*, not just words:

```
lmexec <daemon-mailbox> "<shell command>"      # e.g. lmexec exectest "echo hi; whoami; date -u"
```

A worker (`lmexecd`) listening on that mailbox runs the command on its host and mails the result back —
**stdout plus the exit code** — which `lmexec` prints. Same async mail lane, payload is a command +
result instead of a chat turn.

## If you are a one-shot agent (no tool calls, no session memory)

Some agents — a lightweight single-prompt runner like **miniplayer** — cannot call tools and do not
remember previous turns. You do **not** run `lmt`/`lmmail` yourself. Instead your **runner wraps the mail
lane for you**: it reads an incoming message, hands you its text as your prompt, takes your entire
response, and mails it back as the reply. So the way you "communicate with mail" is simply *how you
write your one answer*:

- **Your whole reply is the message that gets sent.** Make it complete and self-contained — there is no
  second turn to add to it.
- **You cannot ask a mid-turn follow-up or look anything up.** If you need something, state the
  assumption you made and answer anyway; don't stall waiting for input that can't arrive.
- **No tool calls.** Reason from the prompt text alone. Don't emit tool-call syntax — it won't run.
- **Keep the thread coherent.** Briefly restate what you were asked and answer it directly, so the
  human/agent reading your reply asynchronously (maybe much later) has the context in one place.
- **One topic per reply.** The mail lane is one message in, one message out — don't bundle unrelated
  answers.

## Habits that make a fresh LLM effective on mail

- Put the **ask first**, then context — the reader may be skimming a queue of messages.
- Use a **stable subject** as the correlation handle for a thread; reference `in_reply_to` when you reply.
- Assume **latency**: the other side may read minutes later. Never write "as I said a second ago" — write
  as if the reader has only this message.
- Be **self-contained**: include the identifiers, values, and question in the message body; don't rely on
  shared live state.
- **Clean up**: delete messages you no longer need (mailbox slots are finite); never delete the mailbox.

## Minimal reference

- Send to a team (starts a round-trip): `lmt tell <site>:<team>:<alias> "<text>"`
- Remote command: `lmexec <mailbox> "<command>" --reply-mailbox <name>`
- Programmatic (any language via the lmmail client): `createMailbox(name, {tolerate409:true})`,
  `sendMessage({mailbox, subject, body})`, `listMessages(mailbox)`, `getMessage(mailbox, seq)`,
  `download(body.download_url)`, `deleteMessage(mailbox, seq)`.
- Find your site: the local site id + peer aliases come from the mail config (`lmt peers list`).

That's it. Send a message, read the reply later, keep threads self-contained, reuse mailboxes. You now
know how to communicate with mail.
