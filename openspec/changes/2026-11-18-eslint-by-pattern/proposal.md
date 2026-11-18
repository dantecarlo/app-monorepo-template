# Proposal: every ESLint block applied by pattern, and a new app inherits every rule

> **Status:** open

## Why

Decision 52 of `docs/INIT_AND_HARNESS_PLAN.md` applies one rule set to every app and package by
pattern, so an app declares only what its framework forces; Stage F, step F.8 schedules it as work
unit 1b. Today `eslint.config.mjs` writes one block per workspace by name (`packages/core/**`,
`apps/web/**`, `apps/mobile/**` and four more), the styling pillar is wired to two named apps,
and the rules behind it (`eslint-local-rules/style-positioning.detect.mjs`,
`eslint-local-rules/ui-kit.detect.mjs`) only judge paths under those two apps. An app added under
`apps/` gets `local/dependency-seam` and the overrides already written by suffix, and none of the
base rules, the React rules, the filename rules or the styling pillar: the fixture app of F.8 unit
1 proves the seam alone.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-15 (translated from Spanish): "And something important, web and app have to be
  standardized, and any other project, that is, they have to always follow the same rules and
  centralize it if possible, because if later plain React is added for example it should follow
  the same rules"

## What changes

- **Shared blocks by pattern.** Every rule set more than one workspace shares applies by pattern:
  the base rules and the filename rules to `apps/*/**` and `packages/*/**`; the casing of
  `src/components/ui/` folders and the styling pillar (`local/style-positions-only`,
  `local/style-token-values`, `local/ui-kit-boundary`) to every app; the fractal, logic-in-hook,
  suffix-contract and test overrides by suffix, as today; `local/dependency-seam` as today. The
  scope of the styling rules reads any folder under `apps/`, not two named ones.
- **Framework blocks by what an app declares.** `scripts/eslint-config.detect.mjs` reads the
  `package.json` of every folder under `apps/` once, when the config loads. The React rules apply
  to every app that declares `react`, the Next.js block (its rules, its Node globals, the App
  Router and middleware file names, the async server screens and the generated `next-env.d.ts`)
  to every app that declares `next`, and the Expo block (its rules, the React Native globals and
  accessibility relaxations, the Expo Router file names) to every app that declares `expo`, in any
  dependency field. A `package.json` that cannot be parsed fails the config load, naming it. The
  workspace folders and the dependency fields are the ones `verify:dependency-seams` reads; the
  gate takes them from the new module, so both read a manifest one way.
- **What stays scoped to one workspace.** A rule set that is one workspace's own keeps its name:
  `packages/core`'s import boundary, the literal values of `packages/tokens/src`, the browser
  globals and React rules `packages/tokens` carries without declaring `react`, the generated types
  of `packages/supabase` the config ignores, and the Node globals of `packages/tooling`'s scripts.
- **No behaviour change on today's tree.** ESLint over every lintable file, from the root and from
  each workspace folder as `pnpm lint` runs it, gives the same findings before and after, and
  `eslint --print-config` gives the same config for a sample of every file kind; a rule that newly
  reaches a file it always should have is listed in the verify report with its reason.
- **The fixture app inherits every rule.** The fixture of F.8 unit 1 grows into a plain React app
  (`eslint-local-rules/__fixtures__/apps/fixture/`, whose `package.json` declares `react` and
  neither `next` nor `expo`), refused for a violation of each shared rule family: base, React,
  filename, styling pillar, logic-in-hook, suffix contract and dependency seam. Two more fixture
  apps declare `next` and `expo` and get their framework's block. They are linted through the
  config `eslint.config.mjs` builds, for the fixture's folder instead of the repository's, so
  nothing in the config names them.
- **The docs.** `docs/code-standards.md` says where the config applies each rule set and how a new
  app inherits it (a new § 24, and its § 21 row); `docs/harness.md`, `docs/maps/global-map.md` and
  `docs/architecture/shared.md` where they name the config.

## Out of scope

- **A React package.** The framework blocks read the apps; a package that declares `react` gets
  the shared rules and not the React set. No package declares one today.
- **The gates that still name the two apps.** `scripts/verify-allowlist-freshness.mjs` walks the
  two app sources by name and `scripts/verify-maps.mjs` reads the two app roots; they are not ESLint
  blocks, and a follow-up widens them.
- **Moving any import into its seam**, F.8 units 2 to 9.

## Affected specs

- `openspec/specs/harness/dependency-seams/spec.md`: modified SEAM-09, added SEAM-10.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
