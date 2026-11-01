import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

export const HOOK = new URL("../dist/hook.js", import.meta.url).pathname;
export const CLI = new URL("../dist/cli.js", import.meta.url).pathname;

export function project() {
  const dir = mkdtempSync(join(tmpdir(), "trail-"));
  const home = mkdtempSync(join(tmpdir(), "trail-home-"));
  return { dir, home, env: { ...process.env, CLAUDE_TRAIL_HOME: home, TRAIL_LANG: "en" } };
}

export function hook(p, event, payload) {
  const r = spawnSync("node", [HOOK, event], { input: JSON.stringify({ cwd: p.dir, session_id: "s1", ...payload }), env: p.env, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`hook ${event} exited ${r.status}: ${r.stderr}`);
  return r.stdout;
}

export function cli(p, args, opts = {}) {
  const r = spawnSync("node", [CLI, ...args], { cwd: p.dir, env: { ...p.env, ...(opts.env ?? {}) }, encoding: "utf8", input: opts.input });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

export function write(p, name, content) { writeFileSync(join(p.dir, name), content); }

/** A fake Claude Code transcript with a cost-state record, like the real thing. */
export function transcript(p, { usd = 1.25, model = "claude-opus-5-5", lastText = "Done. Next step: wire the retry into the client." } = {}) {
  const lines = [
    JSON.stringify({ type: "assistant", timestamp: "2026-11-01T10:00:00Z", message: { model, usage: { input_tokens: 100, output_tokens: 2000, cache_read_input_tokens: 50000, cache_creation_input_tokens: 3000 }, content: [{ type: "text", text: "Working on it." }] } }),
    JSON.stringify({ type: "assistant", timestamp: "2026-11-01T10:05:00Z", message: { model, usage: { input_tokens: 50, output_tokens: 900, cache_read_input_tokens: 60000, cache_creation_input_tokens: 0 }, content: [{ type: "text", text: lastText }] } }),
    JSON.stringify({ type: "cost-state", totalCostUSD: usd, totalLinesAdded: 42, totalLinesRemoved: 7, modelUsage: { [model]: { inputTokens: 150, outputTokens: 2900, cacheReadInputTokens: 110000, cacheCreationInputTokens: 3000, costUSD: usd } } }),
  ];
  const path = join(p.dir, "transcript.jsonl");
  writeFileSync(path, lines.join("\n") + "\n");
  return path;
}
