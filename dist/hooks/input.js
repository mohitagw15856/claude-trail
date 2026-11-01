import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { projectDir } from "../config.js";
export function readStdinJson() {
    try {
        const raw = readFileSync(0, "utf8");
        return raw.trim() ? JSON.parse(raw) : {};
    }
    catch {
        return {};
    }
}
function statePath(cwd, session) { return join(projectDir(cwd), "state", `${session}.json`); }
export function readState(cwd, session) {
    try {
        const p = statePath(cwd, session);
        if (existsSync(p))
            return JSON.parse(readFileSync(p, "utf8"));
    }
    catch { /* ignore */ }
    return {};
}
export function writeState(cwd, session, s) {
    const p = statePath(cwd, session);
    mkdirSync(join(projectDir(cwd), "state"), { recursive: true });
    writeFileSync(p, JSON.stringify(s));
}
