# Delta: packages/tokens

> **Change:** `2026-11-15-app-behaviour`

## MODIFIED Requirements

### Requirement: TOKENS-12 — The NativeWind preset reads each themed colour from its variable

The tokens package SHALL ship the generated Tailwind preset, exported as tailwind-preset.cjs,
whose theme.extend.colors hold, in the dark theme's shape, each themed colour as a read of its
`--c-*` variable, under the name `themeVars` and the web theme declare it, and each colour the
themes share as its literal value, and which the mobile Tailwind config loads; the web app SHALL
load no Tailwind JavaScript config.

**Evidence:** written at apply time, when the code exists.

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

#### Scenario: the web app loads no JavaScript config

- **GIVEN** the web app's CSS entry
- **WHEN** it is read
- **THEN** it imports the generated theme, holds no `@config` and no `tailwind.config.cjs` exists
- **Test:** `apps/web/src/app/__tests__/globals.test.ts` › "imports the generated theme and loads no JS config"
