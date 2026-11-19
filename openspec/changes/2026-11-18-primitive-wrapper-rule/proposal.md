# Proposal: the names a wrapper owns, imported only by that wrapper

> **Status:** open

## Why

Decision 58 of `docs/INIT_AND_HARNESS_PLAN.md` sends the `react-native` primitives that have a
`ui/` wrapper through that wrapper and the `expo-router` hooks through `lib/routing`, but
`local/dependency-seam` judges a package, never the names imported from it: both packages are
`core`, so any file may import any of their names, and `pnpm verify:dependency-seams` says so in
its `NOT covered` clause ("the react-native primitives, the expo-router hooks"). The mobile app
shows the cost: `ui/Text` holds the app's typography, yet 21 other `ui/` blocks (22 files) and
one block test import `Text` from `react-native` and render it raw, so a swap of the text
primitive, or a rule for every text of the app, rewrites 23 files instead of one. Nothing stops a
screen from doing the same, or from calling `useRouter` of `expo-router` around `lib/routing`.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-15 (translated from Spanish): "every package that is not core must be decoupled and have
  an adapter, in ui as a wrapper for example, and so think a strategy for each one; currently the
  Certifipago project already more or less does it, but evaluate and analyze and put it in the
  plan"
- 2026-11-15 (translated from Spanish): "Not only the UI libraries, but all the libraries
  themselves."
- 2026-11-15 (translated from Spanish): "And something important, web and app have to be
  standardized, and any other project, that is, they have to always follow the same rules and
  centralize it if possible, because if later plain React is added for example it should follow
  the same rules"

## What changes

- **A rule for the names a wrapper owns, `local/wrapped-import`.** The name says what it judges:
  an import of a name that a project wrapper owns, which covers both halves of this unit, the
  primitives a `ui/` block wraps and the `expo-router` hooks `lib/routing` wraps; the hooks are no
  primitives, so `local/primitive-wrapper` would name half of it. Its detection,
  `eslint-local-rules/wrapped-import.detect.mjs`, reads the names a file imports, not only the
  package:
  - **A `react-native` primitive a `ui/` block is named after** passes only inside that block's
    folder. The blocks are read from disk, each app's `src/components/ui/` folders, as
    Certifipago's wrapper detection does, and not from a list in the registry: a block added later
    covers its primitive with no edit anywhere, and a block renamed or removed stops covering it at
    once, while a list goes stale silently the day a block is added and nobody adds its line.
    Today that is `Text`, `Modal`, `Button` and `StatusBar` on mobile: `ui/Text` and `ui/Modal`
    draw their primitive, `ui/Button` and `ui/StatusBar` stand in for it (on `Pressable`, on
    `expo-status-bar`). `View`, `ScrollView` and every primitive no block is named after stay
    direct; so do `Pressable` and `TextInput`, the examples the plan names, because no block wraps
    either one alone: 15 blocks press through `Pressable`, and `AuthField` and `SearchBar` both
    draw a `TextInput`.
  - **An `expo-router` hook**, every name of `use` and a capital, and its `router` object, which
    is `useRouter`'s navigation outside React, pass only inside the app's `src/lib/routing/`; its
    layout components (`Stack`, `Tabs`, `Slot`, `Redirect`, `Link`) and its types stay direct,
    because `expo-router` is core.
  - **What it reads**, as `local/dependency-seam` does: named imports and type-only imports
    (judged by the name the module exports, not a local alias), named re-exports and the keys of
    the object a `vi.mock` or `vi.doMock` factory returns. A reach of the whole module of one of
    the two packages, a namespace import, `export *`, `import x = require()`, a dynamic `import()`
    or `require()`, or a `vi.mock` with no factory or one whose result it cannot read, is refused
    where a narrowed name would be, so it fails closed. `src/test/**`, the registry's test
    infrastructure, passes any name.
  - **Applied by pattern** over `apps/*/**` and `packages/*/**`, with the workspace root the ESLint
    config is built for, so an app added later is judged by its own `ui/` blocks with no config
    change; a fixture app proves it.
- **`ui/Text` takes what the blocks set.** It hands the NativeWind classes (`className`) and the
  accessibility role (`accessibilityRole`) it is given to the native text, with its variant and
  style as before, so `Button` and `Chip` keep their label classes and `ScreenHeader` and
  `AuthShell` their header role.
- **Every text renders through `ui/Text`.** The 22 block files and the async boundary test that
  import `Text` from `react-native` render `@/components/ui/Text` instead, with the props they
  pass today.
  The rendered output stays the same, with its proof: every prop the native text receives and the
  markup of every block that renders text, in both themes, recorded at the base and after the
  migration.
- **No `lib/routing` module yet on mobile.** The app calls no `expo-router` hook (it renders
  `Stack` and types its route boundary with `ErrorBoundaryProps`), so the wrapper holds what the
  app calls, nothing: the rule keeps the seam, and the first hook a project needs is added there
  under the app's own types, as web's `useAppRouter` is.
- **The records.** The allowlist stays empty; the notes of `react-native` and `expo-router` in
  `.agents/contracts/dependencies.json` say which names the rule narrows (the `expo-router` one
  still names F.8 unit 6); the `NOT covered` clause of `pnpm verify:dependency-seams` stops naming
  what the rule now covers.
- **The docs.** The `component`, `modify`, `screen`, `lib` and `arch` skills, `docs/code-standards.md`
  § 21, § 22 and § 23, `docs/architecture/mobile.md` and `docs/maps/global-map.md`.

## Out of scope

- **Raw HTML elements on web that a `ui/` block wraps** (`<button>`, `<input>`): they are JSX
  intrinsics, not imports; the verify report lists what it finds, for a later unit.
- **`apps/web/**`**, which imports neither package.
- **A block for `Pressable` or `TextInput`.** Whether either should get one is a decision of its
  own; the rule covers it the day such a block exists.
- **A block that stands in for a primitive under another name** (`ui/Toggle` for `Switch`): no
  alias list is added, because none is needed today and a list is what goes stale.
- **`AGENTS.md`**, whose LAWs F.8 unit 9 updates; the verify report names the sentences this rule
  makes untrue.
- **The registry's shape.** The names the rule narrows live in its detection, not in new registry
  keys, because the gate's shape check (`scripts/dependency-seams.detect.mjs`) is not part of this
  change.

## Affected specs

- `openspec/specs/harness/dependency-seams/spec.md`: added SEAM-11, SEAM-12, SEAM-13, SEAM-14,
  SEAM-15.
- `openspec/specs/apps/mobile/spec.md`: added MOBILE-77, MOBILE-78, MOBILE-79.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
