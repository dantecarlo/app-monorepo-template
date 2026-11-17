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
    │   ├── fonts/                 # Inter and Montserrat woff2 + their OFL texts (next/font/local)
    │   ├── providers.tsx · SupabaseProviders.tsx   # NextIntl, QueryClient, AuthProvider, Toast
    │   ├── error.tsx              # root segment boundary: render crash → ErrorState + retry, reported once
    │   ├── global-error.tsx       # root layout crash: own html/body → ErrorState + retry, reported once
    │   ├── globals.css            # Tailwind CSS 4 entry: imports the generated @app/tokens/theme.css
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
    │                              # (Items, ItemsSummary, Auth: sign-in through IAuthGateway)
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
  show the `ErrorState` with a retry, and report the crash to observability once through
  `useReportBoundaryError` and `reportBoundaryError` in `src/lib/observability/`. A segment can add
  its own `error.tsx` or `loading.tsx`; none ships below the root.
- **Where an error shows** ([code-standards § 19](../code-standards.md)): a failed query queues no
  toast; the screen shows its `ErrorState`, as the dashboard's items list does with a Try again
  that refetches. A failed mutation is the toast, from its error's `messageKey`.
- **Sign-in**: a valid login submit runs the `useSignIn` mutation, which calls the auth gateway
  port through `src/services/Auth/` and replaces the route with `/`; a rejection is the mutation
  toast, never a field error. The browser gateway lives in
  `src/lib/supabase/authGateway.adapter.ts`, shared by the auth provider and the auth service: a
  no-op during server rendering and without the Supabase settings. The gateway names each sign-in
  failure it knows as an `AppError` with its `auth.error` message key (`NOT_CONFIGURED`, and
  `INVALID_CREDENTIALS`, `EMAIL_NOT_CONFIRMED` and `RATE_LIMITED` from the Supabase Auth code),
  and an unreachable Supabase as the network error, so the toast says what went wrong; any other
  rejection stays generic.
- **Query keys**: `src/lib/query/queryKeys.constant.ts` builds every key from
  `QueryKeySegmentEnum` and puts its dynamic values in one trailing params object
  (`['items', 'list', { limit, search }]`), which the error report always redacts. A key holds
  every value its query reads, so two items lists of different limits never share a cache entry.
- **Route segments**: organize by logical area (e.g. `/dashboard`, `/profile`, `/settings`) with
  server layouts. `src/middleware.ts` only enforces the origin lock today; it gates no route.

## 4. UI & i18n stack

- **In-repo UI primitives** under `src/components/ui/` (no shadcn) + **Tailwind CSS 4**.
  `src/app/globals.css` imports `@app/tokens/theme.css`, which
  `packages/tokens/scripts/generate.mjs` writes from `packages/tokens/src/tokens.constant.ts`:
  the `--c-*` colours of both themes (flipped by `data-theme` on `<html>`), the `@theme` colour,
  font, shadow and motion variables, and the spacing, radius, font-size, layout-width, glyph and
  inset scales in `@theme inline`. The web loads no JavaScript config. A new value goes in the
  token source, then `pnpm --filter @app/tokens generate`; `pnpm verify:theme-sync` fails while
  the generated file differs from its regeneration. `globals.css` keeps by hand only what no
  `ui/` block can own (the `.glass-card` surface, the `<body>` and its aurora, the accent gradient
  and the shimmer), reading every colour, shadow, font and motion value through a generated
  variable.
- **Fonts are self-hosted.** `src/app/layout.tsx` loads Inter (400 to 500) and Montserrat (400
  to 800) with `next/font/local` from `src/app/fonts/`, as `--font-inter` and `--font-montserrat`
  with `display: 'swap'`, so `next build` fetches nothing (`next/font/google` downloaded them at
  build time, and a network blip failed the build). Each family is one file: the Latin variable
  woff2 Google Fonts serves (`inter-latin.woff2`, 48 KB, and `montserrat-latin.woff2`, 36 KB),
  with its licence beside it (`inter-OFL.txt`, `montserrat-OFL.txt`). The Latin subset holds
  every letter Spanish needs (U+0000 to U+00FF). They came from Certifipago (its commit
  `70f653001`), whose files match what Google serves byte for byte. To update one, download the
  `latin` woff2 that the Google Fonts CSS for the family names, check its sha256 against a second
  download, replace the file, and keep the copyright line of its OFL text equal to the
  file's name record. `src/app/__tests__/layout.test.tsx` checks that every file the layout
  names exists and is a woff2, that both together stay under 128 KB, and that nothing loads from
  Google Fonts.
- **Styling lives in the components** (`AGENTS.md` LAW, `docs/code-standards.md` §22). A block
  under `components/ui/`, or a screen's own `components/`, owns its look; a screen, a route entry
  and a container only position, through their `*.style.ts` and `helpers/layout.style.ts`. Text
  is `ui/Text` (a variant, or a tone and a weight), a labelled rule is `ui/Divider`, and a
  screen's surface is `ui/Screen`. Every value is a token or a step of Tailwind's scale, and only
  `ui/` imports a UI kit or `tailwind-variants`. `local/style-positions-only`,
  `local/style-token-values` and `local/ui-kit-boundary` hold it. Every block builds its variants
  with the shared `tv` of `components/ui/variants.helper.ts`, which registers every token name
  with tailwind-merge from the generated `themeNames` of `@app/tokens`: of two token classes of
  one utility only the last stays (`p-sm p-lg` is `p-lg`), a token size (`text-button`) is never
  read as a colour, and a token shadow stays beside a shadow colour.
- **i18n: `next-intl`** reading the shared `@app/i18n` ICU catalogs — same keys as mobile,
  different adapter. `src/i18n/request.config.ts` resolves the locale from the `NEXT_LOCALE`
  cookie; there is no locale middleware and no locale segment in the URL. Every component, server
  or client, renders in that locale: the root layout keeps its document shell static (Cache
  Components blocks a route that reads a cookie outside `<Suspense>`) and renders the providers
  inside `<Suspense>` through `src/app/LocaleProviders.tsx`, which reads the request's locale and
  messages (`getLocale`, `getMessages`) and hands them to the client providers. So the routes'
  content renders per request and only the shell is prerendered. The shell writes the default
  language on `<html lang>`; `src/i18n/noFlashLocale.constant.ts`, a pre-paint script beside the
  theme's, replaces it with the cookie's supported language, and the providers keep it in step
  after a switch (`useDocumentLanguage`). The language button writes the cookie and refreshes the
  router, which runs the request config again. `app/global-error.tsx`, which has no request
  config above it, reads the cookie on the client (`useCookieLanguage`). The cookie name, its
  lifetime and the time zone live in `src/i18n/i18n.constant.ts`, and the reduction of a value to
  a supported language in `src/i18n/locale.helper.ts`. Every user-facing string of a block is a
  catalog message, accessibility labels included; an adapter returns data, such as an item's age
  as a unit and a count, which the block words through the catalog.
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
| Sign-in through the auth gateway                     | `src/services/Auth/`, `screens/Login/hooks/`        |
