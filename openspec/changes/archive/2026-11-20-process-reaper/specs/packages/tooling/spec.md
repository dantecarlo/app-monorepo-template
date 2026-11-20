# Delta: packages/tooling

> **Change:** `2026-11-20-process-reaper`

## MODIFIED Requirements

### Requirement: TOOLING-12 — A child is ended with every process it started

The tooling package SHALL end a child and its descendants from `signalProcessTree` (on POSIX by
sending the signal to the child's process group, which holds its descendants only when the child
was spawned with `TREE_SPAWN_OPTIONS`, so a child spawned without them receives the signal alone;
on Windows by `taskkill /pid <pid> /T /F` whatever the signal, stopped after 5 s whether or not
the call waits for it), and say in its declaration and its JSDoc that on POSIX the descendants
are reached only for a child spawned with `TREE_SPAWN_OPTIONS`.

**Evidence:** `packages/tooling/src/process-tree.mjs:47-78`, `packages/tooling/src/process-tree.mjs:19`,
`packages/tooling/src/process-tree.d.mts:6-9`, `packages/tooling/src/process-tree.mjs:36-39`

#### Scenario: a child that started a process

- **GIVEN** a child spawned with `TREE_SPAWN_OPTIONS` that started a long-lived process of its own
- **WHEN** `signalProcessTree` signals it with `SIGTERM` and `wait`
- **THEN** it returns true, and both the child and the process it started end within ten seconds
- **Test:** `packages/tooling/src/__tests__/process-tree.test.mjs` › "signalProcessTree ends a child and the process it started"

#### Scenario: taskkill is bounded

- **GIVEN** `signalProcessTree` on Windows, with `wait` and without it
- **WHEN** it runs taskkill
- **THEN** each call gives taskkill a 5 s timeout, so a taskkill that hangs never holds its caller
- **Test:** `packages/tooling/src/__tests__/process-tree.test.mjs` › "on Windows taskkill is bounded at 5 s, waited for or not"

#### Scenario: a POSIX child that leads no group

- **GIVEN** a POSIX child spawned without `TREE_SPAWN_OPTIONS`
- **WHEN** `signalProcessTree` signals it
- **THEN** the group signal fails and only the child itself receives the signal, so a process it
  started keeps running
- **Test:** Not covered — no test spawns a child without the options.

#### Scenario: the declaration names the condition

- **GIVEN** the type declarations of `@app/tooling/process-tree`
- **WHEN** a reader reads the documentation of `signalProcessTree`
- **THEN** it says that on POSIX the descendants are reached only for a child spawned with
  `TREE_SPAWN_OPTIONS`
- **Test:** Not covered — the wording of a comment is read in review; no test reads it.
