import { test } from "node:test";
import assert from "node:assert/strict";
import { detectCorrection, normalizeCorrection } from "../dist/log/corrections.js";
import { redact } from "../dist/log/redact.js";
import { usd, priceFor } from "../dist/log/pricing.js";
import { lineKey } from "../dist/log/hash.js";
import { DICT_KEYS } from "../dist/i18n/index.js";
import { openLoops } from "../dist/lenses/handoff.js";

test("correction detection, English", () => {
  assert.equal(detectCorrection("Don't use em-dashes").strength, "strong");
  assert.equal(detectCorrection("Always run the tests before committing").strength, "strong");
  assert.equal(detectCorrection("ok but from now on use pnpm").strength, "weak");
  assert.equal(detectCorrection("build the login page"), null);
  assert.equal(detectCorrection("/clear"), null);
  assert.equal(detectCorrection("x".repeat(700)), null);
});

test("correction detection, 中文", () => {
  assert.deepEqual(detectCorrection("不要用 any 类型"), { strength: "strong", lang: "zh", text: "不要用 any 类型" });
  assert.equal(detectCorrection("以后都用中文注释").strength, "strong");
  assert.equal(detectCorrection("好的，记得每次都跑测试").strength, "weak");
  assert.equal(detectCorrection("帮我写一个登录页面"), null);
});

test("normalisation clusters near-duplicates", () => {
  assert.equal(normalizeCorrection("No, don't use em-dashes!"), normalizeCorrection("don't use em dashes"));
});

test("redaction covers common token shapes", () => {
  const s = redact("ghp_abcdefghijklmnopqrstuvwxyz0123 and password=hunter22 and https://u:pw@host/x");
  assert.doesNotMatch(s, /ghp_abc/);
  assert.doesNotMatch(s, /hunter22/);
  assert.doesNotMatch(s, /u:pw@/);
});

test("pricing matches the longest model prefix", () => {
  assert.equal(priceFor("claude-opus-5-5").input, 4);
  assert.equal(priceFor("claude-opus-5").input, 5);
  assert.equal(priceFor("claude-sonnet-5-5-20260101").output, 10);
  assert.equal(priceFor("gpt-x"), null);
  assert.equal(usd("claude-haiku-5-5", { input: 1e6, output: 0, cacheRead: 0, cacheWrite: 0 }), 0.1);
});

test("line keys skip noise", () => {
  assert.equal(lineKey("}"), null);
  assert.equal(lineKey("   "), null);
  assert.equal(lineKey("const a = 1;"), lineKey("    const a = 1;   "));
});

test("open loops are extracted in both languages", () => {
  const loops = openLoops("All good.\n- Next step: add tests\n- 下一步：接入 API\nThanks");
  assert.equal(loops.length, 2);
});

test("every English string has a 中文 translation", () => {
  const missing = DICT_KEYS.en.filter((k) => !DICT_KEYS.zh.includes(k));
  assert.deepEqual(missing, []);
  const extra = DICT_KEYS.zh.filter((k) => !DICT_KEYS.en.includes(k));
  assert.deepEqual(extra, []);
});
