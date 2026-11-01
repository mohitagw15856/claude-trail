import { en } from "./en.js";
import { zh } from "./zh.js";
import type { Lang } from "../config.js";

const DICTS: Record<Lang, Record<string, string>> = { en, zh };
let current: Lang = "en";

export function setLang(l: Lang): void { current = l; }
export function getLang(): Lang { return current; }

export function t(key: string, vars: Record<string, string | number> = {}): string {
  const s = DICTS[current][key] ?? en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_m, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function fmtDuration(ms: number): string {
  if (ms < 60_000) return t("unit.s", { n: Math.round(ms / 1000) });
  if (ms < 3_600_000) return t("unit.min", { n: Math.round(ms / 60_000) });
  return t("unit.h", { n: (ms / 3_600_000).toFixed(1) });
}

export function fmtUsd(n: number): string { return n >= 100 ? `$${n.toFixed(0)}` : n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(3)}`; }

export function fmtTokens(n: number): string { return n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n); }

export function fmtWhen(iso: string | undefined): string {
  if (!iso) return "?";
  const d = new Date(iso);
  const locale = current === "zh" ? "zh-CN" : "en-GB";
  return d.toLocaleString(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function fmtDate(iso: string | undefined): string { return (iso ?? "").slice(0, 10) || "?"; }

export function fmtBytes(n: number): string { return n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : n >= 1e3 ? `${Math.round(n / 1e3)} KB` : `${n} B`; }

export const DICT_KEYS = { en: Object.keys(en), zh: Object.keys(zh) };
