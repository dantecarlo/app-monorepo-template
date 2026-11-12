# Delta: <living spec path, for example packages/core>

> **Change:** `<YYYY-MM-DD>-<change name>`

## ADDED Requirements

### Requirement: <PREFIX>-<next free number> — <short name>

The <unit> SHALL <the new behaviour>.

**Evidence:** written at apply time, when the code exists.

#### Scenario: <the case>

- **GIVEN** <the state before>
- **WHEN** <the action or event>
- **THEN** <the observable result>
- **Test:** `<test file path>` › "<test title>"

## MODIFIED Requirements

### Requirement: <PREFIX>-<existing number> — <short name>

<The whole requirement as it will read after the change: statement, evidence and every scenario,
not only the lines that differ.>

## REMOVED Requirements

### Requirement: <PREFIX>-<existing number> — <short name>

**Reason:** <why the behaviour goes away>.

<!--
Rules (openspec/README.md § 3.1):
- The file sits under the change's specs/ at the same path the living spec has.
- Keep only the sections the change needs.
- A modified or removed ID must exist in the living spec; an added ID must not.
- Archive appends ADDED, replaces MODIFIED and deletes REMOVED; a removed ID is never reused.
- A test named here may not exist until apply; verify:specs checks it from the verify report on.
-->
