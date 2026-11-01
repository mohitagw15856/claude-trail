import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SETTINGS = join(homedir(), ".claude", "settings.json");
const MARK = "claude-trail";

export function hookScriptPath(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "hook.js");
}

interface HookEntry { matcher?: string; hooks: Array<{ type: string; command: string; timeout?: number }> }

function trailEntries(script: string): Record<string, HookEntry[]> {
  const cmd = (ev: string) => ({ type: "command", command: `node "${script}" ${ev}`, timeout: ev === "Stop" || ev === "SessionEnd" ? 20 : 10 });
  return {
    SessionStart: [{ matcher: "startup|resume|clear|compact", hooks: [cmd("SessionStart")] }],
    UserPromptSubmit: [{ hooks: [cmd("UserPromptSubmit")] }],
    PostToolUse: [{ matcher: "Edit|Write|MultiEdit|NotebookEdit|Bash", hooks: [cmd("PostToolUse")] }],
    Stop: [{ hooks: [cmd("Stop")] }],
    SessionEnd: [{ hooks: [cmd("SessionEnd")] }],
  };
}

function isOurs(e: HookEntry): boolean { return e.hooks?.some((h) => h.command?.includes(MARK)); }

export function installHooks(settingsPath = SETTINGS): { path: string; existed: boolean } {
  mkdirSync(dirname(settingsPath), { recursive: true });
  const s: any = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, "utf8") || "{}") : {};
  s.hooks ??= {};
  let existed = false;
  for (const [ev, entries] of Object.entries(trailEntries(hookScriptPath()))) {
    const cur: HookEntry[] = s.hooks[ev] ?? [];
    if (cur.some(isOurs)) existed = true;
    s.hooks[ev] = [...cur.filter((e) => !isOurs(e)), ...entries];
  }
  writeFileSync(settingsPath, JSON.stringify(s, null, 2) + "\n");
  return { path: settingsPath, existed };
}

export function uninstallHooks(settingsPath = SETTINGS): string {
  if (!existsSync(settingsPath)) return settingsPath;
  const s: any = JSON.parse(readFileSync(settingsPath, "utf8") || "{}");
  for (const ev of Object.keys(s.hooks ?? {})) {
    s.hooks[ev] = (s.hooks[ev] as HookEntry[]).filter((e) => !isOurs(e));
    if (!s.hooks[ev].length) delete s.hooks[ev];
  }
  writeFileSync(settingsPath, JSON.stringify(s, null, 2) + "\n");
  return settingsPath;
}

export function hooksInstalled(settingsPath = SETTINGS): boolean {
  try { return existsSync(settingsPath) && readFileSync(settingsPath, "utf8").includes(MARK); } catch { return false; }
}

export function pluginInstalled(): boolean {
  try {
    const p = join(homedir(), ".claude", "plugins", "installed_plugins.json");
    return existsSync(p) && readFileSync(p, "utf8").includes(MARK);
  } catch { return false; }
}
