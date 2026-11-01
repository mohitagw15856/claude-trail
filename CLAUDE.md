# claude-trail

TypeScript, Node 20+, zero runtime dependencies. `npm test` builds and runs `tests/*.test.mjs` with `node --test`.

- Hooks live in `src/hooks/` and must never throw, never block, never touch the network.
- All user-visible strings go through `t()` with keys in `src/i18n/en.ts` AND `src/i18n/zh.ts`. A test enforces parity.
- Lenses in `src/lenses/` are pure functions over `readEvents()`.
- Imports use `.js` extensions (NodeNext).
- `npm run media` regenerates `docs/public/*.png|gif` from real CLI output via `scripts/make-demo.mjs` and `scripts/render-media.py` (needs `uv`). Regenerate after changing any output format.
- Don't add dependencies. Don't add a daemon. Don't add a database.
