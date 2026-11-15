# Delta: apps/web

> **Change:** `2026-11-15-generated-tokens`

## ADDED Requirements

### Requirement: WEB-43 — The web theme is the generated CSS, with no JS config

The web app SHALL read every token value from the generated `@app/tokens/theme.css`, which
`src/app/globals.css` imports, and load no Tailwind JavaScript config; the rules `globals.css` still
writes by hand (the glass card, the document body and its aurora, the accent gradient and the
shimmer) SHALL read every colour, shadow, font and motion value through a variable the generated
theme declares, and spell no colour; and the root layout SHALL load each font family under the CSS
variable the tokens name for it.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the CSS entry is read

- **GIVEN** the web app's CSS entry
- **WHEN** it is read
- **THEN** it imports the generated theme, holds no `@config`, and no `tailwind.config.cjs` exists
- **Test:** `apps/web/src/app/__tests__/globals.test.ts` › "imports the generated theme and loads no JS config"

#### Scenario: a hand-written rule reads a value

- **GIVEN** the hand-written rules of the CSS entry and the generated theme
- **WHEN** every variable the rules read is looked up in the generated theme
- **THEN** each is declared there, and the rules spell no hex or colour function
- **Test:** `apps/web/src/app/__tests__/globals.test.ts` › "reads every colour, shadow, font and motion value of its own rules from a generated variable"

#### Scenario: the layout loads the fonts

- **GIVEN** the root layout and the tokens
- **WHEN** the layout's font loaders are read
- **THEN** each family is loaded under the variable the generated theme reads for it
- **Test:** `apps/web/src/app/__tests__/layout.test.tsx` › "loads each family under the variable the generated theme reads"

#### Scenario: the served pages render in both themes

- **GIVEN** the built app served by the production server
- **WHEN** the home and login pages are opened in the dark and the light theme
- **THEN** every element computes the same style it did through the preset bridge
- **Test:** Not covered — no committed test renders both themes; the verify report records a
  one-off Playwright comparison of computed styles and screenshots before and after the change,
  and `e2e/glass.e2e.ts` covers the dark glass card only

## MODIFIED Requirements

### Requirement: WEB-40 — Every web style value is a token

The web app SHALL take every value of its style files and views from `@app/tokens` or a step of
Tailwind's scale: no raw colour, no Tailwind palette colour and no arbitrary value.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a component holds an arbitrary value

- **GIVEN** a `components/ui` style file with an arbitrary padding
- **WHEN** it is linted
- **THEN** `local/style-token-values` reports the token
- **Test:** `eslint-local-rules/index.test.mjs` › "export const X = { PILL: 'px-[11px] rounded-full' }"

#### Scenario: a palette colour stands in for a token

- **GIVEN** a style file with a white overlay and a black scrim from Tailwind's palette
- **WHEN** it is linted
- **THEN** the arbitrary overlay and the palette scrim are each reported
- **Test:** `eslint-local-rules/index.test.mjs` › "export const X = { DOT: 'bg-white/[0.08]', SCRIM: 'bg-black/60' }"
