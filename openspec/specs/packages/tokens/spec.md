# packages/tokens — living spec

> **Governs:** `packages/tokens/src`, `packages/tokens/scripts`, `packages/tokens/theme.css`, `packages/tokens/tailwind-preset.cjs`
> **ID prefix:** `TOKENS`
> **Derived from:** `docs/architecture/shared.md`
> **Verified against the code:** 2026-11-16 at `eeeaac7`

## Purpose

The tokens package owns the design-token values: a dark and a light theme with one key set, dark
by default, the colours both themes share, and the spacing, radius, typography, shadows (CSS and
React Native), motion and accent gradient, all in one source, `packages/tokens/src/tokens.constant.ts`.
One generator writes every token output from it: the web theme CSS apps/web imports, the
NativeWind preset, which reads each themed colour from its variable, the mobile theme variables, and the name of every token
utility, which the web's tailwind-merge reads; a gate fails while an output differs from its
regeneration. It holds no components, and apps/mobile switches themes at
runtime.

## Requirements

### Requirement: TOKENS-01 — Dark and light themes share one key set

The tokens package SHALL define two color themes, dark and light, keyed by ThemeEnum, that expose an identical set of semantic leaf keys.

**Evidence:** `packages/tokens/src/tokens.constant.ts:136`, `packages/tokens/src/tokens.constant.ts:15`

#### Scenario: a consumer switches theme

- **GIVEN** the dark and the light themes
- **WHEN** their leaf key paths are collected and sorted
- **THEN** the two lists are equal, so a consumer can read any key from either theme
- **Test:** `packages/tokens/src/__tests__/tokens.constant.test.ts` › "dark and light themes expose an identical semantic key set"

### Requirement: TOKENS-02 — The default theme is dark

The tokens package SHALL name the dark theme as the default theme.

**Evidence:** `packages/tokens/src/tokens.constant.ts:22`

#### Scenario: the default names a defined theme

- **GIVEN** DEFAULT_THEME
- **WHEN** it is looked up in ThemeEnum and in themes
- **THEN** it is a ThemeEnum value and themes holds an entry for it
- **Test:** `packages/tokens/src/__tests__/tokens.constant.test.ts` › "default theme is a member of the theme enum"

#### Scenario: the default is dark

- **GIVEN** DEFAULT_THEME
- **WHEN** its value is read
- **THEN** it is dark
- **Test:** Not covered — the test asserts membership in the enum, not the value

### Requirement: TOKENS-03 — The glass recipe is pinned per theme

The tokens package SHALL give the glass surface the fill rgba(24,27,34,0.42) and the stroke rgba(255,255,255,0.10) in the dark theme, and the fill rgba(255,255,255,0.66) and the stroke rgba(0,0,0,0.08) in the light theme.

**Evidence:** `packages/tokens/src/tokens.constant.ts:61`, `packages/tokens/src/tokens.constant.ts:62`, `packages/tokens/src/tokens.constant.ts:105`, `packages/tokens/src/tokens.constant.ts:106`

#### Scenario: the glass values are read

- **GIVEN** the dark and the light themes
- **WHEN** their glass fill and stroke are read
- **THEN** each equals its pinned value
- **Test:** `packages/tokens/src/__tests__/tokens.constant.test.ts` › "glass recipe values are pinned per theme (drift anchor)"

### Requirement: TOKENS-04 — The flat colors alias is the dark theme

The tokens package SHALL export colors as the dark theme object itself.

**Evidence:** `packages/tokens/src/tokens.constant.ts:145`

#### Scenario: a consumer imports colors

- **GIVEN** a consumer that imports colors
- **WHEN** it compares it with themes.dark
- **THEN** both are the same object
- **Test:** `packages/tokens/src/__tests__/tokens.constant.test.ts` › "flat colors alias stays bound to the dark theme for back-compat"

### Requirement: TOKENS-05 — The theme-invariant colours are shared by both themes

The tokens package SHALL define the theme-invariant colours once, as `sharedColors`: accent
#FF6A1A, accentLight #FF8A3D, accentInk #2A1402, accentTint rgba(255,106,26,0.16) and coolGlow
#5B6CFF, and give both themes those values.

**Evidence:** `packages/tokens/src/tokens.constant.ts:30`, `packages/tokens/src/tokens.constant.ts:45`, `packages/tokens/src/tokens.constant.ts:89`

#### Scenario: a shared colour is read from each theme

- **GIVEN** the dark and the light themes
- **WHEN** each shared colour is read from both
- **THEN** both themes give the value `sharedColors` holds
- **Test:** `packages/tokens/src/__tests__/tokens.constant.test.ts` › "both themes carry the shared colours"

### Requirement: TOKENS-06 — Spacing is a fixed scale in pixels

The tokens package SHALL define spacing as xs 4, sm 8, md 12, lg 16, xl 20, 2xl 24 and 3xl 32, in pixels.

**Evidence:** `packages/tokens/src/tokens.constant.ts:151`

#### Scenario: a spacing step is read

- **GIVEN** the spacing scale
- **WHEN** a step is read
- **THEN** it holds its pixel value as a number
- **Test:** Not covered — no test reads spacing

### Requirement: TOKENS-07 — Radii are a fixed scale in pixels

The tokens package SHALL define border radii as sm 8, md 14, lg 20, xl 26 and full 9999, in pixels.

**Evidence:** `packages/tokens/src/tokens.constant.ts:188`

#### Scenario: a radius is read

- **GIVEN** the radius scale
- **WHEN** a step is read
- **THEN** it holds its pixel value as a number
- **Test:** Not covered — no test reads radius

### Requirement: TOKENS-08 — Typography is two families and nine sizes

The tokens package SHALL define the font families Inter for body and Montserrat for display, and nine font sizes, each a pixel size with its line height: caption, label, body, button, title, heading, amount, display and amountHero.

**Evidence:** `packages/tokens/src/tokens.constant.ts:200`, `packages/tokens/src/tokens.constant.ts:218`

#### Scenario: a text style is built

- **GIVEN** the typography tokens
- **WHEN** a consumer reads a font size
- **THEN** it gets a size and a line height in pixels
- **Test:** Not covered — no test reads fontFamily or fontSize

### Requirement: TOKENS-09 — Shadows exist for the web and for React Native

The tokens package SHALL define the shadows accentGlow, card and markerGlow both as CSS box-shadow strings and as React Native shadow style objects, and rimLight, an inset shadow, as a CSS string only.

**Evidence:** `packages/tokens/src/tokens.constant.ts:249`, `packages/tokens/src/tokens.constant.ts:260`

#### Scenario: a native consumer reads a shadow

- **GIVEN** a React Native style that needs the card shadow
- **WHEN** it spreads rnShadows.card
- **THEN** it gets elevation, shadow color, offset, opacity and radius values
- **Test:** Not covered — no test reads shadows or rnShadows

### Requirement: TOKENS-10 — The accent gradient runs from light to base accent

The tokens package SHALL define the accent gradient as a vertical CSS linear gradient from #FF8A3D to #FF6A1A.

**Evidence:** `packages/tokens/src/tokens.constant.ts:298`

#### Scenario: a button uses the gradient

- **GIVEN** a web style that needs the accent gradient
- **WHEN** it reads gradients.accent
- **THEN** it gets a 180-degree linear gradient between the two accent values
- **Test:** Not covered — no test reads gradients

### Requirement: TOKENS-11 — The entry point exposes every token

The tokens package SHALL expose every token group as a named export from its entry point, and the tokens aggregate of colors, fontFamily, fontSize, gradients, radius, rnShadows, shadows, spacing and themes as its default export.

**Evidence:** `packages/tokens/src/index.ts:2`, `packages/tokens/src/index.ts:3`, `packages/tokens/src/index.ts:4`, `packages/tokens/src/tokens.constant.ts:307`

#### Scenario: a consumer imports the default export

- **GIVEN** a consumer of the tokens package
- **WHEN** it imports the default export
- **THEN** it gets the aggregate holding every token group
- **Test:** Not covered — the theme test imports the constant module, not the entry point

### Requirement: TOKENS-12 — The NativeWind preset reads each themed colour from its variable

The tokens package SHALL ship the generated Tailwind preset, exported as tailwind-preset.cjs,
whose theme.extend.colors hold, in the dark theme's shape, each themed colour as a read of its
`--c-*` variable, under the name `themeVars` and the web theme declare it, and each colour the
themes share as its literal value, and which the mobile Tailwind config loads; the web app SHALL
load no Tailwind JavaScript config.

**Evidence:** `packages/tokens/scripts/generate.mjs:331-344`, `packages/tokens/scripts/generate.mjs:351`, `packages/tokens/tailwind-preset.cjs:22`, `packages/tokens/package.json:9`

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

**Evidence:** `packages/tokens/scripts/generate.mjs:225`, `packages/tokens/scripts/generate.mjs:234`, `packages/tokens/scripts/generate.mjs:352`, `packages/tokens/scripts/generate.mjs:375`, `packages/tokens/theme.css:119`, `packages/tokens/tailwind-preset.cjs:56`, `packages/tokens/tailwind-preset.cjs:100`

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

**Evidence:** `packages/tokens/src/tokens.constant.ts:166`, `packages/tokens/src/tokens.constant.ts:177`, `packages/tokens/src/tokens.constant.ts:234`, `packages/tokens/scripts/generate.mjs:226`, `packages/tokens/scripts/generate.mjs:230`, `packages/tokens/scripts/generate.mjs:240`, `packages/tokens/tailwind-preset.cjs:56`, `packages/tokens/tailwind-preset.cjs:68`, `packages/tokens/tailwind-preset.cjs:85`

#### Scenario: the preset carries the new scales

- **GIVEN** the tokens and the Tailwind preset
- **WHEN** every layout width, glyph size and inset is read from both
- **THEN** each preset entry is its token written as a CSS length
- **Test:** `packages/tokens/__tests__/tailwind-preset.test.ts` › "the preset carries every scale token as a CSS length"

### Requirement: TOKENS-15 — Every generated output equals its regeneration

The repository SHALL fail `pnpm verify:theme-sync` when a generated token output differs from what
the generator writes from the current source, or is missing, naming the file, its first differing
line and the command that regenerates it.

**Evidence:** `scripts/verify-theme-sync.mjs:51`, `scripts/verify-theme-sync.mjs:77`, `scripts/verify-theme-sync.mjs:91`, `scripts/verify-theme-sync.mjs:104`, `scripts/verify-theme-sync.test.mjs:96`, `scripts/verify-theme-sync.test.mjs:135`

#### Scenario: a generated file is edited by hand

- **GIVEN** the committed outputs, with one value of one output edited by hand
- **WHEN** the theme-sync gate regenerates in memory and compares
- **THEN** it reports that output, and only it
- **Test:** `scripts/verify-theme-sync.test.mjs` › "a planted edit in the web theme is caught"
- **Test:** `scripts/verify-theme-sync.test.mjs` › "a planted edit in the preset is caught"
- **Test:** `scripts/verify-theme-sync.test.mjs` › "a planted edit in the mobile theme variables is caught"
- **Test:** `scripts/verify-theme-sync.test.mjs` › "a planted edit in the theme names is caught"

#### Scenario: the source changes and nobody regenerates

- **GIVEN** the committed outputs, with a dark colour changed in the source only
- **WHEN** the theme-sync gate compares
- **THEN** it reports the web theme and the mobile theme variables, every output that carries the
  themed colour values; the preset names the colour's variable and does not change
- **Test:** `scripts/verify-theme-sync.test.mjs` › "a source change that was not regenerated is caught in every output it reaches"

#### Scenario: a token is renamed and nobody regenerates

- **GIVEN** the committed outputs, with a token key renamed in the source only
- **WHEN** the theme-sync gate compares
- **THEN** it reports the web theme, the preset and the theme names, every output that names the
  token
- **Test:** `scripts/verify-theme-sync.test.mjs` › "a renamed token that was not regenerated is caught in the theme names too"

#### Scenario: the outputs are current

- **GIVEN** the committed outputs as the generator writes them
- **WHEN** the theme-sync gate runs as a process
- **THEN** it exits 0
- **Test:** `scripts/verify-theme-sync.test.mjs` › "the shipped outputs equal their regeneration"
- **Test:** `scripts/verify-theme-sync.test.mjs` › "the gate exits 0 over the shipped outputs"

### Requirement: TOKENS-16 — One generator writes every token output from the source

The tokens package SHALL write every token-derived output with one generator,
`scripts/generate.mjs`, from `src/tokens.constant.ts` alone: the web theme `theme.css`, the
NativeWind preset `tailwind-preset.cjs`, the mobile theme variables `src/themeVars.constant.ts`
and the theme names `src/themeNames.constant.ts`. Each file SHALL start with a header that names
the generator and says not to edit it.

**Evidence:** `packages/tokens/scripts/generate.mjs:47`, `packages/tokens/scripts/generate.mjs:54`, `packages/tokens/scripts/generate.mjs:514`, `packages/tokens/scripts/generate.mjs:521`, `packages/tokens/scripts/generate.mjs:529`, `packages/tokens/scripts/generate.mjs:539`, `packages/tokens/package.json:21`

#### Scenario: the generator runs

- **GIVEN** a package folder holding the token source
- **WHEN** the generator runs over it twice
- **THEN** the first run writes the four outputs, each under its do-not-edit header, and the
  second run rewrites none of them
- **Test:** `packages/tokens/scripts/__tests__/generate.test.ts` › "writes every output under its do-not-edit header, and rewrites nothing on a second run"

#### Scenario: a token is added to the source

- **GIVEN** the source with one more spacing step
- **WHEN** the outputs are rendered from it
- **THEN** the web theme and the preset both carry the new step, as a CSS length, and the theme
  names list it under spacing
- **Test:** `packages/tokens/scripts/__tests__/generate.test.ts` › "a token added to the source reaches every output that carries its group"

### Requirement: TOKENS-17 — The web theme carries both themes and the scales

The tokens package SHALL write, in the web theme, each themed colour as `--c-<name>` with its
dark value in `:root, [data-theme='dark']` and its light value in `[data-theme='light']`, mapped in
`@theme` as `--color-<name>: var(--c-<name>)`; each shared colour once, as a literal
`--color-<name>` in `@theme`; the font families, the shadows and the motion in `@theme`; and the
spacing, inset, layout-width, radius, font-size and glyph-size scales in `@theme inline` as CSS
lengths, `<name>` being the kebab case of the token's key path.

**Evidence:** `packages/tokens/scripts/generate.mjs:98`, `packages/tokens/scripts/generate.mjs:254`, `packages/tokens/scripts/generate.mjs:267`, `packages/tokens/scripts/generate.mjs:272`, `packages/tokens/scripts/generate.mjs:281`, `packages/tokens/scripts/generate.mjs:289`, `packages/tokens/theme.css:11`, `packages/tokens/theme.css:40`, `packages/tokens/theme.css:72`, `packages/tokens/theme.css:119`

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

**Evidence:** `packages/tokens/scripts/generate.mjs:404`, `packages/tokens/src/themeVars.constant.ts:13`, `packages/tokens/src/index.ts:2`

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

**Evidence:** `packages/tokens/src/tokens.constant.ts:206`, `packages/tokens/src/tokens.constant.ts:212`, `packages/tokens/src/tokens.constant.ts:289`, `packages/tokens/scripts/generate.mjs:152`, `packages/tokens/scripts/generate.mjs:202`, `packages/tokens/scripts/generate.mjs:206`, `packages/tokens/scripts/generate.mjs:360`

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

### Requirement: TOKENS-20 — The theme names list every token utility of the web theme

The tokens package SHALL export `themeNames`, which the generator writes into
`src/themeNames.constant.ts` from the declarations it writes into the web theme. For each Tailwind
namespace whose variables make a utility (color, container, ease, font, radius, shadow, spacing and
text), `themeNames` SHALL hold the sorted names of the web theme's tokens in that namespace, as
plain data. A namespace whose variables make no utility SHALL be left out by a named rule. Today
that is `duration`: Tailwind 4 builds `duration-*` from `--transition-duration-*`, so
`--duration-shimmer` is read only through `var()`.

**Evidence:** `packages/tokens/scripts/generate.mjs:177`, `packages/tokens/scripts/generate.mjs:444`, `packages/tokens/scripts/generate.mjs:447`, `packages/tokens/scripts/generate.mjs:488`, `packages/tokens/src/themeNames.constant.ts:13`, `packages/tokens/src/index.ts:1`, `packages/tokens/src/__tests__/themeNames.constant.test.ts:27`

#### Scenario: the names are tied to the web theme

- **GIVEN** the committed `theme.css` and `themeNames`
- **WHEN** every variable of its `@theme` and `@theme inline` blocks is mapped to the utility its
  namespace feeds
- **THEN** every name of a utility namespace is in `themeNames` under that namespace,
  `themeNames` names nothing the CSS does not declare, and every namespace the CSS declares is
  either mapped to a utility or excluded by a named rule
- **Test:** `packages/tokens/src/__tests__/themeNames.constant.test.ts` › "names every token utility theme.css declares, and nothing it does not"

#### Scenario: a namespace makes no utility

- **GIVEN** the web theme, which declares `--duration-shimmer`
- **WHEN** `themeNames` is read
- **THEN** it holds no `duration` namespace
- **Test:** `packages/tokens/src/__tests__/themeNames.constant.test.ts` › "leaves out a namespace whose variables make no utility, by its rule"

<!-- region web-next -->
#### Scenario: a listed name makes a utility

- **GIVEN** the web app's Tailwind and the generated web theme
- **WHEN** one utility of every name in `themeNames` is compiled, and `duration-shimmer`
- **THEN** each listed name produces a rule and `duration-shimmer` produces none
- **Test:** `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "lists only theme names the web's Tailwind turns into a utility"
<!-- endregion web-next -->

## Open questions

- **Q1** — Closed on 2026-11-15 by `openspec/changes/archive/2026-11-14-style-pillar/`: the web
  app loaded the preset through a Tailwind JavaScript config and `@config`. Superseded the same day
  by `openspec/changes/archive/2026-11-15-generated-tokens/`: the web app imports the generated
  theme and loads no JavaScript config (TOKENS-12, apps/web WEB-43).
- **Q2** — Closed on 2026-11-15 by `openspec/changes/archive/2026-11-15-generated-tokens/`: every
  output is generated from the source, so the preset's shadows and font families are the source's
  (TOKENS-13, TOKENS-19), and `verify:theme-sync` regenerates and compares every output
  (TOKENS-15).
