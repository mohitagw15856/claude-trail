# Contributing

Thanks for leaving footprints. 🐾

## Setup

```bash
git clone https://github.com/mohitagw15856/claude-trail
cd claude-trail
npm install          # typescript + @types/node, nothing else
npm test             # builds, then runs node --test
```

Try your build against a real Claude Code session without touching your global settings:

```bash
node dist/cli.js install     # writes absolute paths to THIS checkout into ~/.claude/settings.json
# … use Claude Code …
node dist/cli.js install --uninstall
```

## Rules of the repo

- **Zero runtime dependencies.** If it is not in Node 20's standard library, it does not go in `src/`.
- **Hooks never fail and never block.** No network, no model calls, no heavy parsing in `src/hooks/`. Target under 50 ms.
- **Every string is in `src/i18n/`.** `npm test` fails if `zh` is missing a key. Add the English and 中文 together; if you cannot write the 中文, leave the English in both and say so in the PR.
- **Lenses are pure.** They read the log and return a string or an object. No caching layer, no database.
- **Media is generated.** `npm run media` rebuilds every PNG and GIF from real CLI output. If you change an output format, run it and commit the result.

## Adding a lens

1. `src/lenses/<name>.ts` exporting a `render<Name>(cwd, opts)` and, if useful, a data function.
2. A `case` in `src/cli.ts` and a line in `help.text` for both languages.
3. Strings in `src/i18n/en.ts` and `src/i18n/zh.ts`.
4. A test in `tests/lenses.test.mjs` that drives the real hooks (see `session()` there).
5. A section in `README.md` and `docs/lenses.md`.

## Adding a language

See [docs/i18n/README.md](docs/i18n/README.md).

## Commit style

Short imperative subject, body if the why is not obvious. Co-authorship trailers welcome.
