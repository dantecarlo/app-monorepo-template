# Delta: packages/tooling

> **Change:** `2026-11-19-capability-prune-claims`

## ADDED Requirements

### Requirement: TOOLING-17 — The registry a prune leaves stays true

The tooling package SHALL drop, for one capability of the manifest, every entry of
`.agents/contracts/dependencies.json` whose `owner` is that capability, and every entry not owned
by `core` whose package a `remove-dep` of the capability takes from the last kept `package.json`
declaring it; and list every kept entry whose package no kept `package.json` declares once the
`remove-dep` actions apply, every seam glob of a kept entry that matches no kept file under
`apps/` or `packages/`, and every dependency a kept `package.json` still declares that no kept
entry names.

**Evidence:** written at apply time, when the code exists.

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

#### Scenario: the three prunes of this repository

- **GIVEN** the repository's tracked files, its manifest and its registry
- **WHEN** the prune of `sentry`, of `mobile-expo` and of `supabase` is checked
- **THEN** no registry finding is listed for any of them
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "pruning sentry, mobile-expo or supabase of this repository leaves the registry true"

### Requirement: TOOLING-18 — A kept spec cites no pruned file

The tooling package SHALL list every kept living spec under `openspec/specs/` that cites, in
backticks, a file the prune deletes: a scenario's test, an evidence `path:line` or a governed
path.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a test the prune deletes

- **GIVEN** a kept spec whose scenario names a test the capability claims, and a pruned spec that
  names it too
- **WHEN** the prune is checked
- **THEN** the kept spec is listed with the test, and the pruned spec is not
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept spec that cites a pruned test is a leak"

#### Scenario: an evidence or governed path

- **GIVEN** a kept spec that governs a file the capability claims and cites another as evidence,
  with a line range
- **WHEN** the prune is checked
- **THEN** the kept spec is listed with both files
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept spec that governs or cites a pruned file as evidence is a leak"

### Requirement: TOOLING-19 — A kept file names no pruned file and keeps no orphaned key

The tooling package SHALL list every kept source file that names a file the prune deletes by a
quoted relative path outside an import, and every key of a kept `.env.example` that a file the
prune deletes reads through `process.env` and no kept file reads.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a relative path string

- **GIVEN** a kept config that resolves a pruned file by a quoted relative path
- **WHEN** the prune is checked
- **THEN** the config is listed with the path
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept file that names a pruned file by a relative path is a leak"

#### Scenario: an orphaned environment key

- **GIVEN** a kept `.env.example` with a key only a pruned file reads, a key a kept file reads,
  and a key no file reads
- **WHEN** the prune is checked
- **THEN** only the first key is listed
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept .env.example key that only pruned files read is a leak"

### Requirement: TOOLING-20 — A capability's regions go with it

The tooling package SHALL judge every kept file without the lines of the pruned capability's
regions, read with the region reader of the manifest engine, and keep the regions of every other
capability.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a leak inside a region

- **GIVEN** a kept file whose import of a pruned file sits inside a region of the pruned
  capability, and a second whose import sits inside a region of another capability
- **WHEN** the prune is checked
- **THEN** only the second file is listed
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a leak inside a region of the pruned capability is no leak"

#### Scenario: the sentry capability of this repository

- **GIVEN** the repository's tracked files, its manifest, its registry and its regions
- **WHEN** the prune of `sentry` is checked with every check
- **THEN** nothing is listed
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "pruning the sentry capability of this repository leaves no dangling reference"
