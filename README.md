# app-monorepo-template

A production-grade **pnpm + Turborepo monorepo starter** for building a **web (Next.js)** app and a **mobile (Expo)** app that share one design system and architecture.

---

## Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Web | Next.js 15 (App Router) + Tailwind CSS v3 |
| Mobile | Expo (React Native) + NativeWind v4 |
| Design system | `@app/ui` — shared tokens + Tailwind preset |
| State | Zustand |
| Data fetching | TanStack Query v5 |
| Language | TypeScript (strict) |
| Optional backend | Supabase (env-driven, off by default) |

---

## Monorepo layout

```
app-monorepo-template/
├── pnpm-workspace.yaml
├── package.json            # root scripts (turbo build/dev/lint/typecheck)
├── turbo.json
├── tsconfig.base.json      # shared TS base config (@app/* path aliases)
├── .gitignore
├── .prettierrc
├── LICENSE
│
├── packages/
│   └── ui/                 # @app/ui — shared design tokens + Tailwind preset
│       ├── package.json
│       ├── src/
│       │   ├── tokens.ts   # colors, spacing, radius, typography, shadows
│       │   └── index.ts    # barrel
│       └── tailwind-preset.cjs  # CommonJS preset consumed by both apps
│
└── apps/
    ├── web/                # @app/web — Next.js 15 + App Router
    │   ├── package.json
    │   ├── next.config.ts
    │   ├── tailwind.config.ts   # extends @app/ui preset
    │   ├── postcss.config.mjs
    │   ├── tsconfig.json
    │   └── src/
    │       ├── app/             # Next.js App Router root
    │       │   ├── layout.tsx
    │       │   ├── page.tsx
    │       │   ├── providers.tsx
    │       │   └── globals.css
    │       ├── components/ui/   # shared presentational atoms
    │       │   ├── Button/
    │       │   ├── Chip/
    │       │   └── GlassCard/
    │       ├── features/
    │       │   └── items/       # demo feature — fractal folder structure
    │       │       ├── components/
    │       │       ├── hooks/
    │       │       ├── models/
    │       │       ├── screens/
    │       │       └── services/
    │       ├── helpers/
    │       │   └── style.constant.ts
    │       ├── lib/
    │       │   ├── query/       # useAppQuery, useAppMutation, QueryKeys
    │       │   └── supabase/    # optional data layer
    │       └── stores/          # Zustand stores (toast, ui)
    │
    └── mobile/             # @app/mobile — Expo + expo-router + NativeWind
        ├── package.json
        ├── app.json
        ├── metro.config.js      # monorepo watchFolders + withNativeWind
        ├── babel.config.js
        ├── tailwind.config.js   # extends @app/ui preset
        ├── global.css
        ├── tsconfig.json
        ├── expo-env.d.ts
        ├── nativewind-env.d.ts
        ├── app/                 # expo-router file-based routes
        │   ├── _layout.tsx
        │   └── index.tsx
        ├── modules/             # native modules go here (empty placeholder)
        └── src/
            ├── features/
            │   └── items/       # same fractal structure as web
            ├── helpers/
            │   └── style.constant.ts   # RN StyleSheet constants from @app/ui tokens
            ├── lib/
            │   ├── query/
            │   └── supabase/
            └── stores/
```

---

## Shared design system

`packages/ui` is the **single source of truth** for visual design.

- `src/tokens.ts` — plain TypeScript objects: colors, spacing, radius, typography, shadows, gradients. No framework dependencies. Both apps import these directly.
- `tailwind-preset.cjs` — CommonJS Tailwind preset that maps the same values into Tailwind's `theme.extend`. Used by `apps/web/tailwind.config.ts` and `apps/mobile/tailwind.config.js` via `require('@app/ui/tailwind-preset.cjs')`.

**Web** consumes design tokens through Tailwind class names (e.g. `bg-bg-base`, `text-accent`, `glass-card`).

**Mobile** consumes design tokens two ways:
- NativeWind class names for layout/color (same Tailwind classes work on RN via NativeWind)
- Direct token imports via `@app/ui` for RN `StyleSheet.create()` entries in `style.constant.ts`

This means changing a color in `tokens.ts` + `tailwind-preset.cjs` propagates to both platforms.

---

## Architecture and conventions

### Fractal feature folders

Each feature lives under `src/features/<feature-name>/` and is fully self-contained:

```
features/items/
├── components/   # presentational — ItemCard.component.tsx + ItemCard.styles.ts
├── hooks/        # useItems.hook.ts (wraps useAppQuery)
├── models/       # Item.type.ts — DTO + ViewModel interfaces
├── screens/      # ItemsDashboard.screen.tsx (container)
├── services/     # items.service.ts (fetch) + Items.adapter.ts (DTO → VM)
└── index.ts      # barrel — export only what other features need
```

### Data-call chain

```
useXxx.hook → useAppQuery → xxx.service → Xxx.adapter → XxxViewModel
```

- `xxx.service.ts` — fetches raw DTOs (mock or real API/Supabase)
- `Xxx.adapter.ts` — maps DTO to ViewModel; ships as TanStack `select` function
- `useXxx.hook.ts` — wires service + adapter into `useAppQuery`
- Screen/component — consumes the ViewModel, never the DTO

### No relative imports

All imports use path aliases, never `../../`:

- `@/*` → `apps/web/src/*` or `apps/mobile/src/*` (within each app)
- `@app/ui` → `packages/ui/src/index.ts` (cross-package)

### Tailwind class-strings in constants

Never write inline `className` strings directly in JSX. All reusable class combinations live in `*.styles.ts` files or `helpers/style.constant.ts`:

```typescript
// good
import { TEXT, GLASS } from '@/helpers/style.constant';
<p className={TEXT.TITLE}>...</p>

// avoid
<p className="font-display text-title font-semibold text-text-primary">...</p>
```

### Naming conventions

| Artifact | Suffix | Example |
|---|---|---|
| React component | `.component.tsx` | `ItemCard.component.tsx` |
| Screen (container) | `.screen.tsx` | `ItemsDashboard.screen.tsx` |
| Hook | `.hook.ts` | `useItems.hook.ts` |
| Service | `.service.ts` | `items.service.ts` |
| Adapter | `.adapter.ts` | `Items.adapter.ts` |
| Type/interface file | `.type.ts` | `Item.type.ts` |
| Style constants | `.styles.ts` | `ItemCard.styles.ts` |
| Query keys | `.constant.ts` | `queryKeys.constant.ts` |
| Zustand store | `.store.ts` | `toast.store.ts` |

### Single-object params

Functions and hooks always accept a single options object for future extensibility:

```typescript
// good
export function useItems({ limit = 50, search }: UseItemsParams = {}) { ... }

// avoid
export function useItems(limit: number, search?: string) { ... }
```

### useAppQuery / useAppMutation

Thin wrappers over TanStack Query that inject a global error toast automatically. Use these instead of calling `useQuery`/`useMutation` directly:

```typescript
return useAppQuery<ItemViewModel[]>({
  queryOptions: {
    queryKey: QueryKeys.items.list(search),
    queryFn: async () => adaptItems(await getItems({ search })),
  },
  errorMessage: 'Failed to load items.',
});
```

### Zustand stores

- `toast.store.ts` — ephemeral toasts with auto-dismiss
- `ui.store.ts` — layout prefs (sidebar collapsed, active nav), persisted to localStorage (web) or memory (mobile)

---

## Getting started

```bash
# Install all workspace dependencies from the repo root
pnpm install

# Start the web app (Next.js dev server on http://localhost:3000)
pnpm --filter web dev

# Start the mobile app (Expo dev server)
pnpm --filter mobile start
```

> **Mobile note:** The Expo app runs in Expo Go by default for quick iteration. Once you add custom native modules under `apps/mobile/modules/`, you will need a development build (`expo run:android` / `expo run:ios`).

### Environment variables

Web (copy to `apps/web/.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Mobile (copy to `apps/mobile/.env`):

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Both apps ship with mock data by default — Supabase is entirely optional and only required when you swap the service layer for real API calls.

---

## How to add a feature

1. Create `src/features/<feature-name>/` with the full fractal structure.
2. Define the DTO and ViewModel in `models/<Feature>.type.ts`.
3. Implement the service in `services/<feature>.service.ts`.
4. Write the adapter in `services/<Feature>.adapter.ts`.
5. Create the hook `hooks/use<Feature>.hook.ts` using `useAppQuery`.
6. Add query keys to `lib/query/queryKeys.constant.ts`.
7. Build the screen and components under `screens/` and `components/`.
8. Export the public API through `index.ts`.

The same structure applies to both `apps/web` and `apps/mobile`.

---

## License

Proprietary — All Rights Reserved. This repository is published for viewing and evaluation only.
To use, deploy, or build upon this code, you must obtain written permission or a paid license from the author.
Contact: [https://github.com/dantecarlo](https://github.com/dantecarlo)
