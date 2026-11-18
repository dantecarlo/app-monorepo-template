# Verify report: 2026-11-18-ui-seam-leaks

> **Verified:** 2026-11-18 at `696109f`

## Scenarios

Every test ran green in `ATL_TEMPLATE_SELF=1 pnpm validate` at `696109f` (exit 0): the web suite
124 files and 454 tests, the mobile suite 80 files and 227 tests. The type
scenarios (`expectTypeOf`) are checked by `tsc --noEmit` of each app, inside the same run's
`typecheck`.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| WEB-70 | a block's unions match its config | `apps/web/src/components/ui/Avatar/__tests__/Avatar.constant.test.ts` › "its variant unions are the variants of its tv config" | green |
| WEB-70 | a block's unions match its config | `apps/web/src/components/ui/Button/__tests__/Button.constant.test.ts` › "its variant unions are the variants of its tv config" | green |
| WEB-70 | a block's unions match its config | `apps/web/src/components/ui/Chip/__tests__/Chip.constant.test.ts` › "its variant unions are the variants of its tv config" | green |
| WEB-70 | a block's unions match its config | `apps/web/src/components/ui/ConfirmDialog/__tests__/ConfirmDialog.constant.test.ts` › "its variant unions are the variants of its tv config" | green |
| WEB-70 | a block's unions match its config | `apps/web/src/components/ui/GlassCard/__tests__/GlassCard.constant.test.ts` › "its variant unions are the variants of its tv config" | green |
| WEB-70 | a block's unions match its config | `apps/web/src/components/ui/IconButton/__tests__/IconButton.constant.test.ts` › "its variant unions are the variants of its tv config" | green |
| WEB-70 | a block's unions match its config | `apps/web/src/components/ui/LoadingSkeleton/__tests__/LoadingSkeleton.constant.test.ts` › "its variant unions are the variants of its tv config" | green |
| WEB-70 | a block's unions match its config | `apps/web/src/components/ui/Modal/__tests__/Modal.constant.test.ts` › "its variant unions are the variants of its tv config" | green |
| WEB-70 | a block's unions match its config | `apps/web/src/components/ui/StatusBadge/__tests__/StatusBadge.constant.test.ts` › "its variant unions are the variants of its tv config" | green |
| WEB-70 | a block's unions match its config | `apps/web/src/components/ui/Text/__tests__/Text.constant.test.ts` › "its variant unions are the variants of its tv config" | green |
| WEB-70 | a union that disagrees with its config | `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "reads the variants a tv config takes, and tells a union that drops or adds an option from them" | green |
| WEB-70 | a file outside the helper imports the kit | Not covered — `local/dependency-seam` and `pnpm verify:dependency-seams` (PASS, 41 allowlist entries, none of `tailwind-variants`) | green gate |
| WEB-70 | the ui blocks keep their classes | Not covered — the one-off comparison below | identical |
| WEB-71 | a child throws and the fallback resets | `apps/web/src/components/ui/AsyncBoundary/__tests__/AsyncBoundary.component.test.tsx` › "renders its error fallback with the thrown error, and its children again after a reset" | green |
| WEB-71 | the fallback's type | `apps/web/src/components/ui/AsyncBoundary/__tests__/AsyncBoundary.component.test.tsx` › "types its error fallback with its own props" | green |
| WEB-72 | an image renders | `apps/web/src/components/ui/Image/__tests__/Image.component.test.tsx` › "renders its source at its size under its alternative text" | green |
| WEB-72 | the image fails to load | `apps/web/src/components/ui/Image/__tests__/Image.component.test.tsx` › "calls its error handler when the image fails to load" | green |
| WEB-72 | a priority image | `apps/web/src/components/ui/Image/__tests__/Image.component.test.tsx` › "loads a priority image eagerly and any other lazily" | green |
| WEB-72 | the logo renders its asset | `apps/web/src/components/ui/Logo/__tests__/Logo.component.test.tsx` › "renders the asset slot image by default" | green |
| WEB-72 | the logo renders its asset | `apps/web/src/components/ui/Logo/__tests__/Logo.component.test.tsx` › "falls back to the brand wordmark when the asset errors" | green |
| WEB-72 | a file outside the block imports next/image | Not covered — `local/dependency-seam` and `pnpm verify:dependency-seams` (PASS, none of `next/image`) | green gate |
| MOBILE-70 | a child throws and the fallback resets | `apps/mobile/src/components/ui/AsyncBoundary/__tests__/AsyncBoundary.component.test.tsx` › "renders its error fallback with the thrown error, and its children again after a reset" | green |
| MOBILE-70 | the fallback's type | `apps/mobile/src/components/ui/AsyncBoundary/__tests__/AsyncBoundary.component.test.tsx` › "types its error fallback with its own props" | green |
| MOBILE-71 | a gradient renders | `apps/mobile/src/components/ui/Gradient/__tests__/Gradient.component.test.tsx` › "hands its stops, its direction and its style to the gradient, behind its children" | green |
| MOBILE-71 | the blocks that paint a gradient | `apps/mobile/src/components/ui/AccentGradient/__tests__/AccentGradient.component.test.tsx` › "paints the accent gradient behind its children" | green |
| MOBILE-71 | the blocks that paint a gradient | `apps/mobile/src/components/ui/LoadingSkeleton/__tests__/LoadingSkeleton.component.test.tsx` › "sweeps its shimmer gradient across the skeleton" | green |
| MOBILE-71 | the blocks that paint a gradient | `apps/mobile/src/components/ui/Toggle/__tests__/Toggle.component.test.tsx` › "paints its track with the accent gradient only while on" | green |
| MOBILE-71 | a file outside the block imports the gradient | Not covered — `local/dependency-seam` and `pnpm verify:dependency-seams` (PASS, none of `expo-linear-gradient`) | green gate |
| MOBILE-72 | the block sets the glyphs | `apps/mobile/src/components/ui/StatusBar/__tests__/StatusBar.component.test.tsx` › "sets the status bar to the glyph style it is given" | green |
| MOBILE-72 | the block's own style type | `apps/mobile/src/components/ui/StatusBar/__tests__/StatusBar.component.test.tsx` › "takes its own glyph style" | green |
| MOBILE-72 | a file outside the block imports the status bar | Not covered — `local/dependency-seam` and `pnpm verify:dependency-seams` (PASS, none of `expo-status-bar`) | green gate |
| MOBILE-73 | a theme is applied | `apps/mobile/src/lib/theme/__tests__/colorScheme.adapter.test.ts` › "applies a theme to the live color scheme" | green |
| MOBILE-73 | a block under the light theme | `apps/mobile/src/components/ui/Text/__tests__/Text.component.test.tsx` › "paints a variant in the active theme's colour" | green |
| MOBILE-73 | a block under the light theme | `apps/mobile/src/components/ui/Screen/__tests__/Screen.component.test.tsx` › "paints the active theme's base background" | green |
| MOBILE-73 | a block test imports nativewind | Not covered — `local/dependency-seam` and `pnpm verify:dependency-seams` (PASS, the one `nativewind` entry left is F.8 unit 6's) | green gate |
| MOBILE-41 | a screen-local component imports the gradient | `eslint-local-rules/index.test.mjs` › "import { LinearGradient } from 'expo-linear-gradient'" | green |
| MOBILE-41 | the gradient renders through its block | `apps/mobile/src/components/ui/AccentGradient/__tests__/AccentGradient.component.test.tsx` › "paints the accent gradient behind its children" | green |

### Red before green

| Task | Rule | Observed red |
| ---- | ---- | ------------ |
| T1 | a block's unions match its config | `tsc --noEmit` of the web app: 27 errors, among them `Module '"@/components/ui/variants.helper"' has no exported member 'VariantUnionsType'` and `Cannot find module '@/components/ui/Button/Button.constant'`; vitest: 7 files `Failed to resolve import ".../<Block>.constant"`, and `expected undefined to deeply equal [ 'lg', 'md', 'sm' ]` (Modal), `[ 'accent', 'glass' ]` (IconButton), `[ 'accent', 'glass', 'neutral' ]` (Avatar) |
| T1 | a union that disagrees with its config | dropping `'sm'` from `BUTTON_SIZE_VARIANTS` failed `tsc` in `Button.constant.test.ts` (`size: "Expected: literal string: lg, Actual: literal string: sm"`) and in `ErrorState.component.tsx`, which passes `size="sm"`; restored |
| T1 | a file outside the helper imports the kit | the 10 entries removed with the base type files back: `verify:dependency-seams` reported 10 problems, `apps/web/src/components/ui/Avatar/Avatar.type.ts imports tailwind-variants outside its seam 1 time(s) and is not listed`, one per block |
| T2 | the fallback's type | `tsc` of both apps: `'"@/components/ui/AsyncBoundary/AsyncBoundary.type"' has no exported member named 'IAsyncBoundaryFallbackProps'` |
| T2 | only the component file imports the library | the seam narrowed with the base files back: 4 problems, the type file and the default error fallback of each app `import react-error-boundary outside its seam` |
| T3 | an image renders | `Failed to resolve import "@/components/ui/Image/Image.component"` |
| T3 | a file outside the block imports next/image | the seam narrowed and the 4 entries removed with the base files back: 4 problems, the logo and the logo, auth shell and sign-in screen tests `import next/image outside its seam` |
| T4 | a gradient renders | `Failed to resolve import "@/components/ui/Gradient/Gradient.component"` |
| T4 | a file outside the block imports the gradient | the seam narrowed and the entry removed with the base files back: 4 problems, the accent gradient, skeleton and toggle components and the dashboard header test `import expo-linear-gradient outside its seam` |
| T5 | the block sets the glyphs | `Failed to resolve import "@/components/ui/StatusBar/StatusBar.component"` |
| T5 | a file outside the block imports the status bar | the seam narrowed and the 3 entries removed with the base files back: 3 problems, `_layout.tsx`, its test and `useRootTheme.type.ts` `import expo-status-bar outside its seam` |
| T6 | a theme is applied | `Failed to resolve import "@/lib/theme/colorScheme.adapter"` |
| T6 | a block test imports nativewind | the 2 entries removed with the base tests back: 2 problems, the `Screen` and `Text` tests `import nativewind outside its seam` |

These tests passed on the base code and pin what the change keeps: "renders its error fallback
with the thrown error, and its children again after a reset" in both apps, "paints its track with
the accent gradient only while on" and "sweeps its shimmer gradient across the skeleton". Every
existing component, screen and route test passed unchanged in its assertions; a test that mocked a
library now mocks the block that wraps it, or, for the dashboard header, the suite's own mock.

## No visible change

- **The web class strings.** Every `tv` export of every `apps/web/src/components/ui/**/*.style.ts`
  file, 21 of them, was resolved with every combination of its variants, `undefined` included,
  each slot of a slotted block resolved: 420 class strings, recorded at the base `a3e7e75` and
  again after T1 (`fd1d135`), T3 (`b735563`) and at `696109f`. **0 of 420 changed.** No style file changed.
- **The logo.** Rendered through the real `next/image`, before and after it moved onto
  `ui/Image`: the same markup,
  `<img alt="Acme logo" width="64" height="64" decoding="async" data-nimg="1" class="object-contain" style="color: transparent;" src="…/logo.svg">`.
- **The mobile gradients and status bar.** With the primitives replaced by a recorder of every
  prop they receive, the accent gradient, the skeleton in each of its 4 roundings and by default,
  the toggle on and off, the dashboard header and the root layout were rendered under the dark
  and the light theme: 20 records, identical at the base and after T4 (`6314bc8`), T5 (`a1eb12a`) and at `696109f`, the
  status bar's `style` `light` under the dark theme and `dark` under the light one.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-18, at `696109f`; `report:spec-drift`
  listed apps/web, apps/mobile and harness/dependency-seams, the specs whose governed files this
  change touches. A first run at `2b2b35c` failed `format:check` on the one-line seam array of
  `expo-linear-gradient` in `.agents/contracts/dependencies.json`, fixed in `53858fa`.
- `pnpm --filter @app/web build`: exit 0 at `696109f`.
- `pnpm --filter @app/mobile export:web`: exit 0 at `696109f`; `apps/mobile/dist-web` removed.
- `pnpm smoke:web`: exit 0 at `696109f`, `OK: HTTP 200 and marker present`.
- `pnpm verify:dependency-seams`: allowlist 61 entries at the base, 41 after (20 removed: 10
  `tailwind-variants`, 4 `next/image`, 3 `expo-status-bar`, 2 `nativewind` and 1
  `expo-linear-gradient`); no entry of F.8 unit 5 is left, and the `nativewind` entry of the root
  layout test, F.8 unit 6's, stays.

## Not verified

- WEB-70, WEB-72, MOBILE-71, MOBILE-72 and MOBILE-73 have scenarios held by the lint rule and the
  gate, not by a test of the app: harness/dependency-seams SEAM-03 and SEAM-07 are their tests.
- WEB-70 "the ui blocks keep their classes" has no committed test; the comparison above ran by a
  one-off script.
- No device run: the mobile bundle was exported for the web, not started on iOS or Android, and
  the status bar's glyphs were read from the props the block hands the library.
