# Configuration

## Files

| File | Scope | Written by |
|---|---|---|
| `~/.claude-trail/settings.json` | global | `trail lang`, `trail config lang|telegram` |
| `~/.claude-trail/projects.json` | global | every SessionStart |
| `.claude-trail/config.json` | project | `trail lang --project`, `trail config commit|vault.dir|handoff.path|name` |
| `.claude-trail/events.jsonl` | project | hooks |
| `.claude-trail/HANDOFF.md` | project | Stop, SessionEnd, `trail handoff` |
| `.claude-trail/rules.json` | project | `trail rules --apply` |
| `.claude-trail/state/<session>.json` | project | hooks (scratch; safe to delete) |

## Global settings

```json
{
  "lang": "zh",
  "telegram": { "token": "…", "chatId": "…" },
  "vault": { "dir": "/Users/me/Obsidian/Vault" },
  "handoff": { "path": "HANDOFF.md" },
  "pricing": {
    "claude-opus-5-5": { "input": 4, "output": 20, "cacheRead": 0.2, "cacheWrite": 5 }
  }
}
```

`pricing` values are USD per million tokens and match by longest model-id prefix. They are only used when a transcript has no exact `cost-state` record.

## Project config

```json
{ "lang": "en", "commit": true, "handoff": { "path": "HANDOFF.md" }, "vault": { "dir": "../vault" }, "name": "Fare Deck" }
```

`commit: true` rewrites `.claude-trail/.gitignore` so the log and handoff are versioned. Blame then works for every clone.

## Environment

| Variable | Effect |
|---|---|
| `TRAIL_LANG` | `en` or `zh`, beats every file |
| `CLAUDE_TRAIL_HOME` | where global settings and the registry live |
| `TRAIL_TELEGRAM_BOT_TOKEN`, `TRAIL_TELEGRAM_CHAT_ID` | digest delivery |
| `TRAIL_DEBUG` | print hook errors to stderr |

Language resolution order: `TRAIL_LANG` → project `lang` → global `lang` → `LC_ALL`/`LANG` starting with `zh` → `en`.

## Hooks

`npx claude-trail install` merges five entries into `~/.claude/settings.json`, each tagged by the string `claude-trail` in its command, and is idempotent. `trail install --uninstall` removes exactly those. The plugin marketplace route uses `hooks/hooks.json` instead and needs no settings edit.
