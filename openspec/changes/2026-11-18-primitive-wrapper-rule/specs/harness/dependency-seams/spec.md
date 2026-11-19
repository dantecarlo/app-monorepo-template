# Delta: harness/dependency-seams

> **Change:** `2026-11-18-primitive-wrapper-rule`

## ADDED Requirements

### Requirement: SEAM-11 — A react-native primitive a ui block is named after passes only inside that block

`local/wrapped-import` SHALL read the folders of each app's `src/components/ui/` from disk, and
SHALL accept a name imported from `react-native` that one of those folders is named after only
in a file under that folder of the same app; a name no block of the file's app is named after
(`View`, `ScrollView`, `Pressable`) SHALL pass anywhere. A type-only import SHALL be judged the
same way, and the name judged SHALL be the one `react-native` exports, not the local alias.

**Evidence:** written at apply time, when the code exists.

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

**Evidence:** written at apply time, when the code exists.

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

**Evidence:** written at apply time, when the code exists.

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

**Evidence:** written at apply time, when the code exists.

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

**Evidence:** written at apply time, when the code exists.

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
