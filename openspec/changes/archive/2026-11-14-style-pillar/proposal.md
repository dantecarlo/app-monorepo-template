# Proposal: the styling pillar, and the web app on the tokens preset

> **Status:** archived — 2026-11-15

## Why

Screen-local style files on both apps hold colour and type classes, both apps hold arbitrary
values and raw hex in style files, and nothing checks either (follow-up F26 of
`docs/INIT_AND_HARNESS_PLAN.md`). The web app does not load the Tailwind preset that
`packages/tokens/src/tokens.constant.ts:3` says it does, and `scripts/verify-theme-sync.mjs`
never compares the theme-invariant colours of the light theme (F13; packages/tokens Q1 and Q2).

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The
  screen or section files must contain only positioning, and the components are what must hold
  the other styles, but everything centralized in styles and the tokens. Fix everything you
  mention applying what is recommended, and once everything is fixed tell the Arquitecto to
  integrate it and fix everything"
- 2026-11-15 (translated from Spanish): "and always think, when building something, that
  everything should be adaptable: if for example tomorrow shadcn is not used and Material UI or
  another is wanted, the change should be relatively decoupled and 'easy' to make", and "the same
  for everything that is not core, always decoupled and adapted"

## What changes

- **The rule.** `local/style-positions-only` (ported from Certifipago and widened to both apps):
  a screen, a route entry or a container outside the component blocks only positions, in its
  Tailwind and NativeWind classes, its React Native StyleSheet entries and its style slots.
  `local/style-token-values`: every style file and view of both apps takes its values from the
  tokens, with no raw colour, no Tailwind palette colour and no arbitrary value. Both read one
  scope and one detection, `eslint-local-rules/style-positioning.detect.mjs`.
- **The UI kit sits behind `components/ui`** (the owner's decision of 2026-11-15):
  `local/ui-kit-boundary` refuses, outside `components/ui/**` of both apps, an import of a UI kit,
  its headless primitives or its class helpers (`@radix-ui/*`, `class-variance-authority`,
  `tailwind-variants`, `@mui/*`, `expo-linear-gradient`, `react-native-svg`, …), so swapping the
  kit rewrites `components/ui` and nothing else. The one import that broke it, the mobile
  dashboard header's gradient, moves into the new `AccentGradient` block.
- **The list that only shrinks.** `eslint-style-positioning-allowlist.json` is seeded with every
  file that breaks a rule when the rules land; `verify:allowlist-freshness` fails an entry whose
  file no longer breaks its rule and a violation the list does not carry. The change ends with
  the list empty.
- **The web app loads the tokens preset** (`apps/web/tailwind.config.ts`, `@config` in
  `globals.css`): its spacing, radius and type scales come from `@app/tokens`, and the copies in
  `globals.css` are deleted. The colours stay in `globals.css`, which flips them per theme.
- **`verify-theme-sync` compares every colour of both themes**, the theme-invariant ones
  included, against `globals.css` and the preset, and gains its test.
- **Both apps refactored to the rule.** The look leaves the screens, the routes, the root error
  boundary and the shared `helpers/style.constant.ts` (renamed `helpers/layout.style.ts`, which
  keeps positioning only) for new `ui/` blocks, `Text`, `Divider` and `Screen` on each app, and
  for the existing `Button` and the screens' own components. Raw colours and arbitrary values
  move to tokens: the layout widths, the glyph sizes, the pill and knob insets and the
  `warningStroke` colour are added to `packages/tokens`.
- **The LAW** "Styling lives in the components" in `AGENTS.md` and §22 of
  `docs/code-standards.md`, and the skills and architecture docs that show styling.

## Out of scope

- A number in a React Native style (`borderRadius: 18`) and a class string in a `*.constant.ts`:
  the rules do not read either, and both are named as not covered.
- The light theme on mobile (F12): the dashboard keeps the dark palette it paints today, and the
  new mobile `Screen` block paints the theme only where the code already did.
- Comparing the preset's scales and the CSS shadows (the rest of packages/tokens Q2): the web
  copies of the scales are deleted instead, and the shadows stay one copy used by `.glass-card`.

## Affected specs

- `openspec/specs/apps/web/spec.md`: adds WEB-39, WEB-40, WEB-41 and WEB-42
- `openspec/specs/apps/mobile/spec.md`: adds MOBILE-38, MOBILE-39, MOBILE-40 and MOBILE-41; modifies
  MOBILE-05, MOBILE-33 and MOBILE-37, whose evidence moves
- `openspec/specs/packages/tokens/spec.md`: adds TOKENS-14 and TOKENS-15; modifies TOKENS-12 and
  TOKENS-13
