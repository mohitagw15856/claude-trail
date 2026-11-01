import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import { readEvents } from "../log/events.js";
import { lineKey, shortId } from "../log/hash.js";
import { fmtDate, t } from "../i18n/index.js";
import { oneLine } from "./handoff.js";
export function blame(cwd, file) {
    const abs = isAbsolute(file) ? file : join(cwd, file);
    if (!existsSync(abs))
        return { error: t("blame.noFile", { file }) };
    const relFile = relative(cwd, abs);
    const events = readEvents(cwd);
    if (!events.length)
        return { error: t("blame.noLog") };
    const prompts = new Map();
    const index = new Map();
    for (const e of events) {
        if (e.type === "prompt")
            prompts.set(`${e.session}/${e.id}`, e.text);
        if (e.type === "tool" && e.keys && e.file === relFile)
            for (const k of e.keys)
                index.set(k, { session: e.session, ts: e.ts, promptId: e.promptId });
    }
    const src = readFileSync(abs, "utf8").split("\n");
    if (src.length && src[src.length - 1] === "")
        src.pop();
    const lines = [];
    let claude = 0;
    let human = 0;
    const sess = new Set();
    src.forEach((text, i) => {
        const k = lineKey(text);
        const hit = k ? index.get(k) : undefined;
        if (hit) {
            claude++;
            sess.add(hit.session);
            lines.push({ n: i + 1, text, session: hit.session, ts: hit.ts, prompt: hit.promptId ? prompts.get(`${hit.session}/${hit.promptId}`) : undefined });
        }
        else {
            if (k)
                human++;
            lines.push({ n: i + 1, text, noise: !k });
        }
    });
    return { file: relFile, lines, claude, human, sessions: [...sess] };
}
export function renderBlame(r, summaryOnly = false) {
    const L = [t("blame.header", { file: r.file }), ""];
    if (!summaryOnly) {
        const w = String(r.lines.length).length;
        for (const l of r.lines) {
            const who = l.session ? `🐾 ${shortId(l.session)}` : l.noise ? "   ·" : `   ${t("blame.unattributed")}`;
            const when = l.ts ? fmtDate(l.ts) : "          ";
            const prompt = l.prompt ? oneLine(l.prompt, 34) : "";
            L.push(`${String(l.n).padStart(w)}  ${who.padEnd(10)} ${when}  ${prompt.padEnd(34)} │ ${l.text}`);
        }
        L.push("");
    }
    const total = r.claude + r.human;
    L.push(t("blame.summary", { claude: r.claude, pct: total ? Math.round((100 * r.claude) / total) : 0, human: r.human, sessions: r.sessions.length }));
    return L.join("\n") + "\n";
}
