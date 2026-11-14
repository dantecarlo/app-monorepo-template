# Proposal: share the test and process scripts through `@app/tooling`

> **Status:** archived — 2026-11-14

## Why

Every workspace configures Vitest on its own: the five package configs repeat the same 16 lines,
and no workspace runs its tests in a shuffled order, so a test that passes only after another one
goes unnoticed. Certifipago solved both with three root scripts (`vitest-sequence.mjs`,
`vitest-package-base.mjs`, `process-tree.mjs`) that 12 files import by relative path
(`../../scripts/…`), a dependency neither pnpm nor Turborepo can see. Decision 46 of
`docs/INIT_AND_HARNESS_PLAN.md` puts such scripts in a workspace package declared as a
`workspace:*` devDependency and imported by name, and Roadmap step 2.2 (T1d) schedules it here.

Mapping the template on `main` (`6af1c1f`) found three more facts this change has to handle:

- `turbo.json` declares no `globalDependencies`, so a cached `lint` or `typecheck` survives an
  edit to `eslint.config.mjs`, `eslint.rules.mjs`, `eslint-local-rules/` or `tsconfig.base.json`:
  the `#src` change hit cached lint results while it edited the lint rules. `test` is not cached
  at all (`"cache": false`).
- `scripts/init-project.mjs` skips every folder named `scripts`, so `scripts/smoke-web-render.mjs`
  keeps `--filter @app/web` in a derived project, where no package has that name. A root script
  that imports `@app/tooling` would keep the template name the same way.
- `scripts/smoke-web-render.mjs` stops its server with its own tree kill, which on POSIX sends
  its signal to `pnpm` alone and relies on it to stop the `next start` it started.

The owner's words:

- 2026-11-12 (translated from Spanish): "merge everything pending, make a plan for the rest of
  what is missing, and include this with priority"
- 2026-11-14 (translated from Spanish), answering "Shall I merge the template PRs #9, #10 and
  #11, in that order, and continue with step 2.2 (T1d `@app/tooling`)?": "Yes, merge the three"

## What changes

- **The package.** `packages/tooling` (`@app/tooling`, private) holds the three scripts, harvested
  from Certifipago `origin/master` (`e43c26af5`), each with its type declarations and its tests:
  - `vitest-sequence`: every workspace shuffles its tests with a seed taken from the commit
    (`git rev-parse HEAD`), or from `VITEST_SEQUENCE_SEED` to replay a run; it prints the replay
    command.
  - `vitest-package-base`: the shared Vitest config of a package (the `@` alias, `node`
    environment, globals, `clearMocks`, v8 coverage settings, the shuffled sequence). Certifipago's
    `fsModuleCache` is left out: it is a Vitest 5 option, and the template runs Vitest 4.
  - `process-tree`: ends a child process with every process it started (a process group on
    POSIX, `taskkill /T /F` on Windows).
- **The consumers.** The five package configs build on `packageTestBase` and keep only their
  `include`; the two app configs take `testSequence`; `scripts/smoke-web-render.mjs` stops its
  server through `signalProcessTree`. Each of them declares `@app/tooling` as a `workspace:*`
  devDependency (the root for its script) and imports it by name.
- **Turborepo.** `globalDependencies` names the root files cached tasks read: the lint
  configuration, `tsconfig.base.json` and the Prettier configuration. The tooling sources need no
  entry: a workspace that declares `@app/tooling` already hashes its files into its tasks
  (measured with `turbo run --dry=json`). `test` passes `VITEST_SEQUENCE_SEED` through, so a
  replay reaches Vitest.
- **The rename.** `scripts/init-project.mjs` rewrites `@app/` under `scripts/` too, except the two
  files that hold the template's tokens on purpose (`init-project.mjs` and `check-identity.mjs`),
  and its header names the extensions it rewrites.
- **The docs.** `docs/code-standards.md` and `docs/architecture/shared.md` state where shared
  tooling lives; the plan closes the parity row and asks the Arquitecto to move Certifipago's 12
  imports (K9).

## Out of scope

- Certifipago's 12 cross-workspace imports: the Arquitecto moves them once this lands (K9).
- Caching `test` in Turborepo: it stays uncached, as today, so a shuffled run always runs.
- Certifipago's `verify:test-shuffle` gate, which checks that every config calls the sequence:
  every config does after this change, and the gate is a separate harness decision.
- Bumping Vitest to 5.

## Affected specs

- None. The harness stays unspecified, as decided in `2026-11-11-adopt-sdd`.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
