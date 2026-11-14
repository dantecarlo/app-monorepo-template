# Verify report: 2026-11-14-tooling-package

> **Verified:** 2026-11-14 at `020e327`, and at `3f06f12` after the correction

## Scenarios

This change adds no delta: the harness stays unspecified, as decided in `2026-11-11-adopt-sdd`
(`openspec/README.md` § 2.1). Its proof is the tests and gates each task ran.

| Task | Commit    | Checks run | Result |
| ---- | --------- | ---------- | ------ |
| T1   | `2ad057c` | `node --test` in `packages/tooling` before the modules existed, then with them; `verify:manifest:coverage`; `knip`; `eslint .` in the package | red, 3 of 3 files fail with `ERR_MODULE_NOT_FOUND`; then 13 of 13; 945 files owned once; exit 0; exit 0 |
| T2   | `0bbe2b6` | `pnpm --filter @app/core test` before the change, counting the replay notice; after it, `turbo run typecheck` with the cache off, then `turbo run test` under the commit's seed and under `VITEST_SEQUENCE_SEED` 1, 2 and 3 | 0 notices; then typecheck 7 of 7 tasks green, and each of the four test runs exit 0 with 7 notices, the seed 2 run naming `VITEST_SEQUENCE_SEED` as the source in all 7; tokens 4, i18n 1, core 97, cloudflare 24, supabase 21, mobile 116 and web 272 tests, the counts of `main` |
| T3   | `0b4385b` | `pnpm smoke:web` on Windows, with port 3000 checked before and after; `knip` without the root `taskkill` exemption | exit 0, HTTP 200 and the marker present, no listener on 3000 before or after; exit 0 |
| T4   | `39705ec` | the task hash of `turbo run <task> --filter=<pkg> --dry=json` before and after appending a newline to a file, the file restored, on file and task pairs, without and with `globalDependencies` | without: unchanged for `eslint.rules.mjs` and `eslint-local-rules/index.mjs` (`@app/core#lint`), `.prettierrc.json` and `tsconfig.base.json` (`@app/core#typecheck`); changed for `packages/tooling/src/vitest-sequence.d.mts` (`@app/web#typecheck`) and `vitest-sequence.mjs` (`@app/web#lint`). With: every pair changed, `eslint.config.mjs` included. The `.prettierrc.json` probe read `@app/core#format:check`, a task with no command; the file reaches cached lint through `eslint-plugin-prettier` |
| T5   | `3c3a8c7` | `init-project:test`, which runs the rename with `demo-app` on a copy of the tree, before and after the fix | red, 4 of 5, the smoke script kept `@app/web`; then 5 of 5 |
| T6   | `020e327` | `verify:english`; `verify:maps` | green; 246 map references resolve |

T4 measured what the proposal assumed: a tooling change already reaches the tasks of every
workspace that declares `@app/tooling`, so `globalDependencies` names only the root configs; the
proposal was corrected in the same commit. `test` stays uncached (`"cache": false`), so the
roadmap's "a tooling change invalidates the `test` cache" has no cache to act on; the plan's
2.2 row now states what was measured.

## Independent verification

One independent verifier (risk item 5: test configuration, Turborepo inputs, a CI smoke script
and the `/init` rename derived projects run) passed T1 to T4 and T6. It confirmed that:

- the three modules match Certifipago `e43c26af5` except the two stated departures;
- the `.d.mts` declarations match the runtime exports, and TypeScript and Node resolve the
  subpaths;
- every suite passes under seeds 11 and 29 with the counts of `main`;
- the hash probe holds on eight pairs, and no root file a cached task reads is missing;
- every touched command matches the baseline apart from the shuffle lines.

It failed T5 on two blockers, both in the flow the README documents for a derived project
(`pnpm run init <slug>`, then `pnpm install`, then `pnpm validate`). Both are closed in
`a325ffa`:

- Walking `scripts/` renamed `TEMPLATE_NAME` inside `scripts/init-project.test.mjs`, so a
  renamed tree counted itself as the template and failed its own `init-project:test`. The test
  now joins the files init leaves byte for byte.
- The root `package.json` got only its `name` renamed, so `"@app/tooling": "workspace:*"` and
  the `--filter @app/...` scripts survived, and `pnpm install` failed with
  `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND`. On Windows the portable relative path had also stopped the
  rename of its scripts, which the base had renamed by accident. It now gets the text rename on
  every platform.

Recheck on a clone of the corrected branch renamed to `my-app`: no `@app/` is left in the root
`package.json`; the derived project's own `init-project:test` exits 0 (7 pass, the template-only
case skipped); `pnpm install --offline --lockfile-only --ignore-scripts` exits 0. The init test
adds the two cases, red on the uncorrected script (2 of 8 fail), then 8 of 8.

Found on the way and closed in `6233979` (T8): `validate` runs `turbo run format:check`,
but no workspace defines it and `turbo.json` had no root task, so Prettier never checked the
repository. `turbo run format:check` ran 0 tasks and exited 0 with two unformatted files; with
`//#format:check` it exits 1 on them, and 0 once they are formatted.

Its advisories, closed in `3f06f12` or recorded: the plan said `signalProcessTree` returns
whether the tree ended (it returns false only when the tree could not be signalled and is still
running); only the Vitest suites run shuffled, and a checkout with no commit needs
`VITEST_SEQUENCE_SEED`; the README tree lacked `packages/tooling`. No test covers the `false`
branch: no process this suite could start is one it cannot signal, and pid 1 or the test runner
itself would be signalled for real.

After the correction: `ATL_TEMPLATE_SELF=1 pnpm validate` exit 0 at `3f06f12` (turbo 24 of 24 tasks, the root `format:check` among them, none from the cache; `init-project:test` 8 of 8).

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-14, at `020e327` (turbo 23 of 23 tasks,
  none from the cache: the new `globalDependencies` invalidated every cached result). The tooling
  suite ran inside it, 13 of 13, and `init-project:test` 5 of 5.

## Not verified

- The POSIX path of `signalProcessTree` (a process group signalled by its negative pid) and the
  web smoke on Linux: this machine is Windows. CI's `validate` job runs the tooling suite on
  Ubuntu, and its `web-render` job the smoke.
- `pnpm smoke:mobile`: the change touches no file Metro bundles.
- Certifipago, which moves its 12 imports through K9 once this lands.
