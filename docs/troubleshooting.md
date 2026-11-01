# Troubleshooting

Start with:

```bash
trail doctor
TRAIL_DEBUG=1 claude   # hook errors go to stderr
```

| Symptom | Cause | Fix |
|---|---|---|
| Nothing in `.claude-trail/` | Hooks registered while Claude Code was open | Restart Claude Code |
| `Executable not found: node` | Claude Code's PATH lacks Node | Install Node 20+ system-wide, or put the absolute path in the hook command |
| `trail: command not found` | Marketplace install does not add a bin | `npx claude-trail …` or `npm i -g claude-trail` |
| Cost says `estimated` | Transcript has no `cost-state` yet, or is from an older Claude Code | Wait a turn; or override `pricing` in settings |
| Blame shows `human` for Claude's code | Line was reformatted (wrapped) after it was written | Hashes are per trimmed line; reformat before Claude writes, or accept |
| Handoff is empty | Session had no prompts and no tool calls | Expected |
| Two copies of the trail block in HANDOFF.md | Markers were edited by hand | Delete both, run `trail handoff --to HANDOFF.md` |
| Telegram not sent | Token or chat id missing | `trail config telegram <token> <chatId>` |
| Windows | Hooks run `node "…/dist/hook.js"`, no shell needed | Make sure `node` is on the user PATH |

## Reset

```bash
rm -rf .claude-trail            # this project's log
rm -rf ~/.claude-trail          # global settings and registry
trail install --uninstall       # remove hooks from ~/.claude/settings.json
```
