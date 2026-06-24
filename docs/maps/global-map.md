# Global architecture map

> The navigable index of every **shared / global** thing in this monorepo:
> where it lives, what it's for, and which suffix it carries. Per-screen
> internals are mapped separately — see
> [screen-map.template.md](screen-map.template.md), filled once per screen.
>
> Binding rules: [../code-standards.md](../code-standards.md). Layer model:
> [../architecture/shared.md](../architecture/shared.md),
> [../architecture/web.md](../architecture/web.md),
> [../architecture/mobile.md](../architecture/mobile.md).
>
> This file is gated: `node scripts/verify-maps.mjs` fails if any path
> referenced below no longer exists. Update the map when you move things.

## How to read this map

The monorepo is **fractal and screen-centric**. The same shape repeats at
every level:

> **shared** lives at the root of a `src/` (or in `packages/`), **screen-local**
> lives inside `src/screens/<Screen>/`. The litmus test for every new thing:
> **"used by more than this screen?"** → yes = shared (here), no = screen-local
> (see the per-screen template).

Anything below is **shared**. If you are looking for a screen's own component,
hook, model, or styles, it is not here — open that screen's folder.

---

## 1. Cross-app shared packages (`packages/`)

Framework-agnostic, shared by BOTH apps. Pure values / logic / contracts —
**never** React, RN, or DOM. Imported via the `@app/*` alias.

| Thing                 | Path                                                                     | Suffix         | What it holds                                                     |
| --------------------- | ------------------------------------------------------------------------ | -------------- | ----------------------------------------------------------------- |
| Design tokens         | `packages/tokens/src/tokens.constant.ts`                                 | `.constant.ts` | Colors, spacing, type scale — the design source of truth          |
| Tailwind preset       | `packages/tokens/tailwind-preset.cjs`                                    | `.cjs`         | Token-derived preset consumed by web Tailwind + mobile NativeWind |
| Domain errors         | `packages/core/src/errors/AppError.helper.ts`                            | `.helper.ts`   | `AppError` + typed error contract (messageKey, cause chaining, prototype fix) |
| Service error mapper  | `packages/core/src/errors/buildServiceError.helper.ts`                   | `.helper.ts`   | Maps provider errors to typed AppError codes + i18n keys via injectable mapper |
| Service error types   | `packages/core/src/errors/serviceError.type.ts`                          | `.type.ts`     | `ServiceErrorCodeEnum`, `ServiceErrorCodeType`, `SERVICE_ERROR_MESSAGE_KEY_BY_CODE` |
| Service error mapper type | `packages/core/src/errors/IServiceErrorMapper.type.ts`               | `.type.ts`     | `IServiceErrorMapper` port — injectable mapError seam for provider-specific error detection |
| Auth gateway port     | `packages/core/src/ports/auth/IAuthGateway.type.ts`                      | `.type.ts`     | `IAuthGateway` port + session/user/subscription primitive types — no SDK imports |
| Backend client port   | `packages/core/src/ports/client/IBackendClientProvider.type.ts`          | `.type.ts`     | `IBackendClientProvider<TClient>` port — url + anonKey provisioning contract  |
| Observability port    | `packages/core/src/ports/observability/IObservabilityPort.type.ts`       | `.type.ts`     | `IObservabilityPort` + `ICaptureErrorParams` + `ICaptureMessageParams` — provider-agnostic error/message capture seam |
| Observability levels  | `packages/core/src/ports/observability/observabilityLevel.type.ts`       | `.type.ts`     | `ObservabilityLevelEnum` + `ObservabilityLevelType` — no magic severity strings |
| No-op adapter         | `packages/core/src/ports/observability/createNoopObservability.helper.ts` | `.helper.ts`  | Production-safe default — swallows all events silently, zero deps, zero PII risk |
| Console adapter       | `packages/core/src/ports/observability/createConsoleObservability.helper.ts` | `.helper.ts` | Dev-time adapter — logs scrubbed payloads via console.error/warn; isEnabled flag |
| Query-key sanitizer   | `packages/core/src/observability/sanitizeQueryKey.helper.ts`             | `.helper.ts`   | Redacts dynamic id segments from query keys before error reporting (PII-safe) |
| PII scrubbing         | `packages/core/src/utils/scrubPII.helper.ts`                             | `.helper.ts`   | Scrub sensitive fields before they reach any monitoring sink      |
| i18n catalogs         | `packages/i18n/src/locales/es.json`, `packages/i18n/src/locales/en.json` | `.json`        | ICU message catalogs (default `es`, plus `en`)                    |
| i18n constants        | `packages/i18n/src/locales/i18n.constant.ts`                             | `.constant.ts` | Locale codes + default-locale constant                            |
| i18n resources        | `packages/i18n/src/locales/resources.constant.ts`                        | `.constant.ts` | Catalog registry consumed by each app's i18n adapter              |
| Backend client        | `packages/supabase/src/client.adapter.ts`                                | `.adapter.ts`  | Browser/native Supabase client factory; satisfies `IBackendClientProvider` |
| Backend server client | `packages/supabase/src/server.adapter.ts`                                | `.adapter.ts`  | Server/SSR client factory                                         |
| Backend SSR client    | `packages/supabase/src/ssr.adapter.ts`                                   | `.adapter.ts`  | Cookie-aware SSR client (@supabase/ssr) for RLS propagation       |
| Supabase error mapper | `packages/supabase/src/mapSupabaseError.adapter.ts`                      | `.adapter.ts`  | `IServiceErrorMapper` implementation — maps Postgrest errors to `ServiceErrorCodeType` |
| Supabase error builder | `packages/supabase/src/buildSupabaseServiceError.helper.ts`             | `.helper.ts`   | Wired default: `buildServiceError` + `mapSupabaseError`; use in services  |
| Supabase auth gateway | `packages/supabase/src/supabaseAuth.adapter.ts`                          | `.adapter.ts`  | `createSupabaseAuthGateway` — implements `IAuthGateway` over a `SupabaseClient` |
| Backend types         | `packages/supabase/src/types.ts`                                         | `.ts`          | Generated DB types + typed exports                                |
| DB conventions doc    | `packages/supabase/docs/database.md`                                     | `.md`          | Postgres/Supabase conventions: migrations, schemas, RLS, RBAC, audit, pgTAP |
| Core test config      | `packages/core/vitest.config.ts`                                         | `.config.ts`   | Vitest config for the core package (node env, includes src/**/*.test.ts)  |

Each package exposes its public surface through a barrel: `packages/core/src/index.ts`,
`packages/i18n/src/index.ts`, `packages/supabase/src/index.ts`, `packages/tokens/src/index.ts`.

**Backend provider swap.** `@app/core` defines the ports; `@app/supabase` is the
wired default adapter. To replace Supabase: (1) implement `IAuthGateway`,
`IBackendClientProvider`, and `IServiceErrorMapper` in a new adapter package;
(2) repoint each app's `src/lib/supabase/*.adapter.ts` to the new package;
(3) keep service signatures unchanged — the service seam is the only place the
client is touched. RLS policies, SQL migrations, and `supabase/config.toml`
are adapter-owned and must be reproduced in the replacement package.

**Rule of thumb**: imports React / RN / DOM or a UI lib → it does NOT belong
here (it goes per-app, sections 2–3). Pure logic / values / contracts → here.

---

## 2. Per-app shared globals — Web (`apps/web/src/`)

App-specific shared layer. Lives at the root of `apps/web/src/`, imported via
the `@/*` alias. UI here is DOM / shadcn / Tailwind.

| Thing                  | Path                                                                    | Suffix                        | What it holds                                              |
| ---------------------- | ----------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------- |
| Shared UI kit          | `apps/web/src/components/ui`                                            | `.component.tsx`              | Reusable primitives (`Button`, `Chip`, `GlassCard`, `AsyncBoundary`, `Toast`, `Modal`, `ConfirmDialog`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `StatusBadge`, `Icon`, `IconButton`, `Avatar`, `SearchBar`, `SegmentedControl`, `Toggle`, `ScreenHeader`, `SettingRow`, `ListRow`, `NavBar`, `AuthShell`, `AuthField`, `SocialAuthButton`) |
| Icon (web)             | `apps/web/src/components/ui/Icon/Icon.component.tsx`                    | `.component.tsx`              | SVG icon atom; Tabler-style path registry on a 24x24 viewBox; currentColor-driven |
| Icon registry (web)    | `apps/web/src/components/ui/Icon/Icon.constant.tsx`                     | `.constant.tsx`               | ICON_PATHS + IconNameType + default size / stroke width; extended with chevron-left and eye-off |
| Icon button (web)      | `apps/web/src/components/ui/IconButton/IconButton.component.tsx`        | `.component.tsx`              | 40x40 circular icon-only button; glass/accent variants; accessibilityLabel -> aria-label |
| Avatar (web)           | `apps/web/src/components/ui/Avatar/Avatar.component.tsx`                | `.component.tsx`              | Initials avatar; sizes 28/36/44; glass/accent/neutral; decorative (row carries the name) |
| Search bar (web)       | `apps/web/src/components/ui/SearchBar/SearchBar.component.tsx`          | `.component.tsx`              | Controlled glass search input with leading search icon; onChangeText |
| Segmented control (web) | `apps/web/src/components/ui/SegmentedControl/SegmentedControl.component.tsx` | `.component.tsx`        | Tablist/tab segmented control; accent-tinted active pill |
| Toggle (web)           | `apps/web/src/components/ui/Toggle/Toggle.component.tsx`                | `.component.tsx`              | Accessible switch; accent on / neutral off; token knob colors |
| Transversal services   | `apps/web/src/services/Items/items.service.ts`                          | `.service.ts`                 | Items data access (mock + HTTP variants)                   |
| Transversal adapter    | `apps/web/src/services/Items/Items.adapter.ts`                          | `.adapter.ts`                 | DTO → IItemViewModel mapping                               |
| Service constants      | `apps/web/src/services/Items/items.constant.ts`                         | `.constant.ts`                | Time units, mock tuning, API URL                           |
| Services barrel        | `apps/web/src/services/Items/index.ts`                                  | `index.ts`                    | Public API barrel for the Items domain                     |
| Cached summary service | `apps/web/src/services/ItemsSummary/itemsSummary.service.ts`            | `.service.ts`                 | 'use cache' server fetch — cacheLife('minutes') + cacheTag |
| Summary adapter        | `apps/web/src/services/ItemsSummary/ItemsSummary.adapter.ts`            | `.adapter.ts`                 | IItemDto[] → IItemsSummaryViewModel counts                 |
| Summary constants      | `apps/web/src/services/ItemsSummary/itemsSummary.constant.ts`           | `.constant.ts`                | CACHE_LIFE_PROFILE, CACHE_TAG (no magic strings in service)|
| Summary barrel         | `apps/web/src/services/ItemsSummary/index.ts`                           | `index.ts`                    | Public API barrel for the ItemsSummary domain              |
| Style constants        | `apps/web/src/helpers/style.constant.ts`                                | `.constant.ts`                | Shared Tailwind class-string constants                     |
| Query keys             | `apps/web/src/lib/query/queryKeys.constant.ts`                          | `.constant.ts`                | Central React Query key registry                           |
| Observability adapter  | `apps/web/src/lib/observability/observability.adapter.ts`               | `.adapter.ts`                 | App-level observability wiring point — swap this line to inject a Sentry/Datadog adapter |
| Error bridge           | `apps/web/src/lib/observability/toCaptureError.helper.ts`               | `.helper.ts`                  | Adapts `IObservabilityPort.captureError` to the `createQueryClient` `onCaptureError` callback shape |
| Validation constants   | `apps/web/src/validation/validation.constant.ts`                        | `.constant.ts`                | Named bounds for validation schemas (NOTE_MAX_LENGTH, QUANTITY_MIN, QUANTITY_MAX) |
| Example schema factory | `apps/web/src/validation/buildExampleSchema.schema.ts`                  | `.schema.ts`                  | i18n-aware buildExampleSchema({ t }) — zod factory pattern; infers ExampleFormValuesType |
| Query client factory   | `apps/web/src/lib/query/createQueryClient.helper.ts`                    | `.helper.ts`                  | Configured QueryClient with PII-safe cache error sinks     |
| Error message resolver | `apps/web/src/lib/query/resolveErrorMessage.helper.ts`                  | `.helper.ts`                  | Standardized query/mutation error → user string (override > messageKey > message > fallback) |
| App-query hook         | `apps/web/src/lib/query/useAppQuery.hook.ts`                            | `.hook.ts`                    | Wrapper over `useQuery` (project defaults)                 |
| App-mutation hook      | `apps/web/src/lib/query/useAppMutation.hook.ts`                         | `.hook.ts`                    | Wrapper over `useMutation` (project defaults)              |
| Supabase client wiring | `apps/web/src/lib/supabase/client.adapter.ts`                           | `.adapter.ts`                 | App-local client adapter over `@app/supabase`              |
| Supabase server wiring | `apps/web/src/lib/supabase/server.adapter.ts`                           | `.adapter.ts`                 | App-local server adapter over `@app/supabase`              |
| Auth store             | `apps/web/src/stores/auth.store.ts`                                     | `.store.ts`                   | Zustand session+status slice; depends on IAuthSession (port), no SDK; exports selectSession/selectAuthStatus/useSession |
| Global stores          | `apps/web/src/stores/ui.store.ts`, `apps/web/src/stores/toast.store.ts` | `.store.ts`                   | Cross-screen Zustand slices                                |
| Auth provider          | `apps/web/src/components/AuthProvider/AuthProvider.component.tsx`       | `.component.tsx`              | Mounts auth bootstrap; takes IAuthGateway via prop (gateway injected at wiring) |
| Auth bootstrap hook    | `apps/web/src/components/AuthProvider/useAuthBootstrap.hook.ts`         | `.hook.ts`                    | Subscribes to IAuthGateway, hydrates auth.store, cleans up on unmount |
| i18n request config    | `apps/web/src/i18n/request.config.ts`                                   | `.config.ts`                  | next-intl getRequestConfig consuming @app/i18n catalogs (locale, messages, timeZone) |
| Online status hook     | `apps/web/src/components/ui/OfflineBanner/useOnlineStatus.hook.ts`      | `.hook.ts`                    | Tracks navigator connectivity via online/offline events; SSR-safe default true |
| Offline banner         | `apps/web/src/components/ui/OfflineBanner/OfflineBanner.component.tsx`  | `.component.tsx`              | Controlled connectivity banner; i18n message via next-intl |
| Modal dismiss hook     | `apps/web/src/components/ui/Modal/useModalDismiss.hook.ts`              | `.hook.ts`                    | Escape-to-close + body scroll lock for modal overlays |
| Modal (web)            | `apps/web/src/components/ui/Modal/Modal.component.tsx`                  | `.component.tsx`              | Overlay scrim + dialog panel (size sm/md/lg); consumes useModalDismiss; inline accessible close |
| Confirm dialog (web)   | `apps/web/src/components/ui/ConfirmDialog/ConfirmDialog.component.tsx`  | `.component.tsx`              | Confirmation composed on Modal; accent/destructive tone; i18n confirm/cancel |
| Empty state (web)      | `apps/web/src/components/ui/EmptyState/EmptyState.component.tsx`        | `.component.tsx`              | Icon + title + message + optional CTA; copy via next-intl components.emptyState |
| Error state (web)      | `apps/web/src/components/ui/ErrorState/ErrorState.component.tsx`        | `.component.tsx`              | Error message + optional retry; react-error-boundary FallbackComponent compatible; code-driven copy |
| Error state codes (web) | `apps/web/src/components/ui/ErrorState/ErrorState.constant.ts`         | `.constant.ts`                | ErrorStateCodeEnum (403/404/500/offline) + i18n namespace keys |
| Loading skeleton (web) | `apps/web/src/components/ui/LoadingSkeleton/LoadingSkeleton.component.tsx` | `.component.tsx`           | Shimmer placeholder (CSS animate-shimmer); rounded presets; role=status |
| Status badge (web)     | `apps/web/src/components/ui/StatusBadge/StatusBadge.component.tsx`      | `.component.tsx`              | Pill dot+label; token tones success/warning/danger/neutral |
| Screen header (web)    | `apps/web/src/components/ui/ScreenHeader/ScreenHeader.component.tsx`    | `.component.tsx`              | Back + centred title + optional trailing action; composes IconButton |
| Setting row (web)      | `apps/web/src/components/ui/SettingRow/SettingRow.component.tsx`        | `.component.tsx`              | Label/subtitle + trailing control/value/chevron slot; composes Icon |
| List row (web)         | `apps/web/src/components/ui/ListRow/ListRow.component.tsx`              | `.component.tsx`              | Generic list item: leading/title/subtitle/trailing slots; divider between rows |
| Nav bar (web)          | `apps/web/src/components/ui/NavBar/NavBar.component.tsx`                | `.component.tsx`              | Floating glass pill nav; navigation-agnostic items+activeId; icon as ReactNode |
| Auth shell (web)       | `apps/web/src/components/ui/AuthShell/AuthShell.component.tsx`          | `.component.tsx`              | Centred auth layout: brand mark + title/subtitle + GlassCard form; composes GlassCard/Icon |
| Auth field (web)       | `apps/web/src/components/ui/AuthField/AuthField.component.tsx`          | `.component.tsx`              | Glass labeled text field; helper/error states; password reveal toggle; composes Icon |
| Social auth button (web) | `apps/web/src/components/ui/SocialAuthButton/SocialAuthButton.component.tsx` | `.component.tsx`       | Google social-auth glass pill; brand glyph isolated in constants |
| Google brand glyph (web) | `apps/web/src/components/ui/SocialAuthButton/GoogleGlyph.constant.ts`  | `.constant.ts`                | Third-party Google brand colors (not design tokens) |
| Route tree             | `apps/web/src/app`                                                      | Next App Router               | RSC pages, layout, providers                               |
| Test infra             | `apps/web/src/test`                                                     | (no suffix)                   | Vitest setup, MSW mocks, test helper (harness, not a unit) |

**Not present yet, but reserved by convention** (create when first needed,
following the same suffix rules): a root `constants/` folder for cross-screen
enums/constants, a root `hooks/` folder for cross-screen hooks, and a root
`validation/` folder for shared schemas. Until a thing is shared by more than
one screen it stays screen-local.

---

## 3. Per-app shared globals — Mobile (`apps/mobile/src/`)

Same shape as web, but UI is React Native / NativeWind. Imported via `@/*`.

| Thing                  | Path                                                                          | Suffix                        | What it holds                                       |
| ---------------------- | ----------------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------- |
| Transversal services   | `apps/mobile/src/services/Items/items.service.ts`                             | `.service.ts`                 | Items data access (mock implementation)             |
| Transversal adapter    | `apps/mobile/src/services/Items/Items.adapter.ts`                             | `.adapter.ts`                 | DTO → IItemViewModel mapping                        |
| Service constants      | `apps/mobile/src/services/Items/items.constant.ts`                            | `.constant.ts`                | Time units, mock tuning                             |
| Services barrel        | `apps/mobile/src/services/Items/index.ts`                                     | `index.ts`                    | Public API barrel for the Items domain              |
| Style constants        | `apps/mobile/src/helpers/style.constant.ts`                                   | `.constant.ts`                | Shared NativeWind / RN style constants              |
| Query keys             | `apps/mobile/src/lib/query/queryKeys.constant.ts`                             | `.constant.ts`                | Central React Query key registry                    |
| Shared UI kit          | `apps/mobile/src/components/ui`                                               | `.component.tsx`              | Reusable primitives (`AsyncBoundary`, `Toast`, `Modal`, `ConfirmDialog`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `StatusBadge`, `Icon`, `IconButton`, `Avatar`, `SearchBar`, `SegmentedControl`, `Toggle`, `GlassCard`, `ScreenHeader`, `SettingRow`, `ListRow`, `NavBar`, `AuthShell`, `AuthField`, `SocialAuthButton`) |
| Icon (mobile)          | `apps/mobile/src/components/ui/Icon/Icon.component.tsx`                       | `.component.tsx`              | react-native-svg icon atom; shared Tabler path registry; Platform-gated a11y |
| Icon registry (mobile) | `apps/mobile/src/components/ui/Icon/Icon.constant.ts`                         | `.constant.ts`                | ICON_PATHS + IconNameType + default size / stroke width; extended with chevron-left and eye-off |
| Icon button (mobile)   | `apps/mobile/src/components/ui/IconButton/IconButton.component.tsx`           | `.component.tsx`              | 40x40 circular Pressable icon button; glass/accent; onPress |
| Avatar (mobile)        | `apps/mobile/src/components/ui/Avatar/Avatar.component.tsx`                   | `.component.tsx`              | Initials avatar; sizes 28/36/44; glass/accent/neutral; a11y-hidden on native |
| Search bar (mobile)    | `apps/mobile/src/components/ui/SearchBar/SearchBar.component.tsx`             | `.component.tsx`              | Controlled glass TextInput with leading search icon; onChangeText |
| Segmented control (mobile) | `apps/mobile/src/components/ui/SegmentedControl/SegmentedControl.component.tsx` | `.component.tsx`     | tablist/tab segmented control; accentTint active segment |
| Toggle (mobile)        | `apps/mobile/src/components/ui/Toggle/Toggle.component.tsx`                   | `.component.tsx`              | Switch; expo-linear-gradient track + Animated knob via useToggleKnob |
| Toggle knob hook (mobile) | `apps/mobile/src/components/ui/Toggle/useToggleKnob.hook.ts`               | `.hook.ts`                    | Drives knob translateX via RN Animated (native driver, 160ms) |
| Observability adapter  | `apps/mobile/src/lib/observability/observability.adapter.ts`                  | `.adapter.ts`                 | App-level observability wiring point — swap this line to inject a Sentry/Datadog adapter |
| Error bridge           | `apps/mobile/src/lib/observability/toCaptureError.helper.ts`                  | `.helper.ts`                  | Adapts `IObservabilityPort.captureError` to the `createQueryClient` `onCaptureError` callback shape |
| Validation constants   | `apps/mobile/src/validation/validation.constant.ts`                           | `.constant.ts`                | Named bounds for validation schemas (NOTE_MAX_LENGTH, QUANTITY_MIN, QUANTITY_MAX) |
| Example schema factory | `apps/mobile/src/validation/buildExampleSchema.schema.ts`                     | `.schema.ts`                  | i18n-aware buildExampleSchema({ t }) — zod factory pattern; infers ExampleFormValuesType |
| Query client factory   | `apps/mobile/src/lib/query/createQueryClient.helper.ts`                       | `.helper.ts`                  | Configured QueryClient with PII-safe cache error sinks |
| Error message resolver | `apps/mobile/src/lib/query/resolveErrorMessage.helper.ts`                     | `.helper.ts`                  | Standardized query/mutation error → user string     |
| App-query hook         | `apps/mobile/src/lib/query/useAppQuery.hook.ts`                               | `.hook.ts`                    | Wrapper over `useQuery` (project defaults)          |
| App-mutation hook      | `apps/mobile/src/lib/query/useAppMutation.hook.ts`                            | `.hook.ts`                    | Wrapper over `useMutation` (project defaults)       |
| Supabase client wiring | `apps/mobile/src/lib/supabase/client.adapter.ts`                              | `.adapter.ts`                 | App-local client adapter over `@app/supabase`       |
| Auth store             | `apps/mobile/src/stores/auth.store.ts`                                        | `.store.ts`                   | Zustand session+status slice; depends on IAuthSession (port), no SDK |
| Global stores          | `apps/mobile/src/stores/ui.store.ts`, `apps/mobile/src/stores/toast.store.ts` | `.store.ts`                   | Cross-screen Zustand slices                         |
| Auth provider          | `apps/mobile/src/components/AuthProvider/AuthProvider.component.tsx`          | `.component.tsx`              | Mounts auth bootstrap; takes IAuthGateway via prop  |
| Auth bootstrap hook    | `apps/mobile/src/components/AuthProvider/useAuthBootstrap.hook.ts`            | `.hook.ts`                    | Subscribes to IAuthGateway, hydrates auth.store, cleans up |
| Session selector hook  | `apps/mobile/src/hooks/useSession.hook.ts`                                    | `.hook.ts`                    | Selector hook returning { session, status } from auth.store |
| i18n config            | `apps/mobile/src/lib/i18n/i18n.config.ts`                                    | `.config.ts`                  | react-i18next + ICU init consuming @app/i18n resources; AsyncStorage/device locale resolution |
| Offline banner         | `apps/mobile/src/components/ui/OfflineBanner/OfflineBanner.component.tsx`     | `.component.tsx`              | Controlled connectivity banner; i18n via react-i18next |
| Modal (mobile)         | `apps/mobile/src/components/ui/Modal/Modal.component.tsx`                     | `.component.tsx`              | RN Modal bottom-sheet; scrim Pressable + grabber + inline close; tokens via @app/tokens |
| Modal constants (mobile) | `apps/mobile/src/components/ui/Modal/Modal.constant.ts`                     | `.constant.ts`                | Grabber width/height, close icon size |
| Confirm dialog (mobile) | `apps/mobile/src/components/ui/ConfirmDialog/ConfirmDialog.component.tsx`   | `.component.tsx`              | Confirmation composed on Modal; danger confirm Pressable; i18n confirm/cancel |
| Empty state (mobile)   | `apps/mobile/src/components/ui/EmptyState/EmptyState.component.tsx`           | `.component.tsx`              | Icon glyph + title + message + optional CTA; copy via react-i18next |
| Error state (mobile)   | `apps/mobile/src/components/ui/ErrorState/ErrorState.component.tsx`           | `.component.tsx`              | Error message + optional retry; FallbackComponent compatible; code-driven copy |
| Error state codes (mobile) | `apps/mobile/src/components/ui/ErrorState/ErrorState.constant.ts`        | `.constant.ts`                | ErrorStateCodeEnum + i18n namespace keys |
| Loading skeleton (mobile) | `apps/mobile/src/components/ui/LoadingSkeleton/LoadingSkeleton.component.tsx` | `.component.tsx`         | Shimmer placeholder (expo-linear-gradient + Reanimated via useShimmer) |
| Shimmer hook (mobile)  | `apps/mobile/src/components/ui/LoadingSkeleton/useShimmer.hook.ts`            | `.hook.ts`                    | Reanimated translateX loop driving the skeleton sweep |
| Status badge (mobile)  | `apps/mobile/src/components/ui/StatusBadge/StatusBadge.component.tsx`         | `.component.tsx`              | Pill dot+label; token tone map success/warning/danger/neutral |
| Status badge tones (mobile) | `apps/mobile/src/components/ui/StatusBadge/StatusBadge.constant.ts`    | `.constant.ts`                | STATUS_BADGE_TONE_COLORS map + dot/padding consts |
| Glass card (mobile)    | `apps/mobile/src/components/ui/GlassCard/GlassCard.component.tsx`             | `.component.tsx`              | RN glass surface: expo-blur BlurView + glass.fill overlay + 1px stroke; padding/radius variants |
| Screen header (mobile) | `apps/mobile/src/components/ui/ScreenHeader/ScreenHeader.component.tsx`        | `.component.tsx`              | Back + centred title + optional trailing action; composes IconButton |
| Setting row (mobile)   | `apps/mobile/src/components/ui/SettingRow/SettingRow.component.tsx`            | `.component.tsx`              | Label/subtitle + trailing control/value/chevron slot; composes Icon |
| List row (mobile)      | `apps/mobile/src/components/ui/ListRow/ListRow.component.tsx`                  | `.component.tsx`              | Generic list item: leading/title/subtitle/trailing slots; isFirst divider |
| Nav bar (mobile)       | `apps/mobile/src/components/ui/NavBar/NavBar.component.tsx`                    | `.component.tsx`              | Floating glass pill nav (expo-blur); items take IconNameType; composes Icon |
| Auth shell (mobile)    | `apps/mobile/src/components/ui/AuthShell/AuthShell.component.tsx`              | `.component.tsx`              | Centred auth layout: gradient brand mark + title/subtitle + GlassCard form; composes GlassCard/Icon |
| Auth field (mobile)    | `apps/mobile/src/components/ui/AuthField/AuthField.component.tsx`              | `.component.tsx`              | Glass labeled TextInput; helper/error states; password reveal toggle; composes Icon |
| Social auth button (mobile) | `apps/mobile/src/components/ui/SocialAuthButton/SocialAuthButton.component.tsx` | `.component.tsx`        | Google social-auth glass pill; brand glyph isolated in constants |
| Google brand glyph (mobile) | `apps/mobile/src/components/ui/SocialAuthButton/GoogleGlyph.constant.ts`  | `.constant.ts`              | Third-party Google brand colors (not design tokens) |
| Route tree             | `apps/mobile/src/app`                                                         | Expo Router                   | `_layout.tsx`, `index.tsx`, file-based routes       |
| Test infra             | `apps/mobile/src/test`                                                        | (no suffix)                   | Vitest setup + mocks (harness, not a unit)          |

The same reserved-by-convention folders apply (`constants/`, `hooks/`,
`components/`, `validation/`): add them per app only once a thing is shared by
more than one screen.

---

## 4. Screens (fractal roots)

Screens are the build unit. Each one is self-contained and owns its data
fetching, layout, and local members. Their internals are mapped per screen by
[screen-map.template.md](screen-map.template.md).

| App    | Screens root              | Example screen                           |
| ------ | ------------------------- | ---------------------------------------- |
| Web    | `apps/web/src/screens`    | `apps/web/src/screens/ItemsDashboard`    |
| Web    | `apps/web/src/screens`    | `apps/web/src/screens/ItemsSummary`      |
| Mobile | `apps/mobile/src/screens` | `apps/mobile/src/screens/ItemsDashboard` |

Data flow inside every screen: **screen → hook → service → adapter**. A screen
never calls `fetch` directly and never holds business logic in the view.

---

## 5. Design tokens & styling

| Concern         | Where                                                                                 | Notes                                            |
| --------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Token values    | `packages/tokens/src/tokens.constant.ts`                                              | Single source of truth (colors / spacing / type) |
| Tailwind preset | `packages/tokens/tailwind-preset.cjs`                                                 | Web Tailwind + mobile NativeWind both extend it  |
| Web Tailwind    | `apps/web/tailwind.config.ts`                                                         | Extends the shared preset                        |
| Mobile Tailwind | `apps/mobile/tailwind.config.js`                                                      | Extends the shared preset                        |
| Class constants | `apps/web/src/helpers/style.constant.ts`, `apps/mobile/src/helpers/style.constant.ts` | No inline class strings in views — import these  |

Inline literals (numbers/strings) belong in `*.constant.ts` or `*.styles.ts`
only — enforced by ESLint and by `node scripts/verify-maps.mjs`.

---

## 6. Tooling, gates & agent skills

| Thing                | Path                                     | What it does                                                                          |
| -------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Deterministic gate   | `package.json`                           | `pnpm validate` → `turbo run lint typecheck test build format:check` + verify scripts |
| Tests-per-unit check | `scripts/verify-tests.mjs`               | Fails if a unit lacks a sibling `*.test.*`                                            |
| Maps + literal check | `scripts/verify-maps.mjs`                | This map's integrity + magic-literal audit (`pnpm verify:maps`)                       |
| Project rename       | `scripts/init-project.mjs`               | Rewrites `@app/*`, `app-monorepo-template`, and bundle ID to a real project slug      |
| Identity guard       | `scripts/check-identity.mjs`             | Fails if template-default identity is still present; wired into `pnpm validate`       |
| CI workflow          | `.github/workflows/ci.yml`               | Runs `pnpm install` + `pnpm validate` on PR and push to main (ATL_TEMPLATE_SELF=1)   |
| Lint rules           | `eslint.rules.mjs`, `eslint.config.mjs`  | Arrow-only, alias imports, suffixes, naming, no-magic-numbers                         |
| Prettier             | `.prettierrc.json`                       | No semicolons, single quotes, width 75                                                |
| Commit lint          | `commitlint.config.js`                   | Conventional commits (commit-msg hook)                                                |
| Turbo pipeline       | `turbo.json`                             | Task graph + `dependsOn` ordering                                                     |
| Validation harness   | `.claude/skills/validate-all/SKILL.md`   | Deterministic gate + grouped adversarial validators                                   |
| Fractal audit skill  | `.claude/skills/fractal-verify/SKILL.md` | Per-block fractal architecture audit                                                  |
| Validator subagent   | `.claude/agents/validator.md`            | Subagent definition used by the harness                                               |

---

## 7. Where does a new thing go? (decision shortcut)

1. **Pure value / logic / contract, no framework** → `packages/` (section 1).
2. **Shared by 2+ screens, app-specific** → that app's `src/` root (sections 2–3).
3. **Used by exactly one screen** → that screen's folder (per-screen template).
4. **Data access** → `src/services/<Domain>/` (PascalCase folder) containing
   `.service.ts` + paired `.adapter.ts` + optional `.constant.ts` + barrel `index.ts`.
   External consumers import from the barrel; never `fetch` in a view.
5. **Magic value** → a `*.constant.ts` (or `*.styles.ts` for styling), never inline.
