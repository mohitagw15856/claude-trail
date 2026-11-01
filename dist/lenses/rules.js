import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { append, readEvents } from "../log/events.js";
import { normalizeCorrection } from "../log/corrections.js";
import { projectDir } from "../config.js";
import { t } from "../i18n/index.js";
export function topCorrections(events, limit = 10) {
    const m = new Map();
    for (const e of events) {
        let text;
        let strong = false;
        let imported = false;
        if (e.type === "prompt" && e.correction) {
            text = e.correction.text;
            strong = e.correction.strength === "strong";
        }
        else if (e.type === "rule.imported") {
            text = e.text;
            strong = true;
            imported = true;
        }
        if (!text)
            continue;
        const key = normalizeCorrection(text);
        if (key.length < 4)
            continue;
        const c = m.get(key) ?? { key, text, count: 0, last: e.ts, strong: 0, imported };
        c.count++;
        c.last = e.ts;
        if (strong)
            c.strong++;
        m.set(key, c);
    }
    return [...m.values()]
        .sort((a, b) => b.count - a.count || b.strong - a.strong || b.last.localeCompare(a.last))
        .slice(0, limit);
}
function appliedPath(cwd) { return join(projectDir(cwd), "rules.json"); }
function readApplied(cwd) {
    try {
        if (existsSync(appliedPath(cwd)))
            return new Set(JSON.parse(readFileSync(appliedPath(cwd), "utf8")).applied ?? []);
    }
    catch { /* ignore */ }
    return new Set();
}
export function renderRules(cwd, limit = 20) {
    const cands = topCorrections(readEvents(cwd), limit);
    const applied = readApplied(cwd);
    if (!cands.length)
        return `${t("rules.header")}\n\n${t("rules.none")}\n`;
    const L = [t("rules.header"), ""];
    for (const c of cands)
        L.push(`${applied.has(c.key) ? "✅" : c.count >= 2 ? "🌱" : "·"} ${t("rules.row", { count: c.count, text: c.text })}${c.imported ? ` (${t("rules.imported")})` : ""}`);
    L.push("", t("rules.hint"));
    return L.join("\n") + "\n";
}
/** Append repeated corrections to CLAUDE.md under a managed section. Idempotent. */
export function applyRules(cwd, min = 2, file = "CLAUDE.md") {
    const path = join(cwd, file);
    const applied = readApplied(cwd);
    const cands = topCorrections(readEvents(cwd), 100).filter((c) => c.count >= min && !applied.has(c.key));
    if (!cands.length)
        return { added: 0, path };
    const header = `## ${t("rules.section")}`;
    let cur = existsSync(path) ? readFileSync(path, "utf8") : "";
    if (!cur.includes(header))
        cur = `${cur.replace(/\s*$/, "")}${cur ? "\n\n" : ""}${header}\n`;
    const lines = cands.map((c) => `- ${c.text}`);
    cur = cur.replace(/\s*$/, "") + "\n" + lines.join("\n") + "\n";
    writeFileSync(path, cur);
    for (const c of cands) {
        applied.add(c.key);
        append(cwd, { v: 1, ts: new Date().toISOString(), session: "cli", type: "rule.applied", text: c.text });
    }
    writeFileSync(appliedPath(cwd), JSON.stringify({ applied: [...applied] }, null, 2) + "\n");
    return { added: cands.length, path };
}
