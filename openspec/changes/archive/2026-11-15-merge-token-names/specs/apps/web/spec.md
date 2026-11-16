# Delta: apps/web

> **Change:** `2026-11-15-merge-token-names`

## ADDED Requirements

### Requirement: WEB-44 — The shared tv merges every token name

The web app SHALL build the variants of every `ui/` style file with the shared `tv` of
`src/components/ui/variants.helper.ts`. Its tailwind-merge config SHALL register every name of
`themeNames` from `@app/tokens` under the tailwind-merge theme key of its namespace, so that:

- of two classes of one utility that carry token names, only the last stays;
- a shadow size and a shadow colour both stay;
- a token font size stays beside a text colour;
- every merge tailwind-merge already resolved resolves as before.

**Evidence:** written at apply time, when the code exists.

#### Scenario: two classes of one utility carry token names

- **GIVEN** a variant pair per namespace whose classes share a utility and carry token names,
  such as `p-sm p-lg`, `top-knob-inset top-sm`, `max-w-narrow max-w-wide`,
  `shadow-rim-light shadow-none` and `ease-shimmer ease-linear`
- **WHEN** the shared `tv` resolves each pair
- **THEN** only the last class stays
- **Test:** `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "keeps only the last of two classes of one utility that carry token names"

#### Scenario: a shadow size meets a shadow colour

- **GIVEN** `shadow-card shadow-accent`, its reverse, and two shadow sizes
- **WHEN** the shared `tv` resolves each
- **THEN** the size and the colour both stay, and of the two sizes only the last stays
- **Test:** `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "keeps a shadow size beside a shadow colour, and the last of two shadow sizes"

#### Scenario: a pair tailwind-merge already resolved

- **GIVEN** pairs that resolved before the token names were registered: two radii, two families,
  a family and a weight, a colour and a size, two sizes, two backgrounds, two text colours and
  two Tailwind durations
- **WHEN** the shared `tv` resolves each
- **THEN** each resolves as it did before
- **Test:** `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "resolves as before the pairs tailwind-merge already resolved"

#### Scenario: every theme name is registered

- **GIVEN** `themeNames` and the installed tailwind-merge
- **WHEN** each namespace is looked up among tailwind-merge's theme keys, and each name is
  resolved after the previous name of its namespace
- **THEN** every namespace is a theme key, and every name replaces the one before it
- **Test:** `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "registers every theme name of @app/tokens under a tailwind-merge theme key"

#### Scenario: a token font size meets a text colour

- **GIVEN** each token font size and glyph size beside a text colour
- **WHEN** a variant sets another text colour
- **THEN** the size stays and the later colour replaces the earlier one
- **Test:** `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "keeps every token font size beside a text colour"

#### Scenario: a ui block builds its variants

- **GIVEN** every `*.style.ts` file under `src/components/ui/`
- **WHEN** their imports are read
- **THEN** some build variants with `tv`, and none imports `tailwind-variants` directly
- **Test:** `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "is the tv every ui block builds its variants with"

#### Scenario: the ui blocks keep their classes

- **GIVEN** the resolved class string of every `ui/` block, for each variant and each `className`
  a caller passes
- **WHEN** it is resolved with the registered names
- **THEN** each string equals the one before the change, or drops a class a later class of the
  same utility overrides
- **Test:** Not covered — no committed test records every block's strings; the verify report
  records a one-off comparison before and after the change
