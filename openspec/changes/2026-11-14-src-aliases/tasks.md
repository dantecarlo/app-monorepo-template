# Tasks: 2026-11-14-src-aliases

- [x] T1 — `core-import-boundary` accepts `#src/` as core's own module and refuses any other `#` key, RED first on both cases · Requirements: none · Commit: e6ca894
- [x] T2 — `core`: `"imports": { "#src/*": "./src/*.ts" }`, a test that pins that mapping (RED first), and its files import their siblings through `#src/` · Requirements: none · Commit: b4a9860
- [x] T3 — `cloudflare`: the `#src/*` key and its files through `#src/` · Requirements: none · Commit: bca120b
- [x] T4 — `i18n`: the `#src/*` and `#src/*.json` keys and its files through `#src/` · Requirements: none · Commit: 2a3a290
- [x] T5 — `supabase`: the `#src/*` key and its files through `#src/`, the inline disable of `no-relative-import-paths` removed · Requirements: none · Commit: f2a3de6
- [x] T6 — `tokens`: the `#src/*` key and its barrel through `#src/` · Requirements: none · Commit: d2eb372
- [ ] T7 — the `eslint.config.mjs` overrides that turn `no-relative-import-paths` off in packages removed, the core production override included · Requirements: none · Commit: —
- [ ] T8 — `docs/code-standards.md` § 2, `docs/architecture/shared.md`, `AGENTS.md` and `openspec/config.yaml` state the `#src` alias · Requirements: none · Commit: —
- [ ] T9 — `verify-report.md`, then the archive to `openspec/changes/archive/2026-11-14-src-aliases/` as the last commit · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CONN-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
