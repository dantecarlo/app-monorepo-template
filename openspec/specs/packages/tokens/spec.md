# packages/tokens — living spec

> **Governs:** `packages/tokens/src`, `packages/tokens/tailwind-preset.cjs`
> **ID prefix:** `TOKENS`
> **Derived from:** `docs/architecture/shared.md`
> **Verified against the code:** 2026-11-14 at `9afce2d`

## Purpose

The tokens package owns the design-token values: a dark and a light theme with one key set, dark
by default, and the spacing, radius, typography, shadows (CSS and React Native) and accent
gradient, plus a Tailwind preset that carries the dark values. It holds no components; apps/web
keeps its own CSS copy of the colors, and apps/mobile switches themes at runtime.

## Requirements

### Requirement: TOKENS-01 — Dark and light themes share one key set

The tokens package SHALL define two color themes, dark and light, keyed by ThemeEnum, that expose an identical set of semantic leaf keys.

**Evidence:** `packages/tokens/src/tokens.constant.ts:125`, `packages/tokens/src/tokens.constant.ts:9`

#### Scenario: a consumer switches theme

- **GIVEN** the dark and the light themes
- **WHEN** their leaf key paths are collected and sorted
- **THEN** the two lists are equal, so a consumer can read any key from either theme
- **Test:** `packages/tokens/src/__tests__/themes.test.ts` › "dark and light themes expose an identical semantic key set"

### Requirement: TOKENS-02 — The default theme is dark

The tokens package SHALL name the dark theme as the default theme.

**Evidence:** `packages/tokens/src/tokens.constant.ts:16`

#### Scenario: the default names a defined theme

- **GIVEN** DEFAULT_THEME
- **WHEN** it is looked up in ThemeEnum and in themes
- **THEN** it is a ThemeEnum value and themes holds an entry for it
- **Test:** `packages/tokens/src/__tests__/themes.test.ts` › "default theme is a member of the theme enum"

#### Scenario: the default is dark

- **GIVEN** DEFAULT_THEME
- **WHEN** its value is read
- **THEN** it is dark
- **Test:** Not covered — the test asserts membership in the enum, not the value

### Requirement: TOKENS-03 — The glass recipe is pinned per theme

The tokens package SHALL give the glass surface the fill rgba(24,27,34,0.42) and the stroke rgba(255,255,255,0.10) in the dark theme, and the fill rgba(255,255,255,0.66) and the stroke rgba(0,0,0,0.08) in the light theme.

**Evidence:** `packages/tokens/src/tokens.constant.ts:53`, `packages/tokens/src/tokens.constant.ts:54`, `packages/tokens/src/tokens.constant.ts:96`, `packages/tokens/src/tokens.constant.ts:97`

#### Scenario: the glass values are read

- **GIVEN** the dark and the light themes
- **WHEN** their glass fill and stroke are read
- **THEN** each equals its pinned value
- **Test:** `packages/tokens/src/__tests__/themes.test.ts` › "glass recipe values are pinned per theme (drift anchor)"

### Requirement: TOKENS-04 — The flat colors alias is the dark theme

The tokens package SHALL export colors as the dark theme object itself.

**Evidence:** `packages/tokens/src/tokens.constant.ts:134`

#### Scenario: a consumer imports colors

- **GIVEN** a consumer that imports colors
- **WHEN** it compares it with themes.dark
- **THEN** both are the same object
- **Test:** `packages/tokens/src/__tests__/themes.test.ts` › "flat colors alias stays bound to the dark theme for back-compat"

### Requirement: TOKENS-05 — The accent ramp is the same in both themes

The tokens package SHALL carry one accent ramp in both themes: accent #FF6A1A, accentLight #FF8A3D, accentInk #2A1402 and accentTint rgba(255,106,26,0.16).

**Evidence:** `packages/tokens/src/tokens.constant.ts:22`, `packages/tokens/src/tokens.constant.ts:36`, `packages/tokens/src/tokens.constant.ts:79`

#### Scenario: the accent is read from each theme

- **GIVEN** the dark and the light themes
- **WHEN** their accent ramp is read
- **THEN** both themes give the same four values
- **Test:** Not covered — the theme test compares keys, not the accent values

### Requirement: TOKENS-06 — Spacing is a fixed scale in pixels

The tokens package SHALL define spacing as xs 4, sm 8, md 12, lg 16, xl 20, 2xl 24 and 3xl 32, in pixels.

**Evidence:** `packages/tokens/src/tokens.constant.ts:140`

#### Scenario: a spacing step is read

- **GIVEN** the spacing scale
- **WHEN** a step is read
- **THEN** it holds its pixel value as a number
- **Test:** Not covered — no test reads spacing

### Requirement: TOKENS-07 — Radii are a fixed scale in pixels

The tokens package SHALL define border radii as sm 8, md 14, lg 20, xl 26 and full 9999, in pixels.

**Evidence:** `packages/tokens/src/tokens.constant.ts:154`

#### Scenario: a radius is read

- **GIVEN** the radius scale
- **WHEN** a step is read
- **THEN** it holds its pixel value as a number
- **Test:** Not covered — no test reads radius

### Requirement: TOKENS-08 — Typography is two families and nine sizes

The tokens package SHALL define the font families Inter for body and Montserrat for display, and nine font sizes, each a pixel size with its line height: caption, label, body, button, title, heading, amount, display and amountHero.

**Evidence:** `packages/tokens/src/tokens.constant.ts:166`, `packages/tokens/src/tokens.constant.ts:172`

#### Scenario: a text style is built

- **GIVEN** the typography tokens
- **WHEN** a consumer reads a font size
- **THEN** it gets a size and a line height in pixels
- **Test:** Not covered — no test reads fontFamily or fontSize

### Requirement: TOKENS-09 — Shadows exist for the web and for React Native

The tokens package SHALL define the shadows accentGlow, card and markerGlow both as CSS box-shadow strings and as React Native shadow style objects, and rimLight, an inset shadow, as a CSS string only.

**Evidence:** `packages/tokens/src/tokens.constant.ts:192`, `packages/tokens/src/tokens.constant.ts:203`

#### Scenario: a native consumer reads a shadow

- **GIVEN** a React Native style that needs the card shadow
- **WHEN** it spreads rnShadows.card
- **THEN** it gets elevation, shadow color, offset, opacity and radius values
- **Test:** Not covered — no test reads shadows or rnShadows

### Requirement: TOKENS-10 — The accent gradient runs from light to base accent

The tokens package SHALL define the accent gradient as a vertical CSS linear gradient from #FF8A3D to #FF6A1A.

**Evidence:** `packages/tokens/src/tokens.constant.ts:233`

#### Scenario: a button uses the gradient

- **GIVEN** a web style that needs the accent gradient
- **WHEN** it reads gradients.accent
- **THEN** it gets a 180-degree linear gradient between the two accent values
- **Test:** Not covered — no test reads gradients

### Requirement: TOKENS-11 — The entry point exposes every token

The tokens package SHALL expose every token group as a named export from its entry point, and the tokens aggregate of colors, fontFamily, fontSize, gradients, radius, rnShadows, shadows, spacing and themes as its default export.

**Evidence:** `packages/tokens/src/index.ts:1`, `packages/tokens/src/index.ts:2`, `packages/tokens/src/tokens.constant.ts:240`

#### Scenario: a consumer imports the default export

- **GIVEN** a consumer of the tokens package
- **WHEN** it imports the default export
- **THEN** it gets the aggregate holding every token group
- **Test:** Not covered — the theme test imports the constant module, not the entry point

### Requirement: TOKENS-12 — The Tailwind preset carries the dark theme's colors

The tokens package SHALL ship a Tailwind preset, exported as tailwind-preset.cjs, whose theme.extend.colors hold the values of the dark theme.

**Evidence:** `packages/tokens/tailwind-preset.cjs:23`, `packages/tokens/package.json:9`

#### Scenario: a Tailwind config loads the preset

- **GIVEN** a Tailwind config that requires the preset
- **WHEN** it resolves a color utility such as bg-base
- **THEN** the value is the dark theme's
- **Test:** Not covered — no test reads the preset; the `scripts/verify-theme-sync.mjs` gate in pnpm validate compares its theme-variant colors with the dark theme, not its accent ramp

### Requirement: TOKENS-13 — The Tailwind preset carries the scales as CSS lengths

The tokens package SHALL give the Tailwind preset the spacing, radius, font family, font size and shadow tokens, the numeric ones written as pixel lengths.

**Evidence:** `packages/tokens/tailwind-preset.cjs:81`, `packages/tokens/tailwind-preset.cjs:94`, `packages/tokens/tailwind-preset.cjs:105`, `packages/tokens/tailwind-preset.cjs:113`, `packages/tokens/tailwind-preset.cjs:128`

#### Scenario: a Tailwind config resolves a spacing utility

- **GIVEN** a Tailwind config that requires the preset
- **WHEN** it resolves a spacing utility such as p-lg
- **THEN** the value is 16px, the lg spacing token
- **Test:** Not covered — no test reads the preset, and the theme-sync gate compares colors only

## Open questions

- **Q1** — `packages/tokens/src/tokens.constant.ts:3` and `docs/architecture/shared.md:41` say
  the web app's Tailwind uses the preset, but only `apps/mobile/tailwind.config.js:7` loads it,
  and the web app keeps its own copy of the colors in `apps/web/src/app/globals.css:16`.
- **Q2** — The comment at `packages/tokens/tailwind-preset.cjs:10` says the theme-sync gate checks
  drift for both dark and light, but `scripts/verify-theme-sync.mjs:48` compares the preset with
  the dark theme only and skips the accent ramp; it reads colors only, so drift in the preset's
  spacing, radius, font sizes and shadows goes unnoticed.
