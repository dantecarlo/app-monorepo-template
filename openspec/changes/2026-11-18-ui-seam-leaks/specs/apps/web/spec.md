# Delta: apps/web

> **Change:** `2026-11-18-ui-seam-leaks`

## ADDED Requirements

### Requirement: WEB-62 — A ui block's variant props are its own unions, held to its tv config

The web app SHALL type the variant props of every `ui/` block that builds variants with the
shared `tv` (Avatar, Button, Chip, ConfirmDialog, GlassCard, IconButton, LoadingSkeleton, Modal,
StatusBadge and Text) with unions its `*.constant.ts` declares, each derived from a tuple of the
option names of one variant of its `tv` config, so the block's public type names no type of
`tailwind-variants`; typecheck SHALL fail when a union and its config disagree, through the
`VariantUnionsType` of `src/components/ui/variants.helper.ts`, the one file that imports
`tailwind-variants`, type-only imports included.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a block's unions match its config

- **GIVEN** a `ui/` block whose props took the kit's variant props
- **WHEN** its unions and tuples are compared with the variants its `tv` config takes
- **THEN** each union equals the options of its variant, each tuple lists them, and no variant is
  left out
- **Test:** `apps/web/src/components/ui/Avatar/__tests__/Avatar.constant.test.ts` › "its variant unions are the variants of its tv config"
- **Test:** `apps/web/src/components/ui/Button/__tests__/Button.constant.test.ts` › "its variant unions are the variants of its tv config"
- **Test:** `apps/web/src/components/ui/Chip/__tests__/Chip.constant.test.ts` › "its variant unions are the variants of its tv config"
- **Test:** `apps/web/src/components/ui/ConfirmDialog/__tests__/ConfirmDialog.constant.test.ts` › "its variant unions are the variants of its tv config"
- **Test:** `apps/web/src/components/ui/GlassCard/__tests__/GlassCard.constant.test.ts` › "its variant unions are the variants of its tv config"
- **Test:** `apps/web/src/components/ui/IconButton/__tests__/IconButton.constant.test.ts` › "its variant unions are the variants of its tv config"
- **Test:** `apps/web/src/components/ui/LoadingSkeleton/__tests__/LoadingSkeleton.constant.test.ts` › "its variant unions are the variants of its tv config"
- **Test:** `apps/web/src/components/ui/Modal/__tests__/Modal.constant.test.ts` › "its variant unions are the variants of its tv config"
- **Test:** `apps/web/src/components/ui/StatusBadge/__tests__/StatusBadge.constant.test.ts` › "its variant unions are the variants of its tv config"
- **Test:** `apps/web/src/components/ui/Text/__tests__/Text.constant.test.ts` › "its variant unions are the variants of its tv config"

#### Scenario: a union that disagrees with its config

- **GIVEN** a `tv` config and a union that drops one of its options, or adds one it lacks
- **WHEN** the union is compared with `VariantUnionsType` of the config
- **THEN** it is not equal, so the comparison a block's test makes fails the type check
- **Test:** `apps/web/src/components/ui/__tests__/variants.helper.test.ts` › "reads the variants a tv config takes, and tells a union that drops or adds an option from them"

#### Scenario: a file outside the helper imports the kit

- **GIVEN** a `ui/` type file that imports `VariantProps` from `tailwind-variants`
- **WHEN** ESLint and `pnpm verify:dependency-seams` run
- **THEN** the import is reported as outside its seam, and no allowlist entry excuses it
- **Test:** Not covered — no test of this app reads its imports; `local/dependency-seam` refuses
  such an import (harness/dependency-seams SEAM-03) and `pnpm verify:dependency-seams` fails an
  allowlist entry or a violation for it (SEAM-07), both inside `pnpm validate`

#### Scenario: the ui blocks keep their classes

- **GIVEN** the resolved class string of every `tv` export of every `ui/` style file, for every
  combination of its variants
- **WHEN** it is resolved after the change
- **THEN** it equals the string resolved before
- **Test:** Not covered — no committed test records every block's strings; the verify report
  records a one-off comparison before and after the change

### Requirement: WEB-63 — The async boundary takes a fallback typed by its own props

The web app SHALL type the error fallback an async boundary takes, and its default error
fallback, with the block's own `IAsyncBoundaryFallbackProps`, the thrown value and a function
that resets the boundary, so the block's public type names no type of `react-error-boundary`,
which only `src/components/ui/AsyncBoundary/AsyncBoundary.component.tsx` imports; when a child
throws, the boundary SHALL render that fallback with the thrown value, and its children again
once the fallback resets it.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a child throws and the fallback resets

- **GIVEN** an async boundary with an error fallback written against its own props, around a child
  that throws once
- **WHEN** it renders and the fallback resets it
- **THEN** the fallback shows the thrown error's message, and after the reset the child renders
- **Test:** `apps/web/src/components/ui/AsyncBoundary/__tests__/AsyncBoundary.component.test.tsx` › "renders its error fallback with the thrown error, and its children again after a reset"

#### Scenario: the fallback's type

- **GIVEN** the props of the async boundary
- **WHEN** the type of its error fallback is read
- **THEN** it is a component of `IAsyncBoundaryFallbackProps`, an unknown error and a reset that
  takes nothing
- **Test:** `apps/web/src/components/ui/AsyncBoundary/__tests__/AsyncBoundary.component.test.tsx` › "types its error fallback with its own props"

### Requirement: WEB-64 — An image renders through the ui Image block

The web app SHALL render an image through the `Image` block of `src/components/ui/Image/`, which
takes a source, an alternative text, a width and a height, and optionally classes, a load-error
handler and priority, and renders them through `next/image`, a priority image loaded eagerly and
any other lazily; the logo SHALL render its asset through it, and only
`src/components/ui/Image/Image.component.tsx` SHALL import `next/image`, tests included.

**Evidence:** written at apply time, when the code exists.

#### Scenario: an image renders

- **GIVEN** the `Image` block with a source, an alternative text, a width and a height
- **WHEN** it renders
- **THEN** an image named by that text shows that source at that width and height
- **Test:** `apps/web/src/components/ui/Image/__tests__/Image.component.test.tsx` › "renders its source at its size under its alternative text"

#### Scenario: the image fails to load

- **GIVEN** the `Image` block with a load-error handler
- **WHEN** the image fails to load
- **THEN** the handler runs once
- **Test:** `apps/web/src/components/ui/Image/__tests__/Image.component.test.tsx` › "calls its error handler when the image fails to load"

#### Scenario: a priority image

- **GIVEN** one `Image` with priority and one without
- **WHEN** they render
- **THEN** the first is not lazy-loaded and the second is
- **Test:** `apps/web/src/components/ui/Image/__tests__/Image.component.test.tsx` › "loads a priority image eagerly and any other lazily"

#### Scenario: the logo renders its asset

- **GIVEN** the logo, with its asset slot
- **WHEN** it renders, and when its asset fails to load
- **THEN** it shows the asset named by the logo label, then the brand wordmark
- **Test:** `apps/web/src/components/ui/Logo/__tests__/Logo.component.test.tsx` › "renders the asset slot image by default"
- **Test:** `apps/web/src/components/ui/Logo/__tests__/Logo.component.test.tsx` › "falls back to the brand wordmark when the asset errors"

#### Scenario: a file outside the block imports next/image

- **GIVEN** a component, screen or test outside the `Image` block that imports or mocks `next/image`
- **WHEN** ESLint and `pnpm verify:dependency-seams` run
- **THEN** the import is reported as outside its seam, and no allowlist entry excuses it
- **Test:** Not covered — no test of this app reads its imports; `local/dependency-seam` refuses
  such an import (harness/dependency-seams SEAM-03) and `pnpm verify:dependency-seams` fails an
  allowlist entry or a violation for it (SEAM-07), both inside `pnpm validate`
