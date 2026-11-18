# Delta: apps/mobile

> **Change:** `2026-11-18-ui-seam-leaks`

## ADDED Requirements

### Requirement: MOBILE-70 — The async boundary takes a fallback typed by its own props

The mobile app SHALL type the error fallback an async boundary takes, and its default error
fallback, with the block's own `IAsyncBoundaryFallbackProps`, the thrown value and a function
that resets the boundary, so the block's public type names no type of `react-error-boundary`,
which only `src/components/ui/AsyncBoundary/AsyncBoundary.component.tsx` imports; when a child
throws, the boundary SHALL render that fallback with the thrown value, and its children again
once the fallback resets it.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a child throws and the fallback resets

- **GIVEN** an async boundary with an error fallback written against its own props, around a child
  that throws once
- **WHEN** it renders and the fallback resets it
- **THEN** the fallback shows the thrown error's message, and after the reset the child renders
- **Test:** `apps/mobile/src/components/ui/AsyncBoundary/__tests__/AsyncBoundary.component.test.tsx` › "renders its error fallback with the thrown error, and its children again after a reset"

#### Scenario: the fallback's type

- **GIVEN** the props of the async boundary
- **WHEN** the type of its error fallback is read
- **THEN** it is a component of `IAsyncBoundaryFallbackProps`, an unknown error and a reset that
  takes nothing
- **Test:** `apps/mobile/src/components/ui/AsyncBoundary/__tests__/AsyncBoundary.component.test.tsx` › "types its error fallback with its own props"

### Requirement: MOBILE-71 — Every gradient renders through the ui Gradient block

The mobile app SHALL paint every gradient through the `Gradient` block of
`src/components/ui/Gradient/`, which takes its colour stops and optionally a start and an end
point, a style, an accessibility label and children, and renders them through
`expo-linear-gradient`; the accent gradient, the loading skeleton's shimmer and the toggle's track
SHALL render it, and only `src/components/ui/Gradient/Gradient.component.tsx` SHALL import
`expo-linear-gradient`, tests included.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a gradient renders

- **GIVEN** the `Gradient` block with stops, a start and an end point, a style, a label and a child
- **WHEN** it renders
- **THEN** the gradient it draws receives those stops, points, style and label, and holds the
  child
- **Test:** `apps/mobile/src/components/ui/Gradient/__tests__/Gradient.component.test.tsx` › "hands its stops, its direction and its style to the gradient, behind its children"

#### Scenario: the blocks that paint a gradient

- **GIVEN** the accent gradient around content, a loading skeleton, and a toggle on and off
- **WHEN** each renders
- **THEN** the accent gradient paints the light accent to the accent behind the content, the
  skeleton sweeps its shimmer stops across itself, and the toggle paints its track with the accent
  gradient only while on
- **Test:** `apps/mobile/src/components/ui/AccentGradient/__tests__/AccentGradient.component.test.tsx` › "paints the accent gradient behind its children"
- **Test:** `apps/mobile/src/components/ui/LoadingSkeleton/__tests__/LoadingSkeleton.component.test.tsx` › "sweeps its shimmer gradient across the skeleton"
- **Test:** `apps/mobile/src/components/ui/Toggle/__tests__/Toggle.component.test.tsx` › "paints its track with the accent gradient only while on"

#### Scenario: a file outside the block imports the gradient

- **GIVEN** a component, screen or test outside the `Gradient` block that imports or mocks
  `expo-linear-gradient`
- **WHEN** ESLint and `pnpm verify:dependency-seams` run
- **THEN** the import is reported as outside its seam, and no allowlist entry excuses it
- **Test:** Not covered — no test of this app reads its imports; `local/dependency-seam` refuses
  such an import (harness/dependency-seams SEAM-03) and `pnpm verify:dependency-seams` fails an
  allowlist entry or a violation for it (SEAM-07), both inside `pnpm validate`

### Requirement: MOBILE-72 — The status bar renders through the ui StatusBar block

The mobile app SHALL set the status bar's glyphs through the `StatusBar` block of
`src/components/ui/StatusBar/`, whose style is its own `StatusBarStyleType`, dark or light, and
which renders it through `expo-status-bar`; the root layout SHALL render it with the style
`useRootTheme` derives (MOBILE-05), typed by that union, and only
`src/components/ui/StatusBar/StatusBar.component.tsx` SHALL import `expo-status-bar`, tests
included.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the block sets the glyphs

- **GIVEN** the `StatusBar` block with the dark and with the light style
- **WHEN** it renders
- **THEN** the status bar it draws receives that style
- **Test:** `apps/mobile/src/components/ui/StatusBar/__tests__/StatusBar.component.test.tsx` › "sets the status bar to the glyph style it is given"

#### Scenario: the block's own style type

- **GIVEN** the props of the `StatusBar` block
- **WHEN** the type of its style is read
- **THEN** it is `StatusBarStyleType`, the union of dark and light
- **Test:** `apps/mobile/src/components/ui/StatusBar/__tests__/StatusBar.component.test.tsx` › "takes its own glyph style"

#### Scenario: a file outside the block imports the status bar

- **GIVEN** a route, a theme file or a test outside the `StatusBar` block that imports or mocks
  `expo-status-bar`
- **WHEN** ESLint and `pnpm verify:dependency-seams` run
- **THEN** the import is reported as outside its seam, and no allowlist entry excuses it
- **Test:** Not covered — no test of this app reads its imports; `local/dependency-seam` refuses
  such an import (harness/dependency-seams SEAM-03) and `pnpm verify:dependency-seams` fails an
  allowlist entry or a violation for it (SEAM-07), both inside `pnpm validate`

### Requirement: MOBILE-73 — A theme is applied through lib/theme

The mobile app SHALL apply a theme to NativeWind's live color scheme, without storing it, through
`applyTheme` of `src/lib/theme/colorScheme.adapter.ts`, so every theme-token consumer reads that
theme; a block's test SHALL switch the theme through it, never through `nativewind`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a theme is applied

- **GIVEN** the dark theme is active
- **WHEN** `applyTheme` applies the light theme, then the dark one
- **THEN** the theme tokens read the light theme and its palette, then the dark ones
- **Test:** `apps/mobile/src/lib/theme/__tests__/colorScheme.adapter.test.ts` › "applies a theme to the live color scheme"

#### Scenario: a block under the light theme

- **GIVEN** the light theme applied through `applyTheme`
- **WHEN** the `Text` block renders a caption and the `Screen` block a surface
- **THEN** each paints the light theme's colour
- **Test:** `apps/mobile/src/components/ui/Text/__tests__/Text.component.test.tsx` › "paints a variant in the active theme's colour"
- **Test:** `apps/mobile/src/components/ui/Screen/__tests__/Screen.component.test.tsx` › "paints the active theme's base background"

#### Scenario: a block test imports nativewind

- **GIVEN** a `ui/` block test that imports `nativewind`
- **WHEN** ESLint and `pnpm verify:dependency-seams` run
- **THEN** the import is reported as outside its seam, and no allowlist entry excuses it
- **Test:** Not covered — no test of this app reads its imports; `local/dependency-seam` refuses
  such an import (harness/dependency-seams SEAM-03) and `pnpm verify:dependency-seams` fails an
  allowlist entry or a violation for it (SEAM-07), both inside `pnpm validate`

## MODIFIED Requirements

### Requirement: MOBILE-41 — Only the ui blocks import a UI kit

The mobile app SHALL import a UI kit or the drawing primitives the blocks wrap
(`expo-linear-gradient`, `expo-blur`, `react-native-svg`, a future `react-native-paper`) only from
a block under `src/components/ui/`, so a kit is swapped by rewriting that folder alone.

**Evidence:** `eslint-local-rules/ui-kit.detect.mjs:17`, `apps/mobile/src/components/ui/Gradient/Gradient.component.tsx:1`, `apps/mobile/src/components/ui/AccentGradient/AccentGradient.component.tsx:12`

#### Scenario: a screen-local component imports the gradient

- **GIVEN** a screen's own component that imports `expo-linear-gradient`
- **WHEN** it is linted
- **THEN** `local/ui-kit-boundary` reports the import
- **Test:** `eslint-local-rules/index.test.mjs` › "import { LinearGradient } from 'expo-linear-gradient'"

#### Scenario: the gradient renders through its block

- **GIVEN** the `AccentGradient` block around content
- **WHEN** it renders
- **THEN** it paints the light accent to the accent behind the content
- **Test:** `apps/mobile/src/components/ui/AccentGradient/__tests__/AccentGradient.component.test.tsx` › "paints the accent gradient behind its children"
