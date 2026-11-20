# Verify report: 2026-11-19-seam-open-migrations

> **Verified:** 2026-11-19 at `60f2a0e`

## Scenarios

Every test ran green in `ATL_TEMPLATE_SELF=1 pnpm validate` at `60f2a0e`:
`verify:lint-rules:test` 217 of 217 and `verify:dependency-seams:test` 49 of 49.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| SEAM-16 | no migration is open | `scripts/verify-dependency-seams.test.mjs` › "a registry that declares no open migration passes" | green |
| SEAM-16 | a malformed declaration | `scripts/verify-dependency-seams.test.mjs` › "a malformed open-migration declaration is refused, naming it" | green |
| SEAM-16 | a stale migration | `scripts/verify-dependency-seams.test.mjs` › "a declared migration no allowlist entry names is stale" | green |
| SEAM-16 | a stale migration | `scripts/verify-dependency-seams.test.mjs` › "a stale migration names its id and the remedy" | green |
| SEAM-16 | an allowlist the gate cannot read | `scripts/verify-dependency-seams.test.mjs` › "no migration is called stale while the allowlist cannot be read" | green |
| SEAM-07 | a listed pair | `eslint-local-rules/dependency-seam.cases.mjs` › "an allowlisted file and package pair is not reported" | green |
| SEAM-07 | a pair whose migration is not open | `eslint-local-rules/dependency-seam.cases.mjs` › "an allowlist entry whose migration is not open exempts nothing" | green |
| SEAM-07 | an entry whose file was fixed | `scripts/verify-dependency-seams.test.mjs` › "an allowlist entry whose file no longer breaks the rule is stale" | green |
| SEAM-07 | a violation the list does not carry | `scripts/verify-dependency-seams.test.mjs` › "a violation the allowlist does not carry is named" | green |
| SEAM-07 | an entry that names no migration | `scripts/verify-dependency-seams.test.mjs` › "an allowlist entry that names no migration is malformed" | green |
| SEAM-07 | an entry whose migration is not open | `scripts/verify-dependency-seams.test.mjs` › "an allowlist entry whose migration the registry does not declare open is malformed" | green |
| SEAM-07 | an entry whose migration is not open | `scripts/verify-dependency-seams.test.mjs` › "an entry whose migration is not open is named, and a registry with no openMigrations declares none" | green |
| SEAM-07 | an entry under an open migration | `scripts/verify-dependency-seams.test.mjs` › "an allowlist entry whose file still breaks the rule passes" | green |
| SEAM-07 | a reason that names no F.8 unit, and no reason | `scripts/verify-dependency-seams.test.mjs` › "an allowlist entry under an open migration needs no F.8 unit in its reason" | green |
| SEAM-07 | a reason that names no F.8 unit, and no reason | `scripts/verify-dependency-seams.test.mjs` › "an allowlist entry with no reason is malformed" | green |
| SEAM-07 | the gate as a process | `scripts/verify-dependency-seams.test.mjs` › "the gate exits 1 and prints the stale entry" | green |

**Seen red first.** Each new test failed against the base for the reason it names before its
code landed: a registry with `openMigrations` was refused for a key it does not define (so a
declaration of none, a malformed declaration, a stale migration and an unreadable allowlist all
read as `registry-malformed`); an entry with no migration and an F.8 reason passed (0 findings
for 2 expected); an entry naming a migration was refused for the key `migration`, not for its
migration being closed; and the rule's detection exempted the listed `zod` import whatever the
entry's migration.

## The differential against the base

Run on this repository before the change (at `b583152`) and after it (at `c0101f4`), with the
outputs kept outside the worktree:

- `node scripts/verify-dependency-seams.mjs`: exit 0 both times, stderr empty both times, stdout
  byte-identical up to the end of its population line ("100 registry entries, 9 package.json
  file(s), 1010 file(s) under apps/ and packages/ with 957 source file(s) (6 that ESLint does not
  lint), 0 allowlist entries, 0 file-package pair(s) outside their seam"). The rest of the line is
  the gate's `claims` and `notCovered`, which state the rule this change alters and so changed
  with it (assumption A5).
- `local/dependency-seam` alone, through ESLint's `Linter`, over the 957 git-listed sources under
  `apps/` and `packages/`: stdout, stderr and exit code byte-identical, with no message of the rule
  either time.
- Both runs read the same tree. Run again at `60f2a0e`, after `pnpm validate` had built the web
  app, the gate counts two files more (1012, 958 sources, 7 that ESLint does not lint): the
  ignored build output `apps/web/next-env.d.ts` and `apps/web/tsconfig.tsbuildinfo`, which the
  gate walks from disk; the lint output is still identical.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 1, 2026-11-19, at `60f2a0e`. Every gate before
  `verify:specs` passed (turbo: 24 of 24 tasks of lint, typecheck, test, build and format:check).
  `verify:specs` failed as expected: the living spec still cites the renamed title "an allowlist
  entry that names no F.8 unit is malformed" until the archive merges the delta.
- Each gate after `verify:specs`, run one by one: exit 0 (`git-free-env:test`,
  `report:spec-drift:test`, `report:spec-drift`, `verify:english:test`, `verify:english`,
  `verify:instruction-entry:test`, `verify:instruction-entry`, `verify:unicode-safety:test`,
  `verify:unicode-safety`, `verify:workflow-pins:test`, `verify:workflow-pins`,
  `verify:skill-frontmatter:test`, `verify:skill-frontmatter`, `codex-budget:test`, `verify:maps`,
  `check:identity`, `init-project:test`, `verify:pairing`, `verify:structure`, `verify:security`,
  `verify:theme-sync:test`, `verify:theme-sync`, `mcp:docs:test`, `verify:mcp-docs:test`,
  `verify:mcp-docs`, `verify:ticket-branch:test`, `verify:skills:test`, `docs:diagrams:check`, the
  `@app/i18n` tests and `knip`).
- `ATL_TEMPLATE_SELF=1 pnpm validate` runs again after the archive.

## Not verified

- Certifipago: its registry, its 711 entries and its gate are untouched; the proposal says how
  they would carry the migrations. Its allowlist was read at the `origin/master` the donor
  worktree already had (`c81fd63eb`), with no fetch.
- Whether a migration declared open is still in progress, and a new entry for a new import under
  a migration still open: review reads both, as the gate's `notCovered` says.
- A population with entries under an open migration on a real repository: the template's
  allowlist is empty, so the differential shows only that nothing changes here; the cases above
  cover a listed entry under an open migration in a scratch tree.
