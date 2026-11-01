import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { projectDir } from "../config.js";

export interface HookInput {
  session_id?: string; transcript_path?: string; cwd?: string; hook_event_name?: string;
  source?: string; prompt?: string; tool_name?: string; tool_input?: any; tool_response?: any;
  reason?: string; stop_hook_active?: boolean;
}

export function readStdinJson(): HookInput {
  try {
    const raw = readFileSync(0, "utf8");
    return raw.trim() ? JSON.parse(raw) : {};
  } catch { return {}; }
}

/** Tiny per-session scratch state so PostToolUse can know which prompt it belongs to. */
export interface SessionState { startTs?: string; promptId?: string; promptTs?: string; promptCount?: number; stops?: number }

function statePath(cwd: string, session: string): string { return join(projectDir(cwd), "state", `${session}.json`); }

export function readState(cwd: string, session: string): SessionState {
  try { const p = statePath(cwd, session); if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch { /* ignore */ }
  return {};
}

export function writeState(cwd: string, session: string, s: SessionState): void {
  const p = statePath(cwd, session);
  mkdirSync(join(projectDir(cwd), "state"), { recursive: true });
  writeFileSync(p, JSON.stringify(s));
}
