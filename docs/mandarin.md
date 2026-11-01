# 中文支持 · Mandarin support

## 切换语言 · Switching

```bash
trail lang zh                 # 全局 · global
trail lang zh --project       # 仅此项目 · this project only
TRAIL_LANG=zh trail cost      # 单条命令 · one command
```

未设置时，系统 `LANG` 以 `zh` 开头也会自动切换。

## 覆盖范围 · What is localised

- Claude Code 会话开始时注入的上下文（`SessionStart`）
- `HANDOFF.md` 的全部标题和句子
- 七个镜头的终端输出，包括表头
- `trail --help`
- 日期格式（`11月1日 22:59` 与 `1 Nov, 22:59`）

会话 ID、文件名、命令和模型名保持原样，因为那是你的数据。

## 纠正识别 · Correction detection

`src/log/corrections.ts` 中，以下开头会被识别为“强”纠正：

不要 · 别 · 不准 · 不用 · 不可以 · 请不要 · 请别 · 永远不 · 以后（都/不/请） · 总是 · 每次（都） · 请用 · 改用 · 换成 · 不是这样 · 错了 · 不对 · 应该 · 必须 · 记得 · 下次 · 停止 · 别再

出现在句中则为“弱”纠正。两者都会计数，`trail rules` 按重复次数排序。

## 未完成事项 · Open loops

Claude 最后一条消息里包含 下一步 / 待办 / 未完成 / 剩余 / 还需要 / 尚未 / 阻塞 / 待处理 的行会被提取到交接记录。

## 添加语言 · Adding a language

见 [docs/i18n/README.md](i18n/README.md)。一个字典文件，一个测试，一份 README。
