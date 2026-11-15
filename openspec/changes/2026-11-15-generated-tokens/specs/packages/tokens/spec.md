# Delta: packages/tokens

> **Change:** `2026-11-15-generated-tokens`

## ADDED Requirements

### Requirement: TOKENS-16 — One generator writes every token output from the source

The tokens package SHALL write every token-derived output, the web theme `theme.css`, the
NativeWind preset `tailwind-preset.cjs` and the mobile theme variables
`src/themeVars.constant.ts`, with one generator, `scripts/generate.mjs`, from
`src/tokens.constant.ts` alone, each file starting with a header that names the generator and says
not to edit it.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the generator runs

- **GIVEN** a package folder holding the token source
- **WHEN** the generator runs over it twice
- **THEN** the first run writes the three outputs, each under its do-not-edit header, and the
  second run rewrites none of them
- **Test:** `packages/tokens/scripts/__tests__/generate.test.ts` › "writes every output under its do-not-edit header, and rewrites nothing on a second run"

#### Scenario: a token is added to the source

- **GIVEN** the source with one more spacing step
- **WHEN** the outputs are rendered from it
- **THEN** the web theme and the preset both carry the new step, as a CSS length
- **Test:** `packages/tokens/scripts/__tests__/generate.test.ts` › "a token added to the source reaches every output that carries its group"

### Requirement: TOKENS-17 — The web theme carries both themes and the scales

The tokens package SHALL write, in the web theme, each themed colour as `--c-<name>` with its
dark value in `:root, [data-theme='dark']` and its light value in `[data-theme='light']`, mapped in
`@theme` as `--color-<name>: var(--c-<name>)`; each shared colour once, as a literal
`--color-<name>` in `@theme`; the font families, the shadows and the motion in `@theme`; and the
spacing, inset, layout-width, radius, font-size and glyph-size scales in `@theme inline` as CSS
lengths, `<name>` being the kebab case of the token's key path.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a themed colour is read in each theme

- **GIVEN** the web theme rendered from the source
- **WHEN** its theme blocks and its `@theme` block are read
- **THEN** every themed colour has its dark and its light value under `--c-<name>`, and
  `--color-<name>` reads that variable
- **Test:** `packages/tokens/scripts/__tests__/generate.test.ts` › "declares every themed colour in both theme blocks and maps it in @theme"

#### Scenario: a shared colour is read

- **GIVEN** the web theme rendered from the source
- **WHEN** a shared colour is looked up
- **THEN** it is a literal in `@theme` and in neither theme block
- **Test:** `packages/tokens/scripts/__tests__/generate.test.ts` › "writes every shared colour once, as a literal in @theme"

#### Scenario: a scale reaches its utilities

- **GIVEN** the web theme rendered from the source
- **WHEN** its `@theme inline` block is read
- **THEN** every spacing, inset, layout width, radius, font size with its line height and glyph
  size is there as a CSS length
- **Test:** `packages/tokens/scripts/__tests__/generate.test.ts` › "inlines every scale in @theme inline as a CSS length"

### Requirement: TOKENS-18 — The mobile theme variables carry each themed colour per theme

The tokens package SHALL export `themeVars`, the `--c-<name>` value of every themed colour for
each theme, the shape NativeWind's `vars()` takes, and no shared colour.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a theme's variables are read

- **GIVEN** themeVars
- **WHEN** the variables of each theme are read
- **THEN** each themed colour of that theme is its `--c-<name>` value
- **Test:** `packages/tokens/src/__tests__/themeVars.constant.test.ts` › "maps every themed colour of each theme to its --c- variable"

#### Scenario: a shared colour is looked up

- **GIVEN** themeVars
- **WHEN** a shared colour's variable is looked up
- **THEN** neither theme carries it
- **Test:** `packages/tokens/src/__tests__/themeVars.constant.test.ts` › "carries no shared colour"

### Requirement: TOKENS-19 — Font stacks and motion are tokens

The tokens package SHALL define the generic font fallback sans-serif, the CSS variable each web
font loader sets (body `--font-inter`, display `--font-montserrat`) and the shimmer motion, 1600 ms
and linear; the web theme SHALL write each font family as `var(<loader variable>), <family>,
<fallback>` and the motion as `--duration-shimmer` and `--ease-shimmer`, and the preset each font
family as `[<family>, <fallback>]`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the web theme reads the font stacks and the motion

- **GIVEN** the web theme rendered from the source
- **WHEN** its font families and motion are read
- **THEN** each family is its loader variable, its name and the fallback, and the shimmer is
  1600ms and linear
- **Test:** `packages/tokens/scripts/__tests__/generate.test.ts` › "writes each font stack with its loader variable and fallback, and the shimmer motion"

#### Scenario: the preset reads the font stacks

- **GIVEN** the generated preset
- **WHEN** its font families are read
- **THEN** each is its family followed by the fallback
- **Test:** `packages/tokens/__tests__/tailwind-preset.test.ts` › "the preset writes each font family before its fallback"

## MODIFIED Requirements

### Requirement: TOKENS-05 — The theme-invariant colours are shared by both themes

The tokens package SHALL define the theme-invariant colours once, as `sharedColors`: accent
#FF6A1A, accentLight #FF8A3D, accentInk #2A1402, accentTint rgba(255,106,26,0.16) and coolGlow
#5B6CFF, and give both themes those values.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a shared colour is read from each theme

- **GIVEN** the dark and the light themes
- **WHEN** each shared colour is read from both
- **THEN** both themes give the value `sharedColors` holds
- **Test:** `packages/tokens/src/__tests__/tokens.constant.test.ts` › "both themes carry the shared colours"

### Requirement: TOKENS-12 — The NativeWind preset carries the dark theme's colours

The tokens package SHALL ship the generated Tailwind preset, exported as tailwind-preset.cjs,
whose theme.extend.colors hold the values of the dark theme, and which the mobile Tailwind config
loads; the web app SHALL load no Tailwind JavaScript config.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a Tailwind config resolves a colour

- **GIVEN** the preset
- **WHEN** its colours are flattened to utility names, as Tailwind does
- **THEN** every colour of the dark theme is there under the kebab case of its key path, with its
  dark value
- **Test:** `packages/tokens/__tests__/tailwind-preset.test.ts` › "the preset carries every colour of the dark theme"

#### Scenario: the web app loads no JavaScript config

- **GIVEN** the web app's CSS entry
- **WHEN** it is read
- **THEN** it imports the generated theme, holds no `@config` and no `tailwind.config.cjs` exists
- **Test:** `apps/web/src/app/__tests__/globals.test.ts` › "imports the generated theme and loads no JS config"

### Requirement: TOKENS-13 — The outputs carry the scales as CSS lengths

The tokens package SHALL give the generated preset and web theme the spacing, inset, radius,
layout-width, font family, font size, glyph size and shadow tokens, the numeric ones written as
pixel or rem lengths, and the web app SHALL take its spacing, radius, layout-width and font-size
utilities from the generated web theme alone.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a Tailwind config resolves a spacing utility

- **GIVEN** a Tailwind config that requires the preset
- **WHEN** it resolves a spacing utility such as p-lg
- **THEN** the value is 16px, the lg spacing token
- **Test:** `packages/tokens/__tests__/tailwind-preset.test.ts` › "the preset carries every scale token as a CSS length"

#### Scenario: the web theme carries the scales

- **GIVEN** the web theme rendered from the source
- **WHEN** its `@theme inline` block is read
- **THEN** every scale token is there as a CSS length
- **Test:** `packages/tokens/scripts/__tests__/generate.test.ts` › "inlines every scale in @theme inline as a CSS length"

### Requirement: TOKENS-14 — Layout widths, glyph sizes and insets are tokens

The tokens package SHALL define the layout widths narrow 24, content 28, dialog 32 and wide 42, in
rem; the glyph sizes, a font size with no line height, initialsSm 10, initialsMd 13, initialsLg
16 and navIcon 22, in pixels; and the insets knobInset 2.5, pillX 11 and pillY 5, in pixels; and
the generated outputs SHALL carry them as the `max-w-*`, `text-*` and spacing utilities.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the preset carries the new scales

- **GIVEN** the tokens and the Tailwind preset
- **WHEN** every layout width, glyph size and inset is read from both
- **THEN** each preset entry is its token written as a CSS length
- **Test:** `packages/tokens/__tests__/tailwind-preset.test.ts` › "the preset carries every scale token as a CSS length"

### Requirement: TOKENS-15 — Every generated output equals its regeneration

The repository SHALL fail `pnpm verify:theme-sync` when a generated token output differs from what
the generator writes from the current source, or is missing, naming the file, its first differing
line and the command that regenerates it.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a generated file is edited by hand

- **GIVEN** the committed outputs, with one value of the web theme edited by hand
- **WHEN** the theme-sync gate regenerates in memory and compares
- **THEN** it reports the web theme, and only it
- **Test:** `scripts/verify-theme-sync.test.mjs` › "a planted edit in the web theme is caught"
- **Test:** `scripts/verify-theme-sync.test.mjs` › "a planted edit in the preset is caught"
- **Test:** `scripts/verify-theme-sync.test.mjs` › "a planted edit in the mobile theme variables is caught"

#### Scenario: the source changes and nobody regenerates

- **GIVEN** the committed outputs, with a dark colour changed in the source only
- **WHEN** the theme-sync gate compares
- **THEN** it reports the web theme, the preset and the mobile theme variables, every output that
  carries the dark colours
- **Test:** `scripts/verify-theme-sync.test.mjs` › "a source change that was not regenerated is caught in every output it reaches"

#### Scenario: the outputs are current

- **GIVEN** the committed outputs as the generator writes them
- **WHEN** the theme-sync gate runs as a process
- **THEN** it exits 0
- **Test:** `scripts/verify-theme-sync.test.mjs` › "the shipped outputs equal their regeneration"
- **Test:** `scripts/verify-theme-sync.test.mjs` › "the gate exits 0 over the shipped outputs"
