# Verify report: 2026-11-14-src-aliases

> **Verified:** 2026-11-14 at `7cc35d9`

## Scenarios

This change adds no delta: the harness stays unspecified, as decided in `2026-11-11-adopt-sdd`
(`openspec/README.md` § 2.1). Its proof is the tests and gates each task ran.

| Task | Commit    | Checks run | Result |
| ---- | --------- | ---------- | ------ |
| T1   | `e6ca894` | `verify:lint-rules:test` with four `#src/` cases (two imports, two re-exports) and two other `#` keys, before and after the rule change; re-run at verify by linting the six cases with the rule of `e6ca894^` and the rule of `HEAD` | red, 50 of 54 (the four `#src/` cases reported); then 54 of 54; at verify, the base rule reports all six cases and the head rule only `#vendor/a` and `#internal/a` |
| T2   | `b4a9860` | the test that pins core's `"imports"` to `{ "#src/*": "./src/*.ts" }`; core typecheck and tests with the imports rewritten and no key, then with the key; web and mobile typecheck and tests | red, 54 of 55 and TS2307, the tests could not load `#src/errors/AppError.helper`; then 55 of 55, green, core 97 of 97, web 272 of 272, mobile 116 of 116 |
| T3   | `bca120b` | cloudflare typecheck and tests with no key, then with the key; lint | red, 16 TS2307 and `#src/createCloudflareImagesDelivery.adapter` not loaded; then green, 24 of 24, lint clean |
| T4   | `2a3a290` | i18n typecheck with no key, with `#src/*` only, then with both keys; the catalog parity test; mobile tests | red, 6 TS2307, then 3 (a `.json` specifier mapped to `.ts`); then green, parity green, 116 of 116 |
| T5   | `f2a3de6` | supabase typecheck and tests with no key, then with the key; lint; web and mobile typecheck; the supabase adapter tests of both apps | red, 9 TS2307 and `#src/mapSupabaseError.adapter` not loaded; then green, 21 of 21, lint clean, green, 5 of 5 and 2 of 2 |
| T6   | `d2eb372` | mobile typecheck and tests with the barrel rewritten and no key (tokens has no typecheck of its own); then web and mobile typecheck, mobile tests, tokens tests, lint | red, 2 TS2307 and 134 TS2614, `#src/tokens.constant` not resolved; then green, 116 of 116, 4 of 4, no error |
| T7   | `a985ea6` | a relative import linted through `eslint --stdin` at each path an override exempted, before and after; a `#src/` import at the same paths; `pnpm lint`; `verify:lint-rules:test` | 0 reports at the five exempted paths against 1 at the `packages/tokens` control; then 1 at each of the six; no report for `#src/`; 7 of 7 tasks green; 55 of 55 |
| T8   | `7cc35d9` | `verify:english`, `verify:maps`, `verify:specs`; Prettier on the changed docs and `openspec/config.yaml` | green; clean |

At `7cc35d9`, `git grep -n -E "from '\.\.?/" -- 'packages/*/src/**'` is empty: on `66c5539` it
listed 84 specifiers in 37 files (core 51 in 17, cloudflare 16 in 11, i18n 6 in 3, supabase 9 in
5, tokens 2 in 1), and every one reads `#src/` now. No `eslint-disable` pragma is left under
`packages/*/src`. The one exception `docs/code-standards.md` § 2 keeps is an app barrel, whose
`index.ts` re-exports its block's files by `./`.

Closed in `87a5713`, a doc-only commit after `7cc35d9`: § 2 said a package test imports through
`@/`, while the core and cloudflare tests reach their unit through `#src/` (15 specifiers), core's
tests also through `@/` (6, in three files), and the i18n, supabase and tokens tests through `@/`
(6); it now names both, and `shared.md` says only a
package's sources never use `@/`. `verify:english`, `verify:maps` and Prettier pass on it.

## Independent verification

One independent verifier (risk item 3: the import rule is a lint contract every package and
derived project consumes) passed T1 to T9 with no blocker. It rewrote each relative specifier
of the base into its `#src/` form across 37 files and found only import reorders and the removed
disable; it showed the web build bundling files reachable only through `#src`, and both Hermes
bundles holding core's `PII_KEYS`; `validate` exit 0 once Google Fonts answered.

Its advisories, closed in `e3c60c4` and `3fcf7f6`:

- `no-relative-import-paths` reads import declarations only, so a relative re-export or
  `import()` passed in every package, core included. Its fix wrote `@/` from the package folder,
  which the apps do not resolve, and a broken `@/../packages/...` from the repo root, where
  lint-staged runs. `package-src-alias` now judges all three forms in package production files
  and fixes them to `#src/` from the file's own path; the plugin is off there. Planted in
  `packages/cloudflare/src`, a relative import, a relative re-export and an `@/` import were
  fixed to the same three `#src/` specifiers from the package folder and from the repo root.
- `core-import-boundary` now judges `import()` too (`import('react')` is reported).
- Only core's mapping was pinned; a test now pins each of the five packages'.
- The arch, quality and fractal-verify skills and the README alias list now name `#src/*` and
  keep the barrel exception for an app barrel only.
- This report undercounted the `@/` specifiers of the core tests; corrected above.

After the correction: `verify:lint-rules:test` 76 of 76; a cache-free `turbo run lint` 7 of 7
tasks with no error, the new rule silent on every package source; `ATL_TEMPLATE_SELF=1 pnpm
validate` exit 0 at `3fcf7f6` (turbo 21 of 21).

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-14, at `7cc35d9` (turbo 21 of 21 tasks;
  core 97, cloudflare 24, i18n 1, supabase 21, tokens 4, web 272 and mobile 116 tests; `knip`
  green). The web build inside it ran (a cache miss) and compiled the five packages through
  Turbopack, so Next resolves `#src`.
- `pnpm smoke:mobile`: exit 0, 2026-11-14, at `7cc35d9`. Metro exported the iOS and Android Hermes
  bundles, so Metro resolves `#src`.
- Lint holds three warnings in packages, all `single-object-params` in files this change does not
  touch (`scrubPII.helper.ts`, `catalog-parity.test.ts`, `themes.test.ts`).

## Not verified

- `smoke:web` and the e2e suite, which run outside `validate`; the web build inside it compiles
  every package through `#src`. On Windows `smoke:web` fails before it starts the server, a defect
  older than this change, fixed in its own pull request.
- In the apps, a relative re-export still passes `no-relative-import-paths` and holds by review,
  and lint-staged still runs it from the repo root, as before this change.
- Records that keep the relative form on purpose: `docs/INIT_AND_HARNESS_PLAN.md`, the 2026-11-04
  audit and the archived changes.
- Derived projects: a project that takes this change declares the `#src/*` key in each of its
  packages consumed by source before it drops the overrides.
