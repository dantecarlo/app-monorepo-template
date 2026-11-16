# Proposal: generate every token output from one source

> **Status:** archived — 2026-11-15

## Why

The colours of both themes are written four times by hand: in
`packages/tokens/src/tokens.constant.ts`, in the `[data-theme]` blocks and the `@theme` block of
`apps/web/src/app/globals.css`, and in `packages/tokens/tailwind-preset.cjs`; the font stacks and
the shadows are written in both of the last two as well. `scripts/verify-theme-sync.mjs` reads the
copies with regular expressions and compares the colours only, so the shadows and the font
families are compared with nothing (packages/tokens Q2). The web app reaches the preset through a
JavaScript config bridge, `@config` in `globals.css` and `apps/web/tailwind.config.cjs`, so a
consumer that is not Tailwind has no output it can read. Decision 59 and row F.12 of
`docs/INIT_AND_HARNESS_PLAN.md` settle the fix: one source, one generator, one writer per output
and a drift gate that regenerates and diffs (decision 15).

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the
  other styles, but everything centralized in styles and the tokens. Fix everything you mention
  applying what is recommended, and once everything is fixed tell the Arquitecto to integrate it
  and fix everything"
- 2026-11-15, relayed by the Certifipago - Arquitecto session (translated from Spanish): "Talk
  with the template about your third option and see if we can standardise it; we don't want to
  be tied to anything, everything must be adaptable, and that's why I like your third option"

## What changes

- **One source.** `packages/tokens/src/tokens.constant.ts` holds every value an output carries.
  The theme-invariant colours become one exported group, `sharedColors` (the accent ramp and the
  cool glow), spread into both themes. It gains the generic font fallback, the CSS variable each
  web font loader sets, and the shimmer motion (duration and easing) that `globals.css` spells
  by hand today. The knob inset is renamed `knobInset`, so every utility name is the kebab case
  of its token's key.
- **One generator.** `packages/tokens/scripts/generate.mjs`, run as
  `pnpm --filter @app/tokens generate`, writes three files, each under a header that names the
  generator and says not to edit it:
  - `packages/tokens/theme.css`, the web theme: the `--c-*` variables of the dark theme in
    `:root, [data-theme='dark']` and of the light theme in `[data-theme='light']`, the `@theme`
    block (every colour, the font families, the shadows and the motion), and the scales in
    `@theme inline`, so the utilities keep inlining their values as they do through the preset
    today;
  - `packages/tokens/tailwind-preset.cjs`, the NativeWind preset, with the dark theme's colours
    and the scales, as today;
  - `packages/tokens/src/themeVars.constant.ts`, the mobile `themeVars` map: the `--c-*` value of
    every themed colour per theme, the input of NativeWind's `vars()`, exported from
    `@app/tokens`.
- **The web reads its theme as CSS.** `globals.css` imports `@app/tokens/theme.css` and drops
  `@config`; `apps/web/tailwind.config.cjs` is deleted, so the web loads no JavaScript config.
- **Hand-written CSS that stays**, in `globals.css`, each rule reading every colour, shadow, font
  and motion value through a generated variable and spelling no colour:
  - `.glass-card`: twelve `ui/` blocks compose it by class name, and `e2e/glass.e2e.ts` selects
    `.glass-card` and asserts the served bytes hold `-webkit-backdrop-filter:blur(26px)`, which a
    Tailwind `backdrop-blur-*` utility or a `var()` cannot produce, so its 26px blur and its 1px
    hairline stay literal;
  - the document body and its aurora: no component renders `<body>`;
  - `.bg-accent-gradient` and `.animate-shimmer` with its keyframes: utilities several `ui/`
    blocks compose, whose geometry (angle, stops, background size) is not a token.
- **The drift gate.** `verify:theme-sync` keeps its name and becomes the regenerate-and-diff
  check: it renders every output in memory from the source and fails on any difference with the
  committed file, naming the file, its first differing line and the command that regenerates it.
- **Prettier.** The three generated files are listed in `.prettierignore`: the generator is their
  one writer, as for the agent projections.
- **Docs and skills:** the tokens package README (new), `docs/architecture/web.md`,
  `docs/architecture/mobile.md`, `docs/harness.md`, `docs/code-standards.md`,
  `docs/maps/global-map.md`, and the `arch` and `component` skills.

## Out of scope

- Wiring `themeVars` into the mobile app, and pointing the preset's colours at the `--c-*`
  variables, so NativeWind classes follow the light theme: that is the mobile light-theme fix of
  F12 in F.5, which waits for this change. Here the preset keeps the dark values, so nothing the
  mobile app renders changes.
- Moving `.glass-card` into a `ui/` block: it needs `e2e/glass.e2e.ts` and the twelve `ui/` style
  files that compose it, outside this change.
- The mobile animation durations (`SHIMMER_DURATION`, `ANIMATE_DURATION_MS`): component constants,
  not a hand-kept copy of a token output.
- Porting to Certifipago: the Arquitecto adopts the generator when this merges, adding a target
  for any output it has and the template does not.

## Affected specs

- `openspec/specs/packages/tokens/spec.md`: TOKENS-16, TOKENS-17, TOKENS-18 and TOKENS-19 added;
  TOKENS-05, TOKENS-12, TOKENS-13, TOKENS-14 and TOKENS-15 modified.
- `openspec/specs/apps/web/spec.md`: WEB-43 added; WEB-40 modified (its evidence cited the
  deleted config).
