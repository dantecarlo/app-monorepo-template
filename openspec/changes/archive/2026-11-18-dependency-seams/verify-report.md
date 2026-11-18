# Verify report: 2026-11-18-dependency-seams

> **Verified:** 2026-11-18 at `325d441`

## Scenarios

Every test ran green in `ATL_TEMPLATE_SELF=1 pnpm validate` at `325d441`:
`verify:lint-rules:test` 169 of 169 (the seam cases among them), `verify:dependency-seams:test` 28
of 28.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| SEAM-01 | a non-core entry without a seam | `scripts/verify-dependency-seams.test.mjs` › "a non-core entry without a seam is malformed" | green |
| SEAM-01 | an unknown category | `scripts/verify-dependency-seams.test.mjs` › "an entry with an unknown category is malformed" | green |
| SEAM-01 | a package listed twice | `scripts/verify-dependency-seams.test.mjs` › "a registry that names one package twice is malformed" | green |
| SEAM-02 | a package nobody registered | `eslint-local-rules/dependency-seam.cases.mjs` › "a package the registry does not name is refused" | green |
| SEAM-02 | a Node builtin in app source | `eslint-local-rules/dependency-seam.cases.mjs` › "a Node builtin outside its seam is refused" | green |
| SEAM-03 | outside the seam | `eslint-local-rules/dependency-seam.cases.mjs` › "a registered package outside its seam is refused" | green |
| SEAM-03 | inside the seam | `eslint-local-rules/dependency-seam.cases.mjs` › "a registered package inside its seam passes" | green |
| SEAM-03 | a core package | `eslint-local-rules/dependency-seam.cases.mjs` › "a core package passes anywhere" | green |
| SEAM-03 | a type-only import outside the seam | `eslint-local-rules/dependency-seam.cases.mjs` › "a type-only import outside the seam is refused" | green |
| SEAM-03 | an entry whose types are allowed anywhere | `eslint-local-rules/dependency-seam.cases.mjs` › "an entry whose types are anywhere admits a type-only import outside its seam" | green |
| SEAM-03 | a vendor SDK the old import patterns refused | `eslint-local-rules/dependency-seam.cases.mjs` › "a vendor SDK the old import patterns refused is still refused" | green |
| SEAM-04 | a dynamic import | `eslint-local-rules/dependency-seam.cases.mjs` › "a dynamic import outside the seam is refused" | green |
| SEAM-04 | a require | `eslint-local-rules/dependency-seam.cases.mjs` › "a require outside the seam is refused" | green |
| SEAM-04 | a mocked vendor | `eslint-local-rules/dependency-seam.cases.mjs` › "a vi.mock of a package outside its seam is refused" | green |
| SEAM-04 | a re-export | `eslint-local-rules/dependency-seam.cases.mjs` › "a re-export outside the seam is refused" | green |
| SEAM-05 | a narrowed subpath of a core package | `eslint-local-rules/dependency-seam.cases.mjs` › "a subpath entry wins over its package" | green |
| SEAM-05 | a subpath with no entry of its own | `eslint-local-rules/dependency-seam.cases.mjs` › "a subpath with no entry of its own takes its package's" | green |
| SEAM-06 | a test of a unit inside the seam | `eslint-local-rules/dependency-seam.cases.mjs` › "a test inherits the seam of the unit it tests" | green |
| SEAM-06 | a test of a unit outside the seam | `eslint-local-rules/dependency-seam.cases.mjs` › "a test of a unit outside the seam is refused" | green |
| SEAM-06 | test infrastructure | `eslint-local-rules/dependency-seam.cases.mjs` › "test infrastructure under src/test passes any registered package" | green |
| SEAM-06 | an unregistered package in test infrastructure | `eslint-local-rules/dependency-seam.cases.mjs` › "an unregistered package is refused in test infrastructure too" | green |
| SEAM-07 | a listed pair | `eslint-local-rules/dependency-seam.cases.mjs` › "an allowlisted file and package pair is not reported" | green |
| SEAM-07 | an entry whose file was fixed | `scripts/verify-dependency-seams.test.mjs` › "an allowlist entry whose file no longer breaks the rule is stale" | green |
| SEAM-07 | a violation the list does not carry | `scripts/verify-dependency-seams.test.mjs` › "a violation the allowlist does not carry is named" | green |
| SEAM-07 | an entry that names no unit | `scripts/verify-dependency-seams.test.mjs` › "an allowlist entry that names no F.8 unit is malformed" | green |
| SEAM-07 | the gate as a process | `scripts/verify-dependency-seams.test.mjs` › "the gate exits 1 and prints the stale entry" | green |
| SEAM-08 | an unregistered dependency | `scripts/verify-dependency-seams.test.mjs` › "a package.json dependency the registry does not name fails" | green |
| SEAM-08 | a stale entry | `scripts/verify-dependency-seams.test.mjs` › "a registry entry for a package nothing declares is stale" | green |
| SEAM-08 | a glob that matches nothing | `scripts/verify-dependency-seams.test.mjs` › "a seam glob that matches no file fails" | green |
| SEAM-08 | a config file ESLint skips | `scripts/verify-dependency-seams.test.mjs` › "a file ESLint does not lint that imports a package outside its seam fails" | green |
| SEAM-08 | a green states what it judged | `scripts/verify-dependency-seams.test.mjs` › "the gate exits 0 over a clean tree and states what it judged" | green |
| SEAM-09 | the fixture app | `eslint-local-rules/dependency-seam.cases.mjs` › "a new app under apps/ inherits the rule with no config change" | green |

Each test was seen red first:

- **The rule cases**, against two stubs of the detection. A stub that reports nothing turned
  every refusal red ("Should have 1 error but had 0", "Should have 2 errors but had 0" for the
  vendor pair) and both detection cases red (`[]` where a finding was due). A stub that fails
  closed on every statement, with no registry, turned every acceptance red ("Should have no
  errors but had 1", "had 2" for the two-import cases): the seam, the core entry, the subpath
  fallback, the inherited test seam, `src/test/**` and the out-of-scope file.
- **The fixture app**, with the real detection but before `DEPENDENCY_SEAM_OVERRIDE` joined the
  config: `apps/fixture/src/helpers/outside.helper.ts` reported `[]` where an unregistered and an
  outside-the-seam error were due. Adding the block by pattern turned it green with no change for
  the fixture.
- **The gate**, against a stub that finds nothing: its 17 failing cases each "expected N
  finding(s), got 0", its three process checks exited 0 with no denominator, and its three detail
  checks found no finding. "every case fails against a blinded gate" proves the red cases assert
  something; the cases that pass are not red against a stub by construction.
- **The prune check of the sentry capability** (`packages/tooling`, TOOLING-16) went red in the
  first `validate`: the probe text `from '@sentry/nextjs'` in the seam cases read as an import.
  The probe is now spelled from its parts (`325d441`).

## The inventory and the frozen allowlist

The registry holds 100 entries, taken from every `package.json` of the workspace and every import
of `apps/*` and `packages/*` at `6b1d1fc`: core 10, infra 16, ui 10, vendor 6, vendor-package 2,
build 49 (the `node:*` entry of the builtins among them), peer 7. Subpath entries: `next/cache`,
`next/navigation` (infra) and `next/image` (ui), each with an empty seam until its F.8 unit.

The allowlist freezes 143 file-package pairs, all outside their seam, none unregistered:

| Package | Entries | Removed by |
| ------- | ------- | ---------- |
| `next-intl` | 51 | F.8 unit 2 |
| `react-i18next` | 31 | F.8 unit 2 |
| `@tanstack/react-query` | 8 | F.8 unit 3 |
| `zustand` | 8 | F.8 unit 4 |
| `@react-native-async-storage/async-storage` | 3 | F.8 unit 4 |
| `tailwind-variants` | 10 | F.8 unit 5 |
| `next/image` | 4 | F.8 unit 5 |
| `expo-status-bar` | 3 | F.8 unit 5 |
| `expo-linear-gradient` | 1 | F.8 unit 5 |
| `nativewind` | 3 | F.8 unit 5 (2 ui tests), unit 6 (the root layout test) |
| `next/navigation` | 9 | F.8 unit 6 |
| `next/cache` | 2 | F.8 unit 6 |
| `expo-splash-screen` | 2 | F.8 unit 6 |
| `@expo-google-fonts/inter` | 2 | F.8 unit 6 |
| `@expo-google-fonts/montserrat` | 2 | F.8 unit 6 |
| `react-native-safe-area-context` | 1 | F.8 unit 6 |
| `posthog-react-native` | 1 | F.8 unit 6 |
| `@app/supabase` | 2 | F.8 unit 7 |

By unit: 2 → 82, 3 → 8, 4 → 11, 5 → 20, 6 → 20, 7 → 2.

## The differential run

The `no-restricted-imports` config of `6b1d1fc`, copied into a scratch directory, and this
branch's config linted the same 315 probes: 8 vendor SDKs (`@supabase/supabase-js`,
`@supabase/ssr`, `@supabase/realtime-js`, `@stripe/stripe-js`, `@stripe/react-stripe-js`,
`@sentry/nextjs`, `@sentry/react-native`, `@sentry/browser`) and `@testing-library/react` at 35
paths of both apps and every package. Both refuse 187, both accept 13, 98 are refused only now
(an adapter or a `src/lib/**` file of another vendor, `packages/tooling`, and `@stripe/*`, which
no entry names). The 35 `@testing-library/react` verdicts are all unchanged. 17 probes the old
patterns refused are accepted now:

- `apps/web/next-sentry.config.ts` with `@sentry/nextjs`: the old allow-list predated the file,
  which carried an inline disable; the registry lists it in the Sentry seam.
- 4 tests of a seam's own unit: the Sentry adapter tests of both apps and the client adapter test
  of `packages/supabase`, which inherit the seam of the unit they test (SEAM-06).
- 12 under `src/test/**` (`setup.ts` and `test.helper.ts` of web, `setup.ts` of mobile) with a
  registered Supabase or Sentry SDK: the test-infrastructure seam (SEAM-06).

No production import the old patterns refused is accepted, except the config file the old
patterns themselves had to disable.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-18, at `325d441` (turbo 24 of 24 tasks;
  `verify:dependency-seams` judged 100 registry entries, 9 `package.json` files, 867 files under
  `apps/` and `packages/` with 814 sources of which 6 ESLint does not lint, 143 allowlist entries
  against 143 violating pairs; `report:spec-drift` listed 1 of 10 specs, harness/ticket-flow, whose
  skills changed on `main` before this branch; `knip` green). The first run, at `f8985c0`, exited 1
  on the prune check above.

## Not verified

- After `/init` drops a capability (Sentry, the mobile app, Supabase, Cloudflare), its registry
  entries and seam globs would go stale and `verify:dependency-seams` would fail; there is no prune
  executor yet to drop them (Stage 6, F.11).
- `turbo.json` does not list the registry or the allowlist among the lint task's
  `globalDependencies`, so a lint result cached before an edit to either is replayed;
  `verify:dependency-seams` re-derives every violation uncached and fails what the cache hides.
- The rule judges packages, not the names imported from them (F.8 units 6 and 8), and the
  config by pattern covers this rule only: `BASE_RULES`, the React plugins and the styling pillar
  are still wired per app.
