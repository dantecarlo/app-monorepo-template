# Verify report: 2026-11-14-style-pillar

> **Verified:** 2026-11-15 at `8ee2f80`

## Scenarios

Each task wrote its scenario tests first and ran them before the code; the red column is what
that run showed.

| Requirement | Scenario | Test | Red before the code | Result |
| ----------- | -------- | ---- | ------------------- | ------ |
| WEB-39 | a screen style carries a colour | `eslint-local-rules/index.test.mjs` › "export const X = { TITLE: 'mt-lg text-accent-text' }" | `Rule must be an object with a create method`: no rule | green |
| WEB-39 | a component block keeps its look | `eslint-local-rules/index.test.mjs` › "positions-only reads screens, routes and containers, never a component block" | `isAllowlisted` and the scope exports did not exist | green |
| WEB-39 | the shipped web sources only position | Not covered | — | — |
| WEB-40 | a component holds an arbitrary value | `eslint-local-rules/index.test.mjs` › "export const X = { PILL: 'px-[11px] rounded-full' }" | no rule | green |
| WEB-40 | a palette colour stands in for a token | `eslint-local-rules/index.test.mjs` › "export const X = { DOT: 'bg-white/[0.08]', SCRIM: 'bg-black/60' }" | no rule | green |
| WEB-41 | a text variant renders | `apps/web/src/components/ui/Text/Text.component.test.tsx` › "renders a variant's typography on the element it is given" | `@/components/ui/Text/Text.component` does not resolve | green |
| WEB-41 | a tone and a weight are set | `apps/web/src/components/ui/Text/Text.component.test.tsx` › "applies the tone and the weight on their own" | does not resolve | green |
| WEB-41 | a labelled divider renders | `apps/web/src/components/ui/Divider/Divider.component.test.tsx` › "renders the label between two rules" | `@/components/ui/Divider/Divider.component` does not resolve | green |
| WEB-41 | a screen surface renders | `apps/web/src/components/ui/Screen/Screen.component.test.tsx` › "paints the base background behind its children" | `@/components/ui/Screen/Screen.component` does not resolve | green |
| WEB-42 | a screen imports a kit primitive | `eslint-local-rules/index.test.mjs` › "import * as Dialog from '@radix-ui/react-dialog'" | `Rule must be an object with a create method` | green |
| WEB-42 | a ui block wraps the kit | `eslint-local-rules/index.test.mjs` › "import { tv } from 'tailwind-variants'\nimport * as Dialog from '@radix-ui/react-dialog'" | no rule | green |
| MOBILE-05 | the light theme is active | Not covered | — | — |
| MOBILE-33 | the four viewport widths | `e2e/mobile-web.e2e.ts` › "no horizontal overflow and interactive controls within viewport" | not run: e2e is outside `pnpm validate` | not run |
| MOBILE-33 | the column at desktop width | Not covered | — | — |
| MOBILE-37 | a route crashes while rendering | `apps/mobile/src/components/RootErrorBoundary/RootErrorBoundary.component.test.tsx` › "renders the generic error state for a render crash", "calls retry when the retry control is pressed" | existing tests, kept green across the move to `Screen` | green |
| MOBILE-37 | the root layout exports the boundary | `apps/mobile/src/app/__tests__/_layout.test.tsx` › "exports the root error boundary as its ErrorBoundary" | existing test | green |
| MOBILE-38 | a screen StyleSheet entry carries a colour | `eslint-local-rules/index.test.mjs` › "export const S = StyleSheet.create({ title: { color: colors.text.primary, marginTop: 4 } })" | no rule | green |
| MOBILE-38 | a container paints its background inline | `eslint-local-rules/index.test.mjs` › "const B = () => <View style={{ backgroundColor: bg, flex: 1 }} />" | no rule; it went red again once the seeded allowlist listed the real boundary, and now names a container no list holds | green |
| MOBILE-39 | a style file spells a raw colour | `eslint-local-rules/index.test.mjs` › "export const GRADIENT = ['#FF8A3D', '#FF6A1A'] as const" | no rule | green |
| MOBILE-40 | a text variant renders | `apps/mobile/src/components/ui/Text/Text.component.test.tsx` › "renders a variant's typography" | `@/components/ui/Text/Text.component` does not resolve | green |
| MOBILE-40 | a labelled divider renders | `apps/mobile/src/components/ui/Divider/Divider.component.test.tsx` › "renders the label between two rules" | does not resolve | green |
| MOBILE-40 | a themed screen surface renders | `apps/mobile/src/components/ui/Screen/Screen.component.test.tsx` › "paints the dark base, or the active theme's base when themed" | does not resolve | green |
| MOBILE-41 | a screen-local component imports the gradient | `eslint-local-rules/index.test.mjs` › "import { LinearGradient } from 'expo-linear-gradient'" | no rule; the real `DashboardHeader` and dashboard screen failed lint until the gradient moved into `AccentGradient` | green |
| MOBILE-41 | the gradient renders through its block | `apps/mobile/src/components/ui/AccentGradient/AccentGradient.component.test.tsx` › "paints the accent gradient behind its children" | does not resolve | green |
| TOKENS-12 | a Tailwind config loads the preset | `scripts/verify-theme-sync.test.mjs` › "the shipped copies agree" | pins the old behaviour: green before and after | green |
| TOKENS-12 | the web app loads the preset | `apps/web/src/app/globals.test.ts` › "loads the tokens preset through the CSS entry" | with the `@config` line removed: expected the CSS to contain it | green |
| TOKENS-13 | a Tailwind config resolves a spacing utility | `packages/tokens/src/__tests__/preset.test.ts` › "the preset carries every scale token as a CSS length" | against the old preset: `knob-inset` missing | green |
| TOKENS-14 | the preset carries the new scales | `packages/tokens/src/__tests__/preset.test.ts` › "the preset carries every scale token as a CSS length" | same run | green |
| TOKENS-15 | a theme-invariant colour drifts in the light theme | `scripts/verify-theme-sync.test.mjs` › "a light-theme drift of a theme-invariant colour is caught" | on the refactored gate before the comparison: expected 1 finding, got 0 | green |
| TOKENS-15 | a themed colour drifts in the light theme | `scripts/verify-theme-sync.test.mjs` › "a light-theme drift of a themed colour is caught" | pins the old behaviour: green before and after | green |

The freshness gate went red for its stated reason too: with its stale check removed, "an entry
whose file no longer breaks its rule is stale" expected 1 finding and got 0, with six more cases.

## Rendering

The compiled web CSS (`@tailwindcss/postcss` over `apps/web`, before and after each unit) holds
the same values: the preset's scales become literals where `var(--spacing-*)` stood, and every
arbitrary class is replaced by a token or scale class of the same value. Three looks now follow a
component block or a token where the screen had drifted from it:

- the web login submit renders `Button` primary (the label is `text-button` bold, and gains the
  focus ring and press scale) instead of a hand copy at `text-body` semibold;
- the mobile "View all" call to action renders `Button` primary, the solid accent with its glow,
  instead of a hand-built gradient;
- the white overlays (`bg-white/[0.08]`, `bg-white/[0.06]`, `border-white/[0.06]`) and the black
  scrim (`bg-black/60`) become `neutral-tint`, `divider` and `scrim`: equal in the dark theme, and
  following the light theme on web.

## Gate

- `pnpm validate` (`ATL_TEMPLATE_SELF=1`): exit 1, 2026-11-15, at `verify:specs` only, which asks
  for this report once every task is done. Every later gate then ran one by one and exited 0:
  `git-free-env:test`, `report:spec-drift:test`, `report:spec-drift`, `verify:english:test`,
  `verify:english`, `verify:instruction-entry:test`, `verify:instruction-entry`,
  `codex-budget:test`, `verify:maps`, `check:identity`, `init-project:test`, `verify:pairing`,
  `verify:structure`, `verify:security`, `verify:theme-sync:test`, `verify:theme-sync`,
  `docs:diagrams:check`, the i18n tests and `knip`.
- `pnpm --filter @app/web build`: exit 1 on the first run (Turbopack could not resolve the
  `next/font/google` files), exit 0 on the second.
- `pnpm --filter @app/mobile export:web`: exit 0.

## Not verified

- WEB-39 "the shipped web sources only position": the gate reads the repository, and its cases
  run on scratch trees; `verify:allowlist-freshness` passes over the real sources with 0 entries.
- MOBILE-05 and MOBILE-33's column width: no test renders the root layout or measures the column.
- MOBILE-33's viewport widths: the opt-in mobile-web e2e was not run.
- Rendering on a device: the mobile changes were checked through the test double and the web
  export bundle, not on iOS or Android.
