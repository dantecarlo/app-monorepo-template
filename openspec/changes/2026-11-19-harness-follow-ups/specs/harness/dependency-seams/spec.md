# Delta: harness/dependency-seams

> **Change:** `2026-11-19-harness-follow-ups`

## MODIFIED Requirements

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

#### Scenario: a package.json that cannot be read

- **GIVEN** an app `package.json` holding `{`, the only manifest that declares `zod`
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

#### Scenario: a registry the gate refuses

- **GIVEN** a registry whose `zod` entry names no seam, with a screen importing `zod`, and then a
  registry that is JSON `null`
- **WHEN** `node scripts/verify-dependency-seams.mjs --root <tree>` runs over each
- **THEN** it exits 1 naming the registry, prints that no file-package pair was judged, and never
  crashes
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "the gate counts no file-package pair against a registry it refuses"

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

**Evidence:** written at apply time, when the code exists.

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
- **THEN** it holds the Node globals, and no browser global, no JSX parser and no React,
  React Hooks or jsx-a11y plugin or rule
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
