# Lenses

All commands run in the project directory. `trail` is on PATH after `npm install -g claude-trail`; otherwise use `npx claude-trail`.

## 🤝 `trail handoff`

| Flag | Meaning |
|---|---|
| `--print` | render to stdout instead of writing |
| `--to <path>` | write to this file (markers protect your own content) |

Rendered sections: last session (start, duration, cost, model), what you asked, files touched with `+added/-removed`, commands run with non-zero exits flagged, whether a test command ran, open loops extracted from Claude's last message, Claude's last words, top corrections.

Open loops match `next step`, `todo`, `remaining`, `pending`, `blocked`, `not yet`, `下一步`, `待办`, `未完成`, `剩余`, `还需要`, `尚未`, `阻塞`.

## 🔍 `trail blame <file>`

| Flag | Meaning |
|---|---|
| `--summary` | percentages only |
| `--json` | full structure for tooling |

Columns: line number, `🐾 <session>` or `human` or `·` (noise), date, the prompt that produced it, the line. Latest write of a given line content wins.

## 💸 `trail cost`

| Flag | Meaning |
|---|---|
| `--since 7d` | window (`h`, `d`, `w`, `m` suffixes or an ISO date) |
| `--json` | per-session objects |

`trail statusline` prints `🐾 $1.23 · 326k tok · 2 edits`. It accepts Claude Code's status line JSON on stdin and prefers the live `total_cost_usd` when present.

## 🌱 `trail rules`

| Flag | Meaning |
|---|---|
| `--limit 20` | rows to show |
| `--apply` | append to `CLAUDE.md` |
| `--min 2` | minimum repeat count to apply |
| `--file CLAUDE.md` | target file |

Detection runs at prompt time (`src/log/corrections.ts`). Prompts over 600 characters and slash commands are never corrections. Clustering lower-cases, strips punctuation and filler, and trims to 120 characters.

Applied rules are remembered in `.claude-trail/rules.json` so they are never appended twice.

## 📰 `trail digest`

| Flag | Meaning |
|---|---|
| `--since 24h` | window |
| `--all` | every project in the registry |
| `--telegram` | send via Bot API (plain text) |
| `--json` | structure |

## 🗄️ `trail vault [dir]`

Writes `Claude Trail/<project>/sessions/<date>-<id>.md`, `files/<slug>.md`, `index.md`. Default dir is `.claude-trail/vault`, or `vault.dir` from config. `--since` limits sessions. Re-running overwrites notes with the same name, so it is safe to schedule.

## 🛂 `trail export [dir]` / `trail import <dir>`

Export writes `passport.yaml`, `profile.md` (only if absent), `preferences.md`, `areas/<project>.md`. `--json` dumps the raw event log instead. Import reads `[stated]` lines from `preferences.md` and records them as `rule.imported` events, which show up in `trail rules` tagged `(imported)`.

## Setup commands

`install [--uninstall]`, `uninstall`, `doctor`, `status`, `config <key> [value]`, `lang <en|zh> [--project]`, `log [--tail n]`, `version`.
