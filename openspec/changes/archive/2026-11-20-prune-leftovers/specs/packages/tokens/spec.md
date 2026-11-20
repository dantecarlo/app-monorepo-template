# Delta: packages/tokens

> **Change:** `2026-11-20-prune-leftovers`

## MODIFIED Requirements

### Requirement: TOKENS-12 — The NativeWind preset reads each themed colour from its variable

The tokens package SHALL ship the generated Tailwind preset, exported as tailwind-preset.cjs,
whose theme.extend.colors hold, in the dark theme's shape, each themed colour as a read of its
`--c-*` variable, under the name `themeVars` and the web theme declare it, and each colour the
themes share as its literal value, for an app's Tailwind config to load.

<!-- region web-next -->
The web app SHALL load no Tailwind JavaScript config: its CSS entry imports the generated theme.
<!-- endregion web-next -->

**Evidence:** written at archive, from the code.

#### Scenario: a themed colour is resolved

- **GIVEN** the preset and the mobile theme variables
- **WHEN** its colours are flattened to utility names, as Tailwind does
- **THEN** every themed colour reads `var(--c-<name>)`, and the variable is declared in both the dark and the light theme variables
- **Test:** `packages/tokens/__tests__/tailwind-preset.test.ts` › "the preset reads every themed colour from its --c- variable, declared in both themes"

#### Scenario: the dark theme is unchanged

- **GIVEN** the preset
- **WHEN** each of its colours is resolved through the dark theme variables
- **THEN** every colour of the dark theme is there under the kebab case of its key path, with its dark value
- **Test:** `packages/tokens/__tests__/tailwind-preset.test.ts` › "the preset resolves to the dark theme's colours under the dark variables"

#### Scenario: a shared colour

- **GIVEN** the preset
- **WHEN** a colour both themes share is read
- **THEN** it is the literal value of the shared colour
- **Test:** `packages/tokens/__tests__/tailwind-preset.test.ts` › "the preset writes every shared colour as a literal"

<!-- region web-next -->
#### Scenario: the web app loads no JavaScript config

- **GIVEN** the web app's CSS entry
- **WHEN** it is read
- **THEN** it imports the generated theme, holds no `@config` and no `tailwind.config.cjs` exists
- **Test:** `apps/web/src/app/__tests__/globals.test.ts` › "imports the generated theme and loads no JS config"
<!-- endregion web-next -->

### Requirement: TOKENS-13 — The outputs carry the scales as CSS lengths

The tokens package SHALL give the generated preset and web theme the spacing, inset, radius,
layout-width, font family, font size, glyph size and shadow tokens, the numeric ones written as
pixel or rem lengths, and the web app SHALL take its spacing, radius, layout-width and font-size
utilities from the generated web theme alone.

**Evidence:** written at archive, from the code: the generator and the outputs of this package, with no file of an app.

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
