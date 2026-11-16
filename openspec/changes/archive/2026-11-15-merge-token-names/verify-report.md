# Verify report: 2026-11-15-merge-token-names

> **Verified:** 2026-11-16 at `00c4a64`

## Scenarios

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| TOKENS-15 | a generated file is edited by hand | `scripts/verify-theme-sync.test.mjs` › "a planted edit in the web theme is caught" | green |
| TOKENS-15 | a generated file is edited by hand | `scripts/verify-theme-sync.test.mjs` › "a planted edit in the preset is caught" | green |
| TOKENS-15 | a generated file is edited by hand | `scripts/verify-theme-sync.test.mjs` › "a planted edit in the mobile theme variables is caught" | green |
| TOKENS-15 | a generated file is edited by hand | `scripts/verify-theme-sync.test.mjs` › "a planted edit in the theme names is caught" | green |
| TOKENS-15 | the source changes and nobody regenerates | `scripts/verify-theme-sync.test.mjs` › "a source change that was not regenerated is caught in every output it reaches" | green |
| TOKENS-15 | a token is renamed and nobody regenerates | `scripts/verify-theme-sync.test.mjs` › "a renamed token that was not regenerated is caught in the theme names too" | green |
| TOKENS-15 | the outputs are current | `scripts/verify-theme-sync.test.mjs` › "the shipped outputs equal their regeneration" | green |
| TOKENS-15 | the outputs are current | `scripts/verify-theme-sync.test.mjs` › "the gate exits 0 over the shipped outputs" | green |
| TOKENS-16 | the generator runs | `packages/tokens/scripts/__tests__/generate.test.ts` › "writes every output under its do-not-edit header, and rewrites nothing on a second run" | green |
| TOKENS-16 | a token is added to the source | `packages/tokens/scripts/__tests__/generate.test.ts` › "a token added to the source reaches every output that carries its group" | green |
| TOKENS-20 | the names are tied to the web theme | `packages/tokens/src/__tests__/themeNames.constant.test.ts` › "names every token utility theme.css declares, and nothing it does not" | green |
| TOKENS-20 | a namespace makes no utility | `packages/tokens/src/__tests__/themeNames.constant.test.ts` › "leaves out a namespace whose variables make no utility, by its rule" | green |
| TOKENS-20 | a listed name makes a utility | `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "lists only theme names the web's Tailwind turns into a utility" | green |
| WEB-44 | two classes of one utility carry token names | `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "keeps only the last of two classes of one utility that carry token names" | green |
| WEB-44 | a shadow size meets a shadow colour | `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "keeps a shadow size beside a shadow colour, and the last of two shadow sizes" | green |
| WEB-44 | a pair tailwind-merge already resolved | `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "resolves as before the pairs tailwind-merge already resolved" | green |
| WEB-44 | every theme name is registered | `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "registers every theme name of @app/tokens under a tailwind-merge theme key" | green |
| WEB-44 | a token font size meets a text colour | `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "keeps every token font size beside a text colour" | green |
| WEB-44 | a ui block builds its variants | `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "is the tv every ui block builds its variants with" | green |
| WEB-44 | the ui blocks keep their classes | Not covered by a committed test; the one-off comparison below | identical |

### Red before green

| Task | Rule | Observed red |
| ---- | ---- | ------------ |
| T1 | the theme names are tied to `theme.css` | `Cannot find package '@/themeNames.constant'` |
| T1 | the generator writes four outputs | `expected 'generate: 3 output(s) from src/tokens…' to contain '4 written'` |
| T1 | a new token reaches the theme names | `expected '' to match /spacing: \[[^\]]*'4xl'/` |
| T1 | the drift gate covers the theme names | `a planted edit in the theme names is caught: expected 1 finding(s), got 0` |
| T1 | a rename reaches the theme names | `a renamed token that was not regenerated is caught in the theme names too: expected 3 finding(s), got 2` |
| T2 | the last of two token classes stays | `expected [ 'p-sm p-lg', …(13) ] to deeply equal [ 'p-lg', 'px-lg', 'p-lg', …(11) ]`: 8 of the 14 pairs (spacing, insets, container, shadow, ease) kept both classes |
| T2 | a shadow size beside a shadow colour | `expected 'shadow-accent' to be 'shadow-card shadow-accent'` |
| T2 | every theme name is registered | `expected [ 'bg-accent-ink', …(60) ] to deeply equal [ 'bg-accent-ink', …(60) ]`: every container and spacing pair kept both classes |

These tests passed before the change and pin what it keeps: "resolves as before the pairs
tailwind-merge already resolved", "keeps every token font size beside a text colour", "lets a
later token font size replace an earlier one", "merges every other class as tailwind-merge does
by default" and "is the tv every ui block builds its variants with".

"lists only theme names the web's Tailwind turns into a utility" passed on its first run, because
the list of T1 already holds only names that make a utility. To show it can fail, the generator's
`duration` exclusion was removed and the outputs regenerated, then restored with `git checkout`.
Four tests failed:

- the compile test: `expected [ 'duration-shimmer' ] to deeply equal []`;
- the registration test: `expected [ 'duration' ] to deeply equal []`, since `duration` is no
  tailwind-merge theme key;
- the tie test: `expected { color: [ 'accent', …(29) ], …(8) } to deeply equal { color: [ 'accent', …(29) ], …(7) }`;
- the exclusion test, which fails with its rule as the message.

### The probe pairs

Each pair resolved through the shared `tv`, before (`af0c84e`) and after (`c391346`):

| Input | Before | After |
| --- | --- | --- |
| `p-sm p-lg` | `p-sm p-lg` | `p-lg` |
| `px-pill-x px-lg` | `px-pill-x px-lg` | `px-lg` |
| `px-pill-x p-lg` | `px-pill-x p-lg` | `p-lg` |
| `py-pill-y py-sm` | `py-pill-y py-sm` | `py-sm` |
| `p-lg px-pill-x` | `p-lg px-pill-x` | `p-lg px-pill-x` |
| `gap-xs gap-xl` | `gap-xs gap-xl` | `gap-xl` |
| `top-knob-inset top-sm` | `top-knob-inset top-sm` | `top-sm` |
| `w-content w-dialog` | `w-content w-dialog` | `w-dialog` |
| `max-w-narrow max-w-wide` | `max-w-narrow max-w-wide` | `max-w-wide` |
| `rounded-sm rounded-xl` | `rounded-xl` | `rounded-xl` |
| `rounded-lg rounded-full` | `rounded-full` | `rounded-full` |
| `shadow-rim-light shadow-none` | `shadow-rim-light shadow-none` | `shadow-none` |
| `shadow-card shadow-accent` | `shadow-accent` | `shadow-card shadow-accent` |
| `shadow-accent shadow-card` | `shadow-card` | `shadow-accent shadow-card` |
| `shadow-accent-glow shadow-card` | `shadow-card` | `shadow-card` |
| `shadow-card shadow-accent-glow` | `shadow-accent-glow` | `shadow-accent-glow` |
| `ease-shimmer ease-linear` | `ease-shimmer ease-linear` | `ease-linear` |
| `duration-300 duration-500` | `duration-500` | `duration-500` |
| `font-body font-display` | `font-display` | `font-display` |
| `font-display font-bold` | `font-display font-bold` | `font-display font-bold` |
| `text-accent text-button` | `text-accent text-button` | `text-accent text-button` |
| `text-caption text-title` | `text-title` | `text-title` |
| `text-initials-sm text-initials-lg` | `text-initials-lg` | `text-initials-lg` |
| `bg-bg-base bg-accent` | `bg-accent` | `bg-accent` |
| `text-text-primary text-accent-text` | `text-accent-text` | `text-accent-text` |

Before, 12 of the 25 pairs were wrong. After, none are. The pair `duration-shimmer duration-300`
of the first measurement is gone: `duration-shimmer` makes no rule, so there is nothing to merge.

### The ui class strings

Every `tv` export of every `apps/web/src/components/ui/**/*.style.ts` file was resolved with the
web test config:

- with every combination of its variants, `undefined` included;
- with each slot of a slotted block;
- with each `className` a caller passes: `AUTH_SHELL_FORM_CLASS`, `LAYOUT.CONTENT_AREA`,
  `ITEMS_DASHBOARD.VIEW_ALL_BUTTON`, `ITEMS_SUMMARY.CARD`, `ITEMS_SUMMARY.TITLE` and
  `ITEMS_SUMMARY.ROW`.

That gave 442 class strings, recorded at `af0c84e` and again at `c391346`. **0 of 442 changed.**
No block holds two classes of one utility that carry token names, so the change removes no class
from what ships. It changes only what a future variant or `className` that overrides a token class
resolves to.

### The duration finding

Every listed name was compiled through the web's Tailwind 4.3.1 with the generated theme, and each
produced a rule; `duration-shimmer` produced none, while `duration-300` produced
`transition-duration: 300ms`. Tailwind's `duration` utility resolves its value from
`--transition-duration-*`. `--duration-shimmer` stays as `theme.css` writes it, read through
`var()` by `.animate-shimmer` in `apps/web/src/app/globals.css`.

## Gate

- `pnpm --filter @app/web build`: exit 0, 2026-11-16.
- `pnpm smoke:web`: exit 0, 2026-11-16, `OK: HTTP 200 and marker present`.
- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-16 (`report:spec-drift` lists packages/tokens and apps/web, the two specs this change archives into).

## Not verified

- WEB-44 "the ui blocks keep their classes" has no committed test; the comparison above ran once.
- The served pages were not compared in a browser: no class string changed, so the compiled CSS
  and the rendered markup cannot differ.
