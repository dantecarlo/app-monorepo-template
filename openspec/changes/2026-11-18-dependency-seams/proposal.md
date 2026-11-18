# Proposal: every dependency registered, and imported only inside its seam

> **Status:** open

## Why

Decision 51 of `docs/INIT_AND_HARNESS_PLAN.md` puts every library outside the core stack behind
one adapter of the template, and decision 52 applies one rule set to every app by pattern. Stage
F, step F.8 schedules both; this change is its first work unit. Today nothing names which file
may import which package: `no-restricted-imports` in `eslint.rules.mjs` guards only `@supabase/*`,
`@stripe/*` and `@sentry/*`, by a pattern each workspace block repeats, so i18n, query, state, UI
and Expo packages are imported from screens, components and tests alike, and an app added under
`apps/` inherits no guard at all. The inventory of the plan counts 21 web files importing
`next-intl` and 18 mobile files importing `react-i18next` outside their target seams, and
Certifipago's `ui/Stepper` leaked a raw `tv` from `tailwind-variants` past a test that read only
style files.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-15 (translated from Spanish): "every package that is not core must be decoupled and have
  an adapter, in ui as a wrapper for example, and so think a strategy for each one; currently the
  Certifipago project already more or less does it, but evaluate and analyze and put it in the
  plan"
- 2026-11-15 (translated from Spanish): "Not only the UI libraries, but all the libraries
  themselves."
- 2026-11-15 (translated from Spanish): "And something important, web and app have to be
  standardized, and any other project, that is, they have to always follow the same rules and
  centralize it if possible, because if later plain React is added for example it should follow
  the same rules"

## What changes

- **The registry.** `.agents/contracts/dependencies.json` holds one entry per package, or package
  subpath, that a `package.json` of the workspace declares or that source imports. Each entry has
  a category: `core` (used directly), `infra`, `ui`, `vendor`, `vendor-package` (an `@app/*`
  package that wraps a vendor), `build` (dev tooling, imported only by tests, configs and tooling
  scripts) or `peer` (installed for a framework, never imported). Every non-core entry names its
  seam, the repository globs of the files allowed to import it; an empty seam means no file may
  import it yet. Type-only imports are governed too (decision 58): `types` defaults to `seam`, and
  `anywhere` is allowed only where the plan says so, which today is nowhere. A subpath entry
  (`next/navigation`, `next/cache`, `next/image`) wins over its package's. The registry also names
  the test-infrastructure seam, `src/test/**`. It is filled from the plan's inventory, taken again
  at `6b1d1fc`; PostHog and Sentry are adapters since F.7.
- **The rule.** `local/dependency-seam` (`eslint-local-rules/dependency-seam.detect.mjs`, wired in
  `eslint.rules.mjs` at `error`) applies to `apps/*/**` and `packages/*/**` by pattern and
  registers its own plugin there, so an app added later inherits it with no config change. It
  reads static and dynamic imports, re-exports, `require`, the `vi.mock` family and type-only
  imports. A registered package passes only inside its seam; an unregistered one fails, closed. A
  test inherits the seam of the unit it tests (the unit in its parent folder, the `verify:tests`
  convention), and `src/test/**` may import any registered package. It replaces the
  `no-restricted-imports` patterns for `@supabase/*`, `@stripe/*` and `@sentry/*`; the
  `@testing-library/react` path stays where it is.
- **The tailwind-variants ban.** The registry gives `tailwind-variants` and `tailwind-merge` one
  seam, `apps/web/src/components/ui/variants.helper.ts` (F30), so importing `tv` anywhere else is
  a lint error: the ban Certifipago's Arquitecto asked for after the `ui/Stepper` leak.
- **The frozen allowlist.** Every import that breaks the rule today is listed, one entry per file
  and package, in `eslint-dependency-seam-allowlist.json`, with a reason that names the F.8 unit
  that removes it (units 2 to 8). The rule skips a listed pair. No import moves in this change,
  except the ones the registry makes legal by being their seam.
- **The gate.** `pnpm verify:dependency-seams` (`scripts/verify-dependency-seams.mjs`, the pure
  checks in `scripts/dependency-seams.detect.mjs`) runs inside `validate`. It fails when a
  dependency of any `package.json` is not registered, when an entry names a package nothing
  declares, when a seam glob matches no file, when a file ESLint does not lint (the config files
  its ignore list skips) imports a package outside its seam, and when the allowlist holds a stale,
  unlisted, duplicate or malformed entry: the list only shrinks, as the styling allowlist does.
  The gate re-derives every violation with the rule's own detection, uncached.
- **The proof a new app inherits it.** A fixture app, `eslint-local-rules/__fixtures__/apps/fixture/`,
  is linted through the real `eslint.config.mjs` as if it sat at `apps/fixture/`: the rule refuses
  an unregistered package and a registered package outside its seam there, and accepts its seam
  files.
- **The spec and the docs.** A new living spec, `openspec/specs/harness/dependency-seams/spec.md`
  (prefix `SEAM`), with its row in `openspec/README.md` § 2.1; a new § 23 and its rows in § 21 of
  `docs/code-standards.md`; `docs/harness.md`, `docs/maps/global-map.md`, the `lib` skill and one
  line in `AGENTS.md` § Conventions.

## Out of scope

- **Moving any import into its seam.** F.8 units 2 to 8 do it, one change each: the i18n seam (2),
  the query seam's own types and provider (3), `createAppStore` and the key-value storage port
  (4), the `ui/` leaks (5), `lib/bootstrap`, `lib/cache` and `lib/routing` (6), the opaque Supabase
  client (7) and the primitive-wrapper rule (8). Unit 9 empties the allowlist.
- **Named imports.** The rule judges a package, not the names imported from it: the `react-native`
  primitives that have a `ui/` wrapper and the `expo-router` hooks are unit 8 and unit 6.
- **The rest of the config by pattern.** `BASE_RULES`, the React plugins and the styling pillar
  are still wired per app in `eslint.config.mjs`; this change proves the seam rule alone reaches a
  new app.
- **A type that leaks through a wrapper's own API** (`VariantProps`, `FallbackProps`,
  `SupabaseClient<Database>`): the rule sees imports, not the shape a module exports.

## Affected specs

- `openspec/specs/harness/dependency-seams/spec.md` (new): added SEAM-01 to SEAM-09.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
