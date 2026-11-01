# Translations · 翻译 · 翻譯

| Language | README | CLI strings |
|---|---|---|
| English | [README.md](../../README.md) | [`src/i18n/en.ts`](../../src/i18n/en.ts) |
| 简体中文 | [README.zh.md](README.zh.md) | [`src/i18n/zh.ts`](../../src/i18n/zh.ts) |
| 繁體中文 | [README.zh-tw.md](README.zh-tw.md) | uses `zh` |

## Adding a language

1. Copy `src/i18n/en.ts` to `src/i18n/<code>.ts` and translate the values. Keep the keys and the `{placeholders}`.
2. Register it in `src/i18n/index.ts` (`DICTS`) and widen the `Lang` type in `src/config.ts`.
3. Run `npm test`. A test checks that every key in `en` exists in your dictionary.
4. Copy `README.md` to `docs/i18n/README.<code>.md`, translate, and fix the relative image paths (`../public/...`).
5. Add a row above and a link in the language bar at the top of every README.

Translations of the CLI are more valuable than translations of the README: they are what people see every day.
