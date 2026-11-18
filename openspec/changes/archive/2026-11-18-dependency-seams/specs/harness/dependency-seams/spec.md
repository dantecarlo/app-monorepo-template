# Delta: harness/dependency-seams

> **Change:** `2026-11-18-dependency-seams`
> **ID prefix:** `SEAM`

## ADDED Requirements

### Requirement: SEAM-01 — One registry entry per dependency, with its category and seam

The dependency registry `.agents/contracts/dependencies.json` SHALL hold one entry per package or
package subpath, each with a category among `core`, `infra`, `ui`, `vendor`, `vendor-package`,
`build` and `peer`, a seam of repository globs for every non-core entry, no seam for a core
entry, and `types` either `seam` (the default) or `anywhere`; `pnpm verify:dependency-seams`
refuses an entry that breaks this shape and a name listed twice.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a non-core entry without a seam

- **GIVEN** a registry entry for `zod` in the `infra` category with no `seam`
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the entry and what it lacks
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "a non-core entry without a seam is malformed"

#### Scenario: an unknown category

- **GIVEN** a registry entry whose category is `library`
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the entry and the categories it may use
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "an entry with an unknown category is malformed"

#### Scenario: a package listed twice

- **GIVEN** a registry that names `zod` in two entries
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the package
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "a registry that names one package twice is malformed"

### Requirement: SEAM-02 — An unregistered package fails, closed

`local/dependency-seam` SHALL report every import of a package that no registry entry names, in
every file of `apps/*/**` and `packages/*/**` it lints, test infrastructure included; a Node
builtin resolves to the registry's `node:*` entry.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a package nobody registered

- **GIVEN** a web screen that imports `left-pad`, which the registry does not name
- **WHEN** ESLint lints it
- **THEN** `local/dependency-seam` reports it as unregistered
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a package the registry does not name is refused"

#### Scenario: a Node builtin in app source

- **GIVEN** a web screen that imports `node:fs`
- **WHEN** ESLint lints it
- **THEN** it is reported as outside the seam of the `node:*` entry
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a Node builtin outside its seam is refused"

### Requirement: SEAM-03 — A registered package passes only inside its seam

`local/dependency-seam` SHALL accept an import of a core package in any file, and an import of
any other registered package only in a file one of its seam globs matches; a type-only import is
judged the same way unless the entry sets `types` to `anywhere`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: outside the seam

- **GIVEN** a web screen that imports `zod`, whose seam is `apps/*/src/validation/**`
- **WHEN** ESLint lints it
- **THEN** it is reported as outside its seam, naming the seam
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a registered package outside its seam is refused"

#### Scenario: inside the seam

- **GIVEN** a schema under `apps/web/src/validation/` that imports `zod`
- **WHEN** ESLint lints it
- **THEN** nothing is reported
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a registered package inside its seam passes"

#### Scenario: a core package

- **GIVEN** a web screen that imports `react` and `@app/core`
- **WHEN** ESLint lints it
- **THEN** nothing is reported
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a core package passes anywhere"

#### Scenario: a type-only import outside the seam

- **GIVEN** a web screen with `import type { QueryClient } from '@tanstack/react-query'`
- **WHEN** ESLint lints it
- **THEN** it is reported as outside its seam
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a type-only import outside the seam is refused"

#### Scenario: an entry whose types are allowed anywhere

- **GIVEN** a registry entry with `types: anywhere`, and a type-only and a value import of it
  outside its seam
- **WHEN** the rule's detection reads the file
- **THEN** only the value import is reported
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "an entry whose types are anywhere admits a type-only import outside its seam"

#### Scenario: a vendor SDK the old import patterns refused

- **GIVEN** a web screen that imports `@sentry/nextjs`, and another that imports `@stripe/stripe-js`
- **WHEN** ESLint lints them
- **THEN** the first is outside its seam and the second unregistered
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a vendor SDK the old import patterns refused is still refused"

### Requirement: SEAM-04 — Every way a file reaches a package is read

`local/dependency-seam` SHALL judge static imports, type-only imports, re-exports, dynamic
`import()` and `require()` with a literal specifier, `import x = require()`, `import()` types,
and the module argument of `vi.mock`, `vi.doMock`, `vi.unmock`, `vi.doUnmock`,
`vi.importActual` and `vi.importMock`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a dynamic import

- **GIVEN** a web screen with `await import('zod')`
- **WHEN** ESLint lints it
- **THEN** it is reported as outside its seam
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a dynamic import outside the seam is refused"

#### Scenario: a require

- **GIVEN** a web screen with `require('zod')`
- **WHEN** ESLint lints it
- **THEN** it is reported as outside its seam
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a require outside the seam is refused"

#### Scenario: a mocked vendor

- **GIVEN** a screen test with `vi.mock('zod')`
- **WHEN** ESLint lints it
- **THEN** it is reported as outside its seam
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a vi.mock of a package outside its seam is refused"

#### Scenario: a re-export

- **GIVEN** a web barrel with `export { z } from 'zod'`
- **WHEN** ESLint lints it
- **THEN** it is reported as outside its seam
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a re-export outside the seam is refused"

### Requirement: SEAM-05 — The most specific entry wins

`local/dependency-seam` SHALL judge a specifier by the registry entry with the longest name that
is the specifier itself or one of its parent paths down to its package, so a subpath entry
narrows its package and a subpath without an entry of its own takes its package's.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a narrowed subpath of a core package

- **GIVEN** a web screen that imports `next/navigation`, whose entry has a seam of its own
- **WHEN** ESLint lints it
- **THEN** it is reported as outside the seam of `next/navigation`
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a subpath entry wins over its package"

#### Scenario: a subpath with no entry of its own

- **GIVEN** a web route that imports `next/server`
- **WHEN** ESLint lints it
- **THEN** nothing is reported: it takes the core entry of `next`
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a subpath with no entry of its own takes its package's"

### Requirement: SEAM-06 — A test inherits its unit's seam, and src/test is test infrastructure

`local/dependency-seam` SHALL accept, in a test file, every package the seam of the unit it tests
admits, the unit being the file named by the test's stem in the folder that holds its
`__tests__/`, and in a file under a test-infrastructure glob of the registry
(`{apps,packages}/*/src/test/**`), every registered package.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a test of a unit inside the seam

- **GIVEN** `apps/web/src/lib/query/__tests__/useAppQuery.hook.test.ts` importing
  `@tanstack/react-query`, whose seam is `apps/*/src/lib/query/**`
- **WHEN** ESLint lints it
- **THEN** nothing is reported
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a test inherits the seam of the unit it tests"

#### Scenario: a test of a unit outside the seam

- **GIVEN** a screen test importing `@tanstack/react-query`
- **WHEN** ESLint lints it
- **THEN** it is reported as outside its seam
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a test of a unit outside the seam is refused"

#### Scenario: test infrastructure

- **GIVEN** `apps/web/src/test/setup.ts` importing `zustand`
- **WHEN** ESLint lints it
- **THEN** nothing is reported
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "test infrastructure under src/test passes any registered package"

#### Scenario: an unregistered package in test infrastructure

- **GIVEN** `apps/web/src/test/setup.ts` importing `left-pad`
- **WHEN** ESLint lints it
- **THEN** it is reported as unregistered
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "an unregistered package is refused in test infrastructure too"

### Requirement: SEAM-07 — The frozen allowlist only shrinks

`local/dependency-seam` SHALL skip the imports of a package in a file that
`eslint-dependency-seam-allowlist.json` lists as that pair, and `pnpm verify:dependency-seams`
SHALL fail an entry whose file no longer breaks the rule with that package, a violation the list
does not carry, a pair listed twice, and an entry without a path, a package, or a reason that
starts with the F.8 unit, 2 to 8, that removes it.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a listed pair

- **GIVEN** an allowlist entry for a screen and `zod`, and that screen importing `zod` and
  `zustand`
- **WHEN** the rule's detection reads the file
- **THEN** only the `zustand` import is reported
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "an allowlisted file and package pair is not reported"

#### Scenario: an entry whose file was fixed

- **GIVEN** an allowlist entry for a screen and `zod`, and that screen no longer importing `zod`
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the file and the package, and asks for the entry to be removed
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "an allowlist entry whose file no longer breaks the rule is stale"

#### Scenario: a violation the list does not carry

- **GIVEN** a screen importing `zod` and an empty allowlist
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the file, the package and the count
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "a violation the allowlist does not carry is named"

#### Scenario: an entry that names no unit

- **GIVEN** an allowlist entry whose reason does not start with `F.8 unit 2` to `F.8 unit 8`
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the entry
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "an allowlist entry that names no F.8 unit is malformed"

#### Scenario: the gate as a process

- **GIVEN** a stale allowlist entry in a scratch tree
- **WHEN** `node scripts/verify-dependency-seams.mjs --root <tree>` runs
- **THEN** it exits 1 and prints the entry
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "the gate exits 1 and prints the stale entry"

### Requirement: SEAM-08 — The gate holds the registry to the workspace

`pnpm verify:dependency-seams` SHALL fail when a dependency of the root, an `apps/*` or a
`packages/*` `package.json` has no registry entry, when an entry names a package no such
`package.json` declares (the `node:*` entry excepted), when a seam or test-infrastructure glob
matches no file under `apps/` or `packages/`, and when a file ESLint does not lint imports a
package outside its seam or unregistered; it states the population it judged when it passes.

**Evidence:** written at apply time, when the code exists.

#### Scenario: an unregistered dependency

- **GIVEN** an app `package.json` declaring `left-pad`, which the registry does not name
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the package and the `package.json`
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "a package.json dependency the registry does not name fails"

#### Scenario: a stale entry

- **GIVEN** a registry entry for `left-pad`, which no `package.json` declares
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the entry
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "a registry entry for a package nothing declares is stale"

#### Scenario: a glob that matches nothing

- **GIVEN** a seam glob `apps/*/src/lib/store/**` and no such folder
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the entry and the glob
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "a seam glob that matches no file fails"

#### Scenario: a config file ESLint skips

- **GIVEN** `apps/mobile/metro.config.js`, which ESLint ignores, requiring `nativewind/metro`
  while the seam of `nativewind` does not list it
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the file and the package
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "a file ESLint does not lint that imports a package outside its seam fails"

#### Scenario: a green states what it judged

- **GIVEN** a tree whose registry, manifests, files and allowlist agree
- **WHEN** `node scripts/verify-dependency-seams.mjs --root <tree>` runs
- **THEN** it exits 0 and prints the entries, manifests, files and violations it counted
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "the gate exits 0 over a clean tree and states what it judged"

### Requirement: SEAM-09 — A new app inherits the rule by pattern

The ESLint config SHALL run `local/dependency-seam` at `error` on every JavaScript and TypeScript
file of `apps/*/**` and `packages/*/**` and register the plugin it needs in the same block, so an
app added under `apps/` is judged with no config change.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the fixture app

- **GIVEN** the fixture app `eslint-local-rules/__fixtures__/apps/fixture/`, linted through the
  real `eslint.config.mjs` as `apps/fixture/`
- **WHEN** ESLint lints its files
- **THEN** an unregistered package and a registered package outside its seam are reported at
  error, and its seam files report nothing
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a new app under apps/ inherits the rule with no config change"
