import { appendFileSync, existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { ensureProjectDir, projectDir, readProject } from "../config.js";
import { redact } from "./redact.js";
export const LOG_FILE = "events.jsonl";
/** Current time as ISO. TRAIL_FAKE_NOW exists only so the demo generator can produce realistic timestamps. */
export function now() { return process.env.TRAIL_FAKE_NOW ?? new Date().toISOString(); }
export function logPath(cwd) { return join(projectDir(cwd), LOG_FILE); }
export function append(cwd, ev) {
    const dir = ensureProjectDir(cwd, readProject(cwd).commit === true);
    const line = JSON.stringify(ev, (_k, v) => (typeof v === "string" ? redact(v) : v));
    appendFileSync(join(dir, LOG_FILE), line + "\n");
}
export function readEvents(cwd, opts = {}) {
    const p = logPath(cwd);
    if (!existsSync(p))
        return [];
    const out = [];
    for (const line of readFileSync(p, "utf8").split("\n")) {
        if (!line.trim())
            continue;
        let e;
        try {
            e = JSON.parse(line);
        }
        catch {
            continue;
        }
        if (opts.since && e.ts < opts.since.toISOString())
            continue;
        if (opts.session && e.session !== opts.session)
            continue;
        out.push(e);
    }
    return out;
}
export function logSizeBytes(cwd) {
    const p = logPath(cwd);
    try {
        return existsSync(p) ? statSync(p).size : 0;
    }
    catch {
        return 0;
    }
}
export function sessions(events) {
    const map = new Map();
    for (const e of events) {
        const s = map.get(e.session) ?? (map.set(e.session, { id: e.session, prompts: [], tools: [] }), map.get(e.session));
        s.end = e.ts;
        s.start ??= e.ts;
        switch (e.type) {
            case "session.start":
                s.start = e.ts;
                s.source = e.source;
                break;
            case "prompt":
                s.prompts.push(e);
                break;
            case "tool":
                s.tools.push(e);
                break;
            case "stop":
                s.cost = e.cost;
                s.lastText = e.lastText;
                break;
            case "session.end":
                s.cost = e.cost;
                s.reason = e.reason;
                s.durationMs = e.durationMs;
                if (e.lastText)
                    s.lastText = e.lastText;
                break;
        }
    }
    return [...map.values()].sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));
}
export function parseSince(s, fallbackHours = 24) {
    if (!s)
        return new Date(Date.now() - fallbackHours * 3600_000);
    const m = /^(\d+)\s*([hdwm])$/.exec(s.trim());
    if (m) {
        const n = Number(m[1]);
        const mult = { h: 3600_000, d: 86_400_000, w: 7 * 86_400_000, m: 30 * 86_400_000 }[m[2]];
        return new Date(Date.now() - n * mult);
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date(Date.now() - fallbackHours * 3600_000) : d;
}
export function fileStats(tools) {
    const m = new Map();
    for (const t of tools) {
        if (!t.file)
            continue;
        const s = m.get(t.file) ?? { file: t.file, added: 0, removed: 0, edits: 0 };
        s.added += t.added ?? 0;
        s.removed += t.removed ?? 0;
        s.edits++;
        m.set(t.file, s);
    }
    return [...m.values()].sort((a, b) => b.edits - a.edits || b.added - a.added);
}
