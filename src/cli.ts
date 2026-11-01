#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { GLOBAL_DIR, listProjects, projectName, readGlobal, readProject, resolveLang, writeGlobal, writeProject, type Lang } from "./config.js";
import { fmtBytes, fmtUsd, setLang, t } from "./i18n/index.js";
import { logSizeBytes, readEvents, sessions } from "./log/events.js";
import { handoffPath, renderHandoff, writeHandoff } from "./lenses/handoff.js";
import { blame, renderBlame } from "./lenses/blame.js";
import { renderCost, renderStatusline, costSessions } from "./lenses/cost.js";
import { applyRules, renderRules } from "./lenses/rules.js";
import { buildDigest, renderDigest, sendTelegram } from "./lenses/digest.js";
import { exportVault, vaultDir } from "./lenses/vault.js";
import { exportPassport, importPassport, passportDir } from "./lenses/passport.js";
import { hooksInstalled, installHooks, pluginInstalled, uninstallHooks } from "./install.js";

const argv = process.argv.slice(2);
const cmd = argv[0] ?? "help";
const flags: Record<string, string | boolean> = {};
const pos: string[] = [];
for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--")) { const k = a.slice(2); const v = argv[i + 1]; if (v && !v.startsWith("--")) { flags[k] = v; i++; } else flags[k] = true; }
  else pos.push(a);
}
const cwd = process.cwd();
const str = (k: string): string | undefined => (typeof flags[k] === "string" ? (flags[k] as string) : undefined);
const out = (s: string) => process.stdout.write(s.endsWith("\n") ? s : s + "\n");
const json = (o: unknown) => out(JSON.stringify(o, null, 2));

setLang(resolveLang(cwd));

async function main(): Promise<number> {
  switch (cmd) {
    case "handoff": {
      if (flags.print) { out(renderHandoff(cwd)); return 0; }
      const p = writeHandoff(cwd, str("to"));
      out(t("handoff.written", { path: p }));
      return 0;
    }
    case "blame": {
      const file = pos[0];
      if (!file) { out(t("help.text", { tagline: t("app.tagline") })); return 2; }
      const r = blame(cwd, file);
      if ("error" in r) { out(r.error); return 1; }
      if (flags.json) json(r); else out(renderBlame(r, !!flags.summary));
      return 0;
    }
    case "cost": {
      if (flags.json) json(costSessions(cwd, str("since")).map((s) => ({ id: s.id, start: s.start, ...s.cost, edits: s.tools.filter((x) => x.file).length })));
      else out(renderCost(cwd, str("since")));
      return 0;
    }
    case "statusline": {
      let stdin: any = {};
      try { const raw = readFileSync(0, "utf8"); stdin = raw.trim() ? JSON.parse(raw) : {}; } catch { /* no stdin */ }
      const dir = stdin?.workspace?.current_dir ?? stdin?.cwd ?? cwd;
      out(renderStatusline(dir, stdin));
      return 0;
    }
    case "rules": {
      if (flags.apply) {
        const r = applyRules(cwd, Number(str("min") ?? 2), str("file") ?? "CLAUDE.md");
        out(r.added ? t("rules.applied", { n: r.added, path: r.path }) : t("rules.nothingToApply"));
        return 0;
      }
      out(renderRules(cwd, Number(str("limit") ?? 20)));
      return 0;
    }
    case "digest": {
      const d = buildDigest(cwd, { since: str("since"), all: !!flags.all });
      if (flags.json) { json(d); return 0; }
      const text = renderDigest(d);
      out(text);
      if (flags.telegram) out((await sendTelegram(text)) ? t("digest.sent") : t("digest.noTelegram"));
      return 0;
    }
    case "vault": {
      const r = exportVault(cwd, vaultDir(cwd, pos[0]), str("since"));
      out(t("vault.written", { n: r.sessions, f: r.files, dir: r.dir }));
      return 0;
    }
    case "export": {
      if (flags.json || str("format") === "json") { json(readEvents(cwd)); return 0; }
      const r = exportPassport(cwd, passportDir(cwd, pos[0]));
      out(t("passport.exported", { dir: r.dir }));
      return 0;
    }
    case "import": {
      const dir = passportDir(cwd, pos[0]);
      const n = importPassport(cwd, dir);
      out(n || pos[0] ? t("passport.imported", { n, dir }) : t("passport.noVault", { dir }));
      return 0;
    }
    case "install": {
      if (flags.uninstall) { out(t("install.uninstalled", { path: uninstallHooks() })); return 0; }
      const r = installHooks();
      out(r.existed ? t("install.already", { path: r.path }) : t("install.done", { path: r.path }));
      out(t("install.restart"));
      out(t("install.statusline"));
      return 0;
    }
    case "uninstall": { out(t("install.uninstalled", { path: uninstallHooks() })); return 0; }
    case "doctor": {
      const ok = (b: boolean) => (b ? `✅ ${t("doctor.ok")}` : `❌ ${t("doctor.missing")}`);
      const hooks = hooksInstalled(); const plugin = pluginInstalled();
      out([t("doctor.title"), "", `${t("doctor.node", { v: process.version })}  ${ok(Number(process.versions.node.split(".")[0]) >= 20)}`,
        `${t("doctor.hooks")}  ${ok(hooks)}`, `${t("doctor.plugin")}  ${ok(plugin)}`,
        `${t("doctor.log", { path: `${cwd}/.claude-trail/events.jsonl`, size: fmtBytes(logSizeBytes(cwd)) })}  ${ok(logSizeBytes(cwd) > 0)}`,
        t("doctor.lang", { lang: resolveLang(cwd) }), `${t("word.project")}: ${listProjects().length}`, ""].join("\n"));
      return hooks || plugin ? 0 : 1;
    }
    case "status": {
      const ss = sessions(readEvents(cwd)).filter((s) => s.prompts.length || s.tools.length);
      out(t("status.header", { project: projectName(cwd) }));
      out(t("status.line", { sessions: ss.length, prompts: ss.reduce((a, s) => a + s.prompts.length, 0), edits: ss.reduce((a, s) => a + s.tools.filter((x) => x.file).length, 0), cost: fmtUsd(ss.reduce((a, s) => a + (s.cost?.usd ?? 0), 0)), size: fmtBytes(logSizeBytes(cwd)) }));
      out(`HANDOFF: ${handoffPath(cwd)}`);
      return 0;
    }
    case "lang": {
      const l = (pos[0] ?? "").toLowerCase();
      if (l !== "en" && l !== "zh") { out("trail lang <en|zh>"); return 2; }
      if (flags.project) writeProject(cwd, { ...readProject(cwd), lang: l as Lang }); else writeGlobal({ ...readGlobal(), lang: l as Lang });
      setLang(l as Lang); out(t("lang.set", { lang: l }));
      return 0;
    }
    case "config": {
      const [key, ...vals] = pos;
      if (!key) { out(t("config.show")); json({ global: readGlobal(), project: readProject(cwd), home: GLOBAL_DIR }); return 0; }
      const value = vals.join(" ");
      switch (key) {
        case "lang": writeGlobal({ ...readGlobal(), lang: value as Lang }); break;
        case "commit": writeProject(cwd, { ...readProject(cwd), commit: /^(on|true|1|yes)$/i.test(value) }); break;
        case "telegram": writeGlobal({ ...readGlobal(), telegram: { token: vals[0], chatId: vals[1] } }); break;
        case "vault.dir": writeProject(cwd, { ...readProject(cwd), vault: { dir: value } }); break;
        case "handoff.path": writeProject(cwd, { ...readProject(cwd), handoff: { path: value } }); break;
        case "name": writeProject(cwd, { ...readProject(cwd), name: value }); break;
        default: out(`unknown key: ${key}`); return 2;
      }
      out(t("config.set", { key, value: key === "telegram" ? "[set]" : value }));
      return 0;
    }
    case "log": {
      const n = Number(str("tail") ?? 20);
      const evs = readEvents(cwd);
      for (const e of evs.slice(-n)) out(JSON.stringify(e));
      return 0;
    }
    case "version": case "--version": case "-v": { out("claude-trail 1.0.0"); return 0; }
    default: out(t("help.text", { tagline: t("app.tagline") })); return cmd === "help" || cmd === "--help" ? 0 : 2;
  }
}

main().then((code) => process.exit(code), (err) => { process.stderr.write(`trail: ${(err as Error).message}\n`); process.exit(1); });
