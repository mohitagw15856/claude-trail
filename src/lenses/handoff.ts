import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileStats, now, readEvents, sessions, type Session } from "../log/events.js";
import { readGlobal, readProject, projectDir } from "../config.js";
import { fmtDuration, fmtUsd, fmtWhen, getLang, t } from "../i18n/index.js";
import { shortId } from "../log/hash.js";
import { topCorrections } from "./rules.js";

const START = "<!-- trail:start -->";
const END = "<!-- trail:end -->";
const LOOP_RE = /(next step|next,|todo|to do|remaining|left to|pending|follow[- ]up|still need|not yet|blocked|haven'?t|未完成|下一步|待办|剩余|还需要|尚未|阻塞|待处理)/i;

export function openLoops(lastText: string | undefined): string[] {
  if (!lastText) return [];
  const out: string[] = [];
  for (const raw of lastText.split("\n")) {
    const line = raw.replace(/^[\s>*-]+/, "").replace(/\*\*/g, "").trim();
    if (line.length < 8) continue;
    if (LOOP_RE.test(line)) out.push(line.slice(0, 160));
    if (out.length >= 5) break;
  }
  return out;
}

function durationOf(s: Session): number {
  if (s.durationMs) return s.durationMs;
  if (s.start && s.end) return new Date(s.end).getTime() - new Date(s.start).getTime();
  return 0;
}

export function renderHandoff(cwd: string): string {
  const evs = readEvents(cwd);
  const all = sessions(evs).filter((s) => s.prompts.length || s.tools.length || s.cost);
  const last = all[all.length - 1];
  if (!last) return `# ${t("handoff.title")}\n\n${t("handoff.empty")}\n`;
  const files = fileStats(last.tools);
  const cmds = last.tools.filter((x) => x.cmd);
  const tests = cmds.filter((x) => x.tests);
  const loops = openLoops(last.lastText);
  const corrections = topCorrections(evs, 5);
  const L: string[] = [];
  L.push(`# ${t("handoff.title")}`);
  L.push(`_${t("handoff.updated", { when: fmtWhen(now()), session: shortId(last.id) })}_`);
  L.push("");
  L.push(`## ${t("handoff.lastSession")}`);
  L.push(`- ${t("handoff.started", { start: fmtWhen(last.start), duration: fmtDuration(durationOf(last)), cost: last.cost ? fmtUsd(last.cost.usd) : "$?", model: last.cost?.model?.replace(/^claude-/, "") || "?" })}`);
  if (last.prompts.length) {
    L.push("", `### ${t("handoff.prompts")}`);
    for (const p of last.prompts.slice(-6)) L.push(`- ${oneLine(p.text, 140)}`);
  }
  if (files.length) {
    L.push("", `### ${t("handoff.files")}`);
    for (const f of files.slice(0, 12)) L.push(`- \`${f.file}\` (+${f.added}/-${f.removed}, ${f.edits}×)`);
  }
  if (cmds.length) {
    L.push("", `### ${t("handoff.commands")}`);
    for (const c of cmds.slice(-8)) L.push(`- \`${c.cmd}\`${c.exit !== undefined && c.exit !== 0 ? ` ❌ exit ${c.exit}` : ""}`);
  }
  L.push("", tests.length ? `✅ ${t("handoff.tests", { n: tests.length })}` : t("handoff.noTests"));
  L.push("", `## ${t("handoff.openLoops")}`);
  if (loops.length) for (const l of loops) L.push(`- ${l}`); else L.push(`- ${t("handoff.noOpenLoops")}`);
  if (last.lastText) {
    L.push("", `## ${t("handoff.lastWords")}`);
    L.push(`> ${oneLine(last.lastText, 400)}`);
  }
  L.push("", `## ${t("handoff.corrections")}`);
  if (corrections.length) for (const c of corrections) L.push(`- ×${c.count} ${c.text}`); else L.push(`- ${t("handoff.noCorrections")}`);
  L.push("");
  return L.join("\n");
}

export function handoffPath(cwd: string): string {
  const p = readProject(cwd).handoff?.path ?? readGlobal().handoff?.path;
  if (!p) return join(projectDir(cwd), "HANDOFF.md");
  return isAbsolute(p) ? p : join(cwd, p);
}

/** Write the handoff. Files outside .claude-trail/ are only touched between trail markers. */
export function writeHandoff(cwd: string, to?: string): string {
  const path = to ? (isAbsolute(to) ? to : join(cwd, to)) : handoffPath(cwd);
  const body = renderHandoff(cwd);
  mkdirSync(dirname(path), { recursive: true });
  const managed = path.startsWith(projectDir(cwd));
  if (managed || !existsSync(path)) {
    writeFileSync(path, managed ? body : `${START}\n${body}${END}\n`);
    return path;
  }
  const cur = readFileSync(path, "utf8");
  const block = `${START}\n${body}${END}`;
  const next = cur.includes(START) && cur.includes(END)
    ? cur.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block)
    : `${cur.replace(/\s*$/, "")}\n\n${block}\n`;
  writeFileSync(path, next);
  return path;
}

/** What SessionStart injects. Deliberately short: every line here costs tokens on every session. */
export function renderStartContext(prior: Session[], compact = false): string {
  const real = prior.filter((s) => s.prompts.length || s.tools.length);
  if (!real.length) return compact ? "" : t("start.first");
  const last = real[real.length - 1];
  const files = fileStats(last.tools);
  const L: string[] = [t("start.header")];
  L.push(t("start.lastSession", {
    when: fmtWhen(last.start), duration: fmtDuration(durationOf(last)), cost: last.cost ? fmtUsd(last.cost.usd) : "$?",
    edits: last.tools.filter((x) => x.file).length, files: files.length, prompts: last.prompts.length,
  }));
  if (compact) return L.join("\n");
  if (files.length) L.push(`${t("start.files")}: ${files.slice(0, 8).map((f) => f.file).join(", ")}`);
  const loops = openLoops(last.lastText);
  if (loops.length) { L.push(`${t("start.openLoops")}:`); for (const l of loops.slice(0, 3)) L.push(`- ${l}`); }
  else if (last.lastText) L.push(`${t("start.lastWords")}: ${oneLine(last.lastText, 220)}`);
  const corr = topCorrections(real.flatMap((s) => s.prompts), 3).filter((c) => c.count >= 2);
  if (corr.length) { L.push(`${t("start.corrections")}:`); for (const c of corr) L.push(`- ×${c.count} ${c.text}`); }
  L.push(t("start.more"));
  return L.join("\n");
}

export function oneLine(s: string, max: number): string {
  const o = s.replace(/\s+/g, " ").trim();
  return o.length > max ? o.slice(0, max - 1) + "…" : o;
}

export { getLang };
