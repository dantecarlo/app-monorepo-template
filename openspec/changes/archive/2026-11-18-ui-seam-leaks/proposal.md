# Proposal: every UI kit type and primitive behind its own ui block

> **Status:** archived — 2026-11-18

## Why

Decision 51 of `docs/INIT_AND_HARNESS_PLAN.md` puts every library outside the core stack behind
one wrapper of the template, and the styling LAW keeps the kit in one replaceable layer,
`components/ui/`. F.8 unit 1 froze 20 imports that still break that layer
(`eslint-dependency-seam-allowlist.json`): the props of 10 web `ui/` blocks extend the kit's
`VariantProps`, so their public types are `tailwind-variants` types; the web logo imports
`next/image` itself and its tests mock it; the mobile root layout and `lib/theme` name
`expo-status-bar` and its `StatusBarStyle`; a screen test mocks `expo-linear-gradient`, which three
`ui/` blocks import directly; and two `ui/` block tests switch the theme through `nativewind`. The
async boundary of both apps also types its fallback with `FallbackProps` of
`react-error-boundary`. Swapping any of these kits today rewrites types, screens and tests outside
the block that wraps it.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-15 (translated from Spanish): "every package that is not core must be decoupled and have
  an adapter, in ui as a wrapper for example, and so think a strategy for each one; currently the
  Certifipago project already more or less does it, but evaluate and analyze and put it in the
  plan"
- 2026-11-15 (translated from Spanish): "Not only the UI libraries, but all the libraries
  themselves."
- 2026-11-15 (translated from Spanish): "And something important, web and app have to be
  standardized, and any other project, that is, they have to always follow the same rules and
  centralize it if possible, because if later plain React is added for example it should follow
  the same rules"

## What changes

- **Variant unions instead of `VariantProps`, on web.** Each of the 10 blocks (Avatar, Button,
  Chip, ConfirmDialog, GlassCard, IconButton, LoadingSkeleton, Modal, StatusBadge, Text) declares
  one tuple of option names per variant in its `*.constant.ts`, and the union it derives, the shape
  the mobile `Button` and `Chip` constants already have (`BUTTON_SIZE_VARIANTS`,
  `ButtonSizeType`). Its props use those unions, so its public type names no kit type.
  `apps/web/src/components/ui/variants.helper.ts` stays the one file that imports the kit, and
  gains `VariantUnionsType`, the variants a `tv()` config takes; each block's
  `__tests__/<Block>.constant.test.ts` holds its unions and tuples to its config, so typecheck
  fails when they disagree. No style file changes.
- **The async boundary's own fallback props, in both apps.** `IAsyncBoundaryFallbackProps`, the
  thrown value and a function that resets the boundary, types `ErrorFallback` and the default
  error fallback; only `AsyncBoundary.component.tsx` names `react-error-boundary`.
- **`ui/Image`, on web.** A new block that takes the props its one caller passes (source,
  alternative text, width, height, classes, a load-error handler, priority) and renders them
  through `next/image`. The logo renders it, and the logo, auth shell, sign-in screen and
  visible-text record tests mock `@/components/ui/Image`, not `next/image`.
- **`ui/Gradient`, on mobile.** Checking `ui/` first found `AccentGradient`, a surface on one
  fixed gradient, and two blocks, `LoadingSkeleton` and `Toggle`, that paint their own stops and
  direction through `expo-linear-gradient` directly. The new block is the one wrapper of the
  primitive: colour stops, a start and an end point, a style, a label and children.
  `AccentGradient`, the skeleton's shimmer and the toggle's track render it, and the dashboard
  header test drops its vendor mock.
- **`ui/StatusBar`, on mobile.** A new block whose own `StatusBarStyleType` (`'dark' | 'light'`,
  the two glyph styles the app sets) replaces `StatusBarStyle`; the root layout renders it, the
  root theme's result is typed by that union, and the layout test mocks the block.
- **The theme applied through `lib/theme`, on mobile.** `applyTheme` of
  `apps/mobile/src/lib/theme/colorScheme.adapter.ts` applies a theme to NativeWind's live color
  scheme without storing it, and the `Screen` and `Text` block tests switch the theme through it.
- **The seams narrowed.** In `.agents/contracts/dependencies.json`, `next/image` may be imported
  only by `apps/web/src/components/ui/Image/Image.component.tsx`, `expo-status-bar` only by
  `apps/mobile/src/components/ui/StatusBar/StatusBar.component.tsx`, `expo-linear-gradient` only
  by `apps/mobile/src/components/ui/Gradient/Gradient.component.tsx` and `react-error-boundary`
  only by `apps/*/src/components/ui/AsyncBoundary/AsyncBoundary.component.tsx`, so a type file
  that names a kit type again is refused. The 20 entries of F.8 unit 5 leave the allowlist (61 to
  41).
- **No visible change, with its proof.** Every existing component, screen and route test stays
  green with its assertions unchanged. The verify report records, before and after, the resolved
  class string of every `tv` export of every web `ui/` style file for every combination of its
  variants, the logo's rendered markup through the real `next/image`, and every prop the mobile
  gradient and status bar receive from each block that renders one, in both themes; the web build,
  the web smoke and the mobile web export run.
- **The docs.** The `component` and `modify` skills (variant unions instead of `VariantProps`, and
  the new blocks), `docs/code-standards.md` § 22, `docs/architecture/web.md` and `mobile.md`, and
  `docs/maps/global-map.md`.

## Out of scope

- **The other `ui` packages.** `expo-blur`, `react-native-svg`, `react-native-reanimated` and
  `react-native-safe-area-context` keep the seam `apps/mobile/src/components/ui/**`; no allowlist
  entry of unit 5 names them.
- **The root layout's other imports.** The fonts, the splash screen, the safe area, the query
  provider and the `nativewind` import of the layout test are F.8 units 3 and 6.
- **`setTheme` and the theme's start-up.** `apps/mobile/src/lib/theme/theme.config.ts` still sets
  NativeWind's scheme itself; F.8 unit 4 rewrites that file onto the storage port, and moving its
  two calls onto `applyTheme` is left to that change so the two do not collide.
- **A look or a variant.** No class, colour, stop, direction or option changes.
- **The other frozen imports**, units 3, 4, 6 and 7.

## Affected specs

- `openspec/specs/apps/web/spec.md`: added WEB-70, WEB-71, WEB-72.
- `openspec/specs/apps/mobile/spec.md`: added MOBILE-70, MOBILE-71, MOBILE-72, MOBILE-73; modified
  MOBILE-41, whose evidence moves to the `Gradient` block.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
