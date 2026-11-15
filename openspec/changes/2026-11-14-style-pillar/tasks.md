# Tasks: 2026-11-14-style-pillar

- [x] T1 — `local/style-positions-only` and `local/style-token-values`, their shared detection and scope, the allowlist seeded with every file that breaks them, and `verify:allowlist-freshness` with its test · Requirements: WEB-39, WEB-40, MOBILE-38, MOBILE-39 · Commit: b6241f1
- [x] T2 — The web app loads the tokens preset; its CSS copies of the scales are deleted; the layout widths, glyph sizes, insets and `warningStroke` are tokens; `verify-theme-sync` compares every colour of both themes and gains its test · Requirements: TOKENS-12, TOKENS-13, TOKENS-14, TOKENS-15 · Commit: 3ee30ba
- [x] T3 — The web refactor: `Text`, `Divider` and `Screen` blocks, the login submit on `Button`, `helpers/layout.style.ts` with positioning only, every web token value, and the web entries of the allowlist removed · Requirements: WEB-39, WEB-40, WEB-41 · Commit: 97bb93f
- [x] T4 — The mobile refactor: `Text`, `Divider` and `Screen` blocks, the dashboard call to action on `Button`, `helpers/layout.style.ts`, the themed navigator background in `useRootTheme`, every mobile token value, and the allowlist empty · Requirements: MOBILE-05, MOBILE-33, MOBILE-37, MOBILE-38, MOBILE-39, MOBILE-40 · Commit: 7dc82c2
- [x] T6 — `local/ui-kit-boundary` in both apps, proved by planted imports, with the mobile gradient behind `AccentGradient` (in T4) · Requirements: WEB-42, MOBILE-41 · Commit: 916ab48
- [ ] T5 — The LAW in `AGENTS.md` and `docs/code-standards.md`, the skills and the architecture, harness and map docs · Requirements: none · Commit: —
