# Delta: packages/tooling

> **Change:** `2026-11-17-posthog-observability`

## ADDED Requirements

### Requirement: TOOLING-15 — One observability port contract for every adapter

The tooling package SHALL export `runObservabilityPortContract`, which registers, through the
`test` function it is given, one case per contract rule and checks the adapter its harness
builds: every method is safe while the provider is disabled, the PII of every context, breadcrumb
and user is scrubbed before it reaches the provider while the rest of the payload arrives, the id
of a user is kept, and `setUser(null)` clears the user.

**Evidence:** written at apply time, when the code exists.

#### Scenario: an adapter that keeps the contract

- **GIVEN** an in-memory adapter that scrubs every payload and clears the user on `null`
- **WHEN** the contract runs against it
- **THEN** every case passes
- **Test:** `packages/tooling/src/__tests__/observability-port-contract.test.mjs` › "an adapter that keeps the contract passes every case"

#### Scenario: an adapter that throws while disabled

- **GIVEN** an adapter whose methods throw while the provider is disabled
- **WHEN** the contract runs against it
- **THEN** the disabled case fails
- **Test:** `packages/tooling/src/__tests__/observability-port-contract.test.mjs` › "an adapter that throws while disabled fails the disabled case"

#### Scenario: an adapter that hands on a raw email

- **GIVEN** an adapter that hands its payloads to the provider unscrubbed
- **WHEN** the contract runs against it
- **THEN** the context, breadcrumb and user cases fail
- **Test:** `packages/tooling/src/__tests__/observability-port-contract.test.mjs` › "an adapter that hands on a raw email fails the scrub cases"

#### Scenario: an adapter that delivers nothing

- **GIVEN** an adapter that claims to deliver and drops every payload
- **WHEN** the contract runs against it
- **THEN** the context, breadcrumb and user cases fail
- **Test:** `packages/tooling/src/__tests__/observability-port-contract.test.mjs` › "an adapter that drops what it should deliver fails the scrub cases"

#### Scenario: an adapter that keeps the user

- **GIVEN** an adapter that ignores `setUser(null)`
- **WHEN** the contract runs against it
- **THEN** the clear case fails
- **Test:** `packages/tooling/src/__tests__/observability-port-contract.test.mjs` › "an adapter that keeps the user after setUser(null) fails the clear case"

### Requirement: TOOLING-16 — Pruning a capability leaves no dangling reference

The tooling package SHALL list, for one capability of the manifest, every tracked file the prune
keeps that imports a file the prune deletes or a dependency it removes, and every Expo plugin
entry the prune leaves that names a removed dependency.

**Evidence:** written at apply time, when the code exists.

#### Scenario: an import of a pruned file

- **GIVEN** a kept file that imports, by alias or by relative path, a file the capability claims
- **WHEN** the prune is checked
- **THEN** the kept file is listed with the specifier
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept file that imports a pruned file is a leak"

#### Scenario: an import of a removed dependency

- **GIVEN** a kept file that imports a subpath of a dependency the capability removes
- **WHEN** the prune is checked
- **THEN** the kept file is listed with the specifier
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a kept file that imports a removed dependency is a leak"

#### Scenario: imports among pruned files

- **GIVEN** two files the prune deletes, one importing the other and the removed dependency
- **WHEN** the prune is checked
- **THEN** nothing is listed
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "an import between two pruned files is no leak"

#### Scenario: an Expo plugin left behind

- **GIVEN** a capability that removes a dependency and patches `expo.plugins` to a list that still
  names it
- **WHEN** the prune is checked
- **THEN** the plugin entry is listed
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "an Expo plugin the prune leaves that names a removed dependency is a leak"

#### Scenario: the patched plugin list drifts

- **GIVEN** a capability whose patched `expo.plugins` is not the app's list without the plugins
  of its removed dependencies
- **WHEN** the prune is checked
- **THEN** the drift is listed
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "a patched plugin list that drifts from app.json is a leak"

#### Scenario: the sentry capability of this repository

- **GIVEN** the repository's tracked files and its `template.manifest.json`
- **WHEN** the prune of `sentry` is checked
- **THEN** nothing is listed
- **Test:** `packages/tooling/src/__tests__/prune-boundary.test.mjs` › "pruning the sentry capability of this repository leaves no dangling reference"

## MODIFIED Requirements

### Requirement: TOOLING-01 — Four named entry points

The tooling package SHALL expose four entry points, `@app/tooling/observability-port-contract`,
`@app/tooling/process-tree`, `@app/tooling/vitest-package-base` and `@app/tooling/vitest-sequence`,
each pairing its plain ESM module with its type declarations.

**Evidence:** `packages/tooling/package.json:6-23`

#### Scenario: a workspace imports the package base by name

- **GIVEN** a workspace that declares `@app/tooling` as a `workspace:*` devDependency
- **WHEN** its Vitest config imports `@app/tooling/vitest-package-base`
- **THEN** the import resolves to the module at run time and to its declarations for types
- **Test:** Not covered — no test imports the package by name; the config of every package that
  builds on it resolves it on each test run.

#### Scenario: an adapter test imports the port contract by name

- **GIVEN** apps/web, apps/mobile and packages/core, which declare `@app/tooling` as a
  devDependency
- **WHEN** an observability adapter test imports `@app/tooling/observability-port-contract`
- **THEN** the import resolves at run time and its declarations type the harness
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "the observability port contract"
