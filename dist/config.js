import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, basename } from "node:path";
export const GLOBAL_DIR = process.env.CLAUDE_TRAIL_HOME ?? join(homedir(), ".claude-trail");
export const GLOBAL_SETTINGS = join(GLOBAL_DIR, "settings.json");
export const PROJECTS_FILE = join(GLOBAL_DIR, "projects.json");
export const LOG_DIRNAME = ".claude-trail";
function readJson(path, fallback) {
    try {
        if (existsSync(path))
            return { ...fallback, ...JSON.parse(readFileSync(path, "utf8")) };
    }
    catch { /* ignore */ }
    return fallback;
}
export function readGlobal() { return readJson(GLOBAL_SETTINGS, {}); }
export function writeGlobal(s) {
    mkdirSync(GLOBAL_DIR, { recursive: true });
    writeFileSync(GLOBAL_SETTINGS, JSON.stringify(s, null, 2) + "\n");
}
export function projectDir(cwd) { return join(cwd, LOG_DIRNAME); }
export function projectConfigPath(cwd) { return join(projectDir(cwd), "config.json"); }
export function readProject(cwd) { return readJson(projectConfigPath(cwd), {}); }
export function writeProject(cwd, c) {
    ensureProjectDir(cwd, c.commit === true);
    writeFileSync(projectConfigPath(cwd), JSON.stringify(c, null, 2) + "\n");
}
/** Create .claude-trail/ with a self-gitignore unless the project opted into committing the log. */
export function ensureProjectDir(cwd, commit = false) {
    const dir = projectDir(cwd);
    mkdirSync(dir, { recursive: true });
    const gi = join(dir, ".gitignore");
    if (!commit && !existsSync(gi))
        writeFileSync(gi, "# claude-trail keeps its log private by default. Run `trail config commit on` to version it.\n*\n!.gitignore\n!config.json\n");
    if (commit && existsSync(gi))
        writeFileSync(gi, "# claude-trail: log is committed (trail config commit on)\nvault/\n");
    return dir;
}
export function resolveLang(cwd) {
    const env = process.env.TRAIL_LANG ?? process.env.CLAUDE_TRAIL_LANG;
    if (env)
        return env.toLowerCase().startsWith("zh") ? "zh" : "en";
    if (cwd) {
        const p = readProject(cwd);
        if (p.lang)
            return p.lang;
    }
    const g = readGlobal();
    if (g.lang)
        return g.lang;
    const sys = process.env.LC_ALL ?? process.env.LC_MESSAGES ?? process.env.LANG ?? "";
    return sys.toLowerCase().startsWith("zh") ? "zh" : "en";
}
export function projectName(cwd) {
    const p = readProject(cwd);
    return p.name ?? basename(cwd);
}
export function registerProject(cwd) {
    mkdirSync(GLOBAL_DIR, { recursive: true });
    const list = readJson(PROJECTS_FILE, { projects: [] });
    const now = new Date().toISOString();
    const hit = list.projects.find((p) => p.path === cwd);
    if (hit) {
        hit.lastSeen = now;
        hit.sessions++;
        hit.name = projectName(cwd);
    }
    else
        list.projects.push({ path: cwd, name: projectName(cwd), lastSeen: now, sessions: 1 });
    list.projects.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
    writeFileSync(PROJECTS_FILE, JSON.stringify(list, null, 2) + "\n");
}
export function listProjects() {
    return readJson(PROJECTS_FILE, { projects: [] }).projects.filter((p) => existsSync(p.path));
}
