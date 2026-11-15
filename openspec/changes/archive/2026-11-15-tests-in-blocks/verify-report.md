# Verify report: 2026-11-15-tests-in-blocks

> **Verified:** 2026-11-15 at `34c562a`

## Scenarios

This change adds no delta: no requirement is added, modified or removed, and the harness stays
unspecified, as decided in `2026-11-11-adopt-sdd` (`openspec/README.md` § 2.1). The living specs
changed only their citations of moved tests, rewritten in place by the codemod in `2c2c185`. Its
proof is the tests and gates each task ran.

| Task | Commit    | Checks run | Result |
| ---- | --------- | ---------- | ------ |
| T1   | `5aa035c` | the base gate (`970db39`) as a process over five planted scratch trees; `verify:tests:test` before and after the rewrite; the new gate over the tree; the base gate's unit count | red: the base gate passed a test beside its unit, one in a higher `__tests__/`, one naming no unit and a nested `__tests__/` (exit 0 each), and failed the correct placement (exit 1, "missing a sibling test"); the companion could not load (`does not provide an export named 'FINDING_KIND'`); then 32 of 32; the new gate named 175 misplaced tests on the unmoved tree (170 beside, 5 naming no unit or route) and judged the same 80 units the base gate checked |
| T2   | `0f9af9e` | `tests:into-blocks:test` before and after the codemod; a dry run over the tree | red, `ERR_MODULE_NOT_FOUND`; then 14 of 14; the dry run planned 171 moves and listed the four tests it cannot place |
| T3   | `2c2c185` | the codemod over the tree, then a second run; every suite before and after; `turbo run lint typecheck`; ESLint over the moved tests from the root; the folder-casing rule over a `__tests__/` and a planted `badCase/`; `tsc` over a planted package-root test; `knip`, `verify:specs`, `verify:maps`, `verify:structure`, `verify:pairing`, `verify:english`, `verify:tests` | the run moved 171 tests, rewrote 41 specifiers in 40 tests and 287 citations in 8 docs; the second run moved nothing (exit 0). Red after the move: tooling 4 of 13 (the package folder now resolved to `src`), `globals.test.ts` `ENOENT ... apps\web\src\src\app\globals.css`, 6 `simple-import-sort` errors where `./` became `@/`, `The folder "__tests__" does not match the "PASCAL_CASE" pattern`, TS6059 for a package-root test under `rootDir: src` and TS2210 without `rootDir`, and the companions' process checks red on the three shipped frozen entries over a scratch root. Then: the same files and tests in every suite (web 85 and 289, mobile 60 and 130, core 10 and 100, cloudflare 8 and 42, i18n 1 and 1, supabase 6 and 33, tokens 2 and 5, tooling 13), lint and typecheck 15 of 15, the casing rule silent on `__tests__/` and still red on `badCase/`, the planted package-root test typechecked (its type error reported) under `rootDir: "."`, every gate green |
| T4   | `34c562a` | `verify:maps`, `verify:english`, `verify:specs`, `codex-budget:test`, `agent-harness:projection-check` | green |

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-15, at `34c562a` (turbo 24 of 24 tasks;
  `verify:tests` judged 175 test files, 80 units and 3 frozen exceptions; `report:spec-drift`
  listed 7 of 8 specs behind their code, each for its moved tests, which the archive re-verifies;
  `knip` green).
- `pnpm --filter @app/mobile export:web`: exit 0 at `2c2c185`; the bundle holds the app's code and
  none of the moved tests' titles nor `toHaveNoViolations`, so Metro keeps every `__tests__/` out.
  `apps/mobile/dist-web` deleted afterwards.
- `pnpm --filter @app/web build`: exit 0 at `2c2c185`; the routes are `/`, `/_not-found`,
  `/api/turnstile/verify` and `/login`, none from a `__tests__/` folder.

## Not verified

- Three tests stay frozen in `scripts/verify-tests.mjs`, each with its reason:
  `packages/i18n/src/__tests__/catalog-parity.test.ts`,
  `packages/supabase/src/__tests__/supabaseSql.test.ts` and
  `packages/tokens/src/__tests__/preset.test.ts`. Each has a home under the rule, and each is
  cited by a file outside this change's edit surfaces.
- `smoke:mobile`, `smoke:web` and the e2e suite, which run outside `validate`.
- The codemod over a derived project: its companion runs it over scratch repositories only.
