# Verify report: 2026-11-20-prune-leftovers

> **Verified:** 2026-11-20 at `d10a9dc`, the last commit before this report

## Scenarios

Each test below ran green at `facfde2` or `d10a9dc`, which changes only the global map: the `@app/tooling` suite 41 of 41, the lint-rule suite
217 of 217, and the files of the web, mobile, core and tokens tests the scenarios name.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| TOOLING-01 | an adapter test imports the port contract by name | `packages/core/src/ports/observability/__tests__/createNoopObservability.helper.test.ts` › "the observability port contract" | green |
| TOOLING-17 | the prunes of this repository | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "pruning sentry, mobile-expo, supabase, web-next or cloudflare of this repository leaves the registry true" | green |
| TOOLING-17 | the packages of this repository a prune takes | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "pruning i18n or design-tokens of this repository keeps no package whose entry it takes" | green |
| TOOLING-20 | four capabilities of this repository | `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "pruning sentry, supabase, mobile-expo or web-next of this repository leaves no dangling reference" | green |
| WEB-85 | no backend is kept | `apps/web/src/lib/auth/__tests__/noopAuthGateway.helper.test.ts` › "has no session and rejects a sign-in with the not-configured failure" | green |
| WEB-85 | the served gateway keeps the port | `apps/web/src/lib/auth/__tests__/authGateway.adapter.test.ts` › "serves a gateway with every method of the auth gateway port" | green |
| WEB-85 | the Supabase gateway is listed | `apps/web/src/lib/auth/__tests__/authGateway.adapter.test.ts` › "serves the gateway the supabase capability builds" | green |
| WEB-85 | every failure has its message | `apps/web/src/lib/auth/__tests__/authGateway.constant.test.ts` › "names a message every catalog holds for each sign-in failure" | green |
| WEB-20 | the Supabase settings are missing | `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "returns a no-op gateway without the Supabase settings" | green |
| WEB-20 | the rejection names the missing settings | `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "names the Supabase settings in the cause of a sign-in without them" | green |
| WEB-20 | the Supabase settings are present | `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "creates one Supabase auth gateway per browser with the settings" | green |
| WEB-46 | the Supabase settings are missing | `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "rejects a sign-in with the not-configured failure without the Supabase settings" | green |
| WEB-46 | Supabase names the failure | `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "names the failure of each Supabase Auth code a sign-in rejects with" | green |
| WEB-46 | Supabase cannot be reached | `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "names a network failure when Supabase cannot be reached" | green |
| WEB-46 | a failure the gateway does not name | `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "passes any other sign-in rejection through" | green |
| MOBILE-83 | no backend is kept | `apps/mobile/src/lib/auth/__tests__/noopAuthGateway.helper.test.ts` › "has no session and rejects a sign-in" | green |
| MOBILE-83 | the served gateway keeps the port | `apps/mobile/src/lib/auth/__tests__/authGateway.adapter.test.ts` › "serves a gateway with every method of the auth gateway port" | green |
| MOBILE-83 | the Supabase gateway is listed | `apps/mobile/src/lib/auth/__tests__/authGateway.adapter.test.ts` › "serves the gateway the supabase capability builds" | green |
| MOBILE-83 | the root layout renders | `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "hands the auth provider the gateway lib/auth serves" | green |
| MOBILE-29 | before the gateway answers | `apps/mobile/src/stores/__tests__/auth.store.test.ts` › "starts in loading status with no session" | green |
| MOBILE-29 | the provider starts the bootstrap | `apps/mobile/src/components/AuthProvider/__tests__/AuthProvider.component.test.tsx` › "calls getSession on mount via bootstrap" | green |
| MOBILE-75 | the Supabase settings are missing | `apps/mobile/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "names the Supabase settings in the rejection of a sign-in without them" | green |
| MOBILE-75 | the gateway over the app's client | `apps/mobile/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "builds the auth gateway over the client the client adapter creates" | green |
| I18N-11 | a rejected sign-in reaches the user | `apps/web/src/lib/auth/__tests__/authGateway.constant.test.ts` › "names a message every catalog holds for each sign-in failure" | green |
| TOKENS-12 | a themed colour is resolved | `packages/tokens/__tests__/tailwind-preset.test.ts` › "the preset reads every themed colour from its --c- variable, declared in both themes" | green |
| TOKENS-12 | the dark theme is unchanged | `packages/tokens/__tests__/tailwind-preset.test.ts` › "the preset resolves to the dark theme's colours under the dark variables" | green |
| TOKENS-12 | a shared colour | `packages/tokens/__tests__/tailwind-preset.test.ts` › "the preset writes every shared colour as a literal" | green |
| TOKENS-12 | the web app loads no JavaScript config | `apps/web/src/app/__tests__/globals.test.ts` › "imports the generated theme and loads no JS config" | green |
| TOKENS-13 | a Tailwind config resolves a spacing utility | `packages/tokens/__tests__/tailwind-preset.test.ts` › "the preset carries every scale token as a CSS length" | green |
| TOKENS-13 | the web theme carries the scales | `packages/tokens/scripts/__tests__/generate.test.ts` › "inlines every scale in @theme inline as a CSS length" | green |

The unchanged scenarios of TOOLING-17 and TOOLING-20 ran green in the same `@app/tooling` run.
The `local/wrapped-import` rule cases, which no living spec cites, ran green in the lint-rule
suite, judged by the ui blocks of their own scratch tree.

## Every red seen first

| Task | Test | Failure seen before the code |
| ---- | ---- | ---------------------------- |
| T1 | "pruning sentry, mobile-expo, supabase, web-next or cloudflare of this repository leaves the registry true" | `web-next` left `@app/cloudflare` stale and its seam matching no file; `cloudflare` left `@app/cloudflare` in `apps/web/package.json` |
| T1 | "pruning i18n or design-tokens of this repository keeps no package whose entry it takes" | `@app/i18n` and `@app/tokens` stayed declared in both apps' `package.json` |
| T2 | the three files of `apps/web/src/lib/auth/__tests__/` | each failed to resolve its unit: `@/lib/auth/noopAuthGateway.helper`, `@/lib/auth/authGateway.constant`, `@/lib/auth/authGateway.adapter` |
| T3 | the two files of `apps/mobile/src/lib/auth/__tests__/` | each failed to resolve its unit |
| T3 | "hands the auth provider the gateway lib/auth serves" | `getSession` of the mocked lib/auth gateway called 0 times: the layout still took the Supabase one |
| T4 | "pruning supabase of this repository leaves no app import, env key or spec citation dangling" | 4 `.env.example` keys and 15 citations in the web, mobile and i18n specs (the 4 app imports were gone with T2 and T3) |
| T5, T6 | "pruning sentry, mobile-expo or web-next of this repository leaves no dangling reference" | `mobile-expo` left 2 spec citations, `web-next` 9 in 5 specs |

## Gate

- `pnpm validate` was not run by this writer: the machine is shared and the parent runs it.
- Run one by one at `d10a9dc`, each exit 0: `verify:manifest`, `verify:manifest:coverage`,
  `verify:manifest:test`, `verify:dependency-seams`, `verify:specs`, `verify:tests`,
  `verify:tests:test`, `verify:maps`, `verify:english`, `verify:instruction-entry`,
  `codex-budget:test` and `verify:lint-rules:test`.
- `knip` exit 0 with the `knip.json` of `d1ecf7e`, the last that changes it, and one
  configuration hint, `expo-updates` in `ignoreDependencies`, which the base config gave too.
- The web and mobile `tsc --noEmit` exit 0 at `536e617` and `caf3422`; no later commit changes
  a TypeScript file.

## Not verified

- WEB-20 "the page is rendered on the server", MOBILE-29 "a stored session exists" and "the user
  signs out elsewhere", MOBILE-75 "a file outside lib/supabase imports the package" and TOOLING-01
  "a workspace imports the package base by name" stay `Not covered`, with their reasons.
- The files a `supabase` prune leaves under `src/lib/auth/` were read with their region dropped
  and passed ESLint and Prettier; no test ran them, as no executor applies a prune yet.
