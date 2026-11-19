# Delta: harness/dependency-seams

> **Change:** `2026-11-19-capability-prune-claims`

## MODIFIED Requirements

### Requirement: SEAM-01 — One registry entry per dependency, with its category and seam

The dependency registry `.agents/contracts/dependencies.json` SHALL hold one entry per package or
package subpath, each with a category among `core`, `infra`, `ui`, `vendor`, `vendor-package`,
`build` and `peer`, a seam of repository globs for every non-core entry, no seam for a core
entry, `types` either `seam` (the default) or `anywhere`, and an `owner` that names, as text, the
capability of `template.manifest.json` whose prune removes the entry, or `core`;
`pnpm verify:dependency-seams` refuses an entry that breaks this shape and a name listed twice,
and `pnpm verify:manifest:coverage` holds each owner to the manifest.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a non-core entry without a seam

- **GIVEN** a registry entry for `zod` in the `infra` category with no `seam`
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the entry and what it lacks
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "a non-core entry without a seam is malformed"

#### Scenario: an unknown category

- **GIVEN** a registry entry whose category is `library`
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the entry and the categories it may use
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "an entry with an unknown category is malformed"

#### Scenario: a package listed twice

- **GIVEN** a registry that names `zod` in two entries
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the package
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "a registry that names one package twice is malformed"

#### Scenario: an entry that names its owner

- **GIVEN** registry entries that each name an `owner`
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it passes
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "an entry that names its owner passes"

#### Scenario: an owner that is not text

- **GIVEN** a registry entry whose `owner` is a number
- **WHEN** `pnpm verify:dependency-seams` runs
- **THEN** it fails, naming the entry and its owner
- **Test:** `scripts/verify-dependency-seams.test.mjs` › "an entry whose owner is not text is malformed"
