/**
 * memory-passport (https://github.com/mohitagw15856/memory-passport) is a plain-text, provenance-tagged
 * memory format any assistant can read. Export turns the trail into a vault; import pulls preferences back.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { append, fileStats, readEvents, sessions } from "../log/events.js";
import { projectDir, projectName } from "../config.js";
import { fmtDate } from "../i18n/index.js";
import { topCorrections } from "./rules.js";
import { oneLine } from "./handoff.js";
const SRC = "claude-code";
const kebab = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "project";
const yamlStr = (s) => JSON.stringify(s);
export function passportDir(cwd, arg) {
    if (!arg)
        return join(projectDir(cwd), "passport");
    return isAbsolute(arg) ? arg : join(cwd, arg);
}
export function exportPassport(cwd, dir) {
    const evs = readEvents(cwd);
    const ss = sessions(evs).filter((s) => s.prompts.length || s.tools.length);
    const project = projectName(cwd);
    const today = fmtDate(new Date().toISOString());
    mkdirSync(join(dir, "areas"), { recursive: true });
    mkdirSync(join(dir, "people"), { recursive: true });
    mkdirSync(join(dir, "topics"), { recursive: true });
    writeFileSync(join(dir, "passport.yaml"), `spec_version: "0.1"\ncreated: "${today}"\nexported_by: claude-trail 1.0.0\n`);
    let facts = 0;
    // areas/<project>.md: what the project is, from observed work.
    const files = fileStats(ss.flatMap((s) => s.tools)).slice(0, 10);
    const area = ["---", `name: ${yamlStr(project)}`, `description: ${yamlStr(`Coding project worked on with Claude Code; ${ss.length} sessions recorded by claude-trail.`)}`,
        `sources: [${SRC}]`, `updated: "${today}"`, "kind: area", "---", "", "## Recent work"];
    for (const s of ss.slice(-10))
        for (const p of s.prompts.slice(0, 2)) {
            area.push(`- [observed] Asked Claude to: ${oneLine(p.text, 160)} <!-- src: ${SRC}, ${fmtDate(s.start)} -->`);
            facts++;
        }
    if (files.length) {
        area.push("", "## Files that matter");
        for (const f of files) {
            area.push(`- [observed] Frequently edited \`${f.file}\` (${f.edits} edits) <!-- src: ${SRC}, ${today} -->`);
            facts++;
        }
    }
    writeFileSync(join(dir, "areas", `${kebab(project)}.md`), area.join("\n") + "\n");
    // preferences.md: corrections are the user telling an assistant how to behave. [stated] by definition.
    const prefs = ["---", "name: Preferences", `description: ${yamlStr("How the user wants coding assistants to behave, learned from corrections given in Claude Code.")}`,
        `sources: [${SRC}]`, `updated: "${today}"`, "kind: preferences", "---", "", "## Coding assistants"];
    for (const c of topCorrections(evs, 50)) {
        prefs.push(`- [stated] ${oneLine(c.text, 200)} <!-- src: ${SRC}, ${fmtDate(c.last)}${c.count > 1 ? `, repeated ${c.count}x` : ""} -->`);
        facts++;
    }
    writeFileSync(join(dir, "preferences.md"), prefs.join("\n") + "\n");
    if (!existsSync(join(dir, "profile.md")))
        writeFileSync(join(dir, "profile.md"), ["---", "name: Profile", `description: ${yamlStr("The user. Fill in role, location and languages; claude-trail only exports what it observed.")}`, `sources: [${SRC}]`, `updated: "${today}"`, "kind: profile", "---", "", "## Unsorted", `- [observed] Uses Claude Code on project "${project}" <!-- src: ${SRC}, ${today} -->`, ""].join("\n"));
    return { dir, facts: facts + 1 };
}
/** Import [stated] preference lines from a passport vault as rule candidates. */
export function importPassport(cwd, dir) {
    const p = join(dir, "preferences.md");
    if (!existsSync(p))
        return 0;
    const applied = new Set(readEvents(cwd).filter((e) => e.type === "rule.imported").map((e) => e.text));
    let n = 0;
    for (const line of readFileSync(p, "utf8").split("\n")) {
        const m = /^-\s*\[stated\]\s*(.+?)\s*(<!--.*-->)?\s*$/.exec(line);
        if (!m)
            continue;
        const text = m[1].trim();
        if (!text || applied.has(text))
            continue;
        append(cwd, { v: 1, ts: new Date().toISOString(), session: "cli", type: "rule.imported", text, source: dir });
        n++;
    }
    return n;
}
