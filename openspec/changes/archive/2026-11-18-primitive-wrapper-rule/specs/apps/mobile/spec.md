# Delta: apps/mobile

> **Change:** `2026-11-18-primitive-wrapper-rule`

## ADDED Requirements

### Requirement: MOBILE-77 — The Text block takes the classes and the role a block sets

The `Text` block of `src/components/ui/Text/` SHALL hand the native text the NativeWind classes
(`className`) and the accessibility role (`accessibilityRole`) it is given, beside its variant,
its style and its line limit as before; without them it SHALL hand the native text neither.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a role

- **GIVEN** the `Text` block with the accessibility role `header`
- **WHEN** it renders
- **THEN** the text it draws carries the role `header`
- **Test:** `apps/mobile/src/components/ui/Text/__tests__/Text.component.test.tsx` › "hands its accessibility role to the native text"

#### Scenario: classes

- **GIVEN** the `Text` block with the classes `font-bold text-accent-ink`, and another with none
- **WHEN** each renders
- **THEN** the first native text receives those classes, and the second receives no `className`
- **Test:** `apps/mobile/src/components/ui/Text/__tests__/Text.component.test.tsx` › "hands the classes a block sets to the native text"

#### Scenario: a block marks its title as a header

- **GIVEN** the screen header and the auth shell, each with a title
- **WHEN** each renders
- **THEN** its title is the one text with the role `header`
- **Test:** `apps/mobile/src/components/ui/ScreenHeader/__tests__/ScreenHeader.component.test.tsx` › "marks its title as a header"
- **Test:** `apps/mobile/src/components/ui/AuthShell/__tests__/AuthShell.component.test.tsx` › "marks its title as a header"

### Requirement: MOBILE-78 — Every text renders through the Text block

The mobile app SHALL render every text of a block, a screen or a test through the `Text` block;
only files under `src/components/ui/Text/`, and the test infrastructure under `src/test/`, SHALL
import `Text` from `react-native`. The same SHALL hold for every `react-native` primitive a block
of `src/components/ui/` is named after: `Modal` is imported only under `src/components/ui/Modal/`,
and `Button` and `StatusBar` of `react-native` by no file.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the blocks keep the text they show

- **GIVEN** the sign-in screen, the items dashboard, the error, empty and offline states and the
  confirmation dialog, rendered in both languages
- **WHEN** their visible text is read
- **THEN** it is the text recorded at the base of the i18n seam
- **Test:** `apps/mobile/src/test/__tests__/i18n.helper.test.tsx` › "every sample shows the messages it showed at the base, in both languages"

#### Scenario: a block's text keeps its behaviour

- **GIVEN** a toast, a busy button and an async boundary whose child throws, each rendering its
  text through the `Text` block
- **WHEN** the toast's dismiss control is pressed, the button renders, and the boundary resets
- **THEN** the toast goes, the busy indicator is labelled in the active language, and the
  boundary shows its fallback with the thrown error and then its children again
- **Test:** `apps/mobile/src/components/ui/Toast/__tests__/Toast.component.test.tsx` › "removes a toast when its dismiss control is pressed"
- **Test:** `apps/mobile/src/components/ui/Button/__tests__/Button.component.test.tsx` › "labels its busy indicator in the active language"
- **Test:** `apps/mobile/src/components/ui/AsyncBoundary/__tests__/AsyncBoundary.component.test.tsx` › "renders its error fallback with the thrown error, and its children again after a reset"

#### Scenario: the native text receives what it received before

- **GIVEN** every block that renders text, in its variants, in both themes
- **WHEN** it renders before and after its text moves onto the `Text` block
- **THEN** every native text receives the same classes, role, line limit, flattened style and
  children, and the markup is the same
- **Test:** Not covered — a one-off record, in the verify report: no committed test may stand in
  for `react-native`'s `Text` outside the `Text` block (SEAM-13)

#### Scenario: a file outside the Text block imports react-native's Text

- **GIVEN** a block, a screen or a test outside `src/components/ui/Text/` that imports or mocks
  `Text` of `react-native`
- **WHEN** ESLint runs
- **THEN** the import is reported, naming the `Text` block
- **Test:** Not covered — no test of this app reads its imports; `local/wrapped-import` refuses
  such an import (harness/dependency-seams SEAM-11, SEAM-13), inside `pnpm validate`

### Requirement: MOBILE-79 — The expo-router hooks go through lib/routing

The mobile app SHALL call an `expo-router` hook, or its `router` object, only from
`src/lib/routing/`, under the app's own types, as the web's `useAppRouter` does; its routes SHALL
use `expo-router`'s layout components and types directly. The app calls no hook today, so
`src/lib/routing/` holds no module: the root layout renders `Stack`, and the root error boundary
is typed by `ErrorBoundaryProps`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the root layout uses expo-router directly

- **GIVEN** the root layout, with `expo-router`'s `Stack` replaced by a stand-in in its test
- **WHEN** it renders before the bootstrap is ready, and its `ErrorBoundary` export is read
- **THEN** it renders no route, and its `ErrorBoundary` is the root error boundary
- **Test:** `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "renders no route until the bootstrap is ready"
- **Test:** `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "exports the root error boundary as its ErrorBoundary"

#### Scenario: a file outside lib/routing calls a hook

- **GIVEN** a screen, a hook or a block that imports `useRouter`, `useLocalSearchParams` or
  `router` from `expo-router`
- **WHEN** ESLint runs
- **THEN** the import is reported, naming `src/lib/routing/`
- **Test:** Not covered — no test of this app reads its imports; `local/wrapped-import` refuses
  such an import (harness/dependency-seams SEAM-12), inside `pnpm validate`
