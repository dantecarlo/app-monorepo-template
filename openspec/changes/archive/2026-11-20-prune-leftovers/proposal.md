# Proposal: what the capability prunes leave behind

> **Status:** archived — 2026-11-20

## Why

`2026-11-19-capability-prune-claims` made the `sentry` prune leave nothing dangling, and named
what the other prunes still leave (F65 of `docs/INIT_AND_HARNESS_PLAN.md`). Measured at `9df3979`
with `findPruneLeaks` of `packages/tooling/src/prune-boundary.mjs`: the `supabase` prune leaves 26
leaks (6 imports, 4 `.env.example` keys, 16 spec citations), 16 dead rows of
`docs/maps/global-map.md` and a stale frozen exception of `scripts/verify-tests.mjs`; the
`mobile-expo` prune leaves 2 spec citations, 92 dead map references, lint-rule cases judged by the
mobile app's own `ui/` blocks and a knip workspace; the `web-next` prune leaves `@app/cloudflare`
stale in the registry and 9 citations in 5 kept specs; the `i18n`, `cloudflare` and
`design-tokens` prunes keep in the apps' `package.json` the `@app/*` package whose registry entry
they take; and Sentry is still named where its prune keeps the text.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen or section files must contain only positioning, and the components are what must hold the other styles, but everything centralized in styles and the tokens. Fix everything you mention applying what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix everything"
- 2026-11-20 (translated from Spanish): "Finish making all the changes … Finish what's missing" and "advance in parallel"
- 2026-11-20 (translated from Spanish), of the backend: the project "may or may not use Supabase; it can also have its own separate backend, and there we no longer put our hands"

## What changes

- **Each app reaches its auth gateway through `src/lib/auth/`.** The auth service, the web
  providers, the mobile root layout and their tests import a backend-neutral adapter; the
  `supabase` capability adds its gateway to it inside a `supabase` region, and without it the
  adapter serves a no-op gateway. The sign-in failures and their message keys, which name no
  backend, move from `src/lib/supabase/` to `src/lib/auth/`.
- **The `supabase` capability owns regions of what others keep**: its keys in both
  `.env.example`, its frozen exception in `scripts/verify-tests.mjs`, its rows of the global map,
  and the Supabase part of each app spec (its `Governs` line and its requirements).
- **The `mobile-expo` prune**: the `local/wrapped-import` rule cases are judged by ui blocks of a
  scratch tree of their own; the mobile rows of the global map sit in `mobile-expo` regions;
  `mobile-expo` drops its knip workspace with a `patch-json`; the specs name no mobile config
  file.
- **The registry**: the `i18n`, `cloudflare` and `design-tokens` capabilities `remove-dep` their
  `@app/*` package from the apps; `@app/cloudflare` belongs to `web-next`, the capability that
  claims the only `package.json` declaring it (`docs/manifest.md` § Registry entries have owners
  too).
- **The `web-next` prune**: the package and harness specs hold their web evidence in `web-next`
  regions, or cite a package test instead.
- **Sentry**: `docs/observability.md`, both architecture docs, the env table of `AGENTS.md`,
  `pnpm-workspace.yaml`, the global map and the core spec stop naming it where its prune keeps
  them, or hold it in a `sentry` region.
- **`prune-boundary`'s repository tests** hold all of it: the registry after seven prunes, no
  dangling reference after the `sentry`, `mobile-expo` and `web-next` prunes, and none in the
  apps, the env files and the specs after the `supabase` prune.

## Out of scope

- **`eslint-local-rules/index.test.mjs`**, outside this change's edit surface: two rule cases
  spell `@supabase/supabase-js` in an import string, and its `#src` imports case reads
  `packages/supabase/package.json` and the other packages' manifests, so a package prune fails it.
- **The `i18n`, `cloudflare` and `design-tokens` imports** (blocker B4): the apps import
  `@app/i18n` and `@app/tokens` throughout, and the web app's edge files import the Cloudflare
  adapters; the registry findings of their own packages are fixed, the imports are not. The
  `i18n` prune also keeps the vendor i18n packages of the apps, whose entries' seams it removes:
  dropping them needs a `patch-json` of `expo.plugins` that the `sentry` prune already sets.
- **The `web-next` prune's global-map rows and stale claims** (F64, Stage 6).
- **Tests that integrate through the Supabase client from a kept folder**
  (`apps/web/src/screens/Login/hooks/__tests__/useSignIn.hook.test.ts` mocks
  `@/lib/supabase/client.adapter`), which `prune-boundary` does not read: a `vi.mock` path is no
  import.
- **The executor** (Stage 6, step 6.2): the proof prunes scratch worktrees with a scratch
  simulator.

## Assumptions

- **A1** — A backend capability plugs into an app through `src/lib/auth/authGateway.adapter.ts`,
  which lists the gateway of each backend the project keeps in that capability's region; with
  none, the app signs no one in. Recorded in `design.md`.
- **A2** — The ownership rule of `docs/manifest.md` § Registry entries have owners too gives
  `@app/cloudflare` to `web-next`: it claims the only `package.json` declaring it, and the
  `cloudflare` prune takes the entry with its `remove-dep`.
- **A3** — Wrapping an existing requirement in a region, and rewording a scenario's GIVEN so it
  names no file a prune deletes, change no requirement; they are spec edits of their own commits,
  outside the deltas.
- **A4** — A `patch-json` that unsets `workspaces.apps/mobile` of `knip.json` reads the key
  `apps/mobile` as one segment: a path splits on dots only.

## Affected specs

- `openspec/specs/packages/tooling/spec.md`: modifies TOOLING-01, TOOLING-17 and TOOLING-20
- `openspec/specs/apps/web/spec.md`: adds WEB-85; modifies WEB-20 and WEB-46
- `openspec/specs/apps/mobile/spec.md`: adds MOBILE-83; modifies MOBILE-29, MOBILE-42 and MOBILE-75
- `openspec/specs/packages/i18n/spec.md`: modifies I18N-11
- `openspec/specs/packages/tokens/spec.md`: modifies TOKENS-12 and TOKENS-13
