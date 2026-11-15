# Proposal: keep each unit's test in its own folder's `__tests__/`

> **Status:** open

## Why

Decision 57 of `docs/INIT_AND_HARNESS_PLAN.md` (Stage F, step F.4) reverses D-S2: a unit's test no
longer sits beside the unit but in the `__tests__/` of the unit's own folder, carrying the unit's
stem. On `main` (`970db39`) 170 of the 175 tests under `apps/*` and `packages/*` sit beside their
units, `apps/mobile/src/app/__tests__/` holds one route test named after its file
(`_layout.test.tsx`), and four package tests sit in a `src/__tests__/` whose folder holds no unit
of their stem. `scripts/verify-tests.mjs` checks only
that a unit has a sibling test, so nothing holds the new place, and no tool moves a test there with
the imports and the citations it breaks.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-15 (translated from Spanish): "`__tests__` inside each block, and tell the Arquitecto"
- 2026-11-15 (translated from Spanish): "yes, I confirm, but have it adopt it now"

## What changes

- **The rule.** `X/Y.<suffix>` is tested by `X/__tests__/Y.<suffix>.test.<ext>`: in a block
  folder, a hook's own folder, a folder of plain units such as `lib/query/`, a package's `src/`
  folders, and outside `src/` too (`apps/web/next.config.ts` by
  `apps/web/__tests__/next.config.test.ts`). An Expo Router route test is named after its route
  file as `<route>.route.test.tsx` (`_layout.tsx` by `layout.route.test.tsx`, `index.tsx` by
  `index.route.test.tsx`), the way Certifipago names them (its #824). Shared test infrastructure
  (`src/test/**`) and `__mocks__/` are not judged.
- **The gate.** `verify:tests` keeps "every unit has a test" and fails a test beside its unit, a
  test in a higher `__tests__/`, a test whose stem names no unit of the folder that holds its
  `__tests__/` (index and route files count), and a `__tests__/` inside another one. Every frozen
  exception carries a reason, and an entry that exempts nothing fails. A companion,
  `scripts/verify-tests.test.mjs`, plants each violation in a scratch tree.
- **The codemod.** `pnpm tests:into-blocks` (`scripts/move-tests-into-blocks.mjs`, with its test)
  moves each test it can place with `git mv`, rewrites the relative specifiers of a moved test
  (imports, `vi.mock`, `vi.importActual`, `require`) and every citation of its old path in the
  Markdown of `openspec/specs/` and `docs/`, lists what it cannot place, and moves nothing on a
  second run. It ships, so a derived project runs it when it adopts the rule.
- **The move.** The codemod runs over the template; the Vitest `include` globs, the ESLint
  folder-casing glob, `knip.json` and the package configs follow, and the suites run the same
  tests before and after.
- **The teaching.** `docs/code-standards.md` § 9 and § 6, the skills that say where a test goes,
  `docs/architecture/web.md` and `docs/architecture/mobile.md`, `docs/maps/global-map.md`,
  `docs/harness.md`, `docs/e2e.md` and `AGENTS.md`.

## Out of scope

- The root tooling tests under `scripts/` and `eslint-local-rules/`: they are tooling, not app
  blocks, and keep their layout.
- The e2e specs (`*.e2e.ts`) and the SQL tests of `packages/supabase/supabase/tests/`.
- Certifipago, which the Arquitecto integrates (F.10).
- Which mobile units need a test: the presence check keeps its exemptions for mobile components
  and hooks as they are.

## Affected specs

- None in what they require: no requirement is added, modified or removed. Every living spec
  cites moved tests in its `Test:` lines and evidence; the codemod rewrites those citations in
  place, in the commit that moves the files, so `verify:specs` holds at every commit, and the
  archive moves the `Verified against the code` line of each spec whose governed tests moved.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
