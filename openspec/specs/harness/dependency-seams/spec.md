# harness/dependency-seams — living spec

> **Governs:** `.agents/contracts/dependencies.json`, `eslint-dependency-seam-allowlist.json`, `eslint-local-rules/dependency-seam.detect.mjs`, `scripts/dependency-seams.detect.mjs`, `scripts/eslint-config.detect.mjs`, `scripts/verify-dependency-seams.mjs`, `eslint.config.mjs`, `eslint.rules.mjs`
> **ID prefix:** `SEAM`
> **Derived from:** `docs/code-standards.md`, `docs/INIT_AND_HARNESS_PLAN.md`
> **Verified against the code:** 2026-11-18 at `d990d11`

## Purpose

The dependency-seam unit of the harness answers, in one file, which file of the workspace may
import which package (decisions 51, 52 and 58). It owns the registry of every declared or
imported package with its category and seam, the detection `local/dependency-seam` runs over
every app and package by pattern, the frozen allowlist of the imports that broke the rule when it
landed, and the gate that holds the registry to the `package.json` files, the seams to the files,
the configs ESLint ignores to their seams and the allowlist to the source. Moving an import into
its seam belongs to the later F.8 units, and the names imported from a package (the primitive
wrappers) to F.8 unit 8. Since F.8 unit 1b it also owns how the ESLint config reaches a new app:
every shared rule set by pattern, and each framework's block by what an app's `package.json`
declares (SEAM-09, SEAM-10); the other lint rules themselves are not part of this unit.

## Requirements

### Requirement: SEAM-01 — One registry entry per dependency, with its category and seam

The dependency registry `.agents/contracts/dependencies.json` SHALL hold one entry per package or
package subpath, each with a category among `core`, `infra`, `ui`, `vendor`, `vendor-package`,
`build` and `peer`, a seam of repository globs for every non-core entry, no seam for a core
entry, and `types` either `seam` (the default) or `anywhere`; `pnpm verify:dependency-seams`
refuses an entry that breaks this shape and a name listed twice.

**Evidence:** `.agents/contracts/dependencies.json:3-4`, `scripts/dependency-seams.detect.mjs:91-126`,
`scripts/dependency-seams.detect.mjs:131-155`, `scripts/dependency-seams.detect.mjs:352-355`

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

**Evidence:** `eslint-local-rules/dependency-seam.detect.mjs:138-145`,
`eslint-local-rules/dependency-seam.detect.mjs:172-183`,
`eslint-local-rules/dependency-seam.detect.mjs:188-194`, `eslint-local-rules/index.mjs:914-958`

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

**Evidence:** `eslint-local-rules/dependency-seam.detect.mjs:195-201`, `.agents/contracts/dependencies.json:112-114`

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

**Evidence:** `eslint-local-rules/dependency-seam.detect.mjs:78-85`,
`eslint-local-rules/dependency-seam.detect.mjs:247-291`,
`eslint-local-rules/dependency-seam.detect.mjs:304-319`

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

**Evidence:** `eslint-local-rules/dependency-seam.detect.mjs:172-183`, `.agents/contracts/dependencies.json:55-58`

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

**Evidence:** `eslint-local-rules/dependency-seam.detect.mjs:106-122`,
`eslint-local-rules/dependency-seam.detect.mjs:196`, `eslint-local-rules/dependency-seam.detect.mjs:198-201`,
`.agents/contracts/dependencies.json:3`

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

**Evidence:** `eslint-local-rules/dependency-seam.detect.mjs:207-211`,
`eslint-local-rules/dependency-seam.detect.mjs:323-341`, `scripts/dependency-seams.detect.mjs:56`,
`scripts/dependency-seams.detect.mjs:260-272`, `scripts/dependency-seams.detect.mjs:279-335`,
`eslint-dependency-seam-allowlist.json:1`

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

**Evidence:** `scripts/dependency-seams.detect.mjs:167-178`, `scripts/dependency-seams.detect.mjs:180-191`,
`scripts/dependency-seams.detect.mjs:193-214`, `scripts/dependency-seams.detect.mjs:248-258`,
`scripts/verify-dependency-seams.mjs:114-119`, `scripts/verify-dependency-seams.mjs:188-198`,
`scripts/eslint-config.detect.mjs:37-56`

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

### Requirement: SEAM-09 — A new app inherits every shared rule by pattern

The ESLint config SHALL apply every rule set more than one workspace shares by pattern, never by
naming a workspace: the base rules and the filename suffix rules to every TypeScript file of
`apps/*/**` and `packages/*/**`; the casing of `src/components/ui/` folders and the styling pillar
to every app; the fractal, logic-in-hook, suffix-contract and test overrides to every file of their
suffix; and `local/dependency-seam` at `error` to every JavaScript and TypeScript file of
`apps/*/**` and `packages/*/**`; each block registering the plugins it needs, so an app added under
`apps/` is judged by every shared rule with no config change.

**Evidence:** `eslint.config.mjs:257-266`, `eslint.config.mjs:324-327`, `eslint.config.mjs:366-386`,
`eslint.rules.mjs:335-340`, `eslint.rules.mjs:673-689`, `eslint-local-rules/style-positioning.detect.mjs:310-314`,
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

### Requirement: SEAM-10 — What an app's framework forces follows what it declares

The ESLint config SHALL read the `package.json` of every folder under `apps/` once, when it loads,
and apply the React rule set to every app that declares `react`, the Next.js block (the
`@next/next` rules, the Node globals, the App Router and middleware file names, the async server
screens and the generated `next-env.d.ts`) to every app that declares `next`, and the Expo block
(the `expo` rules, the React Native globals and accessibility relaxations, the Expo Router file
names) to every app that declares `expo`, a package named in any dependency field being declared;
a folder with no `package.json` is no app, and a `package.json` that cannot be parsed fails the
config load, naming the file.

**Evidence:** `scripts/eslint-config.detect.mjs:47-56`, `scripts/eslint-config.detect.mjs:63-76`,
`scripts/eslint-config.detect.mjs:80-111`, `eslint.config.mjs:140-231`, `eslint.config.mjs:235-238`,
`eslint.config.mjs:334-336`, `eslint.config.mjs:373`

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

#### Scenario: any dependency field, and a folder that is no app

- **GIVEN** a tree whose apps declare `next` in `devDependencies`, `react` in `peerDependencies` and
  `expo` in `optionalDependencies`, and a folder under `apps/` with no `package.json`
- **WHEN** the detection reads the tree
- **THEN** each app is listed under the framework it declares, and the folder under none
- **Test:** `eslint-local-rules/eslint-config.cases.mjs` › "a framework declared in any dependency field counts, and a folder with no package.json is no app"

#### Scenario: a package.json that cannot be parsed

- **GIVEN** a tree with `apps/broken/package.json` holding `{`
- **WHEN** the ESLint config is built for that tree
- **THEN** it throws, naming `apps/broken/package.json`
- **Test:** `eslint-local-rules/eslint-config.cases.mjs` › "an app package.json that cannot be parsed fails the config load, naming it"
