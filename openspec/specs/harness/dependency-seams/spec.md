# harness/dependency-seams — living spec

> **Governs:** `.agents/contracts/dependencies.json`, `eslint-dependency-seam-allowlist.json`, `eslint-local-rules/dependency-seam.detect.mjs`, `eslint-local-rules/wrapped-import.detect.mjs`, `scripts/dependency-seams.detect.mjs`, `scripts/eslint-config.detect.mjs`, `scripts/verify-dependency-seams.mjs`, `eslint.config.mjs`, `eslint.rules.mjs`
> **ID prefix:** `SEAM`
> **Derived from:** `docs/code-standards.md`, `docs/INIT_AND_HARNESS_PLAN.md`
> **Verified against the code:** 2026-11-25 at `12d6b224`

## Purpose

The dependency-seam unit of the harness answers, in one file, which file of the workspace may
import which package (decisions 51, 52 and 58). It owns the registry of every declared or
imported package with its category and seam, the detection `local/dependency-seam` runs over
every app and package by pattern, the frozen allowlist of the imports that broke the rule when it
landed, and the gate that holds the registry to the `package.json` files, the seams to the files,
the configs ESLint ignores to their seams and the allowlist to the source. Moving an import into
its seam belongs to the later F.8 units. Since F59 an allowlist entry counts only while it names a
migration the registry declares open, and the template declares none (SEAM-07, SEAM-16). Since F.8 unit 8 it also judges the names imported from
two core packages, which `local/wrapped-import` keeps inside the wrapper that owns them
(SEAM-11 to SEAM-15). Since F.8 unit 1b it also owns how the ESLint config reaches a new app or package:
every shared rule set by pattern, and each framework's block by what a workspace's `package.json`
declares (SEAM-09, SEAM-10); the other lint rules themselves are not part of this unit.

## Requirements

### Requirement: SEAM-01 — One registry entry per dependency, with its category and seam

The dependency registry `.agents/contracts/dependencies.json` SHALL hold one entry per package or
package subpath, each with a category among `core`, `infra`, `ui`, `vendor`, `vendor-package`,
`build` and `peer`, a seam of repository globs for every non-core entry, no seam for a core
entry, `types` either `seam` (the default) or `anywhere`, an optional text `note`, no other key, and an `owner` that names, as text, the
capability of `template.manifest.json` whose prune removes the entry, or `core`;
`pnpm verify:dependency-seams` refuses an entry that breaks this shape, an owner that is not text
included, and a name listed twice; whether an entry has an owner, and whether the manifest
declares it, is `pnpm verify:manifest:coverage`'s to refuse.

**Evidence:** `.agents/contracts/dependencies.json:2-9`, `eslint-local-rules/dependency-seam.detect.mjs:49-59`,
`scripts/dependency-seams.detect.mjs:56-63`, `scripts/dependency-seams.detect.mjs:101-141`,
`scripts/dependency-seams.detect.mjs:183-208`, `scripts/manifest-owners.mjs:28-69`

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

#### Scenario: an entry that names its owner

- **GIVEN** registry entries that each name an `owner`
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it passes
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "an entry that names its owner passes"

#### Scenario: an owner that is not text

- **GIVEN** a registry entry whose `owner` is a number
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the entry and its owner
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "an entry whose owner is not text is malformed"

### Requirement: SEAM-02 — An unregistered package fails, closed

`local/dependency-seam` SHALL report every import of a package that no registry entry names, in
every file of `apps/*/**` and `packages/*/**` it lints, test infrastructure included; a Node
builtin resolves to the registry's `node:*` entry.

**Evidence:** `eslint-local-rules/dependency-seam.detect.mjs:67`,
`eslint-local-rules/dependency-seam.detect.mjs:141-148`,
`eslint-local-rules/dependency-seam.detect.mjs:190-193`,
`eslint-local-rules/dependency-seam.detect.mjs:206-212`, `eslint-local-rules/index.mjs:924-953`

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

**Evidence:** `eslint-local-rules/dependency-seam.detect.mjs:213-223`, `.agents/contracts/dependencies.json:133-136`

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
- **THEN** the first is outside its seam while the registry names `@sentry/nextjs`, and
  unregistered once a `sentry` prune has taken its entry; the second is unregistered
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a vendor SDK the old import patterns refused is still refused"

### Requirement: SEAM-04 — Every way a file reaches a package is read

`local/dependency-seam` SHALL judge static imports, type-only imports, re-exports, dynamic
`import()` and `require()` with a literal specifier, `import x = require()`, `import()` types,
and the module argument of `vi.mock`, `vi.doMock`, `vi.unmock`, `vi.doUnmock`,
`vi.importActual` and `vi.importMock`.

**Evidence:** `eslint-local-rules/dependency-seam.detect.mjs:81-88`,
`eslint-local-rules/dependency-seam.detect.mjs:250-258`,
`eslint-local-rules/dependency-seam.detect.mjs:267-276`,
`eslint-local-rules/dependency-seam.detect.mjs:280-324`,
`eslint-local-rules/dependency-seam.detect.mjs:337-352`

#### Scenario: a dynamic import

- **GIVEN** a web screen with `await import('zod')`
- **WHEN** ESLint lints it
- **THEN** it is reported as outside its seam
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a dynamic import outside the seam is refused"

#### Scenario: a dynamic import with a template literal

- **GIVEN** a web screen with ``import(`zod`)``, a template literal with no expression
- **WHEN** ESLint lints it
- **THEN** it is reported as outside its seam
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a dynamic import with a template literal outside the seam is refused"

#### Scenario: a require

- **GIVEN** a web screen with `require('zod')`
- **WHEN** ESLint lints it
- **THEN** it is reported as outside its seam
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a require outside the seam is refused"

#### Scenario: an import-equals require

- **GIVEN** a web screen with `import zod = require('zod')`
- **WHEN** ESLint lints it
- **THEN** it is reported as outside its seam
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "an import-equals require outside the seam is refused"

#### Scenario: an import() type

- **GIVEN** a web screen with `type Schema = import('zod').ZodType`
- **WHEN** ESLint lints it
- **THEN** it is reported as outside its seam
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "an import() type outside the seam is refused"

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

#### Scenario: an export-all re-export

- **GIVEN** a web barrel with `export * from 'zod'`
- **WHEN** ESLint lints it
- **THEN** it is reported as outside its seam
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "an export-all re-export outside the seam is refused"

#### Scenario: a path of the project

- **GIVEN** a web screen importing `./x`, `../y`, `@/lib/z` and `#src/w`
- **WHEN** ESLint lints it
- **THEN** nothing is reported: a path of the project names no package
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a path of the project is never judged as a package"

### Requirement: SEAM-05 — The most specific entry wins

`local/dependency-seam` SHALL judge a specifier by the registry entry with the longest name that
is the specifier itself or one of its parent paths down to its package, so a subpath entry
narrows its package and a subpath without an entry of its own takes its package's.

**Evidence:** `eslint-local-rules/dependency-seam.detect.mjs:190-201`, `.agents/contracts/dependencies.json:32-35`,
`.agents/contracts/dependencies.json:66-69`

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

**Evidence:** `eslint-local-rules/dependency-seam.detect.mjs:74-78`,
`eslint-local-rules/dependency-seam.detect.mjs:109-125`, `eslint-local-rules/dependency-seam.detect.mjs:214-219`,
`.agents/contracts/dependencies.json:3`

#### Scenario: a test of a unit inside the seam

- **GIVEN** a test under an app's `src/lib/query/__tests__/` importing
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

- **GIVEN** a file of an app's test infrastructure, under its `src/test/`, importing `zustand`
- **WHEN** ESLint lints it
- **THEN** nothing is reported
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "test infrastructure under src/test passes any registered package"

#### Scenario: an unregistered package in test infrastructure

- **GIVEN** a file of an app's test infrastructure, under its `src/test/`, importing `left-pad`
- **WHEN** ESLint lints it
- **THEN** it is reported as unregistered
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "an unregistered package is refused in test infrastructure too"

### Requirement: SEAM-07 — The frozen allowlist only shrinks, and counts only under an open migration

`local/dependency-seam` SHALL skip the imports of a package in a file that
`eslint-dependency-seam-allowlist.json` lists as that pair only when the entry's `migration` is
the id of a migration the registry declares open (SEAM-16), and `pnpm verify:dependency-seams`
SHALL fail an entry whose file no longer breaks the rule with that package, a violation the list
does not carry, a pair listed twice, and an entry without a path, a package, a reason, or a
`migration` the registry declares open; the rule and the gate SHALL decide whether an entry names
an open migration with the one predicate of `eslint-local-rules/dependency-seam.detect.mjs`.

**Evidence:** `eslint-local-rules/dependency-seam.detect.mjs:225-244`,
`eslint-local-rules/dependency-seam.detect.mjs:356-380`, `scripts/dependency-seams.detect.mjs:64`,
`scripts/dependency-seams.detect.mjs:327-345`, `scripts/dependency-seams.detect.mjs:352-409`,
`scripts/dependency-seams.detect.mjs:471`, `eslint-dependency-seam-allowlist.json:1`

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

### Requirement: SEAM-08 — The gate holds the registry to the workspace

`pnpm verify:dependency-seams` SHALL fail when a dependency of the root, an `apps/*` or a
`packages/*` `package.json` has no registry entry, when an entry names a package no such
`package.json` declares (the `node:*` entry excepted), when a seam or test-infrastructure glob
matches no file under `apps/` or `packages/`, and when a file ESLint does not lint imports a
package outside its seam or unregistered; it SHALL fail, naming the file, when one of those
`package.json` files cannot be read or parsed or is not a JSON object, and then call no entry
stale, and when a source file under `apps/` or `packages/` cannot be parsed. It states the
population it judged when it passes, and against a registry it refuses it counts no file-package
pair.

**Evidence:** `scripts/dependency-seams.detect.mjs:223-232`, `scripts/dependency-seams.detect.mjs:234-245`,
`scripts/dependency-seams.detect.mjs:247-258`, `scripts/dependency-seams.detect.mjs:260-281`,
`scripts/dependency-seams.detect.mjs:315-325`, `scripts/dependency-seams.detect.mjs:444-480`,
`scripts/verify-dependency-seams.mjs:121-129`, `scripts/verify-dependency-seams.mjs:131-155`,
`scripts/verify-dependency-seams.mjs:201-216`, `scripts/verify-dependency-seams.mjs:231-251`,
`scripts/eslint-config.detect.mjs:68-84`

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

#### Scenario: a package.json that cannot be read

- **GIVEN** an app `package.json` cut off mid-object, the only manifest that declares `react`
  and `zod`
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails once, naming the `package.json`, and calls no entry stale
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "a package.json that cannot be parsed fails, naming it, and no entry is called stale"

#### Scenario: a package.json that is not an object

- **GIVEN** an app `package.json` holding `null`
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the `package.json`
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "a package.json that is not a JSON object fails, naming it"

#### Scenario: a source that cannot be parsed

- **GIVEN** a web screen whose text is not valid TypeScript
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the file, since its imports are not judged
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "a source file that cannot be parsed fails, naming it"

#### Scenario: a glob that matches nothing

- **GIVEN** a seam glob `apps/*/src/lib/store/**` and no such folder
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the entry and the glob
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "a seam glob that matches no file fails"

#### Scenario: a config file ESLint skips

- **GIVEN** an app's `metro.config.js`, which ESLint ignores, requiring `nativewind/metro`
  while the seam of `nativewind` does not list it
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the file and the package
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "a file ESLint does not lint that imports a package outside its seam fails"

#### Scenario: a green states what it judged

- **GIVEN** a tree whose registry, manifests, files and allowlist agree
- **WHEN** `node scripts/verify-dependency-seams.mjs --root <tree>` runs
- **THEN** it exits 0 and prints the entries, manifests, files and violations it counted
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "the gate exits 0 over a clean tree and states what it judged"

#### Scenario: a registry the gate refuses

- **GIVEN** a registry whose `zod` entry names no seam, with a screen importing `zod`, and then a
  registry that is JSON `null`
- **WHEN** `node scripts/verify-dependency-seams.mjs --root <tree>` runs over each
- **THEN** it exits 1 naming the registry, prints that no file-package pair was judged, and never
  crashes
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "the gate counts no file-package pair against a registry it refuses"

### Requirement: SEAM-09 — A new app inherits every shared rule by pattern

The ESLint config SHALL apply every rule set more than one workspace shares by pattern, never by
naming a workspace: the base rules and the filename suffix rules to every TypeScript file of
`apps/*/**` and `packages/*/**`; the casing of `src/components/ui/` folders and the styling pillar
to every app; the fractal, logic-in-hook, suffix-contract and test overrides to every file of their
suffix; and `local/dependency-seam` at `error` to every JavaScript and TypeScript file of
`apps/*/**` and `packages/*/**`; each block registering the plugins it needs, so an app added under
`apps/` is judged by every shared rule with no config change.

**Evidence:** `eslint.config.mjs:258-267`, `eslint.config.mjs:310-313`, `eslint.config.mjs:352-372`,
`eslint.rules.mjs:335-340`, `eslint.rules.mjs:673-680`, `eslint-local-rules/style-positioning.detect.mjs:310-314`,
`eslint-local-rules/ui-kit.detect.mjs:63-66`, `eslint-local-rules/__fixtures__/apps/fixture/package.json:1-7`

#### Scenario: the base rules

- **GIVEN** the fixture app `eslint-local-rules/__fixtures__/apps/fixture/`, whose `package.json`
  declares `react` and neither `next` nor `expo`, linted through the config `eslint.config.mjs`
  builds for the fixture's folder, as `apps/fixture/`; and a helper of it that declares an
  interface without the `I` prefix
- **WHEN** ESLint lints the helper
- **THEN** `@typescript-eslint/naming-convention` reports it at error, and nothing else
- **Test:** `eslint-local-rules/eslint-config.cases.mjs` › "a new app inherits the base rules"

#### Scenario: the React rules

- **GIVEN** a component of the fixture app whose JSX props are not sorted
- **WHEN** ESLint lints it
- **THEN** `react/jsx-sort-props` reports it at error, and nothing else
- **Test:** `eslint-local-rules/eslint-config.cases.mjs` › "a new app that declares react inherits the React rules"

#### Scenario: the filename rules

- **GIVEN** a source file of the fixture app with no fractal suffix, and a block under its
  `src/components/ui/` whose folder is not PascalCase
- **WHEN** ESLint lints them
- **THEN** `check-file/filename-naming-convention` reports the first and
  `check-file/folder-naming-convention` the second, at error
- **Test:** `eslint-local-rules/eslint-config.cases.mjs` › "a new app inherits the filename and folder rules"

#### Scenario: the styling pillar

- **GIVEN** a screen style of the fixture app holding a palette colour, and a screen helper that
  re-exports `tailwind-variants`
- **WHEN** ESLint lints them
- **THEN** `local/style-positions-only` and `local/style-token-values` report the colour and
  `local/ui-kit-boundary` the re-export, at error
- **Test:** `eslint-local-rules/eslint-config.cases.mjs` › "a new app inherits the styling pillar"

#### Scenario: the logic-in-hook rules

- **GIVEN** a component of the fixture app that calls `useEffect`
- **WHEN** ESLint lints it
- **THEN** `no-restricted-syntax` reports it at error, and nothing else
- **Test:** `eslint-local-rules/eslint-config.cases.mjs` › "a new app inherits the logic-in-hook rules"

#### Scenario: the suffix contract

- **GIVEN** a component of the fixture app that declares a top-level SCREAMING_SNAKE const
- **WHEN** ESLint lints it
- **THEN** `local/suffix-contract` reports it at error, and nothing else
- **Test:** `eslint-local-rules/eslint-config.cases.mjs` › "a new app inherits the suffix contract"

#### Scenario: the dependency seam

- **GIVEN** the seam files of the fixture app
- **WHEN** ESLint lints them
- **THEN** an unregistered package and a registered package outside its seam are reported at
  error, and its seam files report nothing
- **Test:** `eslint-local-rules/dependency-seam.cases.mjs` › "a new app under apps/ inherits the rule with no config change"

#### Scenario: no block names an app

- **GIVEN** `eslint.config.mjs`, `eslint.rules.mjs`, `scripts/eslint-config.detect.mjs` and the
  detection modules under `eslint-local-rules/`
- **WHEN** their text is read
- **THEN** none names a folder under `apps/`
- **Test:** `eslint-local-rules/eslint-config.cases.mjs` › "no ESLint config or rule names an app"

### Requirement: SEAM-10 — What a workspace's framework forces follows what it declares

The ESLint config SHALL read the `package.json` of every folder under `apps/` and `packages/`
once, when it loads, and apply the React rule set (the JSX parser, the browser globals, the React
plugins and rules) to every app and every package that declares `react`, the Next.js block (the
`@next/next` rules, the Node globals, the App Router and middleware file names, the async server
screens and the generated `next-env.d.ts`) to every app that declares `next`, and the Expo block
(the `expo` rules, the React Native globals and accessibility relaxations, the Expo Router file
names) to every app that declares `expo`, a package named in any dependency field being declared;
a package that declares no `react`, `packages/tokens` among them, gets the Node globals of every
package and no React rule or browser global; a folder with no `package.json` is no workspace, and
a `package.json` that cannot be parsed, or is not a JSON object, fails the config load, naming
the file.

**Evidence:** `scripts/eslint-config.detect.mjs:51-60`, `scripts/eslint-config.detect.mjs:68-92`,
`scripts/eslint-config.detect.mjs:96-106`, `scripts/eslint-config.detect.mjs:116-143`,
`eslint.config.mjs:142-153`, `eslint.config.mjs:159-176`, `eslint.config.mjs:181-207`,
`eslint.config.mjs:218-233`, `eslint.config.mjs:240`, `eslint.config.mjs:272-275`,
`eslint.config.mjs:320-322`, `eslint.config.mjs:359`

#### Scenario: an app that declares next

- **GIVEN** the fixture app `eslint-local-rules/__fixtures__/apps/fixture-next/`, whose
  `package.json` declares `next` and `react`, with a route `src/app/page.tsx`, an `async` screen
  and a screen that renders `<img>` with a dynamic `process.env` key
- **WHEN** ESLint lints them through the config built for the fixture's folder
- **THEN** `@next/next/no-img-element` reports the `<img>`, and nothing else is reported: the route
  keeps its name and the screen may be `async`
- **Test:** `eslint-local-rules/eslint-config.cases.mjs` › "an app that declares next gets the Next.js block"

#### Scenario: an app that declares expo

- **GIVEN** the fixture app `eslint-local-rules/__fixtures__/apps/fixture-expo/`, whose
  `package.json` declares `expo` and `react`, with the same three files
- **WHEN** ESLint lints them through the config built for the fixture's folder
- **THEN** `expo/no-dynamic-env-var` reports the dynamic key at error, the `async` screen is
  refused, and the route keeps its name
- **Test:** `eslint-local-rules/eslint-config.cases.mjs` › "an app that declares expo gets the Expo block"

#### Scenario: an app that declares neither

- **GIVEN** the fixture app `eslint-local-rules/__fixtures__/apps/fixture/`, whose `package.json`
  declares `react` and neither `next` nor `expo`, with the same three files
- **WHEN** ESLint lints them through the config built for the fixture's folder
- **THEN** the route's name and the `async` screen are refused, and no `@next/next` or `expo` rule
  reports
- **Test:** `eslint-local-rules/eslint-config.cases.mjs` › "an app that declares neither next nor expo gets no framework block"

#### Scenario: a package that declares react

- **GIVEN** the fixture package `eslint-local-rules/__fixtures__/packages/fixture-react/`, whose
  `package.json` declares `react`, with a component whose JSX props are not sorted
- **WHEN** ESLint lints it through the config built for the fixture's folder
- **THEN** `react/jsx-sort-props` reports it at error, and nothing else
- **Test:** `eslint-local-rules/eslint-config.cases.mjs` › "a package that declares react gets the React rules"

#### Scenario: a package that declares no react

- **GIVEN** `packages/tokens`, whose `package.json` declares no `react`
- **WHEN** the repository's ESLint config is computed for `packages/tokens/src/tokens.constant.ts`
- **THEN** it holds the Node globals, and no browser global, no JSX parser, no React, React
  Hooks or jsx-a11y plugin, and none of their rules on
- **Test:** `eslint-local-rules/eslint-config.cases.mjs` › "a package that declares no react, packages/tokens among them, gets the Node globals and no React rule"

#### Scenario: any dependency field, and a folder that is no app

- **GIVEN** a tree whose apps declare `next` in `devDependencies`, `react` in `peerDependencies` and
  `expo` in `optionalDependencies`, and a folder under `apps/` with no `package.json`
- **WHEN** the detection reads the tree
- **THEN** each app is listed under the framework it declares, and the folder under none
- **Test:** `eslint-local-rules/eslint-config.cases.mjs` › "a framework declared in any dependency field counts, and a folder with no package.json is no app"

#### Scenario: a package is listed under react only

- **GIVEN** a tree whose package `packages/ui` declares `react`, `next` and `expo`, and whose
  package `packages/plain` declares none
- **WHEN** the detection reads the tree
- **THEN** `packages/ui` is listed under `react` and under neither `next` nor `expo`, and
  `packages/plain` under none
- **Test:** `eslint-local-rules/eslint-config.cases.mjs` › "a package that declares react is listed under react, and never under next or expo"

#### Scenario: a package.json that cannot be parsed

- **GIVEN** a tree with `apps/broken/package.json` holding `{`
- **WHEN** the ESLint config is built for that tree
- **THEN** it throws, naming `apps/broken/package.json`
- **Test:** `eslint-local-rules/eslint-config.cases.mjs` › "an app package.json that cannot be parsed fails the config load, naming it"

#### Scenario: a package's package.json that cannot be parsed

- **GIVEN** a tree with `packages/broken/package.json` holding `{`
- **WHEN** the ESLint config is built for that tree
- **THEN** it throws, naming `packages/broken/package.json`
- **Test:** `eslint-local-rules/eslint-config.cases.mjs` › "a package package.json that cannot be parsed fails the config load, naming it"

#### Scenario: a package.json that is not an object

- **GIVEN** a tree with `apps/list/package.json` holding `[]`
- **WHEN** the ESLint config is built for that tree
- **THEN** it throws, naming `apps/list/package.json`
- **Test:** `eslint-local-rules/eslint-config.cases.mjs` › "an app package.json that is not a JSON object fails the config load, naming it"

### Requirement: SEAM-11 — A react-native primitive a ui block is named after passes only inside that block

`local/wrapped-import` SHALL read the folders of each app's `src/components/ui/` from disk, and
SHALL accept a name imported from `react-native` that one of those folders is named after only
in a file under that folder of the same app; a name no block of the file's app is named after
(`View`, `ScrollView`, `Pressable`) SHALL pass anywhere. A type-only import SHALL be judged the
same way, and the name judged SHALL be the one `react-native` exports, not the local alias.

**Evidence:** `eslint-local-rules/wrapped-import.detect.mjs:63-74`, `eslint-local-rules/wrapped-import.detect.mjs:227`, `eslint-local-rules/wrapped-import.detect.mjs:334-346`, `.agents/contracts/dependencies.json:48-51`

#### Scenario: outside its block

- **GIVEN** the mobile `Button` block, which imports `Text` from `react-native`, and the mobile
  `ui/Text` block on disk
- **WHEN** ESLint lints it
- **THEN** the import is reported, naming `Text` and the block that wraps it
- **Test:** `eslint-local-rules/wrapped-import.cases.mjs` › "a primitive a ui block is named after is refused outside that block"

#### Scenario: inside its block

- **GIVEN** the mobile `ui/Text` component file, which imports `Text` from `react-native`
- **WHEN** ESLint lints it
- **THEN** nothing is reported
- **Test:** `eslint-local-rules/wrapped-import.cases.mjs` › "a primitive passes inside the block named after it"

#### Scenario: a primitive no block is named after

- **GIVEN** a mobile screen that imports `Pressable`, `ScrollView` and `View` from `react-native`
- **WHEN** ESLint lints it
- **THEN** nothing is reported
- **Test:** `eslint-local-rules/wrapped-import.cases.mjs` › "a primitive no ui block is named after passes anywhere"

#### Scenario: every block named after a primitive wraps it

- **GIVEN** a mobile screen that imports `Button`, `Modal` and `StatusBar` from `react-native`
- **WHEN** ESLint lints it
- **THEN** each of the three is reported, naming its block
- **Test:** `eslint-local-rules/wrapped-import.cases.mjs` › "every primitive a ui block is named after is wrapped, the blocks that stand in for one included"

#### Scenario: a type-only import and an alias

- **GIVEN** a mobile screen with `import { type Text } from 'react-native'`, and another with
  `import { Text as Label } from 'react-native'`
- **WHEN** ESLint lints them
- **THEN** both are reported
- **Test:** `eslint-local-rules/wrapped-import.cases.mjs` › "a type-only import of a wrapped primitive is refused outside its block"
- **Test:** `eslint-local-rules/wrapped-import.cases.mjs` › "a wrapped primitive is judged by the name it is exported under"

#### Scenario: a block added later

- **GIVEN** a tree whose app `a` has the folder `src/components/ui/Switch/` and whose app `b` has
  none, each with a screen that imports `Switch` from `react-native`
- **WHEN** the detection reads both screens
- **THEN** the screen of `a` is reported, naming `Switch`, and the screen of `b` is not
- **Test:** `eslint-local-rules/wrapped-import.cases.mjs` › "a block added to an app's ui folder wraps its primitive in that app only"


### Requirement: SEAM-12 — An expo-router hook passes only inside lib/routing

`local/wrapped-import` SHALL accept a name imported from `expo-router` that is a hook (`use`
followed by a capital) or its `router` object only in a file under the `src/lib/routing/` of the
file's app; its layout components and its types SHALL pass anywhere.

**Evidence:** `eslint-local-rules/wrapped-import.detect.mjs:48-49`, `eslint-local-rules/wrapped-import.detect.mjs:348-358`, `.agents/contracts/dependencies.json:26-29`

#### Scenario: a hook outside lib/routing

- **GIVEN** a mobile screen hook that imports `useRouter` from `expo-router`
- **WHEN** ESLint lints it
- **THEN** the import is reported, naming `useRouter` and `src/lib/routing/`
- **Test:** `eslint-local-rules/wrapped-import.cases.mjs` › "an expo-router hook is refused outside lib/routing"

#### Scenario: a hook inside lib/routing

- **GIVEN** a file under `apps/mobile/src/lib/routing/` that imports `useLocalSearchParams` and
  `useRouter` from `expo-router`
- **WHEN** ESLint lints it
- **THEN** nothing is reported
- **Test:** `eslint-local-rules/wrapped-import.cases.mjs` › "an expo-router hook passes inside lib/routing"

#### Scenario: the router object

- **GIVEN** a mobile screen hook that imports `router` from `expo-router`
- **WHEN** ESLint lints it
- **THEN** the import is reported
- **Test:** `eslint-local-rules/wrapped-import.cases.mjs` › "the router object of expo-router is refused outside lib/routing"

#### Scenario: a layout component and a type

- **GIVEN** the mobile root layout importing `Link`, `Redirect`, `Slot`, `Stack` and `Tabs`, and
  the type `ErrorBoundaryProps`, from `expo-router`
- **WHEN** ESLint lints it
- **THEN** nothing is reported
- **Test:** `eslint-local-rules/wrapped-import.cases.mjs` › "an expo-router layout component or type passes anywhere"


### Requirement: SEAM-13 — Every way a file reaches a wrapped name is read

`local/wrapped-import` SHALL judge, besides the named imports of SEAM-11 and SEAM-12, every named
re-export, every key of the object a `vi.mock` or `vi.doMock` factory returns, and the names a
dynamic `import()` or a `require()` is read by: the keys of the object pattern it is destructured
into, or the one property read off it. It SHALL refuse a reach of the whole module where a name it
narrows would be refused: of `react-native` in an app with `ui/` blocks, of `expo-router` outside
`src/lib/routing/`. A reach of the whole module is a namespace import, `export *`,
`import x = require()`, a dynamic `import()` or `require()` with a literal specifier read any
other way, and a `vi.mock` or `vi.doMock` with no factory or one whose returned object it cannot
read.

**Evidence:** `eslint-local-rules/wrapped-import.detect.mjs:153-165`, `eslint-local-rules/wrapped-import.detect.mjs:173-206`, `eslint-local-rules/wrapped-import.detect.mjs:212-290`, `eslint-local-rules/wrapped-import.detect.mjs:364-386`

#### Scenario: a re-export

- **GIVEN** a barrel of the mobile app with `export { Text } from 'react-native'`
- **WHEN** ESLint lints it
- **THEN** the re-export is reported
- **Test:** `eslint-local-rules/wrapped-import.cases.mjs` › "a re-export of a wrapped name is refused outside its seam"

#### Scenario: a mock that replaces a wrapped name

- **GIVEN** a mobile screen test whose `vi.mock` of `react-native` returns a `Text`, and whose
  `vi.mock` of `expo-router` spreads the original module and returns a `useRouter`
- **WHEN** ESLint lints it
- **THEN** both mocks are reported
- **Test:** `eslint-local-rules/wrapped-import.cases.mjs` › "a vi.mock that replaces a wrapped name is refused outside its seam"

#### Scenario: a mock of names no wrapper owns

- **GIVEN** the mobile root layout test, whose `vi.mock` of `expo-router` returns a `Stack`
- **WHEN** ESLint lints it
- **THEN** nothing is reported
- **Test:** `eslint-local-rules/wrapped-import.cases.mjs` › "a vi.mock that replaces only names no wrapper owns passes"

#### Scenario: a dynamic import read by name

- **GIVEN** a mobile screen test that destructures `Text` from `await import('react-native')` and
  `useRouter` from `require('expo-router')`, and reads `router` off `await import('expo-router')`;
  and the theme config's test, which destructures `Appearance` from `await import('react-native')`
- **WHEN** ESLint lints them
- **THEN** the three names of the first are reported, and nothing in the second
- **Test:** `eslint-local-rules/wrapped-import.cases.mjs` › "a dynamic import or a require read by name is judged by those names"
- **Test:** `eslint-local-rules/wrapped-import.cases.mjs` › "a dynamic import read only for names no wrapper owns passes"

#### Scenario: the whole module

- **GIVEN** a mobile screen test with a namespace import of `react-native`, an `export *` of
  `expo-router`, a `vi.mock` of `expo-router` with no factory, a `require` of `expo-router` and a
  dynamic `import()` of `react-native`
- **WHEN** ESLint lints it
- **THEN** each of the five is reported as a reach of the whole module
- **Test:** `eslint-local-rules/wrapped-import.cases.mjs` › "a reach of the whole module is refused"


### Requirement: SEAM-14 — src/test is test infrastructure, and a test is judged by its path

`local/wrapped-import` SHALL accept any name in a file a `testInfrastructure` glob of
`.agents/contracts/dependencies.json` matches (`src/test/**`), and SHALL judge every other test
by its own path, as the unit beside it is judged: a test under a block's folder or under
`src/lib/routing/` is inside it, any other is not.

**Evidence:** `eslint-local-rules/wrapped-import.detect.mjs:399`, `eslint-local-rules/wrapped-import.detect.mjs:406`, `.agents/contracts/dependencies.json:3`

#### Scenario: test infrastructure

- **GIVEN** a helper under `apps/mobile/src/test/` that imports `Text` from `react-native` and
  `useRouter` from `expo-router`
- **WHEN** ESLint lints it
- **THEN** nothing is reported
- **Test:** `eslint-local-rules/wrapped-import.cases.mjs` › "test infrastructure under src/test passes any wrapped name"

#### Scenario: a test of another block

- **GIVEN** the async boundary's test, which imports `Text` from `react-native`
- **WHEN** ESLint lints it
- **THEN** the import is reported
- **Test:** `eslint-local-rules/wrapped-import.cases.mjs` › "a test outside the block is refused like the unit it tests"


### Requirement: SEAM-15 — The wrapped-import rule applies to every app and package by pattern

The ESLint config SHALL apply `local/wrapped-import` at `error` to every source file of `apps/*`
and `packages/*` by pattern, with the workspace root the config is built for, so an app added
under `apps/` is judged by its own `src/components/ui/` folders and its own `src/lib/routing/`
with no change to the config; a file outside `apps/*` and `packages/*` SHALL NOT be judged.

**Evidence:** `eslint.rules.mjs:691-698`, `eslint.config.mjs:375`, `eslint-local-rules/index.mjs:990-998`, `eslint-local-rules/index.mjs:1006-1010`

#### Scenario: a new app

- **GIVEN** the fixture app `eslint-local-rules/__fixtures__/apps/fixture-expo/` with a
  `src/components/ui/Text/` block and a `src/lib/routing/` hook that import `Text` and
  `useRouter`, and a screen that imports both
- **WHEN** ESLint lints the three files through the config built for the fixture's folder
- **THEN** only the screen is reported, once for each name
- **Test:** `eslint-local-rules/wrapped-import.cases.mjs` › "a new app under apps/ inherits the rule with its own ui blocks and lib/routing"

#### Scenario: a file outside apps and packages

- **GIVEN** a script under `scripts/` that imports `Text` from `react-native`
- **WHEN** ESLint lints it with the rule
- **THEN** nothing is reported
- **Test:** `eslint-local-rules/wrapped-import.cases.mjs` › "a file outside apps and packages is not judged"


### Requirement: SEAM-16 — The registry declares the migrations that are open

The dependency registry `.agents/contracts/dependencies.json` SHALL declare, in an optional
`openMigrations`, the migrations still open, each an object with a text `id` no other declaration
repeats, a text `note` and no other key; a registry without the field SHALL declare none, and the
template's declares none. `pnpm verify:dependency-seams` SHALL refuse a declaration that breaks
this shape as a malformed registry, judging nothing else against it, and SHALL fail a declared
migration that no entry of `eslint-dependency-seam-allowlist.json` names, as stale, to be closed by
removing it; while the allowlist cannot be read, it SHALL call no migration stale.

**Evidence:** `.agents/contracts/dependencies.json:678`,
`eslint-local-rules/dependency-seam.detect.mjs:155-166`,
`eslint-local-rules/dependency-seam.detect.mjs:183`, `scripts/dependency-seams.detect.mjs:49-55`,
`scripts/dependency-seams.detect.mjs:146-181`, `scripts/dependency-seams.detect.mjs:195`,
`scripts/dependency-seams.detect.mjs:411-426`, `scripts/dependency-seams.detect.mjs:452-453`,
`scripts/dependency-seams.detect.mjs:472`

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
