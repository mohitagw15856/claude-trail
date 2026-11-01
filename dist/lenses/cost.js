import { readEvents, sessions, parseSince } from "../log/events.js";
import { projectName } from "../config.js";
import { fmtTokens, fmtUsd, fmtWhen, t } from "../i18n/index.js";
import { shortId } from "../log/hash.js";
export function costSessions(cwd, since) {
    const s = since ? parseSince(since) : undefined;
    return sessions(readEvents(cwd, { since: s })).filter((x) => x.cost);
}
function tokensOf(s) { const u = s.cost.usage; return u.input + u.output + u.cacheRead + u.cacheWrite; }
export function renderCost(cwd, since) {
    const list = costSessions(cwd, since);
    const L = [t("cost.header", { project: projectName(cwd) }), ""];
    if (!list.length)
        return L.concat(t("cost.none")).join("\n") + "\n";
    const head = [t("cost.col.session"), t("cost.col.when"), t("cost.col.model"), t("cost.col.tokens"), t("cost.col.edits"), t("cost.col.usd")];
    const rows = list.map((s) => [shortId(s.id), fmtWhen(s.start), (s.cost.model || "?").replace(/^claude-/, ""), fmtTokens(tokensOf(s)), String(s.tools.filter((x) => x.file).length), fmtUsd(s.cost.usd)]);
    L.push(table([head, ...rows]));
    const total = list.reduce((a, s) => a + s.cost.usd, 0);
    const exact = list.every((s) => s.cost.exact);
    L.push("", t("cost.total", { usd: fmtUsd(total), n: list.length, exactness: t(exact ? "word.exact" : "word.estimated") }));
    const byModel = new Map();
    for (const s of list)
        byModel.set(s.cost.model || "?", (byModel.get(s.cost.model || "?") ?? 0) + s.cost.usd);
    if (byModel.size > 1) {
        L.push("", `${t("cost.byModel")}:`);
        for (const [m, v] of [...byModel].sort((a, b) => b[1] - a[1]))
            L.push(`- ${m}: ${fmtUsd(v)}`);
    }
    return L.join("\n") + "\n";
}
export function table(rows) {
    const w = rows[0].map((_, i) => Math.max(...rows.map((r) => width(r[i]))));
    return rows.map((r, ri) => r.map((c, i) => pad(c, w[i], i >= 3)).join("  ") + (ri === 0 ? "\n" + w.map((x) => "─".repeat(x)).join("  ") : "")).join("\n");
}
function width(s) { let n = 0; for (const ch of s)
    n += /[　-鿿＀-￯]/.test(ch) ? 2 : 1; return n; }
function pad(s, w, right) { const f = " ".repeat(Math.max(0, w - width(s))); return right ? f + s : s + f; }
/** Status line: prefers Claude Code's live JSON on stdin, falls back to the log. */
export function renderStatusline(cwd, stdin) {
    const list = costSessions(cwd);
    const live = stdin?.cost?.total_cost_usd;
    const sid = stdin?.session_id;
    const s = (sid ? list.find((x) => x.id === sid) : undefined) ?? list[list.length - 1];
    const usd = typeof live === "number" ? live : s?.cost?.usd ?? 0;
    const tokens = s ? tokensOf(s) : 0;
    const edits = s ? s.tools.filter((x) => x.file).length : 0;
    return t("cost.statusline", { usd: fmtUsd(usd), tokens: fmtTokens(tokens), edits });
}
