---
name: trail-search
description: Answer questions about this project's Claude Code history using the claude-trail log. Use when the user asks who or which prompt wrote a line, what a session cost, what happened last time, what they keep correcting, or asks for a handoff or digest. Runs the trail CLI; never guesses from memory.
---

# trail-search

The project has a claude-trail log at `.claude-trail/events.jsonl`. Answer history questions by running the CLI, then summarise the output. Use `npx claude-trail` if `trail` is not on PATH.

| Question | Command |
|---|---|
| Which prompt / session wrote this line or file? | `trail blame <file>` (add `--summary` for percentages) |
| What did the last session / this week cost? | `trail cost --since 7d` |
| Where did we leave off? What is still open? | `trail handoff --print` |
| What does the user keep telling me? | `trail rules` |
| What happened today across projects? | `trail digest --since 24h --all` |
| Raw events | `trail log --tail 50` |

Rules:
- Run the command; do not reconstruct history from the conversation.
- Quote session ids as the six-character short form the CLI prints.
- If `trail rules` shows a correction with ×2 or more, follow it in this session without being asked, and offer `trail rules --apply`.
- Respect `TRAIL_LANG`: if the output is in 中文, answer in 中文.
