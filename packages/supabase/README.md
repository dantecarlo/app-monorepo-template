# @app/supabase

The default data and authentication provider adapter for the monorepo.
Implements the `@app/core` ports (`IAuthGateway`, `IBackendClientProvider`,
`IServiceErrorMapper`) using [Supabase](https://supabase.com) and the
`@supabase/supabase-js` SDK.

Apps depend on the **port types** from `@app/core` for type safety and import
the concrete factories from this package in their `src/lib` adapter layer.
To swap providers, implement the same ports in a new adapter package and
update `src/lib/supabase/*.adapter.ts` in each app to point at it.

## Usage

```ts
// Browser / client component / React Native
import { createSupabaseClient } from '@app/supabase'

const supabase = createSupabaseClient({ anonKey, url })
```

```ts
// Server Component / Route Handler (auth-aware SSR via @supabase/ssr)
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@app/supabase/server'

const cookieStore = await cookies()
const supabase = createSupabaseServerClient({
  anonKey,
  cookies: {
    getAll: () => cookieStore.getAll(),
    setAll: (toSet) =>
      toSet.forEach(({ name, options, value }) =>
        cookieStore.set(name, value, options)
      )
  },
  url
})
```

```ts
// Auth gateway (IAuthGateway over a provisioned client)
import { createSupabaseAuthGateway, createSupabaseClient } from '@app/supabase'

const client = createSupabaseClient({ anonKey, url })
const authGateway = createSupabaseAuthGateway({ client })
```

```ts
// Error mapping in service layer
import { buildSupabaseServiceError } from '@app/supabase'

try {
  // ... supabase data call
} catch (err) {
  throw buildSupabaseServiceError({ error: err })
}
```

## Ports this package satisfies

| Port                     | Location in `@app/core`                                         | Adapter                                |
| ------------------------ | --------------------------------------------------------------- | -------------------------------------- |
| `IAuthGateway`           | `packages/core/src/ports/auth/IAuthGateway.type.ts`            | `createSupabaseAuthGateway`            |
| `IBackendClientProvider` | `packages/core/src/ports/client/IBackendClientProvider.type.ts` | `createSupabaseClient` (type-verified) |
| `IServiceErrorMapper`    | `packages/core/src/errors/IServiceErrorMapper.type.ts`          | `mapSupabaseError`                     |

## Swapping the backend provider

The service seam is the single place the provider client is touched.
Swapping Supabase for another backend requires three steps:

1. **Implement the `@app/core` ports** in a new workspace package (e.g.
   `@app/firebase`). Provide the equivalent of `createFirebaseAuthGateway`,
   `mapFirebaseError`, and `buildFirebaseServiceError`.

2. **Repoint each app's `src/lib` adapter** (`src/lib/supabase/*.adapter.ts`)
   to import from the new adapter package instead. This is the only file that
   picks the concrete adapter and wires app env into it.

3. **Keep service signatures unchanged.** Services receive/import the wired
   client and call it; error handling goes through the provider's builder
   (e.g. `buildFirebaseServiceError`). The service contract does not change.

RLS policies, SQL migrations, and `supabase/config.toml` are **not
abstracted** — they are inherently adapter-owned. Swapping providers means
owning the equivalent configuration in the new adapter package.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`)
- Docker running (for the local Supabase stack)

## Common workflows

```bash
# Start the local stack
supabase start

# Reset the local DB (runs every migration in order, then seed.sql if present)
pnpm --filter @app/supabase db:reset

# Push migrations to a remote project
pnpm --filter @app/supabase db:push

# Generate TypeScript types from the local DB into src/types.ts
pnpm --filter @app/supabase gen:types

# Run pgTAP tests (requires the local stack)
pnpm --filter @app/supabase test:db
```

## Layout

- `src/client.adapter.ts` — typed browser/client factory; satisfies `IBackendClientProvider`
- `src/server.adapter.ts` — typed server factory (`@supabase/ssr`, single-object param)
- `src/supabaseAuth.adapter.ts` — `createSupabaseAuthGateway`; implements `IAuthGateway`
- `src/mapSupabaseError.adapter.ts` — `mapSupabaseError`; implements `IServiceErrorMapper`
- `src/buildSupabaseServiceError.helper.ts` — wired convenience: `buildServiceError` + `mapSupabaseError`
- `src/types.ts` — generated `Database` type (placeholder until `gen:types`)
- `supabase/config.toml` — local CLI config
- `supabase/migrations/` — SQL migrations (empty skeleton; add yours here)
- `supabase/tests/` — pgTAP tests (empty skeleton)

## Notes

- The **SERVICE ROLE** key bypasses RLS entirely — only use it server-side
  (Edge Functions, privileged writes). Never expose it to the client.
- `src/types.ts` is a placeholder until you run `gen:types` against a DB with
  migrations applied. Commit the generated file afterwards.
