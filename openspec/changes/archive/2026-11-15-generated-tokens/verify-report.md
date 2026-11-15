# Verify report: 2026-11-15-generated-tokens

> **Verified:** 2026-11-15 at `570257b`

## Scenarios

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| TOKENS-05 | a shared colour is read from each theme | `packages/tokens/src/__tests__/tokens.constant.test.ts` › "both themes carry the shared colours" | green |
| TOKENS-12 | a Tailwind config resolves a colour | `packages/tokens/__tests__/tailwind-preset.test.ts` › "the preset carries every colour of the dark theme" | green |
| TOKENS-12 | the web app loads no JavaScript config | `apps/web/src/app/__tests__/globals.test.ts` › "imports the generated theme and loads no JS config" | green |
| TOKENS-13 | a Tailwind config resolves a spacing utility | `packages/tokens/__tests__/tailwind-preset.test.ts` › "the preset carries every scale token as a CSS length" | green |
| TOKENS-13 | the web theme carries the scales | `packages/tokens/scripts/__tests__/generate.test.ts` › "inlines every scale in @theme inline as a CSS length" | green |
| TOKENS-14 | the preset carries the new scales | `packages/tokens/__tests__/tailwind-preset.test.ts` › "the preset carries every scale token as a CSS length" | green |
| TOKENS-15 | a generated file is edited by hand | `scripts/verify-theme-sync.test.mjs` › "a planted edit in the web theme is caught" | green |
| TOKENS-15 | a generated file is edited by hand | `scripts/verify-theme-sync.test.mjs` › "a planted edit in the preset is caught" | green |
| TOKENS-15 | a generated file is edited by hand | `scripts/verify-theme-sync.test.mjs` › "a planted edit in the mobile theme variables is caught" | green |
| TOKENS-15 | the source changes and nobody regenerates | `scripts/verify-theme-sync.test.mjs` › "a source change that was not regenerated is caught in every output it reaches" | green |
| TOKENS-15 | the outputs are current | `scripts/verify-theme-sync.test.mjs` › "the shipped outputs equal their regeneration" | green |
| TOKENS-15 | the outputs are current | `scripts/verify-theme-sync.test.mjs` › "the gate exits 0 over the shipped outputs" | green |
| TOKENS-16 | the generator runs | `packages/tokens/scripts/__tests__/generate.test.ts` › "writes every output under its do-not-edit header, and rewrites nothing on a second run" | green |
| TOKENS-16 | a token is added to the source | `packages/tokens/scripts/__tests__/generate.test.ts` › "a token added to the source reaches every output that carries its group" | green |
| TOKENS-17 | a themed colour is read in each theme | `packages/tokens/scripts/__tests__/generate.test.ts` › "declares every themed colour in both theme blocks and maps it in @theme" | green |
| TOKENS-17 | a shared colour is read | `packages/tokens/scripts/__tests__/generate.test.ts` › "writes every shared colour once, as a literal in @theme" | green |
| TOKENS-17 | a scale reaches its utilities | `packages/tokens/scripts/__tests__/generate.test.ts` › "inlines every scale in @theme inline as a CSS length" | green |
| TOKENS-18 | a theme's variables are read | `packages/tokens/src/__tests__/themeVars.constant.test.ts` › "maps every themed colour of each theme to its --c- variable" | green |
| TOKENS-18 | a shared colour is looked up | `packages/tokens/src/__tests__/themeVars.constant.test.ts` › "carries no shared colour" | green |
| TOKENS-19 | the web theme reads the font stacks and the motion | `packages/tokens/scripts/__tests__/generate.test.ts` › "writes each font stack with its loader variable and fallback, and the shimmer motion" | green |
| TOKENS-19 | the preset reads the font stacks | `packages/tokens/__tests__/tailwind-preset.test.ts` › "the preset writes each font family before its fallback" | green |
| WEB-40 | a component holds an arbitrary value | `eslint-local-rules/index.test.mjs` › "export const X = { PILL: 'px-[11px] rounded-full' }" | green |
| WEB-40 | a palette colour stands in for a token | `eslint-local-rules/index.test.mjs` › "export const X = { DOT: 'bg-white/[0.08]', SCRIM: 'bg-black/60' }" | green |
| WEB-43 | the CSS entry is read | `apps/web/src/app/__tests__/globals.test.ts` › "imports the generated theme and loads no JS config" | green |
| WEB-43 | a hand-written rule reads a value | `apps/web/src/app/__tests__/globals.test.ts` › "reads every colour, shadow, font and motion value of its own rules from a generated variable" | green |
| WEB-43 | the layout loads the fonts | `apps/web/src/app/__tests__/layout.test.tsx` › "loads each family under the variable the generated theme reads" | green |
| WEB-43 | the served pages render in both themes | Not covered by a committed test; the one-off render check below | identical |

### Red before green

| Task | Rule | Observed red |
| ---- | ---- | ------------ |
| T1 | shared colours | `expected undefined to deeply equal { accent: '#FF6A1A', …(4) }` |
| T1 | font fallback, web font variables, motion | `expected undefined to be 'sans-serif'` |
| T1 | inset keys are the utility names | `expected { xs: '4px', sm: '8px', …(8) } to deeply equal { '2xl': '24px', …(8) }` (the `knob` key against `knob-inset`) |
| T2 | the generator | `Cannot find module '../generate.mjs'` |
| T2 | the mobile theme variables | `Cannot find package '@/themeVars.constant'` |
| T2 | the drift gate, against the base gate | planted edits in the web theme, the preset and the theme variables, and a missing output: `expected 1 finding(s), got 0`; a source change: `expected 3, got 2`; a light source change: `expected 2, got 1`; an unreadable source: `expected 1, got 10` |
| T3 | the CSS entry | `expected '@import \'tailwindcss\';\r\n@config \…' to contain '@import \'@app/tokens/theme.css\';'` |
| T3 | the hand-written rules | `expected [ '--font-inter', '--font-montserrat' ] to deeply equal []`: the hand-kept font stacks read variables the generated theme does not declare |

The preset tests for the dark colours, the font stacks and the shadows, and the layout test for the
font variables, passed before the change: they pin the behaviour the generated files keep.

### The drift gate on the real tree

Planted, run, then restored with `git checkout`:

- `--c-bg-base: #0A0B0D` edited to `#0A0B0E` in `packages/tokens/theme.css`: exit 1, one finding,
  `drift: packages/tokens/theme.css differs from its regeneration at line 15`.
- the dark `raised: '#101216'` edited to `#101217` in `tokens.constant.ts`, not regenerated: exit 1,
  three findings, the preset (line 25), the theme variables (line 18) and the web theme (line 16).
- restored: exit 0.

### Nothing visual changes

- **Web compiled CSS** (`pnpm --filter @app/web build` at `b047c24` and at `06306df`, the built
  stylesheet parsed and every `var()` resolved with the root variables of each theme): 318 rules
  before and after, none added or removed; every declaration of every rule resolves to the same
  value in the dark and the light theme; all 79 root custom properties of each theme are
  unchanged. Added: `--duration-shimmer: 1.6s` and `--ease-shimmer: linear`, the motion tokens
  the shimmer now reads. The scales stay inlined (`.gap-sm{gap:8px}`, `.text-heading{font-size:18px;…}`),
  as `@theme inline` keeps the form the preset bridge produced.
- **Render check** (the production server, Playwright Chromium, `/` and `/login` at 390×844 and
  1280×900, dark and light through the `NEXT_THEME` cookie): the computed style of every element
  and of its `::before` and `::after` (30 properties, 513 elements on the home page, 228 on the
  login page) and the full-page screenshots are byte-identical before and after, 16 of 16 files.
  The baseline was captured twice to confirm it is deterministic.
- **E2E**: `e2e/glass.e2e.ts`, `e2e/axe.e2e.ts` and `e2e/home.e2e.ts` pass on the new build
  (3 of 3), the served `-webkit-backdrop-filter:blur(26px)` included.
- **Mobile**: both presets resolved through the mobile app's Tailwind 3.4.19 behind
  `nativewind/preset`: 121 theme keys and 277 flattened colours, 0 differences.
  `pnpm --filter @app/mobile export:web` writes the same stylesheet,
  `web-410928ac0d51a6c2fb676698fa890664.css`, byte for byte; only the `__common` chunk that
  bundles `@app/tokens` changes. Every token export the apps read before is deep-equal after;
  `inset` differs only by the `knob` key renamed `knobInset`, which no app imports.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 1, 2026-11-15, at `570257b`, stopping at
  `verify:specs`, as the common rules expect before the archive: four scenarios of the living
  packages/tokens spec cite the titles this change renamed (TOKENS-12, TOKENS-15), and the change
  had no verify report yet. Every gate before it passed, `turbo run lint typecheck test build
  format:check` 24 of 24. Every gate after it, run one by one, exited 0: `git-free-env:test`,
  `report:spec-drift:test`, `report:spec-drift` (listing the tokens and web specs, which the
  archive re-verifies), `verify:english:test`, `verify:english`, `verify:instruction-entry:test`,
  `verify:instruction-entry`, `codex-budget:test`, `verify:maps`, `check:identity`,
  `init-project:test`, `verify:pairing`, `verify:structure`, `verify:security`,
  `verify:theme-sync:test`, `verify:theme-sync`, `docs:diagrams:check`, the i18n tests and `knip`.
- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-15, over the archive commit's tree (the
  deltas merged into the living specs): turbo 24 of 24, `verify:specs` PASS over 8 living specs
  and 0 open changes, `report:spec-drift` 0 of 8 specs behind their code, `knip` green.
- `pnpm --filter @app/web build`: exit 0 at `06306df`.
- `pnpm --filter @app/mobile export:web`: exit 0 at `06306df`; `apps/mobile/dist-web` deleted
  afterwards.
- `pnpm smoke:web`: exit 0 at `570257b`, `HTTP 200 and marker present`.

## Not verified

- WEB-43, "the served pages render in both themes": no committed test renders both themes; the
  render check above ran once, from scripts outside the repository.
- The NativeWind classes still resolve to the dark values in the light theme, as before:
  `themeVars` is generated and exported, and no screen injects it yet (F12, in F.5).
- `smoke:mobile` (the iOS and Android export), which runs outside `validate`.
