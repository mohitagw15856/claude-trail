# Nightly digest

```bash
trail config telegram <bot-token> <chat-id>
trail digest --since 24h --all --telegram
```

Get a bot token from `@BotFather` and your chat id by messaging the bot and visiting `https://api.telegram.org/bot<token>/getUpdates`.

## cron

```cron
0 21 * * * cd ~ && /usr/local/bin/npx claude-trail digest --since 24h --all --telegram >> ~/.claude-trail/digest.log 2>&1
```

## launchd (macOS)

`~/Library/LaunchAgents/dev.claude-trail.digest.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>dev.claude-trail.digest</string>
  <key>ProgramArguments</key><array>
    <string>/bin/zsh</string><string>-lc</string>
    <string>npx claude-trail digest --since 24h --all --telegram</string>
  </array>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>21</integer><key>Minute</key><integer>0</integer></dict>
  <key>StandardOutPath</key><string>/tmp/claude-trail-digest.log</string>
  <key>StandardErrorPath</key><string>/tmp/claude-trail-digest.log</string>
</dict></plist>
```

```bash
launchctl load ~/Library/LaunchAgents/dev.claude-trail.digest.plist
```

## Anything else

`trail digest --json` gives you the structure. Pipe it to Slack, Discord, email, a second brain, whatever you already have.
