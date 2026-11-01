export const zh: Record<string, string> = {
  "app.tagline": "Claude Code 的飞行记录仪。一份日志，七个镜头。",
  "app.paw": "🐾 claude-trail",

  "unit.min": "{n} 分钟", "unit.h": "{n} 小时", "unit.s": "{n} 秒",
  "word.session": "会话", "word.sessions": "个会话", "word.prompts": "条提示", "word.edits": "次编辑",
  "word.files": "个文件", "word.commands": "条命令", "word.cost": "花费", "word.tokens": "tokens",
  "word.model": "模型", "word.duration": "时长", "word.project": "项目", "word.human": "人工",
  "word.unknown": "未知", "word.lines": "行", "word.total": "合计", "word.date": "日期", "word.today": "今天",
  "word.exact": "精确", "word.estimated": "估算", "word.yes": "是", "word.no": "否",

  "start.header": "🐾 claude-trail · 上次发生了什么",
  "start.first": "🐾 claude-trail 第一次记录这个项目。下次会话开始时，你会收到一份交接记录。",
  "start.lastSession": "上次会话 {when} · {duration} · {cost} · {edits} 次编辑，涉及 {files} 个文件 · {prompts} 条提示",
  "start.files": "改动的文件",
  "start.lastWords": "Claude 最后说的话",
  "start.openLoops": "未完成事项",
  "start.corrections": "你反复给出的纠正（运行 `trail rules` 可把重复项写入 CLAUDE.md）",
  "start.more": "更多：`trail handoff`、`trail blame <文件>`、`trail cost`",

  "handoff.title": "交接记录 HANDOFF",
  "handoff.updated": "由 claude-trail 于 {when} 更新 · 会话 {session}",
  "handoff.lastSession": "上次会话",
  "handoff.started": "开始于 {start}，持续 {duration}，花费 {cost}（{model}）",
  "handoff.prompts": "你提出的要求",
  "handoff.files": "改动的文件",
  "handoff.commands": "执行的命令",
  "handoff.tests": "运行了测试（{n} 条命令）",
  "handoff.noTests": "⚠️ 本次会话没有运行任何测试命令",
  "handoff.lastWords": "Claude 最后说的话",
  "handoff.openLoops": "未完成事项",
  "handoff.noOpenLoops": "没有标记项。如果 Claude 提到了下一步，会显示在这里。",
  "handoff.corrections": "你给出的纠正",
  "handoff.noCorrections": "暂无记录。",
  "handoff.written": "🤝 交接记录已写入 {path}",
  "handoff.empty": "这个项目还没有记录任何会话。",

  "blame.header": "🔍 trail blame · {file}",
  "blame.col.line": "行", "blame.col.who": "谁", "blame.col.when": "时间", "blame.col.prompt": "提示",
  "blame.summary": "Claude 写了 {claude} 行（{pct}%），人工或未归属 {human} 行，共 {sessions} 个会话",
  "blame.noFile": "找不到文件：{file}",
  "blame.noLog": "这里还没有 trail 日志。先运行一次 Claude Code 会话。",
  "blame.unattributed": "人工",

  "cost.header": "💸 trail cost · {project}",
  "cost.col.session": "会话", "cost.col.when": "时间", "cost.col.model": "模型", "cost.col.tokens": "tokens",
  "cost.col.edits": "编辑", "cost.col.usd": "美元",
  "cost.total": "合计 {usd}，共 {n} 个会话（{exactness}）",
  "cost.byModel": "按模型",
  "cost.none": "还没有带费用数据的会话。",
  "cost.statusline": "🐾 {usd} · {tokens} tok · {edits} 次编辑",

  "rules.header": "🌱 trail rules · 想变成 CLAUDE.md 规则的纠正",
  "rules.none": "还没有记录到纠正。当你对 Claude 说“不要”或“总是”时，会出现在这里。",
  "rules.row": "×{count}  {text}",
  "rules.hint": "运行 `trail rules --apply` 把重复项（×2 及以上）追加到 CLAUDE.md，或用 `--apply --min 1` 追加全部。",
  "rules.applied": "已把 {n} 条规则追加到 {path}",
  "rules.nothingToApply": "没有新的规则可追加。",
  "rules.section": "claude-trail 学到的规则",
  "rules.imported": "导入",

  "digest.header": "📰 trail digest · {period}",
  "digest.project": "{project}：{sessions} 个会话，{prompts} 条提示，{edits} 次编辑，{cost}",
  "digest.topFiles": "改动最多的文件",
  "digest.corrections": "纠正",
  "digest.quiet": "很安静。这段时间没有 Claude Code 会话。",
  "digest.total": "合计：{sessions} 个会话 · {edits} 次编辑 · {cost}",
  "digest.sent": "已发送到 Telegram。",
  "digest.noTelegram": "尚未配置 Telegram。请设置 TRAIL_TELEGRAM_BOT_TOKEN 和 TRAIL_TELEGRAM_CHAT_ID，或运行 `trail config telegram <token> <chatId>`。",

  "vault.written": "🗄️ 已写入 {n} 篇会话笔记和 {f} 篇文件笔记到 {dir}",
  "vault.index": "Claude Trail 索引",
  "vault.fileNote": "改动过这个文件的会话",

  "passport.exported": "🛂 已导出 passport 记忆库到 {dir}",
  "passport.imported": "🛂 已从 {dir} 导入 {n} 条偏好",
  "passport.noVault": "在 {dir} 找不到 passport 记忆库",

  "install.done": "✅ claude-trail 钩子已安装到 {path}",
  "install.already": "{path} 中已有钩子；已刷新。",
  "install.restart": "重启 Claude Code。下一次会话就会留下足迹。",
  "install.uninstalled": "已从 {path} 移除 claude-trail 钩子",
  "install.statusline": "可选状态栏：在 ~/.claude/settings.json 中加入  \"statusLine\": {\"type\": \"command\", \"command\": \"trail statusline\"}",

  "doctor.title": "🩺 trail doctor",
  "doctor.node": "Node {v}",
  "doctor.hooks": "~/.claude/settings.json 中的钩子",
  "doctor.plugin": "已作为 Claude Code 插件安装",
  "doctor.log": "日志位于 {path}（{size}）",
  "doctor.lang": "语言：{lang}",
  "doctor.ok": "正常", "doctor.missing": "缺失",

  "status.header": "🐾 claude-trail 状态 · {project}",
  "status.line": "{sessions} 个会话 · {prompts} 条提示 · {edits} 次编辑 · {cost} · 日志 {size}",

  "config.set": "已设置 {key} = {value}",
  "config.show": "当前配置",
  "lang.set": "Language set to {lang}. 语言已设置为 {lang}。",

  "help.text": `🐾 claude-trail · {tagline}

用法：trail <命令> [选项]

镜头
  handoff [--to <路径>] [--print]     🤝 根据上次会话生成 HANDOFF.md
  blame <文件> [--summary] [--json]   🔍 每一行是哪条提示写的
  cost [--since 7d] [--json]          💸 每个会话花了多少钱
  rules [--apply] [--min 2]           🌱 想变成 CLAUDE.md 规则的纠正
  digest [--since 24h] [--all]        📰 Claude 做了什么，跨项目汇总（--telegram 发送）
  vault [目录] [--since 30d]          🗄️ 导出为带反向链接的 Obsidian 笔记
  export [目录] / import <目录>       🛂 导入或导出 memory-passport 记忆库

设置
  install [--uninstall]               在 ~/.claude/settings.json 注册钩子
  doctor                              检查钩子、日志、语言
  status                              项目一行摘要
  config <键> [值]                    lang | commit | telegram | vault.dir | handoff.path
  lang <en|zh>                        切换语言 / switch language
  statusline                          输出状态栏（从 stdin 读取 Claude Code 的 JSON）
  log [--tail 20]                     原始事件

环境变量：TRAIL_LANG=zh · CLAUDE_TRAIL_HOME=~/.claude-trail`,
};
