# Tasks: 2026-11-15-generated-tokens

- [x] T1 — The source holds every value an output carries: `sharedColors` with the cool glow, the `knobInset` rename, the font fallback, the web font loader variables and the shimmer motion · Requirements: TOKENS-05, TOKENS-14, TOKENS-19 · Commit: b1d0fa5
- [x] T2 — The generator and its three outputs (`theme.css`, `tailwind-preset.cjs`, `src/themeVars.constant.ts`), the package's `generate` script and export, the `.prettierignore` entries, and `verify:theme-sync` as the regenerate-and-diff gate with its companion · Requirements: TOKENS-12, TOKENS-13, TOKENS-15, TOKENS-16, TOKENS-17, TOKENS-18, TOKENS-19 · Commit: 493fce0
- [x] T3 — The web reads the generated theme: `globals.css` imports it and drops `@config`, `apps/web/tailwind.config.cjs` deleted, the hand-written rules on generated variables, the layout's font variables tied to the tokens · Requirements: TOKENS-12, WEB-40, WEB-43 · Commit: 06306df
- [x] T4 — Docs and skills: the tokens README, the web and mobile architecture, the harness, the code standards, the global map, and the `arch`, `component`, `modify` and `validate-all` skills · Requirements: none · Commit: 570257b
