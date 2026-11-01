export const en: Record<string, string> = {
  "app.tagline": "A flight recorder for Claude Code. One log, seven lenses.",
  "app.paw": "🐾 claude-trail",

  "unit.min": "{n} min", "unit.h": "{n} h", "unit.s": "{n} s",
  "word.session": "session", "word.sessions": "sessions", "word.prompts": "prompts", "word.edits": "edits",
  "word.files": "files", "word.commands": "commands", "word.cost": "cost", "word.tokens": "tokens",
  "word.model": "model", "word.duration": "duration", "word.project": "project", "word.human": "human",
  "word.unknown": "unknown", "word.lines": "lines", "word.total": "total", "word.date": "date", "word.today": "today",
  "word.exact": "exact", "word.estimated": "estimated", "word.yes": "yes", "word.no": "no",

  "start.header": "🐾 claude-trail · what happened last time",
  "start.first": "🐾 claude-trail is recording this project for the first time. Next session you will wake up with a handoff.",
  "start.lastSession": "Last session {when} · {duration} · {cost} · {edits} edits in {files} files · {prompts} prompts",
  "start.files": "Files touched",
  "start.lastWords": "Claude's last words",
  "start.openLoops": "Open loops",
  "start.corrections": "Corrections you keep giving (run `trail rules` to turn repeats into CLAUDE.md lines)",
  "start.more": "More: `trail handoff`, `trail blame <file>`, `trail cost`",

  "handoff.title": "HANDOFF",
  "handoff.updated": "Updated {when} by claude-trail · session {session}",
  "handoff.lastSession": "Last session",
  "handoff.started": "Started {start}, ran {duration}, cost {cost} ({model})",
  "handoff.prompts": "What you asked",
  "handoff.files": "Files touched",
  "handoff.commands": "Commands run",
  "handoff.tests": "Tests were run ({n} commands)",
  "handoff.noTests": "⚠️ No test command was run this session",
  "handoff.lastWords": "Claude's last words",
  "handoff.openLoops": "Open loops",
  "handoff.noOpenLoops": "Nothing flagged. If Claude mentioned a next step it would be here.",
  "handoff.corrections": "Corrections you gave",
  "handoff.noCorrections": "None recorded.",
  "handoff.written": "🤝 Handoff written to {path}",
  "handoff.empty": "No sessions recorded yet in this project.",

  "blame.header": "🔍 trail blame · {file}",
  "blame.col.line": "line", "blame.col.who": "who", "blame.col.when": "when", "blame.col.prompt": "prompt",
  "blame.summary": "{claude} lines by Claude ({pct}%), {human} lines human or unattributed, across {sessions} sessions",
  "blame.noFile": "File not found: {file}",
  "blame.noLog": "No trail log here yet. Run a Claude Code session first.",
  "blame.unattributed": "human",

  "cost.header": "💸 trail cost · {project}",
  "cost.col.session": "session", "cost.col.when": "when", "cost.col.model": "model", "cost.col.tokens": "tokens",
  "cost.col.edits": "edits", "cost.col.usd": "usd",
  "cost.total": "Total {usd} across {n} sessions ({exactness})",
  "cost.byModel": "By model",
  "cost.none": "No sessions with cost data yet.",
  "cost.statusline": "🐾 {usd} · {tokens} tok · {edits} edits",

  "rules.header": "🌱 trail rules · corrections that want to become CLAUDE.md lines",
  "rules.none": "No corrections recorded yet. When you tell Claude \"don't\" or \"always\", it lands here.",
  "rules.row": "×{count}  {text}",
  "rules.hint": "Run `trail rules --apply` to append repeats (×2 or more) to CLAUDE.md, or `--apply --min 1` for all.",
  "rules.applied": "Appended {n} rule(s) to {path}",
  "rules.nothingToApply": "Nothing new to apply.",
  "rules.section": "Rules learned by claude-trail",
  "rules.imported": "imported",

  "digest.header": "📰 trail digest · {period}",
  "digest.project": "{project}: {sessions} sessions, {prompts} prompts, {edits} edits, {cost}",
  "digest.topFiles": "Top files",
  "digest.corrections": "Corrections",
  "digest.quiet": "Quiet. No Claude Code sessions in this period.",
  "digest.total": "Total: {sessions} sessions · {edits} edits · {cost}",
  "digest.sent": "Sent to Telegram.",
  "digest.noTelegram": "Telegram not configured. Set TRAIL_TELEGRAM_BOT_TOKEN and TRAIL_TELEGRAM_CHAT_ID or run `trail config telegram <token> <chatId>`.",

  "vault.written": "🗄️ Wrote {n} session notes and {f} file notes to {dir}",
  "vault.index": "Claude Trail index",
  "vault.fileNote": "Sessions that touched this file",

  "passport.exported": "🛂 Exported passport vault to {dir}",
  "passport.imported": "🛂 Imported {n} preference(s) from {dir}",
  "passport.noVault": "No passport vault found at {dir}",

  "install.done": "✅ claude-trail hooks installed in {path}",
  "install.already": "Hooks already present in {path}; refreshed.",
  "install.restart": "Restart Claude Code. Your next session leaves footprints.",
  "install.uninstalled": "Removed claude-trail hooks from {path}",
  "install.statusline": "Optional status line: add  \"statusLine\": {\"type\": \"command\", \"command\": \"trail statusline\"}  to ~/.claude/settings.json",

  "doctor.title": "🩺 trail doctor",
  "doctor.node": "Node {v}",
  "doctor.hooks": "Hooks in ~/.claude/settings.json",
  "doctor.plugin": "Installed as a Claude Code plugin",
  "doctor.log": "Log at {path} ({size})",
  "doctor.lang": "Language: {lang}",
  "doctor.ok": "ok", "doctor.missing": "missing",

  "status.header": "🐾 claude-trail status · {project}",
  "status.line": "{sessions} sessions · {prompts} prompts · {edits} edits · {cost} · log {size}",

  "config.set": "Set {key} = {value}",
  "config.show": "Current config",
  "lang.set": "Language set to {lang}. 语言已设置为 {lang}。",

  "help.text": `🐾 claude-trail · {tagline}

Usage: trail <command> [options]

Lenses
  handoff [--to <path>] [--print]     🤝 write HANDOFF.md from the last session
  blame <file> [--summary] [--json]   🔍 which prompt wrote each line
  cost [--since 7d] [--json]          💸 what each session cost
  rules [--apply] [--min 2]           🌱 corrections that want to become CLAUDE.md lines
  digest [--since 24h] [--all]        📰 what Claude did, across projects (--telegram to send)
  vault [dir] [--since 30d]           🗄️ export sessions as Obsidian notes with backlinks
  export [dir] / import <dir>         🛂 memory-passport vault in or out

Setup
  install [--uninstall]               register hooks in ~/.claude/settings.json
  doctor                              check hooks, log, language
  status                              one-line summary of this project
  config <key> [value]                lang | commit | telegram | vault.dir | handoff.path
  lang <en|zh>                        switch language / 切换语言
  statusline                          print a status line (reads Claude Code's JSON on stdin)
  log [--tail 20]                     raw events

Env: TRAIL_LANG=zh · CLAUDE_TRAIL_HOME=~/.claude-trail`,
};
