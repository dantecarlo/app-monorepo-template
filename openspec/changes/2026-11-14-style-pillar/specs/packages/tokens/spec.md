# Delta: packages/tokens

> **Change:** `2026-11-14-style-pillar`

## ADDED Requirements

### Requirement: TOKENS-14 — Layout widths, glyph sizes and insets are tokens

The tokens package SHALL define the layout widths narrow 24, content 28, dialog 32 and wide 42, in
rem; the glyph sizes, a font size with no line height, initialsSm 10, initialsMd 13, initialsLg
16 and navIcon 22, in pixels; and the insets knob 2.5, pillX 11 and pillY 5, in pixels; and the
Tailwind preset SHALL carry them as the `max-w-*`, `text-*` and spacing utilities.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the preset carries the new scales

- **GIVEN** the tokens and the Tailwind preset
- **WHEN** every layout width, glyph size and inset is read from both
- **THEN** each preset entry is its token written as a CSS length
- **Test:** `packages/tokens/src/__tests__/preset.test.ts` › "the preset carries every scale token as a CSS length"

### Requirement: TOKENS-15 — The colour copies agree for every colour of both themes

The tokens package SHALL keep the colours of `tokens.constant.ts` equal to their copy in
`apps/web/src/app/globals.css` for both themes, the theme-invariant accent ramp and cool glow
included, and equal to the Tailwind preset for the dark theme.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a theme-invariant colour drifts in the light theme

- **GIVEN** the three copies, with the light theme's cool glow changed in `tokens.constant.ts` only
- **WHEN** the theme-sync gate compares them
- **THEN** it reports the light cool glow against its `globals.css` copy
- **Test:** `scripts/verify-theme-sync.test.mjs` › "a light-theme drift of a theme-invariant colour is caught"

#### Scenario: a themed colour drifts in the light theme

- **GIVEN** the three copies, with the light theme's base background changed in `globals.css` only
- **WHEN** the theme-sync gate compares them
- **THEN** it reports the light base background
- **Test:** `scripts/verify-theme-sync.test.mjs` › "a light-theme drift of a themed colour is caught"

## MODIFIED Requirements

### Requirement: TOKENS-12 — The Tailwind preset carries the dark theme's colors

The tokens package SHALL ship a Tailwind preset, exported as tailwind-preset.cjs, whose
theme.extend.colors hold the values of the dark theme, and which the Tailwind configs of both apps
load.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a Tailwind config loads the preset

- **GIVEN** a Tailwind config that requires the preset
- **WHEN** it resolves a color utility such as bg-base
- **THEN** the value is the dark theme's
- **Test:** `scripts/verify-theme-sync.test.mjs` › "the shipped copies agree"

#### Scenario: the web app loads the preset

- **GIVEN** the web app's Tailwind config and its CSS entry
- **WHEN** they are read
- **THEN** the config's only preset is the tokens preset, and the CSS entry loads the config
- **Test:** `apps/web/src/app/__tests__/tailwind.config.test.ts` › "loads the tokens preset through the CSS entry"

### Requirement: TOKENS-13 — The Tailwind preset carries the scales as CSS lengths

The tokens package SHALL give the Tailwind preset the spacing, radius, font family, font size and
shadow tokens, the numeric ones written as pixel lengths, and the web app SHALL take its spacing,
radius and font-size utilities from the preset alone.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a Tailwind config resolves a spacing utility

- **GIVEN** a Tailwind config that requires the preset
- **WHEN** it resolves a spacing utility such as p-lg
- **THEN** the value is 16px, the lg spacing token
- **Test:** `packages/tokens/src/__tests__/preset.test.ts` › "the preset carries every scale token as a CSS length"
