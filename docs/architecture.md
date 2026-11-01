# Architecture

claude-trail is three things: five hooks, one append-only log, and seven pure functions over it.

## Hooks

| Event | Matcher | What is appended | Output |
|---|---|---|---|
| `SessionStart` | `startup\|resume\|clear\|compact` | `session.start` | the handoff context, printed to stdout (Claude reads it) |
| `UserPromptSubmit` | all | `prompt` with optional `correction` | nothing |
| `PostToolUse` | `Edit\|Write\|MultiEdit\|NotebookEdit\|Bash` | `tool` | nothing |
| `Stop` | all | `stop` with a cost snapshot and Claude's last words; rewrites the handoff | nothing |
| `SessionEnd` | all | `session.end` with duration; rewrites the handoff | nothing |

Every hook is `node dist/hook.js <event>`. It reads one JSON object from stdin, appends one line, exits 0. If stdin is not a Claude Code payload (no `session_id`) it writes nothing. If anything throws, it still exits 0; set `TRAIL_DEBUG=1` to see the stack on stderr.

On `compact` the SessionStart injection is one line: Claude already has the thread.

## The log

`.claude-trail/events.jsonl`, one JSON object per line, schema version `v: 1`.

```jsonc
{ "v":1, "ts":"2026-10-30T09:12:00Z", "session":"a1f9…", "type":"session.start", "source":"startup", "cwd":"/p", "lang":"en" }
{ "v":1, "ts":"…", "session":"a1f9…", "type":"prompt", "id":"p1", "text":"add retry", "correction":{"strength":"strong","lang":"en","text":"…"} }
{ "v":1, "ts":"…", "session":"a1f9…", "type":"tool", "tool":"Edit", "file":"src/retry.ts", "added":2, "removed":1, "keys":["9b1c2d3e","…"], "promptId":"p1" }
{ "v":1, "ts":"…", "session":"a1f9…", "type":"tool", "tool":"Bash", "cmd":"npm test", "tests":true, "promptId":"p1" }
{ "v":1, "ts":"…", "session":"a1f9…", "type":"stop", "lastText":"Done. Next step: …", "cost":{ "usd":1.84, "exact":true, "model":"claude-opus-5-5", "usage":{…}, "linesAdded":180, "linesRemoved":23, "turns":9 } }
{ "v":1, "ts":"…", "session":"a1f9…", "type":"session.end", "reason":"other", "cost":{…}, "durationMs":2040000 }
{ "v":1, "ts":"…", "session":"cli", "type":"rule.applied", "text":"always run npm test before you say you're done" }
{ "v":1, "ts":"…", "session":"cli", "type":"rule.imported", "text":"…", "source":"/path/to/passport" }
```

`keys` are FNV-1a hashes of each trimmed line Claude wrote. Blank lines, lone braces and lines under four characters are skipped. Up to 5000 per event.

Redaction runs inside the JSON serialiser, so it applies to every string field. See `src/log/redact.ts`.

## Cost

Claude Code appends a `cost-state` record to its own transcript with `totalCostUSD`, `modelUsage` and line counts. `Stop` and `SessionEnd` receive `transcript_path`, so claude-trail reads the last such record and stores it. When it is absent, it sums `usage` from every assistant message and prices it with `src/log/pricing.ts`, marking `exact: false`.

## Project registry

`~/.claude-trail/projects.json` is upserted on every `SessionStart`. It powers `trail digest --all`. Set `CLAUDE_TRAIL_HOME` to move it.

## What is not stored

Tool outputs, file contents, diffs, thinking, Claude's intermediate messages, anything inside `<private>`, anything after 500 characters of a prompt, anything after 200 characters of a Bash command.

## Performance

Node startup dominates: 30 to 50 ms per hook on a laptop. The log is read fully by the CLI lenses; at 10,000 sessions it is a few MB and parses in well under a second. There is no index because there is nothing to index.
