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

The template targets Supabase Cloud for development; there is no local Docker
stack (`AGENTS.md`, Supabase workflow — Cloud only).

- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`)
- A Supabase Cloud project, and `packages/supabase/.env` (gitignored) holding
  `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` and `SUPABASE_PROJECT_REF`

## Common workflows

The CLI does not read `.env` on its own: load it in the shell first. Every
script targets the linked project.

```bash
cd packages/supabase
set -a; source .env; set +a

# Link the cloud project once per checkout
supabase link --project-ref "$SUPABASE_PROJECT_REF"

# Apply the pending migrations, in number order
pnpm db:push

# Generate TypeScript types from the linked project into src/types.ts
pnpm gen:types

# Run the pgTAP tests on the linked project (the CLI enables pgtap; each
# test file runs in a transaction it rolls back)
pnpm test:db
```

There is no reset script: `supabase db reset --linked` rebuilds the linked
project's database from the local migrations, and its data is lost. Run it by
hand, and only on a disposable development project.

## Layout

- `src/client.adapter.ts` — typed browser/client factory; satisfies `IBackendClientProvider`
- `src/server.adapter.ts` — typed server factory (`@supabase/ssr`, single-object param)
- `src/supabaseAuth.adapter.ts` — `createSupabaseAuthGateway`; implements `IAuthGateway`
- `src/mapSupabaseError.adapter.ts` — `mapSupabaseError`; implements `IServiceErrorMapper`
- `src/buildSupabaseServiceError.helper.ts` — wired convenience: `buildServiceError` + `mapSupabaseError`
- `src/types.ts` — generated `Database` type (placeholder until `gen:types`)
- `supabase/config.toml` — CLI config (the API schemas and search path)
- `supabase/migrations/` — SQL migrations, applied in number order; conventions in `docs/database.md`
- `supabase/tests/` — pgTAP tests, run by `test:db`

## Notes

- The **SERVICE ROLE** key bypasses RLS entirely — only use it server-side
  (Edge Functions, privileged writes). Never expose it to the client.
- `src/types.ts` is a placeholder until you run `gen:types` against the linked
  project with the migrations applied. Commit the generated file afterwards.
