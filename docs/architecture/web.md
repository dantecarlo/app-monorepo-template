# Web architecture — Next.js 15 App Router (fractal, screen-centric)

> Same **fractal screen-centric** philosophy as [mobile.md](mobile.md); the difference is the
> **routing layer** (Next App Router + RSC instead of Expo Router) and the **UI stack**
> (shadcn/Tailwind instead of RN/NativeWind). General model: [shared.md](shared.md). Code rules:
> [../code-standards.md](../code-standards.md).

## 1. Philosophy

Identical to mobile: **shared at the root of `src/`**, **screen-specific inside
`src/screens/<Screen>/`**, build **by screen**, decision rule "used by >1 screen? → shared". The
only differences from mobile are the routing layer and the UI primitives.

## 2. Directory layout

```
apps/web/
├── next.config.mjs · tailwind.config.ts · sentry.*.config.ts · instrumentation.ts
└── src/
    ├── app/                      # Next App Router — ROUTING ONLY (RSC)
    │   ├── layout.tsx            # root layout (providers: QueryClient, i18n, ErrorBoundary)
    │   ├── page.tsx              # delegates to a screen
    │   ├── global-error.tsx      # root crash fallback
    │   ├── <segment>/page.tsx    # each route → delegates to @/screens/<Screen>
    │   ├── <segment>/loading.tsx # route Suspense fallback (skeleton)
    │   └── <segment>/error.tsx   # route error boundary → ErrorState
    │
    ├── screens/<ScreenName>/      # one folder per screen — FRACTAL (same as mobile)
    │   ├── <ScreenName>.screen.tsx · .styles.ts · components/ · hooks/ · models/ · index.ts
    │
    ├── components/                # SHARED UI — shadcn/ui + ui/{Button,Chip,GlassCard,ErrorState,EmptyState}
    ├── services/                  # SHARED transversal services — each with its adapter
    ├── hooks/  stores/  lib/{query,observability}  helpers/  validation/  i18n/
```

## 3. Routing — Next App Router (the key difference)

`src/app/` is **routing only** (RSC). A route delegates to its screen:

```tsx
// src/app/dashboard/page.tsx  (Server Component by default)
import { ItemsDashboardScreen } from '@/screens/ItemsDashboard'
const DashboardPage = () => <ItemsDashboardScreen />
export default DashboardPage
```

- **RSC-first**: fetch server-side where possible; push interactivity into client
  islands marked `'use client'`. A screen may be a Server Component (data) composing client
  sub-components, or a `'use client'` screen for heavy interactivity.
- **Boundaries**: `global-error.tsx` (root), per-segment `error.tsx` (→ `ErrorState`), `loading.tsx`
  (Suspense skeleton). The `AsyncBoundary` client primitive wraps client islands.
- **Route segments**: organize by logical area (e.g. `/dashboard`, `/profile`, `/settings`) gated
  by middleware + server layouts.

## 4. UI & i18n stack

- **shadcn/ui + Tailwind**, tokens from `@app/ui` (the shared preset). Dark-glass token set for
  the default visual language.
- **i18n: `next-intl`** (App-Router-native, RSC + middleware) reading the shared `@app/i18n`
  ICU catalogs — same keys as mobile, different adapter.
- **Edge/security**: origin-lock middleware, security headers, Turnstile on abuse-prone forms
  (see [../infrastructure.md](../infrastructure.md) for the full checklist).

## 5. Differences vs mobile (quick reference)

| Concern        | Mobile (Expo)                    | Web (Next)                                       |
| -------------- | -------------------------------- | ------------------------------------------------ |
| Routing        | Expo Router `src/app/`           | Next App Router `src/app/` (RSC)                 |
| Route → screen | route file renders `<Screen/>`   | `page.tsx` renders `<Screen/>`                   |
| Boundaries     | per-route `ErrorBoundary` export | `error.tsx` / `global-error.tsx` / `loading.tsx` |
| UI             | React Native + NativeWind        | DOM + shadcn/Tailwind                            |
| i18n adapter   | react-i18next                    | next-intl                                        |
| Native modules | project-specific                 | none (consumer surface)                          |

Everything else (screens fractal, shared `src/` root, services+adapters, `packages/*`) is the same.

## 6. Migration map (features → screens)

`apps/web/src/features/items` collapses like mobile did:

| Current                                                       | Target                                                               |
| ------------------------------------------------------------- | -------------------------------------------------------------------- |
| `features/items/screens/ItemsDashboard.screen.tsx` (+ styles) | `screens/ItemsDashboard/`                                            |
| `features/items/components/ItemCard`                          | `src/components/ItemCard/` (shared)                                  |
| `features/items/services/{items.service,Items.adapter}.ts`    | `src/services/` (transversal)                                        |
| `features/items/hooks/useItems`                               | `screens/ItemsDashboard/hooks/` (1 screen) or `src/hooks/` if reused |
| `features/` directory                                         | **removed**                                                          |

Route `src/app/**/page.tsx` delegates to `@/screens/ItemsDashboard`.
