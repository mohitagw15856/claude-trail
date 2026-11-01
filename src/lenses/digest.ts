import { fileStats, parseSince, readEvents, sessions } from "../log/events.js";
import { listProjects, projectName, readGlobal } from "../config.js";
import { fmtUsd, t } from "../i18n/index.js";
import { topCorrections } from "./rules.js";

export interface ProjectDigest { project: string; path: string; sessions: number; prompts: number; edits: number; usd: number; topFiles: string[]; corrections: string[] }

export function digestFor(cwd: string, since: Date): ProjectDigest | null {
  const evs = readEvents(cwd, { since });
  const ss = sessions(evs).filter((s) => s.prompts.length || s.tools.length);
  if (!ss.length) return null;
  const tools = ss.flatMap((s) => s.tools);
  return {
    project: projectName(cwd), path: cwd, sessions: ss.length,
    prompts: ss.reduce((a, s) => a + s.prompts.length, 0),
    edits: tools.filter((x) => x.file).length,
    usd: ss.reduce((a, s) => a + (s.cost?.usd ?? 0), 0),
    topFiles: fileStats(tools).slice(0, 5).map((f) => `${f.file} (${f.edits}×)`),
    corrections: topCorrections(evs, 3).map((c) => `×${c.count} ${c.text}`),
  };
}

export function buildDigest(cwd: string, opts: { since?: string; all?: boolean }): { period: string; projects: ProjectDigest[] } {
  const since = parseSince(opts.since, 24);
  const paths = opts.all ? listProjects().map((p) => p.path) : [cwd];
  const projects = paths.map((p) => digestFor(p, since)).filter((x): x is ProjectDigest => !!x).sort((a, b) => b.edits - a.edits);
  return { period: opts.since ?? "24h", projects };
}

export function renderDigest(d: { period: string; projects: ProjectDigest[] }): string {
  const L = [t("digest.header", { period: d.period }), ""];
  if (!d.projects.length) return L.concat(t("digest.quiet")).join("\n") + "\n";
  for (const p of d.projects) {
    L.push(`**${t("digest.project", { project: p.project, sessions: p.sessions, prompts: p.prompts, edits: p.edits, cost: fmtUsd(p.usd) })}**`);
    if (p.topFiles.length) L.push(`  ${t("digest.topFiles")}: ${p.topFiles.join(", ")}`);
    if (p.corrections.length) L.push(`  ${t("digest.corrections")}: ${p.corrections.join(" · ")}`);
    L.push("");
  }
  L.push(t("digest.total", { sessions: d.projects.reduce((a, p) => a + p.sessions, 0), edits: d.projects.reduce((a, p) => a + p.edits, 0), cost: fmtUsd(d.projects.reduce((a, p) => a + p.usd, 0)) }));
  return L.join("\n") + "\n";
}

export async function sendTelegram(text: string): Promise<boolean> {
  const g = readGlobal().telegram ?? {};
  const token = process.env.TRAIL_TELEGRAM_BOT_TOKEN ?? g.token;
  const chat = process.env.TRAIL_TELEGRAM_CHAT_ID ?? g.chatId;
  if (!token || !chat) return false;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text: text.replace(/\*\*/g, "").slice(0, 4000), disable_web_page_preview: true }),
  });
  return res.ok;
}
