import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { project, hook, cli, write, transcript } from "./helpers.mjs";

function session(p, id, { prompts = [], edits = [], cmds = [], usd = 1.25, lastText } = {}) {
  hook(p, "SessionStart", { session_id: id, source: "startup" });
  let i = 0;
  for (const pr of prompts) {
    hook(p, "UserPromptSubmit", { session_id: id, prompt: pr });
    const e = edits[i++];
    if (e) hook(p, "PostToolUse", { session_id: id, tool_name: "Write", tool_input: { file_path: join(p.dir, e.file), content: e.content } });
  }
  for (const c of cmds) hook(p, "PostToolUse", { session_id: id, tool_name: "Bash", tool_input: { command: c }, tool_response: { stdout: "" } });
  const t = transcript(p, { usd, lastText });
  hook(p, "Stop", { session_id: id, transcript_path: t });
  hook(p, "SessionEnd", { session_id: id, transcript_path: t, reason: "other" });
}

test("blame attributes lines to the prompt that wrote them", () => {
  const p = project();
  const content = "export function retry() {\n  const retries = 3;\n  const backoffMs = 250;\n}\n";
  session(p, "aaaa1111", { prompts: ["add retry with backoff"], edits: [{ file: "retry.ts", content }] });
  write(p, "retry.ts", content.replace("}\n", "  // human added this line\n}\n"));
  const r = cli(p, ["blame", "retry.ts", "--json"]);
  assert.equal(r.code, 0, r.err);
  const j = JSON.parse(r.out);
  assert.equal(j.claude, 3);
  assert.equal(j.human, 1);
  assert.equal(j.lines[1].prompt, "add retry with backoff");
  const text = cli(p, ["blame", "retry.ts"]).out;
  assert.match(text, /🐾 aaaa11/);
  assert.match(text, /3 lines by Claude \(75%\)/);
});

test("cost reads Claude Code's exact cost-state", () => {
  const p = project();
  session(p, "bbbb2222", { prompts: ["x"], usd: 2.5 });
  const r = cli(p, ["cost"]);
  assert.match(r.out, /\$2\.50/);
  assert.match(r.out, /exact/);
  const j = JSON.parse(cli(p, ["cost", "--json"]).out);
  assert.equal(j[0].usd, 2.5);
  assert.equal(j[0].model, "claude-opus-5-5");
  const sl = cli(p, ["statusline"], { input: JSON.stringify({ session_id: "bbbb2222", cost: { total_cost_usd: 3.1 } }) });
  assert.match(sl.out, /\$3\.10/);
});

test("handoff is written on Stop and injected on next SessionStart", () => {
  const p = project();
  session(p, "cccc3333", { prompts: ["build the login page"], edits: [{ file: "login.tsx", content: "export const Login = () => null;\n" }], cmds: ["npm test"], lastText: "Done.\n- Next step: wire the form to the API\n- Remaining: error states" });
  const h = readFileSync(join(p.dir, ".claude-trail/HANDOFF.md"), "utf8");
  assert.match(h, /# HANDOFF/);
  assert.match(h, /login\.tsx/);
  assert.match(h, /Tests were run/);
  assert.match(h, /wire the form to the API/);
  const ctx = hook(p, "SessionStart", { session_id: "dddd4444", source: "startup" });
  assert.match(ctx, /what happened last time/);
  assert.match(ctx, /login\.tsx/);
  assert.match(ctx, /Open loops/);
  assert.ok(ctx.split("\n").length < 15, "injection stays short");
  // --to outside .claude-trail/ only touches the marked block
  write(p, "HANDOFF.md", "# My notes\nkeep me\n");
  cli(p, ["handoff", "--to", "HANDOFF.md"]);
  const h2 = readFileSync(join(p.dir, "HANDOFF.md"), "utf8");
  assert.match(h2, /keep me/);
  assert.match(h2, /<!-- trail:start -->/);
  cli(p, ["handoff", "--to", "HANDOFF.md"]);
  assert.equal(readFileSync(join(p.dir, "HANDOFF.md"), "utf8").split("trail:start").length, 2, "idempotent");
});

test("rules clusters corrections in English and 中文 and applies to CLAUDE.md", () => {
  const p = project();
  session(p, "eeee5555", { prompts: ["Don't use em-dashes in comments", "do the thing", "don't use em dashes in comments!"] });
  session(p, "ffff6666", { prompts: ["不要用 any 类型", "继续", "不要用 any 类型。"] });
  const r = cli(p, ["rules"]);
  assert.match(r.out, /×2  Don't use em-dashes in comments/);
  assert.match(r.out, /×2  不要用 any 类型/);
  const a = cli(p, ["rules", "--apply"]);
  assert.match(a.out, /Appended 2 rule/);
  const md = readFileSync(join(p.dir, "CLAUDE.md"), "utf8");
  assert.match(md, /## Rules learned by claude-trail/);
  assert.match(md, /不要用 any 类型/);
  assert.match(cli(p, ["rules", "--apply"]).out, /Nothing new/);
});

test("digest, vault and passport export from the same log", () => {
  const p = project();
  session(p, "aaaa7777", { prompts: ["refactor auth", "never commit without tests"], edits: [{ file: "auth.ts", content: "export const a = 1;\n" }], usd: 0.4 });
  const d = cli(p, ["digest", "--since", "1d"]);
  assert.match(d.out, /1 sessions, 2 prompts, 1 edits, \$0\.400/);
  assert.match(d.out, /auth\.ts/);
  const dj = JSON.parse(cli(p, ["digest", "--json"]).out);
  assert.equal(dj.projects.length, 1);
  const v = cli(p, ["vault"]);
  assert.match(v.out, /Wrote 1 session notes and 1 file notes/);
  const root = join(p.dir, ".claude-trail/vault/Claude Trail", readdirSync(join(p.dir, ".claude-trail/vault/Claude Trail"))[0]);
  assert.ok(existsSync(join(root, "index.md")));
  const note = readFileSync(join(root, "sessions", readdirSync(join(root, "sessions"))[0]), "utf8");
  assert.match(note, /\[\[files\/auth.ts\|auth.ts\]\]/);
  const e = cli(p, ["export"]);
  assert.match(e.out, /Exported passport vault/);
  const prefs = readFileSync(join(p.dir, ".claude-trail/passport/preferences.md"), "utf8");
  assert.match(prefs, /\[stated\] never commit without tests/);
  assert.match(readFileSync(join(p.dir, ".claude-trail/passport/passport.yaml"), "utf8"), /spec_version: "0.1"/);
  // round trip into a fresh project
  const q = project();
  const i = cli(q, ["import", join(p.dir, ".claude-trail/passport")]);
  assert.match(i.out, /Imported 1 preference/);
  assert.match(cli(q, ["rules"]).out, /never commit without tests \(imported\)/);
});

test("language switches to 中文 via env and config", () => {
  const p = project();
  session(p, "aaaa8888", { prompts: ["hi"] });
  assert.match(cli(p, ["cost"], { env: { TRAIL_LANG: "zh" } }).out, /合计/);
  assert.match(cli(p, ["handoff", "--print"], { env: { TRAIL_LANG: "zh" } }).out, /交接记录/);
  const ctx = hook({ ...p, env: { ...p.env, TRAIL_LANG: "zh" } }, "SessionStart", { session_id: "new", source: "startup" });
  assert.match(ctx, /上次发生了什么/);
  cli(p, ["lang", "zh", "--project"]);
  assert.match(cli(p, ["status"], { env: { TRAIL_LANG: "" } }).out, /状态/);
});
