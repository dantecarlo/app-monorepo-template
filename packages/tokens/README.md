# @app/tokens

Every design-token value of both apps, light and dark, in one source, and the generator that
writes every output from it (decision 59 of `docs/INIT_AND_HARNESS_PLAN.md`).

| File                        | What it is                                                                              | Written by     |
| --------------------------- | --------------------------------------------------------------------------------------- | -------------- |
| `src/tokens.constant.ts`    | The source: colours per theme, spacing, insets, widths, radii, fonts, shadows, motion  | hand           |
| `scripts/generate.mjs`      | The generator                                                                           | hand           |
| `theme.css`                 | The web theme, imported by `apps/web/src/app/globals.css` as `@app/tokens/theme.css`   | the generator  |
| `tailwind-preset.cjs`       | The NativeWind preset `apps/mobile/tailwind.config.js` loads                            | the generator  |
| `src/themeVars.constant.ts` | The mobile theme variables, `themeVars`, exported from `@app/tokens`                    | the generator  |

React Native styles import the source directly (`colors`, `spacing`, `themes[active]`).

## Adding or changing a token

1. Write the value in `src/tokens.constant.ts`. A colour that never changes with the theme goes in
   `sharedColors`; a themed colour goes in both `darkColors` and `lightColors`, under the same key
   (it may hold one value in both, like `knob.on`).
2. Run `pnpm --filter @app/tokens generate`. It rewrites the outputs that changed and lists them.
3. Commit the source with the files it wrote.

Never edit a generated file: each starts with a header that says so, `.prettierignore` lists them,
and `pnpm verify:theme-sync` (inside `pnpm validate`) regenerates every output in memory and fails,
naming the file and its first differing line, while one differs from its regeneration.

## How a token is named

An output names a token by its key path in kebab case: `themes.dark.bg.base` is `bg-base`,
`accentSurface` is `accent-surface`, `fontSize.amountHero` is `amount-hero`, `inset.pillX` is
`pill-x`. So the source key decides the utility (`bg-bg-base`, `px-pill-x`, `text-amount-hero`).

| Source group                                    | Web theme (`theme.css`)                                         | NativeWind preset              |
| ----------------------------------------------- | --------------------------------------------------------------- | ------------------------------ |
| themed colour                                   | `--c-<name>` per theme, `--color-<name>: var(--c-<name>)`       | `colors`, the dark value       |
| `sharedColors`                                  | `--color-<name>`, a literal                                     | `colors`                       |
| `spacing`, `inset`                              | `--spacing-<name>` in `@theme inline`                           | `spacing`                      |
| `layoutWidth`                                   | `--container-<name>` in `@theme inline` (`max-w-<name>`)        | `maxWidth`                     |
| `radius`                                        | `--radius-<name>` in `@theme inline`                            | `borderRadius`                 |
| `fontSize`, `glyphSize`                         | `--text-<name>` (and `--line-height`) in `@theme inline`        | `fontSize`                     |
| `fontFamily`, `webFontVariable`, `fontFallback` | `--font-<name>: var(<loader variable>), <family>, <fallback>`   | `fontFamily`                   |
| `shadows`                                       | `--shadow-<name>`                                               | `boxShadow`                    |
| `motion`                                        | `--duration-<name>`, `--ease-<name>`                            | —                              |

The themed colours also reach `themeVars`, `{ dark: { '--c-<name>': value }, light: … }`, the map
NativeWind's `vars()` takes. The preset still carries the dark colours as literals, so the mobile
app renders exactly as before; pointing them at the `--c-*` variables and injecting `themeVars`
on a root view is the mobile light-theme work that follows.

## A new consumer

A new output is one more entry in `OUTPUTS` and one render function in `scripts/generate.mjs`;
`verify:theme-sync` picks it up, and nothing else changes.
