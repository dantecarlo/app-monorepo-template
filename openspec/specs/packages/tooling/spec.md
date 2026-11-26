# packages/tooling — living spec

> **Governs:** `packages/tooling/src`
> **ID prefix:** `TOOLING`
> **Derived from:** `docs/code-standards.md`, `docs/architecture/shared.md`, `docs/INIT_AND_HARNESS_PLAN.md`
> **Verified against the code:** 2026-11-20 at `c324145`

## Purpose

The tooling package holds the plain-ESM scripts more than one workspace imports by name: the
shared Vitest base every package config builds on, the shuffled test order seeded from the
commit that every workspace runs under (apps/web and apps/mobile take the sequence alone), the
process-tree kill the root web smoke script uses, the observability port contract every adapter
test runs, and the prune check that proves a capability of the manifest leaves no dangling
reference behind, in its files, its regions, its specs and the dependency registry. Each
workspace keeps its own include globs and coverage settings; Turborepo and the root configs own
caching and the seed's pass-through, and the repository gates under `scripts/` are not part of
this unit.

## Requirements

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

### Requirement: TOOLING-02 — The seed comes from the commit

The tooling package SHALL derive the shuffle seed from the first 12 hex digits of the sha that
`git rev-parse HEAD` prints, read as an integer.

**Evidence:** `packages/tooling/src/vitest-sequence.mjs:41`,
`packages/tooling/src/vitest-sequence.mjs:69-74`

#### Scenario: a sha1 or a sha256 commit

- **GIVEN** a 40-digit sha and a 64-digit sha that start with the same 12 hex digits
- **WHEN** a seed is drawn from each
- **THEN** both seeds are those 12 digits read in base 16
- **Test:** `packages/tooling/src/__tests__/vitest-sequence.test.mjs` › "the seed is the first 12 hex digits of the commit sha"

### Requirement: TOOLING-03 — No commit, no shuffled run

The tooling package SHALL refuse a commit value that is not 40 to 64 lowercase hex digits, with
an error that names `VITEST_SEQUENCE_SEED`, so a checkout with no commit fails to load the config
unless the override is set.

**Evidence:** `packages/tooling/src/vitest-sequence.mjs:30-40`,
`packages/tooling/src/vitest-sequence.mjs:75-77`

#### Scenario: a value that is not a sha

- **GIVEN** an empty value or the value `not-a-sha`
- **WHEN** a seed is drawn from it
- **THEN** the draw throws an error that names `VITEST_SEQUENCE_SEED` and says it is not a
  commit sha
- **Test:** `packages/tooling/src/__tests__/vitest-sequence.test.mjs` › "a value that is not a commit sha is refused, naming the override"

#### Scenario: git cannot resolve the commit

- **GIVEN** a folder where `git rev-parse HEAD` fails
- **WHEN** the commit sha is read
- **THEN** it reads as an empty value, which the seed then refuses
- **Test:** Not covered — no test reads the sha outside a git checkout.

### Requirement: TOOLING-04 — The override picks the seed

The tooling package SHALL take the seed from `VITEST_SEQUENCE_SEED` when it holds a value that is
not blank, and from the commit when it is unset or blank.

**Evidence:** `packages/tooling/src/vitest-sequence.mjs:44-58`

#### Scenario: the override is unset or blank

- **GIVEN** no override, or an override of blanks
- **WHEN** the seed is resolved against a commit sha
- **THEN** the seed comes from the commit and its source reads `the commit`
- **Test:** `packages/tooling/src/__tests__/vitest-sequence.test.mjs` › "the commit gives the seed unless the override is set"

#### Scenario: the override is set and there is no commit

- **GIVEN** the override `42` and an empty commit value
- **WHEN** the seed is resolved
- **THEN** the seed is 42 and its source is `VITEST_SEQUENCE_SEED`, and the commit is never read
- **Test:** `packages/tooling/src/__tests__/vitest-sequence.test.mjs` › "the commit gives the seed unless the override is set"

### Requirement: TOOLING-05 — The override must be an integer

The tooling package SHALL refuse an override that is not a safe integer, with an error that says
it is not an integer.

**Evidence:** `packages/tooling/src/vitest-sequence.mjs:50-56`

#### Scenario: letters or a fraction

- **GIVEN** the override `abc` or the override `1.5`
- **WHEN** the seed is resolved
- **THEN** it throws an error saying the override is not an integer
- **Test:** `packages/tooling/src/__tests__/vitest-sequence.test.mjs` › "an override that is not an integer is refused"

### Requirement: TOOLING-06 — A shuffled sequence block

The tooling package SHALL return from `testSequence` the Vitest `sequence` block
`{ seed, shuffle: true }`, with the seed it resolved.

**Evidence:** `packages/tooling/src/vitest-sequence.mjs:82-97`

#### Scenario: the override seed is in force

- **GIVEN** the override `7`
- **WHEN** `testSequence` runs for a package
- **THEN** it returns the seed 7 with shuffle on
- **Test:** `packages/tooling/src/__tests__/vitest-sequence.test.mjs` › "testSequence shuffles with the resolved seed and prints how to replay it"

### Requirement: TOOLING-07 — The run prints how to replay it

The tooling package SHALL print, once and before `testSequence` returns, a notice that names the
workspace from its `package.json`, the seed, its source and the command
`VITEST_SEQUENCE_SEED=<seed> pnpm --filter <workspace> test` that replays the order.

**Evidence:** `packages/tooling/src/vitest-sequence.mjs:60-67`,
`packages/tooling/src/vitest-sequence.mjs:88-94`

#### Scenario: the notice text

- **GIVEN** the seed 42 from the commit, for the workspace `@app/core`
- **WHEN** the notice is written
- **THEN** it says `seed 42, from the commit` and holds the command
  `VITEST_SEQUENCE_SEED=42 pnpm --filter @app/core test`
- **Test:** `packages/tooling/src/__tests__/vitest-sequence.test.mjs` › "the replay notice names the seed, its source and the command that replays it"

#### Scenario: the workspace name

- **GIVEN** the folder of the tooling package
- **WHEN** its workspace name is read
- **THEN** the name is `@app/tooling`, taken from its `package.json`
- **Test:** `packages/tooling/src/__tests__/vitest-sequence.test.mjs` › "the workspace name comes from its package.json"

#### Scenario: one notice per config load

- **GIVEN** the override `7`
- **WHEN** `testSequence` runs for the tooling package
- **THEN** the console prints exactly one line, naming `@app/tooling` and the seed 7
- **Test:** `packages/tooling/src/__tests__/vitest-sequence.test.mjs` › "testSequence shuffles with the resolved seed and prints how to replay it"

### Requirement: TOOLING-08 — The shared package test base

The tooling package SHALL give every package config built on `packageTestBase` the `@` alias onto
the package's own `src`, the node environment, Vitest globals, `clearMocks` and the shuffled
sequence.

**Evidence:** `packages/tooling/src/vitest-package-base.mjs:22-44`

#### Scenario: the base of a package

- **GIVEN** a package folder and a seed override
- **WHEN** `packageTestBase` builds the base for it
- **THEN** `@` points at the folder's `src`, the environment is `node`, globals and `clearMocks`
  are on, and the sequence is shuffled with the override seed
- **Test:** `packages/tooling/src/__tests__/vitest-package-base.test.mjs` › "the base aliases @ onto the package src and runs a shuffled node suite"

### Requirement: TOOLING-09 — Coverage defaults

The tooling package SHALL set v8 coverage in the base, reported as `text-summary`,
`json-summary` and `lcov` into the package's `coverage` folder, with every barrel index under
`src` excluded.

**Evidence:** `packages/tooling/src/vitest-package-base.mjs:34-39`

#### Scenario: provider and exclusion

- **GIVEN** the base of a package
- **WHEN** its coverage block is read
- **THEN** the provider is `v8` and the only exclusion is the `src` barrels
- **Test:** `packages/tooling/src/__tests__/vitest-package-base.test.mjs` › "the base aliases @ onto the package src and runs a shuffled node suite"

#### Scenario: reporters and folder

- **GIVEN** the base of a package
- **WHEN** its coverage block is read
- **THEN** it reports as `text-summary`, `json-summary` and `lcov` into `coverage`
- **Test:** Not covered — no test reads the reporters or the output folder.

### Requirement: TOOLING-10 — No Vitest 5 option

The tooling package SHALL leave `fsModuleCache`, a Vitest 5 option, out of the base, since the
template runs Vitest 4.

**Evidence:** `packages/tooling/src/vitest-package-base.mjs:28-43`,
`packages/core/package.json:23`

#### Scenario: the test block of the base

- **GIVEN** the base of a package
- **WHEN** its `test` block is read
- **THEN** it holds no `fsModuleCache` key
- **Test:** `packages/tooling/src/__tests__/vitest-package-base.test.mjs` › "the base sets no Vitest 5 option"

### Requirement: TOOLING-11 — Spawn options that let a tree be ended

The tooling package SHALL export `TREE_SPAWN_OPTIONS` frozen, with `detached` true on POSIX and
false on Windows, so a child spawned with it leads its own process group on POSIX.

**Evidence:** `packages/tooling/src/process-tree.mjs:22`

#### Scenario: the options on the running platform

- **GIVEN** the platform the suite runs on
- **WHEN** `TREE_SPAWN_OPTIONS` is read
- **THEN** it equals `{ detached: !isWindows }` and is frozen
- **Test:** `packages/tooling/src/__tests__/process-tree.test.mjs` › "the spawn options detach the child on POSIX only, and cannot be changed"

### Requirement: TOOLING-12 — A child is ended with every process it started

The tooling package SHALL end a child and its descendants from `signalProcessTree` (on POSIX by
sending the signal to the child's process group, which holds its descendants only when the child
was spawned with `TREE_SPAWN_OPTIONS`, so a child spawned without them receives the signal alone;
on Windows by `taskkill /pid <pid> /T /F` whatever the signal, stopped after 5 s whether or not
the call waits for it), and say in its declaration and its JSDoc that on POSIX the descendants
are reached only for a child spawned with `TREE_SPAWN_OPTIONS`.

**Evidence:** `packages/tooling/src/process-tree.mjs:47-78`, `packages/tooling/src/process-tree.mjs:19`,
`packages/tooling/src/process-tree.d.mts:6-9`, `packages/tooling/src/process-tree.mjs:36-39`

#### Scenario: a child that started a process

- **GIVEN** a child spawned with `TREE_SPAWN_OPTIONS` that started a long-lived process of its own
- **WHEN** `signalProcessTree` signals it with `SIGTERM` and `wait`
- **THEN** it returns true, and both the child and the process it started end within ten seconds
- **Test:** `packages/tooling/src/__tests__/process-tree.test.mjs` › "signalProcessTree ends a child and the process it started"

#### Scenario: taskkill is bounded

- **GIVEN** `signalProcessTree` on Windows, with `wait` and without it
- **WHEN** it runs taskkill
- **THEN** each call gives taskkill a 5 s timeout, so a taskkill that hangs never holds its caller
- **Test:** `packages/tooling/src/__tests__/process-tree.test.mjs` › "on Windows taskkill is bounded at 5 s, waited for or not"

#### Scenario: a POSIX child that leads no group

- **GIVEN** a POSIX child spawned without `TREE_SPAWN_OPTIONS`
- **WHEN** `signalProcessTree` signals it
- **THEN** the group signal fails and only the child itself receives the signal, so a process it
  started keeps running
- **Test:** Not covered — no test spawns a child without the options.

#### Scenario: the declaration names the condition

- **GIVEN** the type declarations of `@app/tooling/process-tree`
- **WHEN** a reader reads the documentation of `signalProcessTree`
- **THEN** it says that on POSIX the descendants are reached only for a child spawned with
  `TREE_SPAWN_OPTIONS`
- **Test:** Not covered — the wording of a comment is read in review; no test reads it.

### Requirement: TOOLING-13 — Waiting on Windows

The tooling package SHALL, on Windows, run taskkill to completion before `signalProcessTree`
returns when `wait` is set, and start it in the background and return true at once when it is
not.

**Evidence:** `packages/tooling/src/process-tree.mjs:49-66`

#### Scenario: with wait

- **GIVEN** a child on Windows
- **WHEN** `signalProcessTree` signals it with `wait`
- **THEN** the call returns only after taskkill has exited
- **Test:** Not covered — the tree test polls until the processes end, so it passes whether or not
  the call waited, and it runs the Windows branch only on Windows.

#### Scenario: without wait

- **GIVEN** a child on Windows
- **WHEN** `signalProcessTree` signals it without `wait`
- **THEN** it returns true while taskkill still runs
- **Test:** Not covered — no test calls `signalProcessTree` without `wait`.

### Requirement: TOOLING-14 — False only for a tree still running

The tooling package SHALL return false from `signalProcessTree` only when the tree could not be
signalled and the child is still running, and true for a child that never started or has already
ended.

**Evidence:** `packages/tooling/src/process-tree.mjs:48`,
`packages/tooling/src/process-tree.mjs:67-70`, `packages/tooling/src/process-tree.mjs:72-77`

#### Scenario: a tree that already ended

- **GIVEN** a child whose tree was already ended
- **WHEN** `signalProcessTree` signals it again with `wait`
- **THEN** it returns true
- **Test:** `packages/tooling/src/__tests__/process-tree.test.mjs` › "a tree that already ended counts as ended"

#### Scenario: a child that never started

- **GIVEN** a child with no pid
- **WHEN** `signalProcessTree` signals it
- **THEN** it returns true without signalling anything
- **Test:** `packages/tooling/src/__tests__/process-tree.test.mjs` › "a child that never started has nothing to end"

#### Scenario: a tree the caller may not signal

- **GIVEN** a running child whose tree cannot be signalled
- **WHEN** `signalProcessTree` signals it
- **THEN** it returns false
- **Test:** Not covered — no test holds a running process the caller is not allowed to signal.

### Requirement: TOOLING-15 — One observability port contract for every adapter

The tooling package SHALL export `runObservabilityPortContract`, which registers, through the
`test` function it is given, one case per contract rule and checks the adapter its harness
builds: every method is safe while the provider is disabled, the PII of every context, breadcrumb
and user is scrubbed before it reaches the provider while the rest of the payload arrives, the id
of a user is kept, and `setUser(null)` clears the user.

**Evidence:** `packages/tooling/src/observability-port-contract.mjs:58-93`, `packages/tooling/src/observability-port-contract.mjs:95-204`, `packages/tooling/src/observability-port-contract.mjs:207-211`

#### Scenario: an adapter that keeps the contract

- **GIVEN** an in-memory adapter that scrubs every payload and clears the user on `null`
- **WHEN** the contract runs against it
- **THEN** every case passes
- **Test:** `packages/tooling/src/__tests__/observability-port-contract.test.mjs` › "an adapter that keeps the contract passes every case"

#### Scenario: an adapter with no provider behind it

- **GIVEN** a harness that declares no provider and an adapter that hands nothing on
- **WHEN** the contract runs against it
- **THEN** every case passes
- **Test:** `packages/tooling/src/__tests__/observability-port-contract.test.mjs` › "an adapter that hands nothing on passes as a silent provider"

#### Scenario: one test per case

- **GIVEN** a test runner's `test` function
- **WHEN** the contract registers through it
- **THEN** it registers one test per case, under the case's title, in order
- **Test:** `packages/tooling/src/__tests__/observability-port-contract.test.mjs` › "the contract registers one test per case, by its title"

#### Scenario: an adapter that throws while disabled

- **GIVEN** an adapter whose methods throw while the provider is disabled
- **WHEN** the contract runs against it
- **THEN** the disabled case fails
- **Test:** `packages/tooling/src/__tests__/observability-port-contract.test.mjs` › "an adapter that throws while disabled fails the disabled case"

#### Scenario: an adapter that hands on a raw email

- **GIVEN** an adapter that hands its payloads to the provider unscrubbed
- **WHEN** the contract runs against it
- **THEN** the context, breadcrumb and user cases fail
- **Test:** `packages/tooling/src/__tests__/observability-port-contract.test.mjs` › "an adapter that hands on a raw email fails the scrub cases"

#### Scenario: an adapter that delivers nothing

- **GIVEN** an adapter that claims to deliver and drops every payload
- **WHEN** the contract runs against it
- **THEN** the context, breadcrumb and user cases fail
- **Test:** `packages/tooling/src/__tests__/observability-port-contract.test.mjs` › "an adapter that drops what it should deliver fails the scrub cases"

#### Scenario: an adapter that keeps the user

- **GIVEN** an adapter that ignores `setUser(null)`
- **WHEN** the contract runs against it
- **THEN** the clear case fails
- **Test:** `packages/tooling/src/__tests__/observability-port-contract.test.mjs` › "an adapter that keeps the user after setUser(null) fails the clear case"

### Requirement: TOOLING-16 — Pruning a capability leaves no dangling reference

The tooling package SHALL list, for one capability of the manifest, every tracked file the prune
keeps that imports a file the prune deletes or a dependency it removes, and every Expo plugin
entry the prune leaves that names a removed dependency.

**Evidence:** `packages/tooling/src/prune-boundary.mjs:317-398`

#### Scenario: an import of a pruned file

- **GIVEN** a kept file that imports, by alias or by relative path, a file the capability claims
- **WHEN** the prune is checked
- **THEN** the kept file is listed with the specifier
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept file that imports a pruned file is a leak"

#### Scenario: an import of a removed dependency

- **GIVEN** a kept file that imports a subpath of a dependency the capability removes
- **WHEN** the prune is checked
- **THEN** the kept file is listed with the specifier
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept file that imports a removed dependency is a leak"

#### Scenario: imports among pruned files

- **GIVEN** two files the prune deletes, one importing the other and the removed dependency
- **WHEN** the prune is checked
- **THEN** nothing is listed
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "an import between two pruned files is no leak"

#### Scenario: an Expo plugin left behind

- **GIVEN** a capability that removes a dependency and patches `expo.plugins` to a list that still
  names it
- **WHEN** the prune is checked
- **THEN** the plugin entry is listed
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "an Expo plugin the prune leaves that names a removed dependency is a leak"

#### Scenario: the patched plugin list drifts

- **GIVEN** a capability whose patched `expo.plugins` is not the app's list without the plugins
  of its removed dependencies
- **WHEN** the prune is checked
- **THEN** the drift is listed
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a patched plugin list that drifts from app.json is a leak"

<!-- region sentry -->
#### Scenario: the sentry capability of this repository

- **GIVEN** the repository's tracked files and its `template.manifest.json`
- **WHEN** the prune of `sentry` is checked
- **THEN** nothing is listed
- **Test:** `scripts/prune-boundary.sentry.test.mjs` › "pruning sentry of this repository leaves no dangling reference"
<!-- endregion sentry -->

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
<!-- region sentry -->
- **Test:** `scripts/prune-boundary.sentry.test.mjs` › "pruning sentry of this repository leaves no dangling reference"
<!-- endregion sentry -->
<!-- region mobile-expo -->
- **Test:** `scripts/prune-boundary.mobile-expo.test.mjs` › "pruning mobile-expo of this repository leaves no dangling reference"
<!-- endregion mobile-expo -->
<!-- region supabase -->
- **Test:** `scripts/prune-boundary.supabase.test.mjs` › "pruning supabase of this repository leaves no dangling reference"
<!-- endregion supabase -->
<!-- region web-next -->
- **Test:** `scripts/prune-boundary.web-next.test.mjs` › "pruning web-next of this repository leaves no dangling reference"
<!-- endregion web-next -->
<!-- region cloudflare -->
- **Test:** `scripts/prune-boundary.cloudflare.test.mjs` › "pruning cloudflare of this repository leaves the registry true"
<!-- endregion cloudflare -->

#### Scenario: the packages of this repository a prune takes

- **GIVEN** the repository's tracked files, its manifest and its registry
- **WHEN** the prune of `i18n` and of `design-tokens` is checked
- **THEN** no kept `package.json` declares a package whose entry the prune takes
<!-- region i18n -->
- **Test:** `scripts/prune-boundary.i18n.test.mjs` › "pruning i18n of this repository keeps no package whose entry it takes"
<!-- endregion i18n -->
<!-- region design-tokens -->
- **Test:** `scripts/prune-boundary.design-tokens.test.mjs` › "pruning design-tokens of this repository keeps no package whose entry it takes"
<!-- endregion design-tokens -->

### Requirement: TOOLING-18 — A kept spec cites no pruned file

The tooling package SHALL list every kept living spec under `openspec/specs/` that cites, in
backticks, a file the prune deletes: a scenario's test, an evidence `path:line` or a governed
path.

**Evidence:** `packages/tooling/src/prune-boundary.mjs:74`, `packages/tooling/src/prune-boundary.mjs:172-183`

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

<!-- region sentry -->
#### Scenario: the Sentry part of this repository's app specs

- **GIVEN** the repository's web and mobile specs, each holding the Sentry part of its app, its
  `Governs` line and its requirements, in a `sentry` region
- **WHEN** the prune of `sentry` is checked with its regions dropped, and again with them kept
- **THEN** with the regions dropped neither spec is listed, and with them kept both are, with the
  Sentry files their regions cite
- **Test:** `scripts/prune-boundary.sentry.test.mjs` › "pruning sentry of this repository drops the Sentry part of each app spec with its region"
<!-- endregion sentry -->

#### Scenario: an app prune of this repository, Sentry kept

- **GIVEN** the repository's tracked files and its `template.manifest.json`
- **WHEN** the prune of `mobile-expo` and of `web-next` is simulated, Sentry kept: the files the
  app claims or removes deleted, and the app gone from the manifest
- **THEN** no claim the `sentry` capability makes on a living spec is left matching no file
<!-- region mobile-expo -->
- **Test:** `scripts/prune-boundary.mobile-expo.test.mjs` › "pruning mobile-expo of this repository leaves no claim of a kept capability on a spec stale"
<!-- endregion mobile-expo -->
<!-- region web-next -->
- **Test:** `scripts/prune-boundary.web-next.test.mjs` › "pruning web-next of this repository leaves no claim of a kept capability on a spec stale"
<!-- endregion web-next -->

### Requirement: TOOLING-19 — A kept file names no pruned file and keeps no orphaned key

The tooling package SHALL list every kept source file that names a file the prune deletes by a
quoted relative path outside an import, and every key of a kept `.env.example` that a file the
prune deletes reads through `process.env` and no kept file reads.

**Evidence:** `packages/tooling/src/prune-boundary.mjs:124-170`

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

**Evidence:** `packages/tooling/src/prune-boundary.mjs:347-358`, `scripts/manifest-owners.mjs:175-194`

#### Scenario: a leak inside a region

- **GIVEN** a kept file whose import of a pruned file sits inside a region of the pruned
  capability, and a second whose import sits inside a region of another capability
- **WHEN** the prune is checked
- **THEN** only the second file is listed
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a leak inside a region of the pruned capability is no leak"

#### Scenario: four capabilities of this repository

- **GIVEN** the repository's tracked files, its manifest, its registry and its regions
- **WHEN** the prune of `sentry`, of `supabase`, of `mobile-expo` and of `web-next` is checked with
  every check
- **THEN** nothing is listed for any of them
<!-- region sentry -->
- **Test:** `scripts/prune-boundary.sentry.test.mjs` › "pruning sentry of this repository leaves no dangling reference"
<!-- endregion sentry -->
<!-- region supabase -->
- **Test:** `scripts/prune-boundary.supabase.test.mjs` › "pruning supabase of this repository leaves no dangling reference"
<!-- endregion supabase -->
<!-- region mobile-expo -->
- **Test:** `scripts/prune-boundary.mobile-expo.test.mjs` › "pruning mobile-expo of this repository leaves no dangling reference"
<!-- endregion mobile-expo -->
<!-- region web-next -->
- **Test:** `scripts/prune-boundary.web-next.test.mjs` › "pruning web-next of this repository leaves no dangling reference"
<!-- endregion web-next -->
