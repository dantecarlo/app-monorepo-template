# ADR 0002 — Every library behind an adapter

- Status: Accepted
- Date: 2026-11-18
- Deciders: The owner (decisions 51, 52 and 58 of `docs/INIT_AND_HARNESS_PLAN.md`), template
  maintainers

## Context

The owner, 2026-11-15 (translated from Spanish): "every package that is not core must be
decoupled and have an adapter, in ui as a wrapper for example, and so think a strategy for each
one; currently the Certifipago project already more or less does it, but evaluate and analyze
and put it in the plan".

ADR 0001 put the providers (the backend, observability, edge security) behind ports. Every other
library was imported where it was used: when F.8 started, `no-restricted-imports` guarded only
three vendor scopes, the backend's, the payments' and the error monitor's, so nothing guarded the
i18n, query, state, UI or Expo packages, and the rule froze 143 imports outside the seam each
package was given. A library
imported from a hundred files cannot be replaced; one imported from its wrapper can.

**Certifipago, evaluated.** Certifipago already did much of it, so the template read it first.

- What works there: `local/view-import-boundary` fails closed on an unknown package in a view;
  a category of packages only `ui/` imports; wrapper detection that reads the `ui/` blocks from
  disk; the raw TanStack hooks banned; one `lib/` adapter per Expo capability; a name-registry
  `Icon`; and the seam mocks kept in one place.
- What is missing there, and what the template closed:

| Gap in Certifipago                                                                                                   | Closed in the template                                                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The boundary covers views only, so hooks, services, stores and packages escape it                                    | `local/dependency-seam` judges every file of `apps/*` and `packages/*`                                                                                                                                         |
| `next-intl`, `react-i18next`, `expo-*` and `react-native-*` pass as platform, so about 200 files import i18n directly | each has its own entry and seam: the i18n runtimes behind `src/lib/i18n/`; the `expo-*` and `react-native-*` packages behind `lib/bootstrap`, `lib/i18n`, `lib/storage` or a `ui/` block (`ui/Gradient`, `ui/StatusBar`, `ui/AuthShell`); the wrapped `react-native` primitives behind their block |
| Type-only imports are exempt                                                                                         | a type-only import is judged like any other                                                                                                                                                                    |
| No single registry and no `package.json` check                                                                       | `.agents/contracts/dependencies.json`, held to every `package.json` by `pnpm verify:dependency-seams`                                                                                                          |
| Tests mock the vendors                                                                                               | a test mocks the project module (item 6 below)                                                                                                                                                                 |

## Decision

**Decision 51: every library outside the core stack sits behind one adapter of the template.**
The core stack is the language, the framework runtime and the workspace's own `@app/*` packages.
A UI kit is wrapped in `components/ui`, a vendor SDK sits behind a port and a `*.adapter.ts`, and
an infrastructure library behind a `src/lib` wrapper. The rest of the code imports only the
template's module, so replacing a library rewrites its adapter.

**Decision 52: one rule set for every app.** Every rule below applies to `apps/*` and
`packages/*` by pattern, so an app added later inherits it with no change to `eslint.config.mjs`;
the fixture apps of `eslint-local-rules/__fixtures__/apps/` prove it.

**Decision 58, as the F.8 section of the plan records it:** the class dialect of Tailwind and
NativeWind is core; type-only imports are governed too; the `react-native` primitives that have a
wrapper, and the `expo-router` hooks, go through `ui/` and `lib/routing`; one i18n API for both
apps (`IAppTranslator` in `@app/i18n`); zod schemas stay per app until one is shared; the apps
drop the `@supabase/*` dependencies they never import; and a new dependency fails closed at once.

They are held by:

1. **One registry.** `.agents/contracts/dependencies.json` is the one answer to "where may this
   be imported": one entry per package, or package subpath, that a `package.json` declares or
   source imports, 100 today. Each has its category (`core`, `infra`, `ui`, `vendor`,
   `vendor-package`, `build` or `peer`) and, for every category but `core`, its seam: the
   repository globs of the files that may import it. The most specific entry wins
   (`next/navigation` before `next`); no entry sets `"types": "anywhere"`, so a type-only import
   needs the seam too; and `{apps,packages}/*/src/test/**` is the test infrastructure, which may
   import any registered package.
2. **`local/dependency-seam` judges the package**
   (`eslint-local-rules/dependency-seam.detect.mjs`, at `error` over `apps/*/**` and
   `packages/*/**`). It reads static and dynamic imports, re-exports, `require`, `import()` types
   and the `vi.mock` family, type-only imports included. A registered package passes only inside
   its seam; an unregistered one fails, closed. A test inherits the seam of the unit it tests.
3. **`local/wrapped-import` judges the names a wrapper owns**, of two core packages
   (`eslint-local-rules/wrapped-import.detect.mjs`, at `error` over the same pattern). A
   `react-native` primitive a `ui/` block is named after passes only under that block's folder:
   on mobile today `Text`, `Modal`, `Button` and `StatusBar`. The blocks are read from each app's
   `src/components/ui/` on disk, so a block added later covers its primitive with no list to edit.
   An `expo-router` hook, every `use…` name, and its `router` object pass only under the app's
   `src/lib/routing/`. A reach of the whole module (a namespace import, `export *`, a `vi.mock`
   with no factory) is refused where a narrowed name would be.
4. **`pnpm verify:dependency-seams` holds the registry to the workspace**, inside `validate`:
   every dependency of every `package.json` registered, no stale entry, every seam glob matching
   a file, the configs ESLint ignores importing inside their seams, and the allowlist holding
   exactly the imports that still break the rule, each under a migration the registry declares
   open.
5. **The allowlist only shrinks, and ships empty.** `eslint-dependency-seam-allowlist.json` froze
   the 143 imports that broke the rule when it landed, each naming the F.8 unit that removed it.
   Units 2 to 7 moved every one, and it has held 0 entries since unit 7. Since F59 an entry counts
   only while its `migration` is the id of a migration the registry declares open
   (`openMigrations`, each `{ id, note }`), for the rule and the gate alike. The template declares
   none, so the gate refuses every entry; it also fails an entry whose import is gone and an open
   migration no entry names. A derived project with imports still to move declares its
   migrations and lists the imports under them; only review refuses a new entry for a new import
   under a migration still open, so a new library is wrapped (the `lib` skill), never listed.
6. **A test mocks the project module, never the vendor.** Only the wrapper's own test, which
   inherits its seam, reaches the vendor. Every other test mocks `@/lib/*` or
   `@/components/ui/*`, or renders through the app's test helpers: `createRoutingDouble` of
   `apps/web/src/test/routing.helper.ts`, `createQueryWrapper` of each app's
   `src/test/query.helper.tsx`, and `renderWithIntl` and `renderWithI18n` with the real catalogs.
   A test that mocks a vendor its unit's seam does not admit fails the rule like any other file.

The seams F.8 left in place include `lib/i18n`, `lib/query`, `lib/store`, `lib/storage`,
`lib/theme`, `lib/bootstrap`, `lib/routing`, `lib/cache`, `lib/supabase` and
`lib/observability`; the `ui/` blocks; and the opaque `BackendClientType` of `@app/supabase`,
which only `packages/supabase/src/backendClient.adapter.ts` turns back into the SDK client. The
registry names every seam, and `docs/code-standards.md` §23 states how each one is used.

### What stays out

- **The core stack:** `react`, `react-dom`, `next`, `react-native`, `expo`, `expo-router`,
  `typescript`, `@app/core`, `@app/i18n` and `@app/tokens`, imported anywhere, apart from what is
  narrowed above (`next/navigation`, `next/cache` and `next/image`; the wrapped primitives; the
  `expo-router` hooks). The class dialect is core too: a class string is no import.
- **Layout primitives:** `View`, `ScrollView`, `Pressable`, `TextInput` and every other
  `react-native` primitive no `ui/` block is named after, and the `expo-router` layout components
  (`Stack`, `Tabs`, `Slot`, `Redirect`, `Link`) and its types.
- **The names no rule reads yet**, the `NOT covered` clause of `pnpm verify:dependency-seams`: a
  name imported from a package `local/wrapped-import` does not narrow (`Pressable` and
  `TextInput`, which no `ui/` block is named after; a block that stands in for a primitive under
  another name, such as `ui/Toggle` for `Switch`); a specifier that is not a literal;
  triple-slash type references and `declare module` augmentations; imports in CSS and in JSON
  (an Expo plugin); a subpath entry no file imports any longer; a type a wrapper re-exports; and
  whether a seam is the right one, or a frozen import should have been frozen at all, which review
  reads. A raw HTML element a web `ui/` block wraps (`<button>`) is no import either
  (`docs/code-standards.md` §22).

## Consequences

- Replacing a library rewrites the files its seam names and nothing else. The `lib` skill
  (`.claude/skills/lib/SKILL.md`) is the one procedure for wrapping one: register the package
  and its seam, write the adapter or the `ui/` block under a project-owned API and types, mock the
  project module in tests, and never add an allowlist entry.
- A wrapper exposes what its callers use and owns its types. A need nobody has yet (the
  pathname, `redirect`, `revalidateTag`) joins the wrapper with its first caller; the mobile
  `src/lib/routing/` holds no module because the app calls no `expo-router` hook.
- A new dependency is registered in the change that adds it, or `validate` fails at once. That is
  the cost decision 58 accepts: an import nobody planned is a lint error, not a review comment.
- The providers of ADR 0001 stay behind their ports; in this registry they are the `vendor` and
  `vendor-package` entries.
- Certifipago adopts the registry, the two rules and the gate through the Template → Certifipago
  parity ledger of `docs/INIT_AND_HARNESS_PLAN.md`, carried by the Arquitecto's adoption program.
