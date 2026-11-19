# Delta: packages/tooling

> **Change:** `2026-11-19-spec-capability-regions`

## MODIFIED Requirements

### Requirement: TOOLING-18 — A kept spec cites no pruned file

The tooling package SHALL list every kept living spec under `openspec/specs/` that cites, in
backticks, a file the prune deletes: a scenario's test, an evidence `path:line` or a governed
path.

**Evidence:** `packages/tooling/src/prune-boundary.mjs:74`, `packages/tooling/src/prune-boundary.mjs:172-183`

#### Scenario: a test the prune deletes

- **GIVEN** a kept spec whose scenario names a test the capability claims, and a pruned spec that
  names it too
- **WHEN** the prune is checked
- **THEN** the kept spec is listed with the test, and the pruned spec is not
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept spec that cites a pruned test is a leak"

#### Scenario: an evidence or governed path

- **GIVEN** a kept spec that governs a file the capability claims and cites another as evidence,
  with a line range
- **WHEN** the prune is checked
- **THEN** the kept spec is listed with both files
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept spec that governs or cites a pruned file as evidence is a leak"

#### Scenario: the Sentry part of this repository's app specs

- **GIVEN** the repository's web and mobile specs, each holding the Sentry part of its app, its
  `Governs` line and its requirements, in a `sentry` region
- **WHEN** the prune of `sentry` is checked with its regions dropped, and again with them kept
- **THEN** with the regions dropped neither spec is listed, and with them kept both are, with the
  Sentry files their regions cite
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "pruning sentry of this repository drops the Sentry part of each app spec with its region"

#### Scenario: an app prune of this repository, Sentry kept

- **GIVEN** the repository's tracked files and its `template.manifest.json`
- **WHEN** the prune of `mobile-expo` and of `web-next` is simulated, Sentry kept: the files the
  app claims or removes deleted, and the app gone from the manifest
- **THEN** no claim the `sentry` capability makes on a living spec is left matching no file
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "pruning mobile-expo or web-next of this repository leaves no sentry claim on a spec stale"
