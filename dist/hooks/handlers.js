import { relative, isAbsolute } from "node:path";
import { append, now, readEvents, sessions } from "../log/events.js";
import { lineKey } from "../log/hash.js";
import { detectCorrection } from "../log/corrections.js";
import { summarizeTranscript } from "../log/transcript.js";
import { readGlobal, registerProject, resolveLang } from "../config.js";
import { setLang } from "../i18n/index.js";
import { renderStartContext, writeHandoff } from "../lenses/handoff.js";
import { readState, writeState } from "./input.js";
const TEST_RE = /\b(npm|pnpm|yarn|bun)\s+(run\s+)?test\b|\b(pytest|vitest|jest|mocha|go test|cargo test|phpunit|rspec|mix test|dotnet test|gradle test|mvn test|node --test|make test|ctest)\b/;
function rel(cwd, p) {
    if (!p)
        return undefined;
    return isAbsolute(p) ? relative(cwd, p) || p : p;
}
function keysOf(text) {
    if (!text)
        return [];
    const out = [];
    for (const line of text.split("\n")) {
        const k = lineKey(line);
        if (k)
            out.push(k);
        if (out.length >= 5000)
            break;
    }
    return out;
}
function lines(text) { return text ? text.split("\n").length : 0; }
function costOf(transcript) {
    const s = summarizeTranscript(transcript, readGlobal().pricing);
    return { usd: s.costUsd, exact: s.exact, model: s.primaryModel, usage: s.usage, linesAdded: s.linesAdded, linesRemoved: s.linesRemoved, turns: s.turns };
}
export function onSessionStart(i) {
    const cwd = i.cwd ?? process.cwd();
    const session = i.session_id ?? "unknown";
    const lang = resolveLang(cwd);
    setLang(lang);
    registerProject(cwd);
    const prior = sessions(readEvents(cwd));
    append(cwd, { v: 1, ts: now(), session, type: "session.start", source: i.source ?? "startup", cwd, lang });
    writeState(cwd, session, { startTs: now(), promptCount: 0, stops: 0 });
    // On compaction, keep the injection minimal: Claude already has the thread.
    return renderStartContext(prior.filter((s) => s.id !== session), i.source === "compact");
}
export function onUserPromptSubmit(i) {
    const cwd = i.cwd ?? process.cwd();
    const session = i.session_id ?? "unknown";
    const prompt = (i.prompt ?? "").trim();
    if (!prompt)
        return;
    const st = readState(cwd, session);
    const n = (st.promptCount ?? 0) + 1;
    const id = `p${n}`;
    writeState(cwd, session, { ...st, promptId: id, promptTs: now(), promptCount: n });
    const correction = detectCorrection(prompt) ?? undefined;
    append(cwd, { v: 1, ts: now(), session, type: "prompt", id, text: prompt.slice(0, 500), correction });
}
export function onPostToolUse(i) {
    const cwd = i.cwd ?? process.cwd();
    const session = i.session_id ?? "unknown";
    const st = readState(cwd, session);
    const base = { v: 1, ts: now(), session, type: "tool", tool: i.tool_name ?? "?", promptId: st.promptId };
    const inp = i.tool_input ?? {};
    switch (i.tool_name) {
        case "Edit":
            append(cwd, { ...base, file: rel(cwd, inp.file_path), added: lines(inp.new_string), removed: lines(inp.old_string), keys: keysOf(inp.new_string) });
            break;
        case "MultiEdit": {
            let added = 0, removed = 0;
            const keys = [];
            for (const e of inp.edits ?? []) {
                added += lines(e.new_string);
                removed += lines(e.old_string);
                keys.push(...keysOf(e.new_string));
            }
            append(cwd, { ...base, file: rel(cwd, inp.file_path), added, removed, keys });
            break;
        }
        case "Write":
            append(cwd, { ...base, file: rel(cwd, inp.file_path), added: lines(inp.content), removed: 0, keys: keysOf(inp.content) });
            break;
        case "NotebookEdit":
            append(cwd, { ...base, file: rel(cwd, inp.notebook_path), added: lines(inp.new_source), removed: 0, keys: keysOf(inp.new_source) });
            break;
        case "Bash": {
            const cmd = String(inp.command ?? "").replace(/\s+/g, " ").slice(0, 200);
            const r = i.tool_response ?? {};
            const exit = typeof r.exit_code === "number" ? r.exit_code : typeof r.exitCode === "number" ? r.exitCode : undefined;
            append(cwd, { ...base, cmd, tests: TEST_RE.test(cmd), exit });
            break;
        }
        default:
            append(cwd, { ...base });
    }
}
export function onStop(i) {
    const cwd = i.cwd ?? process.cwd();
    const session = i.session_id ?? "unknown";
    setLang(resolveLang(cwd));
    const s = summarizeTranscript(i.transcript_path, readGlobal().pricing);
    const cost = { usd: s.costUsd, exact: s.exact, model: s.primaryModel, usage: s.usage, linesAdded: s.linesAdded, linesRemoved: s.linesRemoved, turns: s.turns };
    append(cwd, { v: 1, ts: now(), session, type: "stop", lastText: s.lastAssistantText.slice(-1200), cost });
    const st = readState(cwd, session);
    writeState(cwd, session, { ...st, stops: (st.stops ?? 0) + 1 });
    writeHandoff(cwd);
}
export function onSessionEnd(i) {
    const cwd = i.cwd ?? process.cwd();
    const session = i.session_id ?? "unknown";
    setLang(resolveLang(cwd));
    const st = readState(cwd, session);
    const durationMs = st.startTs ? new Date(now()).getTime() - new Date(st.startTs).getTime() : 0;
    append(cwd, { v: 1, ts: now(), session, type: "session.end", reason: i.reason ?? "other", cost: costOf(i.transcript_path), durationMs });
    writeHandoff(cwd);
}
