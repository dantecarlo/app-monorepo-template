# packages/tooling — living spec

> **Governs:** `packages/tooling/src`
> **ID prefix:** `TOOLING`
> **Derived from:** `docs/code-standards.md`, `docs/architecture/shared.md`, `docs/INIT_AND_HARNESS_PLAN.md`
> **Verified against the code:** 2026-11-15 at `a4334a6`

## Purpose

The tooling package holds the plain-ESM scripts more than one workspace imports by name: the
shared Vitest base every package config builds on, the shuffled test order seeded from the
commit that every workspace runs under (apps/web and apps/mobile take the sequence alone), and
the process-tree kill the root web smoke script uses. Each workspace keeps its own include globs
and coverage settings; Turborepo and the root configs own caching and the seed's pass-through,
and the repository gates under `scripts/` are not part of this unit.

## Requirements

### Requirement: TOOLING-01 — Three named entry points

The tooling package SHALL expose three entry points, `@app/tooling/process-tree`,
`@app/tooling/vitest-package-base` and `@app/tooling/vitest-sequence`, each pairing its plain ESM
module with its type declarations.

**Evidence:** `packages/tooling/package.json:6-19`

#### Scenario: a workspace imports the package base by name

- **GIVEN** a workspace that declares `@app/tooling` as a `workspace:*` devDependency
- **WHEN** its Vitest config imports `@app/tooling/vitest-package-base`
- **THEN** the import resolves to the module at run time and to its declarations for types
- **Test:** Not covered — no test imports the package by name; the config of every package that
  builds on it resolves it on each test run.

### Requirement: TOOLING-02 — The seed comes from the commit

The tooling package SHALL derive the shuffle seed from the first 12 hex digits of the sha that
`git rev-parse HEAD` prints, read as an integer.

**Evidence:** `packages/tooling/src/vitest-sequence.mjs:41`,
`packages/tooling/src/vitest-sequence.mjs:69-74`

#### Scenario: a sha1 or a sha256 commit

- **GIVEN** a 40-digit sha and a 64-digit sha that start with the same 12 hex digits
- **WHEN** a seed is drawn from each
- **THEN** both seeds are those 12 digits read in base 16
- **Test:** `packages/tooling/src/vitest-sequence.test.mjs` › "the seed is the first 12 hex digits of the commit sha"

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
- **Test:** `packages/tooling/src/vitest-sequence.test.mjs` › "a value that is not a commit sha is refused, naming the override"

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
- **Test:** `packages/tooling/src/vitest-sequence.test.mjs` › "the commit gives the seed unless the override is set"

#### Scenario: the override is set and there is no commit

- **GIVEN** the override `42` and an empty commit value
- **WHEN** the seed is resolved
- **THEN** the seed is 42 and its source is `VITEST_SEQUENCE_SEED`, and the commit is never read
- **Test:** `packages/tooling/src/vitest-sequence.test.mjs` › "the commit gives the seed unless the override is set"

### Requirement: TOOLING-05 — The override must be an integer

The tooling package SHALL refuse an override that is not a safe integer, with an error that says
it is not an integer.

**Evidence:** `packages/tooling/src/vitest-sequence.mjs:50-56`

#### Scenario: letters or a fraction

- **GIVEN** the override `abc` or the override `1.5`
- **WHEN** the seed is resolved
- **THEN** it throws an error saying the override is not an integer
- **Test:** `packages/tooling/src/vitest-sequence.test.mjs` › "an override that is not an integer is refused"

### Requirement: TOOLING-06 — A shuffled sequence block

The tooling package SHALL return from `testSequence` the Vitest `sequence` block
`{ seed, shuffle: true }`, with the seed it resolved.

**Evidence:** `packages/tooling/src/vitest-sequence.mjs:82-97`

#### Scenario: the override seed is in force

- **GIVEN** the override `7`
- **WHEN** `testSequence` runs for a package
- **THEN** it returns the seed 7 with shuffle on
- **Test:** `packages/tooling/src/vitest-sequence.test.mjs` › "testSequence shuffles with the resolved seed and prints how to replay it"

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
- **Test:** `packages/tooling/src/vitest-sequence.test.mjs` › "the replay notice names the seed, its source and the command that replays it"

#### Scenario: the workspace name

- **GIVEN** the folder of the tooling package
- **WHEN** its workspace name is read
- **THEN** the name is `@app/tooling`, taken from its `package.json`
- **Test:** `packages/tooling/src/vitest-sequence.test.mjs` › "the workspace name comes from its package.json"

#### Scenario: one notice per config load

- **GIVEN** the override `7`
- **WHEN** `testSequence` runs for the tooling package
- **THEN** the console prints exactly one line, naming `@app/tooling` and the seed 7
- **Test:** `packages/tooling/src/vitest-sequence.test.mjs` › "testSequence shuffles with the resolved seed and prints how to replay it"

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
- **Test:** `packages/tooling/src/vitest-package-base.test.mjs` › "the base aliases @ onto the package src and runs a shuffled node suite"

### Requirement: TOOLING-09 — Coverage defaults

The tooling package SHALL set v8 coverage in the base, reported as `text-summary`,
`json-summary` and `lcov` into the package's `coverage` folder, with every barrel index under
`src` excluded.

**Evidence:** `packages/tooling/src/vitest-package-base.mjs:34-39`

#### Scenario: provider and exclusion

- **GIVEN** the base of a package
- **WHEN** its coverage block is read
- **THEN** the provider is `v8` and the only exclusion is the `src` barrels
- **Test:** `packages/tooling/src/vitest-package-base.test.mjs` › "the base aliases @ onto the package src and runs a shuffled node suite"

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
- **Test:** `packages/tooling/src/vitest-package-base.test.mjs` › "the base sets no Vitest 5 option"

### Requirement: TOOLING-11 — Spawn options that let a tree be ended

The tooling package SHALL export `TREE_SPAWN_OPTIONS` frozen, with `detached` true on POSIX and
false on Windows, so a child spawned with it leads its own process group on POSIX.

**Evidence:** `packages/tooling/src/process-tree.mjs:20`

#### Scenario: the options on the running platform

- **GIVEN** the platform the suite runs on
- **WHEN** `TREE_SPAWN_OPTIONS` is read
- **THEN** it equals `{ detached: !isWindows }` and is frozen
- **Test:** `packages/tooling/src/process-tree.test.mjs` › "the spawn options detach the child on POSIX only, and cannot be changed"

### Requirement: TOOLING-12 — A child is ended with every process it started

The tooling package SHALL end a child and its descendants from `signalProcessTree` (on POSIX by
sending the signal to the child's process group, which holds its descendants only when the child
was spawned with `TREE_SPAWN_OPTIONS`, so a child spawned without them receives the signal alone;
on Windows by `taskkill /pid <pid> /T /F` whatever the signal), and say in its declaration and
its JSDoc that on POSIX the descendants are reached only for a child spawned with
`TREE_SPAWN_OPTIONS`.

**Evidence:** `packages/tooling/src/process-tree.mjs:47-65`,
`packages/tooling/src/process-tree.d.mts:6-9`, `packages/tooling/src/process-tree.mjs:34-37`

#### Scenario: a child that started a process

- **GIVEN** a child spawned with `TREE_SPAWN_OPTIONS` that started a long-lived process of its own
- **WHEN** `signalProcessTree` signals it with `SIGTERM` and `wait`
- **THEN** it returns true, and both the child and the process it started end within ten seconds
- **Test:** `packages/tooling/src/process-tree.test.mjs` › "signalProcessTree ends a child and the process it started"

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

**Evidence:** `packages/tooling/src/process-tree.mjs:48-62`

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

**Evidence:** `packages/tooling/src/process-tree.mjs:46`,
`packages/tooling/src/process-tree.mjs:59-61`, `packages/tooling/src/process-tree.mjs:66-68`

#### Scenario: a tree that already ended

- **GIVEN** a child whose tree was already ended
- **WHEN** `signalProcessTree` signals it again with `wait`
- **THEN** it returns true
- **Test:** `packages/tooling/src/process-tree.test.mjs` › "a tree that already ended counts as ended"

#### Scenario: a child that never started

- **GIVEN** a child with no pid
- **WHEN** `signalProcessTree` signals it
- **THEN** it returns true without signalling anything
- **Test:** `packages/tooling/src/process-tree.test.mjs` › "a child that never started has nothing to end"

#### Scenario: a tree the caller may not signal

- **GIVEN** a running child whose tree cannot be signalled
- **WHEN** `signalProcessTree` signals it
- **THEN** it returns false
- **Test:** Not covered — no test holds a running process the caller is not allowed to signal.
