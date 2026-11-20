# Design: a backend capability plugs into an app through lib/auth

> **Change:** `2026-11-20-prune-leftovers`

## Decision

Each app keeps one backend-neutral seam, `src/lib/auth/`, owned by the app's capability. Its
`authGateway.adapter.ts` lists the gateway of every backend capability the project keeps, each
entry and its import inside that capability's region (`docs/manifest.md` § Regions), and serves
the first one, or a no-op gateway of the same folder when the list is empty. The auth service,
the web providers, the mobile root layout and every test that stands in for the gateway import
or mock this adapter, never a backend's folder. The sign-in failures and their message keys name
no backend, so they live in `src/lib/auth/` too; what only Supabase names (its error codes, the
name of its unreachable error) stays in `src/lib/supabase/`.

The list keeps a comment line outside every region, so a prune that drops its only entry leaves a
list Prettier prints as it stands, and the code type-checks with no entry at all.

## Options

| Option | Why not |
| ------ | ------- |
| A region at every import site (the service, the providers, the layout) | Each site would hold two versions of its code, and the JSX of the providers cannot lose one wrapper by line |
| A file per capability found by name, as `next.config.ts` finds `next-<capability>.config.ts` | Neither bundler loads a module by a glob the same way, Metro not at all |
| A `copy` verb that brings a no-op adapter in from `templates/` | `templates/` does not exist yet (P5), and the no-op would live outside every test |
| The neutral seam with a list of regions | Chosen: one file per app knows the backends, and a prune drops lines, never code paths |

## Consequences

- A project that adds its own backend writes its gateway in a folder of its own and lists it in
  `src/lib/auth/authGateway.adapter.ts`, outside every region, which no prune touches.
- With no backend the web app's sign-in rejects with the not-configured failure, as it does today
  without the Supabase settings; the mobile app's sign-in already signs no one in.
