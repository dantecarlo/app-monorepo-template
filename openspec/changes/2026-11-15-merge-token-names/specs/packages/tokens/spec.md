# Delta: packages/tokens

> **Change:** `2026-11-15-merge-token-names`

## ADDED Requirements

### Requirement: TOKENS-20 — The theme names list every token utility of the web theme

The tokens package SHALL export `themeNames`, which the generator writes into
`src/themeNames.constant.ts` from the declarations it writes into the web theme. For each Tailwind
namespace whose variables make a utility (color, container, ease, font, radius, shadow, spacing and
text), `themeNames` SHALL hold the sorted names of the web theme's tokens in that namespace, as
plain data. A namespace whose variables make no utility SHALL be left out by a named rule. Today
that is `duration`: Tailwind 4 builds `duration-*` from `--transition-duration-*`, so
`--duration-shimmer` is read only through `var()`.

**Evidence:** written at apply time, when the code exists.

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

#### Scenario: a listed name makes a utility

- **GIVEN** the web app's Tailwind and the generated web theme
- **WHEN** one utility of every name in `themeNames` is compiled, and `duration-shimmer`
- **THEN** each listed name produces a rule and `duration-shimmer` produces none
- **Test:** `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "lists only theme names the web's Tailwind turns into a utility"

## MODIFIED Requirements

### Requirement: TOKENS-15 — Every generated output equals its regeneration

The repository SHALL fail `pnpm verify:theme-sync` when a generated token output differs from what
the generator writes from the current source, or is missing, naming the file, its first differing
line and the command that regenerates it.

**Evidence:** `scripts/verify-theme-sync.mjs:50`, `scripts/verify-theme-sync.mjs:76`, `scripts/verify-theme-sync.mjs:90`, `scripts/verify-theme-sync.mjs:103`

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
- **THEN** it reports the web theme, the preset and the mobile theme variables, every output that
  carries the dark colours
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

**Evidence:** written at apply time, when the code exists.

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
