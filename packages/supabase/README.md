# @app/supabase

Single typed source for Supabase in the monorepo: client/server factories,
generated database types, migrations, and local CLI config.

Apps do **not** construct their own Supabase client — they pass their env into
the factories exported here, so there is exactly one place that knows the
schema and the SDK surface.

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

- `src/client.ts` — typed browser/client factory (single-object param)
- `src/server.ts` — typed server factory (`@supabase/ssr`, single-object param)
- `src/types.ts` — generated `Database` type (placeholder until `gen:types`)
- `supabase/config.toml` — local CLI config
- `supabase/migrations/` — SQL migrations (empty skeleton; add yours here)
- `supabase/tests/` — pgTAP tests (empty skeleton)

## Notes

- The **SERVICE ROLE** key bypasses RLS entirely — only use it server-side
  (Edge Functions, privileged writes). Never expose it to the client.
- `src/types.ts` is a placeholder until you run `gen:types` against a DB with
  migrations applied. Commit the generated file afterwards.
