# Delta: packages/tooling

> **Change:** `2026-11-20-prune-leftovers`

## MODIFIED Requirements

### Requirement: TOOLING-01 — Four named entry points

The tooling package SHALL expose four entry points, `@app/tooling/observability-port-contract`,
`@app/tooling/process-tree`, `@app/tooling/vitest-package-base` and `@app/tooling/vitest-sequence`,
each pairing its plain ESM module with its type declarations.

**Evidence:** `packages/tooling/package.json:6-23`

#### Scenario: a workspace imports the package base by name

- **GIVEN** a workspace that declares `@app/tooling` as a `workspace:*` devDependency
- **WHEN** its Vitest config imports `@app/tooling/vitest-package-base`
- **THEN** the import resolves to the module at run time and to its declarations for types
- **Test:** Not covered — no test imports the package by name; the config of every package that
  builds on it resolves it on each test run.

#### Scenario: an adapter test imports the port contract by name

- **GIVEN** apps/web, apps/mobile and packages/core, which declare `@app/tooling` as a
  devDependency
- **WHEN** an observability adapter test imports `@app/tooling/observability-port-contract`
- **THEN** the import resolves at run time and its declarations type the harness
- **Test:** `packages/core/src/ports/observability/__tests__/createNoopObservability.helper.test.ts` › "the observability port contract"

### Requirement: TOOLING-17 — The registry a prune leaves stays true

The tooling package SHALL drop, for one capability of the manifest, every entry of
`.agents/contracts/dependencies.json` whose `owner` is that capability, and every entry not owned
by `core` whose package a `remove-dep` of the capability takes from the last kept `package.json`
declaring it; and list every kept entry whose package no kept `package.json` declares once the
`remove-dep` actions apply, every seam glob of a kept entry that matches no kept file under
`apps/` or `packages/`, and every dependency a kept `package.json` still declares that no kept
entry names.

**Evidence:** `packages/tooling/src/prune-boundary.mjs:223-308`, `.agents/contracts/dependencies.json:2-9`

#### Scenario: an entry the capability owns

- **GIVEN** a capability that owns a registry entry and claims the only `package.json` that
  declares its package
- **WHEN** the prune is checked
- **THEN** nothing is listed for the entry
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "an entry the pruned capability owns goes with its package"

#### Scenario: a remove-dep takes the entry

- **GIVEN** entries owned by another capability for a package and its subpath that a `remove-dep`
  takes from the last `package.json` declaring it, and one for a package another kept
  `package.json` still declares
- **WHEN** the prune is checked
- **THEN** nothing is listed: the first two go with the dependency and the third stays
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a remove-dep takes the entries of a package it removes from its last package.json"

#### Scenario: a kept entry whose package goes

- **GIVEN** a `core` entry whose package only a pruned `package.json` declares, or a
  `remove-dep` removes
- **WHEN** the prune is checked
- **THEN** the registry is listed with the entry
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept entry whose package no kept package.json declares is a leak"

#### Scenario: a kept seam glob with no file left

- **GIVEN** a kept entry one of whose seam globs matches only files the prune deletes
- **WHEN** the prune is checked
- **THEN** the registry is listed with the glob
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept seam glob that matches no kept file is a leak"

#### Scenario: a kept dependency whose entry goes

- **GIVEN** an entry the pruned capability owns whose package a kept `package.json` still
  declares
- **WHEN** the prune is checked
- **THEN** that `package.json` is listed with the package
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept dependency whose entry the prune removes is a leak"

#### Scenario: the prunes of this repository

- **GIVEN** the repository's tracked files, its manifest and its registry
- **WHEN** the prune of `sentry`, `mobile-expo`, `supabase`, `web-next` and `cloudflare` is checked
- **THEN** no registry finding is listed for any of them
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "pruning sentry, mobile-expo, supabase, web-next or cloudflare of this repository leaves the registry true"

#### Scenario: the packages of this repository a prune takes

- **GIVEN** the repository's tracked files, its manifest and its registry
- **WHEN** the prune of `i18n` and of `design-tokens` is checked
- **THEN** no kept `package.json` declares a package whose entry the prune takes
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "pruning i18n or design-tokens of this repository keeps no package whose entry it takes"

### Requirement: TOOLING-20 — A capability's regions go with it

The tooling package SHALL judge every kept file without the lines of the pruned capability's
regions, read with the region reader of the manifest engine, and keep the regions of every other
capability.

**Evidence:** `packages/tooling/src/prune-boundary.mjs:347-358`, `scripts/manifest-owners.mjs:175-194`

#### Scenario: a leak inside a region

- **GIVEN** a kept file whose import of a pruned file sits inside a region of the pruned
  capability, and a second whose import sits inside a region of another capability
- **WHEN** the prune is checked
- **THEN** only the second file is listed
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a leak inside a region of the pruned capability is no leak"

#### Scenario: three capabilities of this repository

- **GIVEN** the repository's tracked files, its manifest, its registry and its regions
- **WHEN** the prune of `sentry`, of `mobile-expo` and of `web-next` is checked with every check
- **THEN** nothing is listed for any of them
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "pruning sentry, mobile-expo or web-next of this repository leaves no dangling reference"

#### Scenario: the supabase capability of this repository

- **GIVEN** the repository's tracked files, its manifest, its registry and its regions
- **WHEN** the prune of `supabase` is checked
- **THEN** no file under `apps/` imports a pruned file, no `.env.example` keeps a key only pruned
  files read, and no kept spec cites a pruned file
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "pruning supabase of this repository leaves no app import, env key or spec citation dangling"
