# Proposal: PostHog as the default observability provider, Sentry an optional capability

> **Status:** open

## Why

Stage F row F.7 of `docs/INIT_AND_HARNESS_PLAN.md` carries decision 53: observability defaults to
PostHog, Sentry becomes an optional capability with an install guide, and `/init` asks which one
the project uses. Today both composition roots bind Sentry
(`apps/web/src/lib/observability/observability.adapter.ts:5-6`,
`apps/mobile/src/lib/observability/observability.adapter.ts:5-6`), no PostHog adapter exists,
and `docs/observability.md:7-11` records that no manifest capability prunes the Sentry SDKs,
config files and env keys: `apps/web/next.config.ts:1` and `apps/web/instrumentation.ts:1` import
`@sentry/nextjs`, so deleting Sentry leaves dangling imports.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen or section files must contain only positioning, and the components are what must hold the other styles, but everything centralized in styles and the tokens. Fix everything you mention applying what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix everything"
- 2026-11-15 (translated from Spanish): "and on the way, ask in the init whether it has some logger or uses the default one, which is PostHog. And Sentry should be deleted from Certifipago. Although in the template we would have to see some documentation on how to install it if it is needed, and offer it as an option in init"

The decisions the parent session made for this change, applied as stated:

- A PostHog adapter per app beside the Sentry one, implementing `IObservabilityPort`, with every
  payload through `scrubPII`; one PostHog client per app under `src/lib/posthog/`, the only file
  that imports the SDK (decision 51), configured from `NEXT_PUBLIC_POSTHOG_KEY` /
  `NEXT_PUBLIC_POSTHOG_HOST` and `EXPO_PUBLIC_POSTHOG_KEY` / `EXPO_PUBLIC_POSTHOG_HOST`, inert with
  no key.
- Privacy defaults: no session recording, no autocapture of form inputs, and a `before_send` that
  drops the query and the fragment of every URL the SDK attaches.
- Both composition roots bind PostHog; console and noop stay one-line swaps.
- Every Sentry file is owned by a manifest capability `sentry`, so `/init` can prune it, and a
  test fails when a file that survives the prune still imports a pruned file or a removed
  dependency. The template keeps Sentry wired as the superset.
- One port contract suite, run against the PostHog, Sentry, console and noop adapters.

## What changes

- **packages/tooling:** the observability port contract suite, `@app/tooling/observability-port-contract`,
  that each adapter's test runs with its own harness; and the prune boundary check, which
  computes what pruning one capability deletes and lists every surviving file that still
  imports it.
- **apps/web:** `src/lib/posthog/` (the client and the URL scrub of `before_send`),
  `createPostHogObservability.adapter.ts`, the composition root bound to it; `next.config.ts`
  applies every `next-<capability>.config.ts` beside it and names none, and the Sentry wrapper
  moves to `next-sentry.config.ts`; the observability barrel no longer re-exports a provider.
- **apps/mobile:** `src/lib/posthog/` (the client), `createPostHogObservability.adapter.ts`, the
  composition root bound to it, the barrel no longer re-exporting a provider.
- **packages/core:** the console and noop adapters run the contract suite in their tests.
- **template.manifest.json:** the `sentry` capability (its root files claimed, its files inside
  the apps removed, its two dependencies dropped and the Expo plugin entry patched out), selected
  by no preset; `web-next` claims its files by name and removes `apps/web/**` when absent.
- **Docs and skills:** `docs/observability.md` rewritten with PostHog as the default and an
  "Adding Sentry" guide, the env tables of `AGENTS.md` and both `.env.example`, the architecture
  docs, the global map, `docs/manifest.md` and the skills that name Sentry as the default.

## Out of scope

- Server-side PostHog capture on the web (`posthog-node`): not installed, and no dependency is
  added. With Sentry dropped, an error thrown only on the server is not captured.
- The `/init` question itself (Stage 6, the executor, P5 to P7): this change gives it a
  capability to prune.
- Files outside this change's edit surface that still name Sentry: `scripts/verify-security-static.mjs`
  CHECK 42, the vendor override of `eslint.rules.mjs`, the alias in `apps/mobile/vitest.config.ts`,
  `pnpm-workspace.yaml`, `README.md`, `docs/infrastructure.md` and `docs/decisions/0001-pluggable-providers.md`.
  They are listed as holes in `docs/manifest.md`.
- Removing Sentry from Certifipago: the Arquitecto's row F.10.

## Affected specs

- `openspec/specs/apps/web/spec.md`: WEB-29 modified; WEB-48 to WEB-54 added
- `openspec/specs/apps/mobile/spec.md`: MOBILE-47 to MOBILE-51 added
- `openspec/specs/packages/core/spec.md`: CORE-15 modified; CORE-26 added
- `openspec/specs/packages/tooling/spec.md`: TOOLING-01 modified; TOOLING-15 and TOOLING-16 added
