import { mkdirSync, writeFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { fileStats, parseSince, readEvents, sessions, type Session } from "../log/events.js";
import { projectDir, projectName, readGlobal, readProject } from "../config.js";
import { fmtDate, fmtDuration, fmtUsd, t } from "../i18n/index.js";
import { shortId } from "../log/hash.js";
import { oneLine, openLoops } from "./handoff.js";

export function vaultDir(cwd: string, arg?: string): string {
  const p = arg ?? readProject(cwd).vault?.dir ?? readGlobal().vault?.dir;
  if (!p) return join(projectDir(cwd), "vault");
  return isAbsolute(p) ? p : join(cwd, p);
}

const slug = (s: string) => s.replace(/[^A-Za-z0-9一-鿿._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
const noteName = (s: Session) => `${fmtDate(s.start)}-${shortId(s.id)}`;

export function exportVault(cwd: string, dir: string, since?: string): { sessions: number; files: number; dir: string } {
  const project = projectName(cwd);
  const root = join(dir, "Claude Trail", slug(project));
  mkdirSync(join(root, "sessions"), { recursive: true });
  mkdirSync(join(root, "files"), { recursive: true });
  const ss = sessions(readEvents(cwd, { since: since ? parseSince(since) : undefined })).filter((s) => s.prompts.length || s.tools.length);
  const byFile = new Map<string, Session[]>();
  for (const s of ss) {
    const files = fileStats(s.tools);
    for (const f of files) byFile.set(f.file, [...(byFile.get(f.file) ?? []), s]);
    const dur = s.durationMs ?? (s.start && s.end ? new Date(s.end).getTime() - new Date(s.start).getTime() : 0);
    const L = [
      "---", `date: ${fmtDate(s.start)}`, `project: ${project}`, `session: ${s.id}`, `cost_usd: ${(s.cost?.usd ?? 0).toFixed(4)}`,
      `model: ${s.cost?.model ?? ""}`, `edits: ${s.tools.filter((x) => x.file).length}`, `tags: [claude-trail, ${slug(project)}]`, "---", "",
      `# ${project} · ${fmtDate(s.start)} · ${shortId(s.id)}`, "",
      `${t("word.duration")}: ${fmtDuration(dur)} · ${t("word.cost")}: ${fmtUsd(s.cost?.usd ?? 0)}`, "",
      `## ${t("handoff.prompts")}`, ...s.prompts.map((p) => `- ${oneLine(p.text, 200)}${p.correction ? " 🌱" : ""}`), "",
      `## ${t("handoff.files")}`, ...files.map((f) => `- [[files/${slug(f.file)}|${f.file}]] (+${f.added}/-${f.removed})`), "",
    ];
    const cmds = s.tools.filter((x) => x.cmd);
    if (cmds.length) L.push(`## ${t("handoff.commands")}`, ...cmds.map((c) => `- \`${c.cmd}\``), "");
    const loops = openLoops(s.lastText);
    if (loops.length) L.push(`## ${t("handoff.openLoops")}`, ...loops.map((l) => `- ${l}`), "");
    if (s.lastText) L.push(`## ${t("handoff.lastWords")}`, `> ${oneLine(s.lastText, 500)}`, "");
    writeFileSync(join(root, "sessions", `${noteName(s)}.md`), L.join("\n"));
  }
  for (const [file, list] of byFile) {
    const L = ["---", `file: ${file}`, `project: ${project}`, "tags: [claude-trail, file]", "---", "", `# ${file}`, "", `## ${t("vault.fileNote")}`,
      ...list.map((s) => `- [[sessions/${noteName(s)}|${fmtDate(s.start)} · ${shortId(s.id)}]]`), ""];
    writeFileSync(join(root, "files", `${slug(file)}.md`), L.join("\n"));
  }
  const idx = ["---", `project: ${project}`, "tags: [claude-trail, index]", "---", "", `# ${t("vault.index")} · ${project}`, "",
    `| ${t("word.date")} | ${t("word.session")} | ${t("word.prompts")} | ${t("word.edits")} | ${t("word.cost")} |`, "|---|---|---|---|---|",
    ...[...ss].reverse().map((s) => `| ${fmtDate(s.start)} | [[sessions/${noteName(s)}\\|${shortId(s.id)}]] | ${s.prompts.length} | ${s.tools.filter((x) => x.file).length} | ${fmtUsd(s.cost?.usd ?? 0)} |`), ""];
  writeFileSync(join(root, "index.md"), idx.join("\n"));
  return { sessions: ss.length, files: byFile.size, dir: root };
}
