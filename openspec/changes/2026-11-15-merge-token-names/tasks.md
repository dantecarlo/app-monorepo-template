# Tasks: 2026-11-15-merge-token-names

- [x] T1 — The generator writes `src/themeNames.constant.ts` from the web theme's declarations, `duration` left out by a named rule, exported from `@app/tokens`; the tie test; the generator and theme-sync tests, the gate's header and claim, and `.prettierignore` · Requirements: TOKENS-15, TOKENS-16, TOKENS-20 · Commit: d1461c5
- [x] T2 — The shared `tv` builds its tailwind-merge config from `themeNames`; the merge-pair, registration and compile tests; the `ui/` class strings compared before and after · Requirements: TOKENS-20, WEB-44 · Commit: c391346
- [ ] T3 — Docs and skills: the tokens README, `docs/architecture/web.md`, `docs/code-standards.md` §22, `docs/maps/global-map.md`, and the `component` and `arch` skills · Requirements: none · Commit: —
