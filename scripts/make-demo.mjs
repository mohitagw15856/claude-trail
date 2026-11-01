/**
 * Builds a realistic demo project by driving the REAL hooks, then captures REAL CLI output.
 * The GIFs in the README are rendered from these captures. No screen recording, no mock output.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = new URL("..", import.meta.url).pathname;
const DEMO = join(ROOT, "scripts/.demo");
const PROJ = join(DEMO, "project");
const OUT = join(DEMO, "out");
const HOME = join(DEMO, "home");
const HOOK = join(ROOT, "dist/hook.js");
const CLI = join(ROOT, "dist/cli.js");
rmSync(DEMO, { recursive: true, force: true });
mkdirSync(join(PROJ, "src"), { recursive: true }); mkdirSync(OUT, { recursive: true }); mkdirSync(HOME, { recursive: true });
const env = { ...process.env, CLAUDE_TRAIL_HOME: HOME, TRAIL_LANG: "en" };
let clock = new Date("2026-10-30T09:12:00Z").getTime();
const tick = (min) => { clock += min * 60_000; return new Date(clock).toISOString(); };

function hook(event, payload) {
  const r = spawnSync("node", [HOOK, event], { input: JSON.stringify({ cwd: PROJ, ...payload }), env: { ...env, TRAIL_FAKE_NOW: new Date(clock).toISOString() }, encoding: "utf8" });
  return r.stdout;
}
function transcript(name, { usd, model = "claude-opus-5-5", lastText, out = 4200, cr = 310_000, cw = 12_000 }) {
  const p = join(DEMO, `${name}.jsonl`);
  writeFileSync(p, [
    JSON.stringify({ type: "assistant", timestamp: new Date(clock).toISOString(), message: { model, usage: { input_tokens: 120, output_tokens: out, cache_read_input_tokens: cr, cache_creation_input_tokens: cw }, content: [{ type: "text", text: lastText }] } }),
    JSON.stringify({ type: "cost-state", totalCostUSD: usd, totalLinesAdded: 180, totalLinesRemoved: 23, modelUsage: { [model]: { inputTokens: 120, outputTokens: out, cacheReadInputTokens: cr, cacheCreationInputTokens: cw, costUSD: usd } } }),
  ].join("\n") + "\n");
  return p;
}
function write(file, content) { mkdirSync(join(PROJ, file, ".."), { recursive: true }); writeFileSync(join(PROJ, file), content); return content; }

const RETRY_V1 = `import { sleep } from "./sleep";

export async function fetchWithRetry(url: string, init?: RequestInit) {
  const retries = 3;
  const backoffMs = 250;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return res;
    } catch (err) {
      if (attempt === retries - 1) throw err;
    }
    await sleep(backoffMs * 2 ** attempt);
  }
  throw new Error("unreachable");
}
`;
const RETRY_V2 = RETRY_V1.replace('  const retries = 3;\n', '  const retries = init?.signal ? 1 : 3;\n').replace('throw new Error("unreachable");', 'throw new Error(`fetchWithRetry: gave up after ${retries} attempts`);');

// ── Session 1: build the retry helper ───────────────────────────────────────
hook("SessionStart", { session_id: "a1f9c2e0-s1", source: "startup", _t: tick(0) });
hook("UserPromptSubmit", { session_id: "a1f9c2e0-s1", prompt: "add a fetchWithRetry helper with exponential backoff" });
hook("PostToolUse", { session_id: "a1f9c2e0-s1", tool_name: "Write", tool_input: { file_path: join(PROJ, "src/retry.ts"), content: write("src/retry.ts", RETRY_V1) } });
hook("PostToolUse", { session_id: "a1f9c2e0-s1", tool_name: "Write", tool_input: { file_path: join(PROJ, "src/sleep.ts"), content: write("src/sleep.ts", "export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));\n") } });
hook("UserPromptSubmit", { session_id: "a1f9c2e0-s1", prompt: "Don't use em-dashes in comments" });
hook("PostToolUse", { session_id: "a1f9c2e0-s1", tool_name: "Bash", tool_input: { command: "npm test" }, tool_response: { stdout: "ok" } });
tick(34);
let t = transcript("s1", { usd: 1.84, lastText: "Added fetchWithRetry with exponential backoff and a sleep helper. Tests pass.\n\nNext step: respect AbortSignal so callers can cancel mid-retry." });
hook("Stop", { session_id: "a1f9c2e0-s1", transcript_path: t });
hook("SessionEnd", { session_id: "a1f9c2e0-s1", transcript_path: t, reason: "other" });

// ── Session 2: abort signal + a correction repeated ──────────────────────────
tick(60 * 20);
hook("SessionStart", { session_id: "b7d3e4f1-s2", source: "startup" });
hook("UserPromptSubmit", { session_id: "b7d3e4f1-s2", prompt: "respect AbortSignal in fetchWithRetry and improve the give-up error" });
hook("PostToolUse", { session_id: "b7d3e4f1-s2", tool_name: "Edit", tool_input: { file_path: join(PROJ, "src/retry.ts"), old_string: "  const retries = 3;\n", new_string: "  const retries = init?.signal ? 1 : 3;\n" } });
hook("PostToolUse", { session_id: "b7d3e4f1-s2", tool_name: "Edit", tool_input: { file_path: join(PROJ, "src/retry.ts"), old_string: 'throw new Error("unreachable");', new_string: 'throw new Error(`fetchWithRetry: gave up after ${retries} attempts`);' } });
write("src/retry.ts", RETRY_V2);
hook("UserPromptSubmit", { session_id: "b7d3e4f1-s2", prompt: "no, don't use em-dashes in comments, use plain hyphens" });
hook("UserPromptSubmit", { session_id: "b7d3e4f1-s2", prompt: "always run npm test before you say you're done" });
hook("PostToolUse", { session_id: "b7d3e4f1-s2", tool_name: "Bash", tool_input: { command: "npm test" }, tool_response: { stdout: "ok" } });
tick(22);
t = transcript("s2", { usd: 0.97, model: "claude-sonnet-5-5", out: 2100, cr: 140_000, lastText: "AbortSignal is respected and the error message names the attempt count.\n\nRemaining: the README still documents the old 3-retry default." });
hook("Stop", { session_id: "b7d3e4f1-s2", transcript_path: t });
hook("SessionEnd", { session_id: "b7d3e4f1-s2", transcript_path: t, reason: "other" });

// ── Session 3: 中文 session, human edits a line by hand afterwards ─────────────
tick(60 * 15);
hook("SessionStart", { session_id: "c9e8a7b6-s3", source: "startup" });
hook("UserPromptSubmit", { session_id: "c9e8a7b6-s3", prompt: "把 README 里的重试默认值改成和代码一致" });
hook("PostToolUse", { session_id: "c9e8a7b6-s3", tool_name: "Write", tool_input: { file_path: join(PROJ, "README.md"), content: write("README.md", "# demo\n\nfetchWithRetry retries 3 times, or once when an AbortSignal is passed.\n") } });
hook("UserPromptSubmit", { session_id: "c9e8a7b6-s3", prompt: "不要用 any 类型" });
hook("UserPromptSubmit", { session_id: "c9e8a7b6-s3", prompt: "always run npm test before you say you're done" });
hook("PostToolUse", { session_id: "c9e8a7b6-s3", tool_name: "Bash", tool_input: { command: "npm test" }, tool_response: { stdout: "ok" } });
tick(11);
t = transcript("s3", { usd: 0.41, model: "claude-sonnet-5-5", out: 900, cr: 80_000, lastText: "README 已更新。\n\n下一步：给 fetchWithRetry 加 jitter，避免重试风暴。" });
hook("Stop", { session_id: "c9e8a7b6-s3", transcript_path: t });
hook("SessionEnd", { session_id: "c9e8a7b6-s3", transcript_path: t, reason: "other" });
// a human edits one line by hand
write("src/retry.ts", RETRY_V2.replace("const backoffMs = 250;", "const backoffMs = 400; // tuned by hand after prod incident"));

// ── Capture real output ──────────────────────────────────────────────────────
function cap(name, args, extraEnv = {}, input) {
  const r = spawnSync("node", [CLI, ...args], { cwd: PROJ, env: { ...env, ...extraEnv }, encoding: "utf8", input });
  writeFileSync(join(OUT, `${name}.txt`), r.stdout);
  return r.stdout;
}
cap("blame", ["blame", "src/retry.ts"]);
cap("cost", ["cost"]);
cap("rules", ["rules"]);
cap("handoff", ["handoff", "--print"]);
cap("digest", ["digest", "--since", "7d"]);
cap("vault", ["vault"]);
cap("export", ["export"]);
cap("status", ["status"]);
cap("blame-zh", ["blame", "src/retry.ts", "--summary"], { TRAIL_LANG: "zh" });
cap("cost-zh", ["cost"], { TRAIL_LANG: "zh" });
cap("handoff-zh", ["handoff", "--print"], { TRAIL_LANG: "zh" });
cap("rules-zh", ["rules"], { TRAIL_LANG: "zh" });
cap("digest-zh", ["digest", "--since", "7d"], { TRAIL_LANG: "zh" });
writeFileSync(join(OUT, "sessionstart.txt"), hook("SessionStart", { session_id: "d0d0d0d0-s4", source: "startup" }));
writeFileSync(join(OUT, "sessionstart-zh.txt"), spawnSync("node", [HOOK, "SessionStart"], { input: JSON.stringify({ cwd: PROJ, session_id: "d0d0d0d0-s5", source: "startup" }), env: { ...env, TRAIL_LANG: "zh" }, encoding: "utf8" }).stdout);
const vaultDir = join(PROJ, ".claude-trail/vault/Claude Trail/project");
const { readdirSync, readFileSync } = await import("node:fs");
const note = readdirSync(join(vaultDir, "sessions")).sort()[0];
writeFileSync(join(OUT, "vault-note.txt"), readFileSync(join(vaultDir, "sessions", note), "utf8"));
writeFileSync(join(OUT, "passport.txt"), readFileSync(join(PROJ, ".claude-trail/passport/preferences.md"), "utf8"));
console.log("demo captured in", OUT);
for (const f of readdirSync(OUT)) console.log(" -", f);
