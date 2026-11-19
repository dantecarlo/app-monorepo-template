# Proposal: a capability prune leaves nothing stale

> **Status:** open

## Why

Two follow-ups of `docs/INIT_AND_HARNESS_PLAN.md`, F49 and F52, show that pruning an optional
capability of `template.manifest.json` leaves behind what it should take along. No prune executor
exists yet (Stage 6, step 6.2); `packages/tooling/src/prune-boundary.mjs` (TOOLING-16) only lists
the imports and Expo plugins a prune would leave dangling, and it lists none for `sentry` today.

- **F49** (harness): "a Sentry prune leaves the Sentry keys in both `.env.example`, the mobile
  vitest alias, `@sentry/cli` in `allowBuilds`, mentions in `README.md`, `docs/infrastructure.md`
  and ADR 0001, and specs that cite the removed Sentry tests; the `sentry` capability should claim
  or rewrite each". The keys sit in `apps/web/.env.example:32-43` and
  `apps/mobile/.env.example:32-39`, the alias in `apps/mobile/vitest.config.ts:36-39`, the build
  entry in `pnpm-workspace.yaml:20`. WEB-29, WEB-30, MOBILE-26 and MOBILE-27, two scenarios of
  WEB-53 and the Sentry scenarios of WEB-54 and MOBILE-51 cite tests the prune deletes, and the web
  spec governs five files it deletes (`openspec/specs/apps/web/spec.md:3`). ADR 0002 and two rows
  of `docs/maps/global-map.md` (`:157`, `:272`) name Sentry files too, and `verify:maps` fails on
  those rows once the files are gone.
- **F52** (harness): "when `/init` drops a capability (Sentry, mobile, Supabase), its entries in
  `.agents/contracts/dependencies.json` and their seam globs go stale, and
  `verify:dependency-seams` fails in that project; the manifest should claim each capability's
  registry entries so the prune removes them". The registry stores `packages` as an array of
  records (`.agents/contracts/dependencies.json:3`) and no manifest verb removes one record by
  name. The `supabase` capability never removes `@app/supabase` (`workspace:*`) or `@supabase/*`
  from the apps' `package.json` (`template.manifest.json:236-258`), so `pnpm install` fails after
  its prune.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-19, on F52: "Ownership per entry"

## What changes

- **Every registry entry names its owner (F52).** Each entry of
  `.agents/contracts/dependencies.json` carries an `owner`: the capability whose prune removes its
  package from the workspace, or `core`, the template's own owner, the way the manifest's file
  claims name it. `verify:manifest:coverage` fails an entry with no owner, or one that names a
  capability the manifest does not declare. `verify:dependency-seams` accepts the key.
- **A prune removes the entries it owns (F52).** The manifest's contract (`docs/manifest.md`)
  states that an absent capability takes every registry entry it owns, with its seam globs, the
  way it takes the files it claims. `prune-boundary` judges the registry the prune leaves: a kept
  entry whose package no kept `package.json` declares, a kept seam glob that matches no kept file,
  and a dependency a kept `package.json` declares that no kept entry names.
- **The `supabase` prune removes the apps' Supabase dependencies.** Its `onAbsent` drops
  `@app/supabase` and `@supabase/supabase-js` from both apps' `package.json` and `@supabase/ssr`
  from the web app's, with `remove-dep`.
- **A capability owns regions of the files others keep (F49, Q2).** A region is the lines between
  a `region <capability>` and an `endregion <capability>` comment; the prune of that capability
  drops them. `verify:manifest:coverage` fails a region that names a capability the manifest does
  not declare, and one opened and never closed, closed and never opened, or opened inside
  another. No verb is added. The `sentry` capability claims, with regions, its keys in both
  `.env.example`, its mobile Vitest alias, its `allowBuilds` entry and its rows of the global map.
- **The Sentry requirements move into a spec the capability claims (F49).** A new living spec,
  `openspec/specs/capabilities/sentry/spec.md` (prefix `SENTRY`), takes WEB-29, WEB-30, MOBILE-26,
  MOBILE-27 and the Sentry scenarios of WEB-53, WEB-54 and MOBILE-51, and governs the Sentry
  files; the `sentry` capability claims it, so its prune deletes them with the tests they cite.
- **`prune-boundary` sees what F49 found.** It also lists a kept spec that cites a file the prune
  deletes (a scenario's test, an evidence path or a governed path), a kept source file that names
  a pruned file by a relative path string, and a key of a kept `.env.example` that only pruned
  files read; and it drops the pruned capability's regions before it judges a kept file.
- **The docs stop naming Sentry where a prune would leave it (F49).** `README.md`,
  `docs/infrastructure.md`, ADR 0001 and ADR 0002 name the default provider, or no provider,
  where they named Sentry; `docs/manifest.md` documents the regions, the registry owners and the
  known gaps as they now stand.

## Out of scope

- **The executor.** Applying a prune (files, verbs, regions, registry entries) is Stage 6,
  step 6.2; this change states the contract and proves it with `prune-boundary` and a scratch
  simulator.
- **Other capabilities' holes.** The `i18n` and `cloudflare` prunes keep the dependencies their
  entries name, and the `supabase`, `i18n`, `web-next` and `mobile-expo` prunes keep imports in
  files other owners keep (blocker B4, the known-gaps table of `docs/manifest.md`); this change
  names what `prune-boundary` finds for them and fixes the three prunes the follow-ups name.
- **`docs/observability.md`, `docs/architecture/web.md` and `AGENTS.md`.** They document the
  optional capability or list its key, and they sit outside this change's edit surface; the
  known-gaps table names them.
- **The `openspec/README.md` § 2.1 row of a pruned spec.** A table row cannot hold a region, so
  the row of the new spec stays after a prune, as the rows of every other capability's spec do
  (the known-gaps row "any with a spec").

## Affected specs

- `openspec/specs/packages/tooling/spec.md`: adds TOOLING-17, TOOLING-18, TOOLING-19 and
  TOOLING-20
- `openspec/specs/harness/dependency-seams/spec.md`: modifies SEAM-01
- `openspec/specs/apps/web/spec.md`: removes WEB-29 and WEB-30; modifies WEB-53 and WEB-54
- `openspec/specs/apps/mobile/spec.md`: removes MOBILE-26 and MOBILE-27; modifies MOBILE-51
- `openspec/specs/capabilities/sentry/spec.md` (new): adds SENTRY-01 to SENTRY-06
