# Delta: apps/mobile

> **Change:** `2026-11-14-style-pillar`

## ADDED Requirements

### Requirement: MOBILE-38 — A screen or section only positions

The mobile app SHALL keep the look of a screen, a route entry and a container outside the
component blocks in a component block (`src/components/ui/`, or a screen's own `components/`):
their NativeWind classes, StyleSheet entries and style slots carry only layout, spacing, size,
position, overflow and visibility.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a screen StyleSheet entry carries a colour

- **GIVEN** a mobile screen style file whose StyleSheet entry sets a text colour
- **WHEN** it is linted
- **THEN** `local/style-positions-only` reports the declaration key
- **Test:** `eslint-local-rules/index.test.mjs` › "export const S = StyleSheet.create({ title: { color: colors.text.primary, marginTop: 4 } })"

#### Scenario: a container paints its background inline

- **GIVEN** the root error boundary container with an inline background colour
- **WHEN** it is linted
- **THEN** the declaration key is reported
- **Test:** `eslint-local-rules/index.test.mjs` › "const B = () => <View style={{ backgroundColor: bg, flex: 1 }} />"

### Requirement: MOBILE-39 — Every mobile style value is a token

The mobile app SHALL take every colour of its style files and views from `@app/tokens`, and every
NativeWind class value from the tokens preset or Tailwind's scale: no raw colour, no Tailwind
palette colour and no arbitrary value.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a style file spells a raw colour

- **GIVEN** a mobile style file holding two hex colours
- **WHEN** it is linted
- **THEN** `local/style-token-values` reports each of them
- **Test:** `eslint-local-rules/index.test.mjs` › "export const GRADIENT = ['#FF8A3D', '#FF6A1A'] as const"

### Requirement: MOBILE-40 — Text, Divider and Screen carry the look screens used to hold

The mobile app SHALL render text through the `Text` block, whose variant sets its typography and
colour, a labelled rule through the `Divider` block, and a screen's surface through the `Screen`
block, which fills its parent and paints the dark base background, or the active theme's base
background when it is themed.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a text variant renders

- **GIVEN** the `Text` block with the caption variant
- **WHEN** it renders
- **THEN** its style holds the caption size, line height and tertiary colour of the tokens
- **Test:** `apps/mobile/src/components/ui/Text/Text.component.test.tsx` › "renders a variant's typography"

#### Scenario: a labelled divider renders

- **GIVEN** the `Divider` block with a label
- **WHEN** it renders
- **THEN** the label is shown between two hairline rules
- **Test:** `apps/mobile/src/components/ui/Divider/Divider.component.test.tsx` › "renders the label between two rules"

#### Scenario: a themed screen surface renders

- **GIVEN** the `Screen` block, themed and not themed, under the light theme
- **WHEN** it renders
- **THEN** the themed surface paints the light base background and the other the dark one
- **Test:** `apps/mobile/src/components/ui/Screen/Screen.component.test.tsx` › "paints the dark base, or the active theme's base when themed"

### Requirement: MOBILE-41 — Only the ui blocks import a UI kit

The mobile app SHALL import a UI kit or the drawing primitives the blocks wrap
(`expo-linear-gradient`, `expo-blur`, `react-native-svg`, a future `react-native-paper`) only from
a block under `src/components/ui/`, so a kit is swapped by rewriting that folder alone.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a screen-local component imports the gradient

- **GIVEN** a screen's own component that imports `expo-linear-gradient`
- **WHEN** it is linted
- **THEN** `local/ui-kit-boundary` reports the import
- **Test:** `eslint-local-rules/index.test.mjs` › "import { LinearGradient } from 'expo-linear-gradient'"

#### Scenario: the gradient renders through its block

- **GIVEN** the `AccentGradient` block around content
- **WHEN** it renders
- **THEN** it paints the light accent to the accent behind the content
- **Test:** `apps/mobile/src/components/ui/AccentGradient/AccentGradient.component.test.tsx` › "paints the accent gradient behind its children"

## MODIFIED Requirements

### Requirement: MOBILE-05 — The root frame follows the theme

The mobile app SHALL paint the navigator background with the active theme's base background and
show dark status bar glyphs under the light theme and light glyphs under the dark one.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the light theme is active

- **GIVEN** the NativeWind color scheme is light
- **WHEN** the root layout renders
- **THEN** the status bar style is dark and the content background is the light base color
- **Test:** Not covered — no test calls useRootTheme or renders the root layout

### Requirement: MOBILE-33 — Web export fits every viewport

The mobile app's web export SHALL render the root route in a centred column at most 428 px wide,
with no horizontal overflow and every interactive control that is not fixed or sticky inside the
viewport, at 390, 768, 1280 and 1920 px wide.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the four viewport widths

- **GIVEN** the web export served on port 3001 and the opt-in mobile-web projects enabled
- **WHEN** the root route loads at each of the four widths
- **THEN** the document and body scroll widths stay within the client width plus 1 px, and no button or link lies outside it
- **Test:** `e2e/mobile-web.e2e.ts` › "no horizontal overflow and interactive controls within viewport"

#### Scenario: the column at desktop width

- **GIVEN** the web export at 1280 px wide
- **WHEN** the root route loads
- **THEN** the dashboard column is 428 px wide and centred
- **Test:** Not covered — the mobile-web e2e measures overflow and control bounds, not the column width

### Requirement: MOBILE-37 — A render crash shows the error state

The mobile app SHALL export an `ErrorBoundary` from the root layout, which Expo Router wraps
around the layout and every route below it, rendering the error state with its generic copy on
the theme background and a retry control that re-renders the route.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a route crashes while rendering

- **GIVEN** a route throws while rendering
- **WHEN** the root error boundary renders and its retry control is pressed
- **THEN** the generic error title and message are shown in an alert, and the route is re-rendered once
- **Test:** `apps/mobile/src/components/RootErrorBoundary/RootErrorBoundary.component.test.tsx` › "renders the generic error state for a render crash"
- **Test:** `apps/mobile/src/components/RootErrorBoundary/RootErrorBoundary.component.test.tsx` › "calls retry when the retry control is pressed"

#### Scenario: the root layout exports the boundary

- **GIVEN** the root layout module
- **WHEN** Expo Router reads its exports
- **THEN** its `ErrorBoundary` is the root error boundary
- **Test:** `apps/mobile/src/app/__tests__/_layout.test.tsx` › "exports the root error boundary as its ErrorBoundary"
