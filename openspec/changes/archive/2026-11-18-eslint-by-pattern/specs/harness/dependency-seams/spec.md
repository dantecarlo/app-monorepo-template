# Delta: harness/dependency-seams

> **Change:** `2026-11-18-eslint-by-pattern`

## ADDED Requirements

### Requirement: SEAM-10 — What an app's framework forces follows what it declares

The ESLint config SHALL read the `package.json` of every folder under `apps/` once, when it loads,
and apply the React rule set to every app that declares `react`, the Next.js block (the
`@next/next` rules, the Node globals, the App Router and middleware file names, the async server
screens and the generated `next-env.d.ts`) to every app that declares `next`, and the Expo block
(the `expo` rules, the React Native globals and accessibility relaxations, the Expo Router file
names) to every app that declares `expo`, a package named in any dependency field being declared;
a folder with no `package.json` is no app, and a `package.json` that cannot be parsed fails the
config load, naming the file.

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

## MODIFIED Requirements

### Requirement: SEAM-09 — A new app inherits every shared rule by pattern

The ESLint config SHALL apply every rule set more than one workspace shares by pattern, never by
naming a workspace: the base rules and the filename suffix rules to every TypeScript file of
`apps/*/**` and `packages/*/**`; the casing of `src/components/ui/` folders and the styling pillar
to every app; the fractal, logic-in-hook, suffix-contract and test overrides to every file of their
suffix; and `local/dependency-seam` at `error` to every JavaScript and TypeScript file of
`apps/*/**` and `packages/*/**`; each block registering the plugins it needs, so an app added under
`apps/` is judged by every shared rule with no config change.

**Evidence:** written at apply time, when the code exists.

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
