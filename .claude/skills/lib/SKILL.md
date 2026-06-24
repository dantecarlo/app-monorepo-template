---
name: lib
description: >
  Wrap a third-party vendor behind a project-internal API in src/lib/{name}/ or a
  workspace package. Features import from @/lib/{name} or @app/*, never from the
  vendor package directly (provider-behind-ports). Config from env vars only. The
  Supabase-behind-@app/supabase pattern is the canonical neutral wrapping example
  already in the template. Arrow-only, alias imports.
  USE WHEN: "wrap library", "create lib for [vendor]", "abstract [library]",
  "add [name] lib", "create a wrapper for [package]", "hide [vendor] behind a port".
---

# Create Lib

> A lib wrapper makes the vendor API a project-internal detail.
> Features import from `@/lib/{name}` or `@app/*`, never from the vendor package
> directly. This is the provider-behind-ports pattern — enforced by Rule 2 and the
> layer contract in `arch`.
>
> The canonical example in the template is the Supabase client:
> features never `import { createClient } from '@supabase/supabase-js'` — they
> import from `@app/supabase` or access the client via `IBackendClientProvider` from
> `@app/core`.

---

## Do You Need a New Lib?

```
Does any feature import directly from the vendor package?
├── YES → wrap it so the vendor is isolated
└── NO → Is there already a lib for this vendor?
    ├── YES → extend the existing lib
    └── NO  → create a new lib
```

---

## Complexity Levels

| Level    | When                                 | Files                            |
| -------- | ------------------------------------ | -------------------------------- |
| Minimal  | Config + re-export only              | `index.ts`                       |
| Standard | Config + hook + constants            | config + hook + constants + barrel |
| Full     | Config + hook + helpers + types + constants | all files               |

---

## Generated Structure

```
src/lib/{name}/
├── {name}.config.ts        # Initialization and configuration
├── {name}.constant.ts      # URLs, keys, limits, status enums
├── {name}.type.ts          # Project-specific types wrapping vendor types
├── use{Name}.hook.tsx      # React hook wrapping vendor hook (if applicable)
├── {name}.helper.ts        # Pure utility functions
└── index.ts                # Barrel export
```

For cross-app vendor wrapping, the lib becomes a workspace package in `packages/{name}/`.

---

## Step 1 — Config (`{name}.config.ts`)

```typescript
import { VendorClient } from '{vendor-package}'

// Config from environment variables only — no hardcoded keys
export const {name}Client = new VendorClient({
  apiKey: process.env.NEXT_PUBLIC_{NAME}_API_KEY
})
```

---

## Step 2 — Constants (`{name}.constant.ts`)

```typescript
export const {NAME}_CONFIG = {
  MAX_RETRIES: 3,
  REQUEST_TIMEOUT_MS: 10_000,
  BASE_URL: '/api/{name}'
} as const

export enum {Name}StatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}
```

---

## Step 3 — Types (`{name}.type.ts`)

```typescript
// Project-scoped types — do NOT re-export vendor types directly
import type { VendorOptions } from '{vendor-package}'

export type {Name}OptionsType = Pick<VendorOptions, 'timeout' | 'retries'>

export interface I{Name}Result {
  data: unknown
  error: string | null
}
```

---

## Step 4 — Hook (`use{Name}.hook.tsx`) — if the lib has a React integration

```typescript
'use client' // web only

import { useVendorHook } from '{vendor-package}'
import type { {Name}OptionsType } from '@/lib/{name}/{name}.type'

export interface IUse{Name} {
  // project-specific params only — flatten vendor surface
}

export interface IUse{Name}Return {
  // expose only what features actually need
}

export const use{Name} = (params: IUse{Name}): IUse{Name}Return => {
  const vendor = useVendorHook(/* mapped params */)
  return {
    // expose only what features need
  }
}
```

---

## Step 5 — Barrel (`index.ts`)

```typescript
export { use{Name} } from './use{Name}.hook'
export { {name}Client } from './{name}.config'
export { {NAME}_CONFIG, {Name}StatusEnum } from './{name}.constant'
export type { {Name}OptionsType, I{Name}Result } from './{name}.type'
```

---

## Ports and Provider-Behind-Ports

When the vendor is a backend client (database, auth, analytics), define a port
interface in `@app/core` and let the lib implement it:

```typescript
// packages/core/src/ports/client/IBackendClientProvider.type.ts
export interface IBackendClientProvider {
  // narrow, project-specific surface — not the full vendor API
}

// packages/supabase/index.ts  (or src/lib/supabase/supabase.config.ts)
import type { IBackendClientProvider } from '@app/core'
// export a factory that satisfies the port
```

Features then depend on `IBackendClientProvider`, not on Supabase concretely.

---

## Extending an Existing Lib

When adding to `@/lib/query/` or similar:

1. Does a matching constant already exist in `{name}.constant.ts`?
2. Does a matching type already exist in `{name}.type.ts`?
3. Is the new function consistent in naming with existing functions?

Never add feature-specific logic to a lib — libs must be domain-agnostic.

---

## DO vs DON'T

| DO                                                               | DON'T                                    |
| ---------------------------------------------------------------- | ---------------------------------------- |
| Import vendor package only in `{name}.config.ts` or hook        | Import vendor directly in features/screens |
| Expose only what the project uses (narrow surface)               | Re-export the entire vendor API          |
| Config from environment variables                                | Hardcode API keys or base URLs           |
| Keep lib domain-agnostic                                         | Add feature business logic to a lib      |
| Project-specific types wrapping vendor types                     | Expose vendor types directly to features |
| Define a port interface in `@app/core` for backend vendors       | Let features import vendor SDK directly  |
