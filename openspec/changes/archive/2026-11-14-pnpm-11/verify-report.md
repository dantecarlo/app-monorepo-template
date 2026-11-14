# Verify report: 2026-11-14-pnpm-11

> **Verified:** 2026-11-14 at `87fb174`, at `084c10d` for the runtime checks and the gate, and at
> `7a96d3f` after the correction

## Scenarios

This change adds no delta: the harness stays unspecified, as decided in `2026-11-11-adopt-sdd`
(`openspec/README.md` § 2.1). Its proof is the install, the gates and the smokes each task ran.

| Task | Commit                    | Checks run                                                                                                                                               | Result                                                                                                                                                                                                                                         |
| ---- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1   | `fbc5990`                 | `pnpm --version` in the worktree; a `git grep` for `9.15.9`, `pnpm@9` and `pnpm 9`; the seven `pnpm/action-setup` steps of `ci.yml` beside Certifipago's | `11.9.0`; no step names a version, and the matches left are the proposal and the records under "Not verified"; the same step shape as Certifipago's, which pins the action by sha                                                              |
| T2   | `93d5e9c`, then `1cefd1d` | `pnpm install --frozen-lockfile` after deleting every `node_modules`; `node_modules/.modules.yaml`; the root of `node_modules`                           | exit 0 in 27.4 s, 1,272 packages, no warning; `nodeLinker: isolated`, the four `publicHoistPattern` entries, `ignoredBuilds` and `pendingBuilds` empty; `eslint`, `prettier`, `whatwg-fetch` and `react-native-css-interop` linked at the root |
| T3   | `b764e5a`                 | the `importers` section of `pnpm-lock.yaml` against `origin/main`; the frozen install; `git status` after it                                             | one line differs, the hashed peer suffix of `expo-router`; "Lockfile is up to date, resolution step is skipped"; no file changed                                                                                                               |
| T4   | `87fb174`                 | the same `git grep`; `verify:english`; `verify:maps`                                                                                                     | `AGENTS.md`, `README.md` and the `/init` default name pnpm 11; green; 243 map references resolve                                                                                                                                               |

`93d5e9c` took Certifipago's `nodeLinker: hoisted`; `1cefd1d` puts the isolated linker back and
moves the four hoist patterns of `.npmrc` into `pnpm-workspace.yaml`, so T2 names the commit that
leaves its settings as the task describes them.

Beyond `importers`, the lockfile moves transitive resolutions between versions it already held:
`@babel/core`, `@babel/helper-module-transforms`, `@babel/helpers`, `@babel/template`, `metro`,
`metro-transform-plugins` and `metro-transform-worker` resolve `@babel/{generator,parser,
traverse,types}` 7.29.14 instead of 7.29.7; `happy-dom` resolves `@types/node` 24.13.2 instead of
22.20.0, so `@types/node@22.20.0` and `undici-types@6.21.0` leave the lockfile; and pnpm 11 adds
`libc:` fields. No version is new, and the bundles below show no effect.

## The setup at runtime

After the clean install, at `084c10d`, whose tree differs from `87fb174` only in one comment of
`pnpm-workspace.yaml` and one sentence of the proposal (the copies of `@sentry/core` the hoisted
linker puts in the bundle: six, not seven, measured below):

- `pnpm lint` and `pnpm typecheck`, with the Turborepo cache off: exit 0, 7 of 7 tasks each; lint
  reports 0 errors, 19 warnings in `apps/web` and 5 in `apps/mobile`.
- The tests, `turbo run test` with the cache off (the root has no `test` script): exit 0; web 272
  of 272, mobile 116 of 116, core 97 of 97, cloudflare 24 of 24, supabase 21 of 21, tokens 4 of 4,
  i18n 1 of 1.
- `pnpm smoke:mobile`: exit 0; iOS bundles 2,439 modules and Android 2,434, and both Hermes
  bundles are found (7.0 MB each). Metro warns that the `exports` map of `expo-router` 58.0.31
  names a file the package does not ship, and falls back to file resolution.
- `pnpm smoke:web`: the build compiles, then the render probe exits 1 with `spawn pnpm ENOENT`:
  `scripts/smoke-web-render.mjs` spawns `pnpm` with `shell: false`, which Windows cannot resolve
  to `pnpm.cmd`, whatever the pnpm version. The same probe through a shell: `next start` ready,
  HTTP 200, the `aurora` marker present.

## The hoisted linker, measured

In a scratch clone of the branch with `nodeLinker: hoisted` added, the frozen install exits 0 and
changes no file but `pnpm-workspace.yaml`. The root `node_modules/@sentry/core` is 10.61.0, and
10.75.2 is nested under seven packages: `@sentry/browser`, `bundler-plugins`, `feedback`, `react`,
`react-native`, `replay` and `replay-canvas`.

An Android export with source maps under each linker: 2,378 sources with the isolated linker and
3,596 with the hoisted one. The whole difference is 1,176 more sources of `@sentry/core` and 42
more of `@sentry/browser-utils`; the bundle holds six of the nested copies (`bundler-plugins`
runs at build time only). Without source maps the Android Hermes bundle is 6,972,746 bytes with
the isolated linker and 9,251,064 with the hoisted one.

## Independent verification

One independent verifier (risk item 5: the package manager, its lockfile and CI) passed T1 to
T5 with no blocker, in fresh clones under pnpm 11.9.0 against an `origin/main` clone under
9.15.9. Every setting is read (`pnpm config get`, `.modules.yaml`); the root and per-workspace
`node_modules` listings match the base; the seven packages with install scripts are the six
`allowBuilds` names; `shellEmulator` passes a quoted glob through unexpanded; the Hermes bundles
differ from the base by 5 bytes and hold the same module counts; every pnpm command form CI
uses runs here.

Its advisories, closed in `d5e3fe5` and `7a96d3f`:

- `pnpm/action-setup` floated on `v4`; it is pinned to the commit Certifipago pins
  (`b906aff`, v4) in every job and in the CI snippets of `docs/e2e.md` and `docs/responsive.md`.
- The parity ledger still said the template is on 9.15.9; it records the adoption, the isolated
  linker the template keeps and why, and the pinned action.
- This report left out the transitive lockfile moves and gave a wrong Android module count;
  both are corrected above.

After the correction: `ATL_TEMPLATE_SELF=1 pnpm validate` exit 0 at `7a96d3f` (turbo 21 of 21 tasks), and `prettier --check` clean on `ci.yml`.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-14, at `084c10d` (turbo 21 of 21 tasks,
  14 from the cache of the runs above).
- At `87fb174`: `pnpm install --frozen-lockfile` up to date; `verify:specs`, `verify:english` and
  the manifest gates green.

## Not verified

- CI: the pinned `pnpm/action-setup` steps that read `packageManager` run only on GitHub, and this
  change has not run there yet. Certifipago's CI runs the same step on the same value.
- `pnpm verify:expo` (`expo-doctor` and `expo install --check`, a CI job), not run locally.
- A native Android or iOS build on Windows: the isolated linker keeps the `MAX_PATH` exposure the
  template had under pnpm 9.
- `pnpm init <slug>`, the command `README.md`, `docs/` and `ci.yml` document: pnpm's built-in
  `init` refuses arguments (`ERR_PNPM_INIT_ARG`) under 9.15.9 and 11.9.0 alike, so it never
  reaches `scripts/init-project.mjs`; `pnpm run init <slug>` does. Older than this change and
  outside it, fixed in its own pull request with the `smoke:web` defect above.
- Records that keep 9.15.9 on purpose: the plan's account of decision D-S6 and its Roadmap step, the 2026-11-04 audit data and the archived changes.
