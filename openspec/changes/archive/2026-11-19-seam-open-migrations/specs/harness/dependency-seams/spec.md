# Delta: harness/dependency-seams

> **Change:** `2026-11-19-seam-open-migrations`

## ADDED Requirements

### Requirement: SEAM-16 — The registry declares the migrations that are open

The dependency registry `.agents/contracts/dependencies.json` SHALL declare, in an optional
`openMigrations`, the migrations still open, each an object with a text `id` no other declaration
repeats, a text `note` and no other key; a registry without the field SHALL declare none, and the
template's declares none. `pnpm verify:dependency-seams` SHALL refuse a declaration that breaks
this shape as a malformed registry, judging nothing else against it, and SHALL fail a declared
migration that no entry of `eslint-dependency-seam-allowlist.json` names, as stale, to be closed by
removing it; while the allowlist cannot be read, it SHALL call no migration stale.

**Evidence:** written at apply time, when the code exists.

#### Scenario: no migration is open

- **GIVEN** a tree whose registry declares `openMigrations: []` and whose allowlist is empty
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it passes
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "a registry that declares no open migration passes"

#### Scenario: a malformed declaration

- **GIVEN** a registry whose `openMigrations` is not an array, then one with a migration that has
  no note, one with a key the declaration does not define, and one that declares an id twice
- **WHEN** `pnpm verify:dependency-seams` runs over each
- **THEN** each fails once, as a malformed registry, naming what is wrong
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "a malformed open-migration declaration is refused, naming it"

#### Scenario: a stale migration

- **GIVEN** a registry that declares the migration `f8-unit-2` and an empty allowlist
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails once, naming `f8-unit-2` as stale and asking for its removal
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "a declared migration no allowlist entry names is stale"
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "a stale migration names its id and the remedy"

#### Scenario: an allowlist the gate cannot read

- **GIVEN** a registry that declares the migration `f8-unit-2` and an allowlist that is not a JSON
  array
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails once, naming the allowlist, and calls no migration stale
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "no migration is called stale while the allowlist cannot be read"

## MODIFIED Requirements

### Requirement: SEAM-07 — The frozen allowlist only shrinks, and counts only under an open migration

`local/dependency-seam` SHALL skip the imports of a package in a file that
`eslint-dependency-seam-allowlist.json` lists as that pair only when the entry's `migration` is
the id of a migration the registry declares open (SEAM-16), and `pnpm verify:dependency-seams`
SHALL fail an entry whose file no longer breaks the rule with that package, a violation the list
does not carry, a pair listed twice, and an entry without a path, a package, a reason, or a
`migration` the registry declares open; the rule and the gate SHALL decide whether an entry names
an open migration with the one predicate of `eslint-local-rules/dependency-seam.detect.mjs`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a listed pair

- **GIVEN** a registry that declares the migration `m` open, an allowlist entry for a screen and
  `zod` that names `m`, and that screen importing `zod` and `zustand`
- **WHEN** the rule's detection reads the file
- **THEN** only the `zustand` import is reported
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "an allowlisted file and package pair is not reported"

#### Scenario: a pair whose migration is not open

- **GIVEN** an allowlist entry for a screen and `zod` that names no migration, then one that names
  `closed` while the registry declares only `m`, then one that names `m` in a registry with no
  `openMigrations`; and that screen importing `zod` and `zustand`
- **WHEN** the rule's detection reads the file under each
- **THEN** both imports are reported every time
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "an allowlist entry whose migration is not open exempts nothing"

#### Scenario: an entry whose file was fixed

- **GIVEN** an allowlist entry for a screen and `zod` under an open migration, and that screen no
  longer importing `zod`
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the file and the package, and asks for the entry to be removed
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "an allowlist entry whose file no longer breaks the rule is stale"

#### Scenario: a violation the list does not carry

- **GIVEN** a screen importing `zod` and an empty allowlist
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the file, the package and the count
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "a violation the allowlist does not carry is named"

#### Scenario: an entry that names no migration

- **GIVEN** an allowlist entry, with a reason that starts with `F.8 unit 2`, that has no
  `migration`, for a screen that imports `zod`
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the entry as malformed and the import as not listed
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "an allowlist entry that names no migration is malformed"

#### Scenario: an entry whose migration is not open

- **GIVEN** an allowlist entry that names `f8-unit-9` in a registry that declares no open
  migration, and then the same entry in a registry with no `openMigrations`
- **WHEN** `pnpm verify:dependency-seams` runs over each
- **THEN** it fails, naming the entry, its migration and that the registry does not declare it open,
  and the import as not listed
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "an allowlist entry whose migration the registry does not declare open is malformed"
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "an entry whose migration is not open is named, and a registry with no openMigrations declares none"

#### Scenario: an entry under an open migration

- **GIVEN** a registry that declares `f8-unit-2` open, and an allowlist entry that names it for a
  screen that imports `zod`
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it passes
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "an allowlist entry whose file still breaks the rule passes"

#### Scenario: a reason that names no F.8 unit, and no reason

- **GIVEN** an allowlist entry under an open migration whose reason does not start with an F.8
  unit, and then one with no reason, each for a screen that imports `zod`
- **WHEN** `pnpm verify:dependency-seams` runs over each
- **THEN** the first passes, and the second fails, naming the entry as malformed and the import as
  not listed
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "an allowlist entry under an open migration needs no F.8 unit in its reason"
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "an allowlist entry with no reason is malformed"

#### Scenario: the gate as a process

- **GIVEN** a stale allowlist entry in a scratch tree
- **WHEN** `node scripts/verify-dependency-seams.mjs --root <tree>` runs
- **THEN** it exits 1 and prints the entry
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "the gate exits 1 and prints the stale entry"
