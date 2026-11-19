# Verify report: 2026-11-18-primitive-wrapper-rule

> **Verified:** 2026-11-18 at `48578da`

## Scenarios

Every test ran green in `ATL_TEMPLATE_SELF=1 pnpm validate` at `48578da` (exit 0): the lint-rule
suite 203 tests, the mobile suite 91 files and 278 tests, the web suite 133 files and 508 tests.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| SEAM-11 | outside its block | `eslint-local-rules/wrapped-import.cases.mjs` › "a primitive a ui block is named after is refused outside that block" | green |
| SEAM-11 | inside its block | `eslint-local-rules/wrapped-import.cases.mjs` › "a primitive passes inside the block named after it" | green |
| SEAM-11 | a primitive no block is named after | `eslint-local-rules/wrapped-import.cases.mjs` › "a primitive no ui block is named after passes anywhere" | green |
| SEAM-11 | every block named after a primitive wraps it | `eslint-local-rules/wrapped-import.cases.mjs` › "every primitive a ui block is named after is wrapped, the blocks that stand in for one included" | green |
| SEAM-11 | a type-only import and an alias | `eslint-local-rules/wrapped-import.cases.mjs` › "a type-only import of a wrapped primitive is refused outside its block" | green |
| SEAM-11 | a type-only import and an alias | `eslint-local-rules/wrapped-import.cases.mjs` › "a wrapped primitive is judged by the name it is exported under" | green |
| SEAM-11 | a block added later | `eslint-local-rules/wrapped-import.cases.mjs` › "a block added to an app's ui folder wraps its primitive in that app only" | green |
| SEAM-12 | a hook outside lib/routing | `eslint-local-rules/wrapped-import.cases.mjs` › "an expo-router hook is refused outside lib/routing" | green |
| SEAM-12 | a hook inside lib/routing | `eslint-local-rules/wrapped-import.cases.mjs` › "an expo-router hook passes inside lib/routing" | green |
| SEAM-12 | the router object | `eslint-local-rules/wrapped-import.cases.mjs` › "the router object of expo-router is refused outside lib/routing" | green |
| SEAM-12 | a layout component and a type | `eslint-local-rules/wrapped-import.cases.mjs` › "an expo-router layout component or type passes anywhere" | green |
| SEAM-13 | a re-export | `eslint-local-rules/wrapped-import.cases.mjs` › "a re-export of a wrapped name is refused outside its seam" | green |
| SEAM-13 | a mock that replaces a wrapped name | `eslint-local-rules/wrapped-import.cases.mjs` › "a vi.mock that replaces a wrapped name is refused outside its seam" | green |
| SEAM-13 | a mock of names no wrapper owns | `eslint-local-rules/wrapped-import.cases.mjs` › "a vi.mock that replaces only names no wrapper owns passes" | green |
| SEAM-13 | a dynamic import read by name | `eslint-local-rules/wrapped-import.cases.mjs` › "a dynamic import or a require read by name is judged by those names" | green |
| SEAM-13 | a dynamic import read by name | `eslint-local-rules/wrapped-import.cases.mjs` › "a dynamic import read only for names no wrapper owns passes" | green |
| SEAM-13 | the whole module | `eslint-local-rules/wrapped-import.cases.mjs` › "a reach of the whole module is refused" | green |
| SEAM-14 | test infrastructure | `eslint-local-rules/wrapped-import.cases.mjs` › "test infrastructure under src/test passes any wrapped name" | green |
| SEAM-14 | a test of another block | `eslint-local-rules/wrapped-import.cases.mjs` › "a test outside the block is refused like the unit it tests" | green |
| SEAM-15 | a new app | `eslint-local-rules/wrapped-import.cases.mjs` › "a new app under apps/ inherits the rule with its own ui blocks and lib/routing" | green |
| SEAM-15 | a file outside apps and packages | `eslint-local-rules/wrapped-import.cases.mjs` › "a file outside apps and packages is not judged" | green |
| MOBILE-77 | a role | `apps/mobile/src/components/ui/Text/__tests__/Text.component.test.tsx` › "hands its accessibility role to the native text" | green |
| MOBILE-77 | classes | `apps/mobile/src/components/ui/Text/__tests__/Text.component.test.tsx` › "hands the classes a block sets to the native text" | green |
| MOBILE-77 | a block marks its title as a header | `apps/mobile/src/components/ui/ScreenHeader/__tests__/ScreenHeader.component.test.tsx` › "marks its title as a header" | green |
| MOBILE-77 | a block marks its title as a header | `apps/mobile/src/components/ui/AuthShell/__tests__/AuthShell.component.test.tsx` › "marks its title as a header" | green |
| MOBILE-78 | the blocks keep the text they show | `apps/mobile/src/test/__tests__/i18n.helper.test.tsx` › "every sample shows the messages it showed at the base, in both languages" | green |
| MOBILE-78 | a block's text keeps its behaviour | `apps/mobile/src/components/ui/Toast/__tests__/Toast.component.test.tsx` › "removes a toast when its dismiss control is pressed" | green |
| MOBILE-78 | a block's text keeps its behaviour | `apps/mobile/src/components/ui/Button/__tests__/Button.component.test.tsx` › "labels its busy indicator in the active language" | green |
| MOBILE-78 | a block's text keeps its behaviour | `apps/mobile/src/components/ui/AsyncBoundary/__tests__/AsyncBoundary.component.test.tsx` › "renders its error fallback with the thrown error, and its children again after a reset" | green |
| MOBILE-78 | the native text receives what it received before | Not covered — the one-off record below | identical |
| MOBILE-78 | a file outside the Text block imports react-native's Text | Not covered — `local/wrapped-import` inside `pnpm validate` (0 findings over 950 files) | green gate |
| MOBILE-79 | the root layout uses expo-router directly | `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "renders no route until the bootstrap is ready" | green |
| MOBILE-79 | the root layout uses expo-router directly | `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "exports the root error boundary as its ErrorBoundary" | green |
| MOBILE-79 | a file outside lib/routing calls a hook | Not covered — `local/wrapped-import` inside `pnpm validate`; the app imports no hook | green gate |

### Red before green

| Task | Rule | Observed red |
| ---- | ---- | ------------ |
| T1 | a role | `TestingLibraryElementError: Unable to find an accessible element with the role "header"` |
| T1 | classes | `AssertionError: expected undefined to be 'font-bold text-accent-ink' // Object.is equality` |
| T3 | every rule case | `TypeError: Rule must be an object with a \`create\` method`: the suite ran before `local/wrapped-import` existed |
| T3 | a file outside the Text block imports react-native's Text | the base content (`6f5b899`) of the 23 migrated files, linted with the rule and the repository's config: 23 findings, one per file, `'Text' of react-native is wrapped by the Text block, and only that block's folder may import it` |
| T3 | a dynamic import read by name | the first version read every `import()` as the whole module, and linting the app reported `apps/mobile/src/lib/theme/__tests__/theme.config.test.ts:25`, `'react-native' is reached whole here`, for `const { Appearance } = await import('react-native')`; the rule now reads the destructured names, and the test is unchanged |

These tests passed on the base code and pin what the change keeps: "marks its title as a header"
of the screen header and the auth shell, and every existing block, screen and route test, whose
assertions are unchanged; the async boundary test renders its child through the `Text` block.

## No visible change

With `react-native`'s `Text` replaced by a recorder of every prop it receives (undefined props
dropped, the style flattened as React Native flattens it) and its `Modal` by a stand-in that shows
its children, 67 samples were rendered under the dark and the light theme: every variant of
`Avatar`, `Button` (with the loading and full-width cases), `Chip` (with and without its dot) and
`StatusBadge`, and the async boundary and its default error, `AuthField` (plain, and in error as a
password), `AuthShell`, `ConfirmDialog`, `Divider`, `EmptyState`, `ErrorState` (default, by code,
custom), `LanguageSwitcher`, `ListRow`, `Logo` (wordmark and asset), `Modal`, `NavBar`,
`OfflineBanner`, `ScreenHeader`, `SegmentedControl`, `SettingRow`, `SocialAuthButton`, two toasts
and the sign-in screen. **134 renders and 228 native texts**, each with its classes, role, line
limit, flattened style and children, and the markup of every render: recorded at the base
`6f5b899`, again at the base to prove the record deterministic, after T2 (`93fce2b`) and at
`48578da`. **The three later records are byte-identical to the base.**

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-18, at `48578da`; `report:spec-drift`
  listed 2 specs, apps/mobile and harness/dependency-seams, whose governed files this change
  touches and which the archive re-verifies.
- `pnpm --filter @app/mobile export:web`: exit 0 at `48578da`; `apps/mobile/dist-web` removed.
- `pnpm verify:dependency-seams`: PASS, 0 allowlist entries, 0 file-package pairs outside their
  seam; its `NOT covered` clause no longer names the `react-native` primitives and the
  `expo-router` hooks.
- ESLint over `apps/` and `packages/`, 950 files: 0 errors, `local/wrapped-import` included; the 26
  warnings (`single-object-params`, `no-inline-tailwind-classname`, `no-img-element`) are the
  base's.

## Not verified

- MOBILE-78 and MOBILE-79 have scenarios held by the lint rule, not by a test of the app:
  harness/dependency-seams SEAM-11 to SEAM-13 are their tests. The rendered-output record ran by a
  one-off test outside the repository, which may stand in for `react-native`'s `Text` only
  because it is never committed (SEAM-13).
- No device run: the bundle was exported for the web, not started on iOS or Android, so that
  NativeWind turns the classes `Button` and `Chip` hand `ui/Text` into the native text's style is
  read from NativeWind's contract (a component passes `className` down to a core component), not
  observed on a device.
- `expo-router` has no hook caller, so `apps/mobile/src/lib/routing/` holds no module and no
  routing test double was added; the first caller adds both.
- Raw HTML controls on web, out of scope: no file outside `apps/web/src/components/ui/` draws a
  `<button>`, `<input>`, `<img>`, `<select>`, `<textarea>` or `<dialog>`; inside it, 15 blocks draw
  one (AsyncBoundary, AuthField, Button, ConfirmDialog, IconButton, LanguageSwitcher, ListRow,
  Modal, NavBar, SearchBar, SegmentedControl, SettingRow, SocialAuthButton, Toast, Toggle), the
  web counterpart of the mobile `Pressable`, for a later unit.
