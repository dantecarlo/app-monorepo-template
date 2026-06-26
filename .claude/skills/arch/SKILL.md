---
name: arch
description: >
  Foundational architecture reference and navigational map for the template
  monorepo. Encodes the fractal layer contract, file-naming suffixes, TypeScript
  naming conventions, import policy, Tailwind-in-constants pattern, service+adapter
  pairing, TanStack Query wrappers, Zustand state, and the agnostic domain layer
  (@app/core ports, errors, PII scrubbing).
  USE WHEN: "what's the architecture?", "what are the conventions?",
  "how should I name this?", "what layer does X belong to?", any coding task,
  "show me the folder structure", "what are the rules?".
---

# Architecture Reference

> The binding source of truth is `docs/code-standards.md`. This skill is the
> navigational map on top of it — it explains the WHY and shows the complete
> layout. When any rule here conflicts with `docs/code-standards.md`, the
> doc file wins.
>
> Stack defaults: React + TypeScript + Tailwind + Zustand + TanStack Query.
> Web = Next.js (App Router). Mobile = Expo (Expo Router).
> Both apps live in the monorepo under `apps/web` and `apps/mobile`.

For structural audits of a specific block, use `fractal-verify` instead.

---

## 1. Directory Layout

```
apps/
├── web/src/
│   ├── app/             # Next.js App Router pages
│   ├── screens/         # Container screens (one folder per screen, PascalCase)
│   ├── components/      # Reusable UI components
│   │   └── ui/          # Generic primitives (Button, Avatar, Chip, EmptyState…)
│   ├── hooks/           # Shared cross-screen hooks
│   ├── services/        # Data layer — grouped per domain (see §6)
│   │   └── <Domain>/    # PascalCase: Items/, AuthProvider/, etc.
│   ├── stores/          # Zustand slices (one file per slice)
│   ├── lib/             # Third-party wrappers (query, supabase, msw, …)
│   ├── helpers/         # Pure utility functions
│   └── test/            # Test helper, MSW setup, mock data
│
├── mobile/src/
│   ├── app/             # Expo Router screens
│   ├── screens/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   ├── lib/
│   └── test/
│
packages/
├── core/                # @app/core — agnostic domain layer (ports, errors, PII)
├── i18n/                # @app/i18n — translation catalog
├── tokens/              # @app/tokens — design tokens
└── supabase/            # @app/supabase — Supabase client factory
```

**Key rule**: folders are optional — create them only when needed. When they
exist, naming and structure are mandatory.

---

## 2. Layer Contract

| Layer           | Contents                                              | Rule                                              |
| --------------- | ----------------------------------------------------- | ------------------------------------------------- |
| Domain / Core   | Ports (IAuthGateway, IBackendClientProvider), AppError, scrubPII | No framework or vendor imports. Lives in `@app/core`. |
| Application     | Hooks that orchestrate ports, TanStack Query wrappers | No UI framework imports in business logic         |
| Infrastructure  | Service functions, adapters, Zustand store slices     | May import TanStack Query, Zustand, Supabase (via port only) |
| Presentation    | Components, screens, pages                            | May import any, but no direct data fetching       |

**Dependency direction**: inward only. Domain depends on nothing. Outer layers
depend inward through ports/interfaces, never the reverse.

---

## 3. File Suffixes (Rule 3 of `docs/code-standards.md`)

| File type                   | Suffix + extension       | Example                      |
| --------------------------- | ------------------------ | ---------------------------- |
| Presentational component    | `Name.component.tsx`     | `ItemCard.component.tsx`     |
| Screen (container)          | `Name.screen.tsx`        | `Dashboard.screen.tsx`       |
| Custom hook                 | `useName.hook.ts`        | `useItems.hook.ts`           |
| Service (API calls)         | `name.service.ts`        | `items.service.ts`           |
| Adapter (DTO → domain)      | `Name.adapter.ts`        | `Items.adapter.ts`           |
| TypeScript types/interfaces | `Name.type.ts`           | `Item.type.ts`               |
| Constants                   | `Name.constant.ts`       | `queryKeys.constant.ts`      |
| Tailwind class constants     | `Name.styles.ts`         | `ItemCard.styles.ts`         |
| Helper / pure utility       | `name.helper.ts`         | `formatDate.helper.ts`       |
| Zustand store               | `name.store.ts`          | `ui.store.ts`                |
| Test file                   | `Name.test.tsx`          | `ItemCard.test.tsx`          |
| Barrel export               | `index.ts`               |                              |

---

## 4. TypeScript Naming Conventions (Rule 4)

```typescript
// Interfaces — I prefix
interface IItemCard { ... }
interface IUseItems { ... }

// Type aliases — Type suffix
type ItemRowType = { ... }
type StatusType = 'active' | 'inactive'

// Enums — Enum suffix, ALL_CAPS values
enum ItemStatusEnum {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

// Constants — ALL_CAPS, named by PURPOSE not VALUE
const MAX_RETRY_ATTEMPTS = 3   // purpose-named ✅
const NUMBER_THREE = 3         // value-named ❌
```

---

## 5. Constant Naming — Purpose Over Value

```typescript
// ❌ Value-named (banned)
const NUMBER_FIVE = 5
const COLOR_RED = '#ef4444'

// ✅ Purpose-named
const PASSWORD_MIN_LENGTH = 5
const DANGER_COLOR = '#ef4444'
```

---

## 6. Service + Adapter — Per-Domain Folder (Rule 6)

Services live in dedicated PascalCase subfolders under `src/services/`:

```
src/services/
└── Items/
    ├── items.service.ts       # async fetch functions, returns raw DTOs
    ├── Items.adapter.ts       # pure DTO → domain shape (no async, no I/O)
    ├── items.constant.ts      # optional domain constants
    ├── index.ts               # barrel: exports service + adapter ONLY
    ├── items.service.test.ts
    └── Items.adapter.test.ts
```

- The barrel (`index.ts`) exports service functions and adapter functions only.
  Never exports constants, types, or test utilities.
- External consumers import from the barrel: `import { ... } from '@/services/Items'`.
- Internal files use full alias paths: `@/services/Items/<file>` (no `../`).
- Service and adapter are **always paired**. Never create one without the other.
- Service returns raw DTOs. Adapter is pure — no async, no side effects.

Data flow: `Component → Hook → Service → Adapter`

---

## 7. Import Policy — Alias Only (Rule 2)

```typescript
// ❌ Relative imports (banned outside barrel index.ts)
import { Item } from '../../domain/Item.type'

// ✅ Alias imports
import { IAuthGateway } from '@app/core'          // workspace package
import { ItemCard } from '@/components/ui/ItemCard' // app-local alias
import { getItems } from '@/services/Items'         // domain barrel
```

Available aliases:
- `@/*` → `src/*` inside each app (`apps/web/src`, `apps/mobile/src`)
- `@app/*` → workspace packages (`@app/core`, `@app/tokens`, `@app/i18n`, etc.)

Exception: `index.ts` barrel re-exports may use `./` relative paths for siblings.

---

## 8. Arrow Functions Only (Rule 1)

No `function` keyword anywhere — arrow expressions only.

```typescript
// ❌
function formatDate(iso: string): string { ... }
export function ItemCard({ label }: IItemCard) { ... }

// ✅
const formatDate = (iso: string): string => { ... }
export const ItemCard = ({ label }: IItemCard) => { ... }
```

---

## 9. Single-Object Parameters (Rule 5)

Every function, hook, service, and component takes one object argument.

```typescript
// ❌
const useItems = (limit: number, search: string) => { ... }

// ✅
const useItems = ({ limit, search }: IUseItems) => { ... }
```

Exceptions: React event handlers, array callbacks (`map`, `filter`),
third-party library callbacks (TanStack `queryFn`, MSW handlers).

---

## 10. Tailwind Classes in Constants (no inline class strings)

```typescript
// ❌ Inline class soup in JSX
<div className="flex items-center gap-3 py-3 border-t">

// ✅ Named constants in *.styles.ts
// ItemCard.styles.ts
export const ITEM_CARD = {
  CONTAINER: 'flex items-center gap-3 py-3',
  DIVIDER: 'border-t border-white/[0.06] first:border-t-0',
  AVATAR: 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted',
} as const

// In component
import { ITEM_CARD } from '@/components/ItemCard/ItemCard.styles'
<div className={`${ITEM_CARD.CONTAINER} ${ITEM_CARD.DIVIDER}`}>
```

Constants describe purpose: `CONTAINER`, `AVATAR` — not `FLEX_ROW`, `ROUNDED`.

---

## 10a. Logic in Hooks — Views Stay Render-Only (Rule 14a)

A `*.component.tsx` / `*.screen.tsx` is **render + composition ONLY**. When a
view holds logic, that logic moves into a colocated `use{Name}.hook.ts`. The
view consumes the hook's result and stays render-only.

```
View (.component/.screen) → useName.hook.ts → Service → Adapter
```

A `use{Name}.hook.ts` is **REQUIRED** when the view holds LOGIC:

1. 2+ `useState`, OR a single `useState` holding derived/business/multi-value
   state (NOT a trivial boolean toggle).
2. Any `useEffect` / `useMemo` / `useCallback` / `useRef` carrying behaviour.
3. An event-handler body that branches or has 2+ statements / `await`.
4. A captured `.map` / `.filter` / `.sort` / `.reduce` derivation producing a
   NEW shape (i18n view-model mapping counts).
5. Client-side `async` / `await` / `.then` / `fetch`.

ALLOWED INLINE: pure render; ONE trivial boolean toggle `useState`; prop
pass-through handlers (`onPress={onPress}`); `.map` inline in JSX that only
renders JSX; RSC async **server** screens calling a data/use-case layer (a naked
service call still belongs behind a colocated loader, e.g.
`loadItemsSummary.service.ts`).

```typescript
// ❌ Logic stranded in the view
const ItemsDashboardScreen = () => {
  const [activeNav, setActiveNav] = useState('home') // business state in view
  const labels = NAV.map((n) => ({ ...n, label: t(n.key) })) // captured derivation
  // ...
}

// ✅ Logic owned by the hook; view renders the result
const ItemsDashboardScreen = () => {
  const { activeNav, items, onNavChange } = useItems()
  return <DashboardNav activeId={activeNav} onItemPress={onNavChange} />
}
```

The deterministic subset is a hard ESLint gate: `local/logic-in-view` (ERROR —
2+ useState, branching handlers, captured derivations), `local/single-use-state`
(WARN — single useState guidance), `useRef`/`useEffect`/`useMemo`/`useCallback`
and client `async`/`.then` bans via `no-restricted-syntax`. `apps/web` RSC async
screens are an explicit allowlist (`RSC_ASYNC_SCREEN_OVERRIDE`). See
`docs/code-standards.md` Rule 14a.

---

## 11. TanStack Query Wrappers

Use `useAppQuery` and `useAppMutation` from `@/lib/query`. Never call
`useQuery`/`useMutation` directly in features.

```typescript
const useItemList = ({ contextId }: IUseItemList) => {
  return useAppQuery<IItemViewModel[]>({
    queryOptions: {
      queryKey: sanitizeQueryKey({
        key: QueryKeys.items.list(contextId)
      }),
      queryFn: async () => {
        const dtos = await getItems({ contextId })
        return adaptItems(dtos)
      }
    },
    errorMessage: 'Could not load items.'
  })
}
```

Register all query keys in `@/lib/query/queryKeys.constant.ts` (never inline strings).
Use `sanitizeQueryKey` from `@app/core` to scrub PII from query keys.

---

## 12. Zustand State

Use Zustand for cross-feature UI state. TanStack Query owns all async/server state.
Context is only for framework-required providers (theme, auth session).

```typescript
// ui.store.ts
import { create } from 'zustand'

interface IUiState {
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
}

export const selectIsSidebarOpen = (s: IUiState): boolean => s.isSidebarOpen
export const selectSetIsSidebarOpen = (s: IUiState) => s.setIsSidebarOpen

export const useUiStore = create<IUiState>((set) => ({
  isSidebarOpen: false,
  setIsSidebarOpen: (open) => set({ isSidebarOpen: open })
}))
```

Consumers subscribe to one selector at a time: `useUiStore(selectIsSidebarOpen)`.

---

## 13. @app/core — Agnostic Domain Layer

The `@app/core` package holds everything that must stay framework-agnostic:

```typescript
// Ports — define the contract, not the implementation
import type { IAuthGateway } from '@app/core'
import type { IBackendClientProvider } from '@app/core'

// Error handling
import { AppError, buildServiceError } from '@app/core'

// PII scrubbing (use before any logging or query key)
import { scrubPII, PII_KEYS, sanitizeQueryKey } from '@app/core'
```

- Vendor SDKs (Supabase, etc.) are accessed only through these ports.
  Never import a vendor SDK directly in a feature or hook.
- `IBackendClientProvider` is the port for the database client.
  `IAuthGateway` is the port for authentication.
- `buildServiceError` / `AppError` are the standard error shapes for services.

---

## 14. Prettier Contract (Rule 13)

```json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 75,
  "tabWidth": 2,
  "trailingComma": "none"
}
```

No semicolons. Single quotes. 75-character print width.

---

## 15. i18n

UI copy goes through `@app/i18n`. Never hardcode user-facing strings as
inline literals. Define keys in the translation catalog; load with the
project's i18n hook.

---

## 16. Web vs Mobile

| Concern       | Web (Next.js App Router) | Mobile (Expo Router)               |
| ------------- | ------------------------ | ---------------------------------- |
| Routing       | `app/` directory         | `app/` directory                   |
| Styling       | Tailwind + `*.styles.ts` | NativeWind or StyleSheet + `*.styles.ts` |
| Nav hook      | `useRouter` (next/navigation) | `useRouter` (expo-router)     |
| State/query   | Zustand + TanStack Query | Same                               |
| `'use client'`| Required for hooks/interactivity | Not applicable             |

All business logic in hooks and services is framework-agnostic.

---

## Audit counterpart

Use `fractal-verify` to audit the structure of a specific screen or component
block. Use `validate-all` for a full post-generation harness (standards,
tests, security, a11y).
