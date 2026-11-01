import { en } from "./en.js";
import { zh } from "./zh.js";
const DICTS = { en, zh };
let current = "en";
export function setLang(l) { current = l; }
export function getLang() { return current; }
export function t(key, vars = {}) {
    const s = DICTS[current][key] ?? en[key] ?? key;
    return s.replace(/\{(\w+)\}/g, (_m, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
export function fmtDuration(ms) {
    if (ms < 60_000)
        return t("unit.s", { n: Math.round(ms / 1000) });
    if (ms < 3_600_000)
        return t("unit.min", { n: Math.round(ms / 60_000) });
    return t("unit.h", { n: (ms / 3_600_000).toFixed(1) });
}
export function fmtUsd(n) { return n >= 100 ? `$${n.toFixed(0)}` : n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(3)}`; }
export function fmtTokens(n) { return n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n); }
export function fmtWhen(iso) {
    if (!iso)
        return "?";
    const d = new Date(iso);
    const locale = current === "zh" ? "zh-CN" : "en-GB";
    return d.toLocaleString(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
export function fmtDate(iso) { return (iso ?? "").slice(0, 10) || "?"; }
export function fmtBytes(n) { return n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : n >= 1e3 ? `${Math.round(n / 1e3)} KB` : `${n} B`; }
export const DICT_KEYS = { en: Object.keys(en), zh: Object.keys(zh) };
