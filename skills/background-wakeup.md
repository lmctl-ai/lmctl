# Skill: Background wake-up

This wake-loop skill is obsolete for current lmctl.

Default delegation is synchronous `lmctl prompt`: it blocks for one member turn
and returns that member's reply. Use the provider harness's background execution
when you need the calling session to remain responsive.

Do not document a separate lmctl wake or harvest command for LLMs to call.
A busy receiver returns a busy error and no prompt is held for later delivery.
External supervision belongs to the provider or operator harness, not regular
agent workflow.

Use the Lead skill for current delegation guidance.
