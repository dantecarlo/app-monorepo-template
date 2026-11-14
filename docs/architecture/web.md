# Web architecture — Next.js 16 App Router (fractal, screen-centric)

> Same **fractal screen-centric** philosophy as [mobile.md](mobile.md); the difference is the
> **routing layer** (Next App Router + RSC instead of Expo Router) and the **UI stack**
> (DOM + Tailwind CSS 4 instead of RN/NativeWind). General model: [shared.md](shared.md). Code
> rules: [../code-standards.md](../code-standards.md).

## 1. Philosophy

Identical to mobile: **shared at the root of `src/`**, **screen-specific inside
`src/screens/<Screen>/`**, build **by screen**, decision rule "used by >1 screen? → shared". The
only differences from mobile are the routing layer and the UI primitives.

## 2. Directory layout

```
apps/web/
├── next.config.ts · postcss.config.mjs · instrumentation.ts
├── sentry.client.config.ts · sentry.server.config.ts · sentry.edge.config.ts
└── src/
    ├── middleware.ts              # origin lock (originGuard adapter)
    ├── app/                       # Next App Router — ROUTING ONLY (RSC)
    │   ├── layout.tsx             # root layout: fonts, theme script, ThemeProvider, providers
    │   ├── providers.tsx · SupabaseProviders.tsx   # NextIntl, QueryClient, AuthProvider
    │   ├── globals.css            # Tailwind CSS 4 entry + @theme tokens
    │   ├── page.tsx               # / → ItemsSummaryScreen (RSC, in Suspense) + ItemsDashboardScreen
    │   ├── login/page.tsx         # /login → LoginScreen
    │   └── api/turnstile/verify/route.ts   # Turnstile token check (botProtection adapter)
    │
    ├── screens/<ScreenName>/      # one folder per screen — FRACTAL (same as mobile)
    │   ├── <ScreenName>.screen.tsx · .style.ts · components/ · hooks/ · models/ · index.ts
    │
    ├── components/                # SHARED UI — AuthProvider/, ThemeProvider/, ui/{Button,Chip,GlassCard,…}
    ├── services/<Domain>/         # SHARED transversal services — service + adapter + barrel
    ├── lib/                       # bot-protection, image-delivery, observability, origin-guard,
    │                              # query, supabase, theme
    └── stores/  helpers/  validation/  i18n/  test/
```

A shared `src/hooks/` folder is created on first use; none ships on web today.

## 3. Routing — Next App Router (the key difference)

`src/app/` is **routing only** (RSC). A route delegates to its screen:

```tsx
// src/app/login/page.tsx  (Server Component by default)
import { LoginScreen } from '@/screens/Login'
const LoginPage = () => <LoginScreen />
export default LoginPage
```

- **RSC-first**: fetch server-side where possible; push interactivity into client
  islands marked `'use client'`. A screen may be a Server Component (data) composing client
  sub-components — `ItemsSummaryScreen` is an async Server Component that loads its data through
  `loadItemsSummary.service.ts` — or a `'use client'` screen for heavy interactivity
  (`ItemsDashboardScreen`, `LoginScreen`).
- **Boundaries**: `page.tsx` wraps the async screen in `<Suspense>`; the `AsyncBoundary` client
  primitive wraps client islands. Next's `error.tsx`, `global-error.tsx` and `loading.tsx`
  conventions are available per segment; none ships today.
- **Route segments**: organize by logical area (e.g. `/dashboard`, `/profile`, `/settings`) with
  server layouts. `src/middleware.ts` only enforces the origin lock today; it gates no route.

## 4. UI & i18n stack

- **In-repo UI primitives** under `src/components/ui/` (no shadcn) + **Tailwind CSS 4**,
  configured CSS-first in `src/app/globals.css` (`@theme`). Its token values mirror
  `@app/tokens`; `pnpm verify:theme-sync` keeps the copies in lockstep. Dark-glass token set for
  the default visual language.
- **i18n: `next-intl`** reading the shared `@app/i18n` ICU catalogs — same keys as mobile,
  different adapter. `src/i18n/request.config.ts` resolves the locale from the `NEXT_LOCALE`
  cookie; there is no locale middleware.
- **Edge/security**: origin-lock middleware, security headers in `next.config.ts`, Turnstile on
  abuse-prone forms (see [../infrastructure.md](../infrastructure.md) for the full checklist).

## 5. Differences vs mobile (quick reference)

| Concern        | Mobile (Expo)                    | Web (Next)                                       |
| -------------- | -------------------------------- | ------------------------------------------------ |
| Routing        | Expo Router `src/app/`           | Next App Router `src/app/` (RSC)                 |
| Route → screen | route file renders `<Screen/>`   | `page.tsx` renders `<Screen/>`                   |
| Boundaries     | per-route `ErrorBoundary` export | `error.tsx` / `global-error.tsx` / `loading.tsx` |
| UI             | React Native + NativeWind        | DOM + Tailwind CSS 4                             |
| i18n adapter   | react-i18next                    | next-intl                                        |
| Native modules | project-specific                 | none (consumer surface)                          |

Everything else (screens fractal, shared `src/` root, services+adapters, `packages/*`) is the same.

## 6. The shipped sample

There is no `src/features/` folder; the sample code already follows the layout above.

| Unit                                                 | Where                                               |
| ---------------------------------------------------- | --------------------------------------------------- |
| Items dashboard and its five screen-local components | `screens/ItemsDashboard/`                           |
| Items summary (async Server Component)               | `screens/ItemsSummary/`                             |
| Login form                                           | `screens/Login/`                                    |
| Items and items-summary data access                  | `src/services/Items/`, `src/services/ItemsSummary/` |
