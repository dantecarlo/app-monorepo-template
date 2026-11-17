# Design: 2026-11-17-posthog-observability

## Decision

Sentry stays wired in the template, and everything it adds is a file the `sentry` capability
owns, so pruning it is deleting files and dropping two dependency records. Three decisions make
that true.

1. **`next.config.ts` names no optional capability.** Next.js reads only `next.config.ts`, so the
   Sentry wrapper cannot be pruned while that file imports it. `next.config.ts` builds the base
   config and then applies, in name order, the default export of every `next-<capability>.config.ts`
   beside it; Sentry's is `next-sentry.config.ts`. `instrumentation.ts` holds only Sentry code and
   is owned by `sentry` whole: Next.js runs without one.
2. **The manifest keeps one owner per file.** `sentry` claims the files no other claim covers
   (the root files of `apps/web` it owns), and removes the files inside a subtree another
   capability owns (`apps/*/src`) with `remove`, the cross-cutting verb of `docs/manifest.md`.
   `web-next` therefore claims its root files by name instead of `apps/web/**`, and removes
   `apps/web/**` when absent, which keeps what it deletes. The Expo plugin entry is dropped by a
   `patch-json` that sets `expo.plugins` to the list without it, and the prune test fails when
   that list drifts from `apps/mobile/app.json`.
3. **The port contract lives in `packages/tooling`.** It is a plain ESM module that takes the
   test runner's `test` and an adapter harness, so it runs under Vitest in the apps and in
   packages/core and under `node:test` in its own package, and depends on neither. packages/core
   cannot host it: `local/core-import-boundary` refuses any import from a production file of core,
   its test support would ship in the barrel the apps import, and its `package.json` exports only
   `.`.

The PostHog mapping onto the port:

| Port method      | PostHog call                                | Why                                                                                |
| ---------------- | ------------------------------------------- | ---------------------------------------------------------------------------------- |
| `captureError`   | `captureException(error, scrubbed context)` | PostHog's error tracking groups it as an issue                                     |
| `captureMessage` | `captureLog({ body, level, attributes })`   | a message at a severity is a log record; an event per message text pollutes events |
| `addBreadcrumb`  | `addExceptionStep(message, properties)`     | PostHog's breadcrumb: the steps ride with the next captured exception              |
| `setUser`        | `identify(id, scrubbed rest)`, or `reset()` | `reset` clears the identity on sign-out                                            |

## Options considered

| Option                                                           | For                                       | Against                                                                         |
| ---------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------- |
| `next.config.ts` imports `next-sentry.config.ts`                 | one obvious line                          | the prune leaves a dangling import, the exact defect this change removes        |
| `sentry` owns `next.config.ts`, `web-next` a base config         | no discovery                              | the prune deletes the only config Next reads; `copy` from `templates/` is planned only |
| Record `next.config.ts` as an `onAbsent` hole (blocker B4)       | no code change                            | `/init` cannot drop Sentry until region markers exist                           |
| **Apply every `next-<capability>.config.ts` by name** (chosen)   | prune is a delete; no capability is named | the config reads its own folder, and only with Next's default config loader     |
| Claim Sentry files inside `apps/*/src` and let the deeper glob win | one verb                                | changes the ownership rule of the coverage gate, which only the owner may ask   |
| **`remove` for files inside another subtree** (chosen)           | the documented cross-cutting verb         | `web-next` lists its root files by name; a new root file fails coverage, by design |
| Contract suite in `@app/core` test support                       | next to the port                          | core's import boundary, its barrel and its exports map all refuse it            |
| **Contract suite in `packages/tooling`** (chosen)                | both apps and core already depend on it   | its types are declared by hand in a `.d.mts`                                    |

## Why this one

Each chosen option keeps the rule the repository already has: one owner per file, a closed verb
set, and a prune that deletes. The discovery seam is the "injected adapter" that
`docs/manifest.md` § `onAbsent` holes names as the way out of blocker B4, applied to the one file
Next.js reads, and Next's default loader (`next/dist/build/next-config-ts/transpile-config.js`,
SWC to CommonJS with a require hook) resolves the `import()` it performs. The prune test reads
the manifest itself, so a new Sentry file, a new import of one, or a new Expo plugin fails it the
day it lands.
