# Delta: apps/web

> **Change:** `2026-11-14-style-pillar`

## ADDED Requirements

### Requirement: WEB-39 — A screen or section only positions

The web app SHALL keep the look of a screen, a route entry and a container outside the component
blocks in a component block (`src/components/ui/`, or a screen's own `components/`): their class
strings and style props carry only layout, spacing, size, position, overflow and visibility.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a screen style carries a colour

- **GIVEN** a web screen style file whose class string holds a colour utility
- **WHEN** it is linted
- **THEN** `local/style-positions-only` reports the token and names where the look belongs
- **Test:** `eslint-local-rules/index.test.mjs` › "export const X = { TITLE: 'mt-lg text-accent-text' }"

#### Scenario: a component block keeps its look

- **GIVEN** a `components/ui` style file and a screen's own component style file with colour classes
- **WHEN** the scope of the rule is read
- **THEN** neither file is in scope, while a screen, a route entry and a container are
- **Test:** `eslint-local-rules/index.test.mjs` › "positions-only reads screens, routes and containers, never a component block"

#### Scenario: the shipped web sources only position

- **GIVEN** the web app's source
- **WHEN** `pnpm validate` lints it and runs `verify:allowlist-freshness`
- **THEN** no screen or section breaks the rule and the allowlist holds no web entry
- **Test:** Not covered — the gate reads the repository itself, and its cases run on scratch trees: `scripts/verify-allowlist-freshness.test.mjs` › "a violating file the list does not carry is named"

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

### Requirement: WEB-41 — Text, Divider and Screen carry the look screens used to hold

The web app SHALL render text in a screen through the `Text` block, whose variant, tone and weight
set its typography and colour, a labelled rule through the `Divider` block, and a screen's
surface through the `Screen` block, which fills the viewport and paints the base background.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a text variant renders

- **GIVEN** the `Text` block with the title variant on a paragraph
- **WHEN** it renders
- **THEN** the paragraph carries the display family, the title size, the semibold weight and the primary text colour
- **Test:** `apps/web/src/components/ui/Text/Text.component.test.tsx` › "renders a variant's typography on the element it is given"

#### Scenario: a tone and a weight are set

- **GIVEN** the `Text` block with the success tone and the semibold weight
- **WHEN** it renders
- **THEN** it carries the success text colour and the semibold weight, and no other typography
- **Test:** `apps/web/src/components/ui/Text/Text.component.test.tsx` › "applies the tone and the weight on their own"

#### Scenario: a labelled divider renders

- **GIVEN** the `Divider` block with a label
- **WHEN** it renders
- **THEN** the label sits between two divider rules hidden from assistive technology
- **Test:** `apps/web/src/components/ui/Divider/Divider.component.test.tsx` › "renders the label between two rules"

#### Scenario: a screen surface renders

- **GIVEN** the `Screen` block around content
- **WHEN** it renders
- **THEN** the content sits on a full-height surface painted with the base background
- **Test:** `apps/web/src/components/ui/Screen/Screen.component.test.tsx` › "paints the base background behind its children"
