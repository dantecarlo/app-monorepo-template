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
├── next.config.ts · postcss.config.mjs · tailwind.config.cjs · instrumentation.ts
├── sentry.client.config.ts · sentry.server.config.ts · sentry.edge.config.ts
└── src/
    ├── middleware.ts              # origin lock (originGuard adapter)
    ├── app/                       # Next App Router — ROUTING ONLY (RSC)
    │   ├── layout.tsx             # root layout: fonts, theme script, ThemeProvider, providers
    │   ├── fonts/                 # Inter and Montserrat files + OFL.txt (next/font/local)
    │   ├── providers.tsx · SupabaseProviders.tsx   # NextIntl, QueryClient, AuthProvider, Toast
    │   ├── error.tsx              # root segment boundary: render crash → ErrorState + retry
    │   ├── global-error.tsx       # root layout crash: own html/body → ErrorState + retry
    │   ├── globals.css            # Tailwind CSS 4 entry: @config the preset, themed colours, body base
    │   ├── page.tsx               # / → ItemsSummaryScreen (RSC, in Suspense) + ItemsDashboardScreen
    │   ├── login/page.tsx         # /login → LoginScreen
    │   └── api/turnstile/verify/route.ts   # Turnstile token check (botProtection adapter)
    │
    ├── screens/<ScreenName>/      # one folder per screen — FRACTAL (same as mobile)
    │   ├── <ScreenName>.screen.tsx · .style.ts · components/ · hooks/ · models/ · index.ts
    │
    ├── components/                # SHARED UI — AuthProvider/, ThemeProvider/, ui/{Button,Text,Divider,Screen,…}
    │                              # ui/variants.helper.ts: the one tv the ui blocks build with
    ├── services/<Domain>/         # SHARED transversal services — service + adapter + barrel
    ├── lib/                       # bot-protection, image-delivery, observability, origin-guard,
    │                              # query, supabase, theme
    └── stores/  helpers/ (layout.style.ts: positioning only)  validation/  i18n/  test/
```

Every folder that holds a unit keeps that unit's test in its own `__tests__/`, named after it:
`components/ui/Button/__tests__/Button.component.test.tsx`, `stores/__tests__/auth.store.test.ts`,
`app/__tests__/error.test.tsx` (Next treats a folder that starts with `_` as private, outside the
routes). `src/test/` holds the shared setup, test helper and MSW mocks
([code-standards § 9](../code-standards.md)).

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
  primitive wraps client islands. A render crash below the root layout lands in `app/error.tsx`,
  and a crash of the root layout in `app/global-error.tsx`, which renders its own document; both
  show the `ErrorState` with a retry. A segment can add its own `error.tsx` or `loading.tsx`;
  none ships below the root.
- **Route segments**: organize by logical area (e.g. `/dashboard`, `/profile`, `/settings`) with
  server layouts. `src/middleware.ts` only enforces the origin lock today; it gates no route.

## 4. UI & i18n stack

- **In-repo UI primitives** under `src/components/ui/` (no shadcn) + **Tailwind CSS 4**.
  `src/app/globals.css` loads `tailwind.config.cjs` with `@config`, and that config loads the
  `@app/tokens` preset: the spacing, radius, font-size, layout-width, glyph and inset scales come
  from it. The CSS keeps what the preset cannot carry, the colours that flip per theme through the
  `--c-*` variables (its `@theme` wins over the preset), the font families `next/font` injects,
  the shadows `.glass-card` reads, and the base look of `<body>`. `pnpm verify:theme-sync` keeps
  every colour of both themes equal to the tokens.
- **Fonts are self-hosted.** `src/app/layout.tsx` loads Inter (400, 500) and Montserrat (400 to
  800) with `next/font/local` from `src/app/fonts/`, as `--font-inter` and `--font-montserrat`
  with `display: 'swap'`, so `next build` fetches nothing (`next/font/google` downloaded them at
  build time, and a network blip failed the build). The files are copies of the ones
  `@expo-google-fonts/inter` and `@expo-google-fonts/montserrat` ship, the packages the mobile app
  loads; `src/app/fonts/OFL.txt` holds their licence. To update them, bump those packages in
  `apps/mobile`, copy the same `*_<weight><Style>.ttf` files from
  `node_modules/@expo-google-fonts/<family>/` over the ones in `src/app/fonts/`, and keep the
  copyright lines of `OFL.txt` equal to each file's name record. A new weight is a new file there
  and a new `src` entry in the layout. `src/app/__tests__/layout.test.tsx` checks that every file
  the layout names exists and that nothing loads from Google Fonts.
- **Styling lives in the components** (`AGENTS.md` LAW, `docs/code-standards.md` §22). A block
  under `components/ui/`, or a screen's own `components/`, owns its look; a screen, a route entry
  and a container only position, through their `*.style.ts` and `helpers/layout.style.ts`. Text
  is `ui/Text` (a variant, or a tone and a weight), a labelled rule is `ui/Divider`, and a
  screen's surface is `ui/Screen`. Every value is a token or a step of Tailwind's scale, and only
  `ui/` imports a UI kit or `tailwind-variants`. `local/style-positions-only`,
  `local/style-token-values` and `local/ui-kit-boundary` hold it. Every block builds its variants
  with the shared `tv` of `components/ui/variants.helper.ts`, which tells tailwind-merge
  that the token sizes (`text-button`, `text-initials-sm`) are font sizes, not colours.
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
