import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { project, hook, cli } from "./helpers.mjs";

test("hooks append events and never fail on garbage", () => {
  const p = project();
  const ctx = hook(p, "SessionStart", { source: "startup" });
  assert.match(ctx, /first time/);
  hook(p, "UserPromptSubmit", { prompt: "add retry logic" });
  hook(p, "PostToolUse", { tool_name: "Edit", tool_input: { file_path: join(p.dir, "a.ts"), old_string: "x", new_string: "const retries = 3;\nconst backoffMs = 250;" } });
  const log = readFileSync(join(p.dir, ".claude-trail/events.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  assert.equal(log.length, 3);
  assert.equal(log[1].type, "prompt");
  assert.equal(log[2].file, "a.ts");
  assert.equal(log[2].added, 2);
  assert.equal(log[2].promptId, "p1");
  assert.ok(existsSync(join(p.dir, ".claude-trail/.gitignore")), "log is gitignored by default");
  // garbage stdin: exit 0, nothing logged
  const r = spawnSync("node", [new URL("../dist/hook.js", import.meta.url).pathname, "PostToolUse"], { input: "not json", env: p.env, encoding: "utf8" });
  assert.equal(r.status, 0);
  assert.equal(readFileSync(join(p.dir, ".claude-trail/events.jsonl"), "utf8").trim().split("\n").length, 3);
});

test("secrets are redacted at write time and <private> is dropped", () => {
  const p = project();
  hook(p, "UserPromptSubmit", { prompt: "use key sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789 and <private>my salary is 1</private> ok" });
  const line = readFileSync(join(p.dir, ".claude-trail/events.jsonl"), "utf8");
  assert.doesNotMatch(line, /sk-ant-api03/);
  assert.doesNotMatch(line, /salary/);
  assert.match(line, /\[redacted:anthropic-key\]/);
  assert.match(line, /\[private\]/);
});

test("status and log commands work", () => {
  const p = project();
  hook(p, "UserPromptSubmit", { prompt: "hello" });
  const s = cli(p, ["status"]);
  assert.equal(s.code, 0);
  assert.match(s.out, /1 sessions · 1 prompts/);
  const l = cli(p, ["log", "--tail", "1"]);
  assert.match(l.out, /"type":"prompt"/);
});
