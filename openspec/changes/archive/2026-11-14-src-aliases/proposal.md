# Proposal: import a package's own files through its `#src` alias

> **Status:** archived — 2026-11-14

## Why

The alias rule (`docs/code-standards.md` § 2) holds in the apps but not in the packages. The five
packages another workspace consumes from source (`core`, `cloudflare`, `i18n`, `supabase`,
`tokens`) reach their own files by relative path: 37 files under `packages/*/src` on `main`
(`66c5539`), barrels and tests included. They cannot use `@/`, because `@/` resolves against the
`src` of the workspace that compiles the file, which is the consuming app. So `eslint.config.mjs`
turns `no-relative-import-paths` off for core's production files, the `i18n` locales, the
`supabase` adapters and the `cloudflare` adapters and helpers, and
`packages/supabase/src/buildSupabaseServiceError.helper.ts` disables it inline. A moved file
rewrites every neighbour that reaches it by `../`.

A `#` key that a package declares under `"imports"` in its own `package.json` resolves against
that `package.json`, whoever compiles the file. Decision 45 of `docs/INIT_AND_HARNESS_PLAN.md`
adopts it, and Roadmap step 2.1 (T1c) schedules it here: Certifipago measured on 2026-11-12, in
its #792 (merged as `4784c939b`), that Turbopack (Next 16), Metro, TypeScript with
`moduleResolution: bundler` and Vitest all resolve `#src`, and that Node refuses a relative target
that leaves the package.

The owner's words:

- 2026-11-12 (translated from Spanish): "merge everything pending, make a plan for the rest of
  what is missing, and include this with priority"
- 2026-11-14 (translated from Spanish): "merge #8 and continue with the plan"

## What changes

- **The alias.** Each of the five packages declares `"imports": { "#src/*": "./src/*.ts" }` in its
  `package.json`; `i18n` also declares `"#src/*.json": "./src/*.json"` for its catalogs.
- **The imports.** The 37 files import their own siblings through `#src/…`, the package barrels
  (`index.ts`) and their re-exports included, so no relative import is left under
  `packages/*/src`.
- **The lint.** The four `eslint.config.mjs` overrides that turn `no-relative-import-paths` off in
  packages go, the core production override added in P0 included, and so does the inline disable
  in `buildSupabaseServiceError.helper.ts`. `core-import-boundary` (`eslint-local-rules/`) accepts
  `#src/` as core's own module and keeps refusing every package, `@/`, `node:` builtin and any
  other `#` key. A test in `eslint-local-rules/index.test.mjs` pins core's mapping to
  `./src/*.ts`, the condition under which `#src/` is core's own.
- **The docs.** `docs/code-standards.md` § 2 states the `#src` alias and why `@/` cannot serve in a
  package source; `docs/architecture/shared.md`, the conventions line of `AGENTS.md` and the alias
  rule of `openspec/config.yaml` follow.

## Out of scope

- `@app/tooling`, the shared tooling package of decision 46 (Roadmap step 2.2), its own change.
- pnpm 11.9.0 (D-S6, Roadmap step 2.3), its own change.
- Certifipago, which already made this change in #792.
- The apps: their `@/` alias resolves inside the app that compiles the file, and their barrels and
  tests keep the exceptions they have today.
- The `@/` imports that package tests already use: a test compiles inside its own package, where
  `@/` resolves, so they stay.

## Affected specs

- None. The harness stays unspecified, as decided in `2026-11-11-adopt-sdd`.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
