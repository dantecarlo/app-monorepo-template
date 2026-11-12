# <Unit name> — living spec

> **Governs:** `<code path>`, `<code path>`
> **ID prefix:** `<PREFIX>`
> **Derived from:** `<doc path>`, `<ADR path>`
> **Verified against the code:** <YYYY-MM-DD> at `<short sha>`

## Purpose

<Two to four sentences: what this unit is responsible for, and what it leaves to which other
spec. Name each neighbour by its spec name in plain text (packages/core), never in backticks:
backticks mean a repository path, which must exist.>

## Requirements

### Requirement: <PREFIX>-01 — <short name of the behaviour>

The <unit> SHALL <one observable behaviour, in the present tense of what the code does>.

**Evidence:** `<path>:<line>`, `<migration path>`

#### Scenario: <the case, in a few words>

- **GIVEN** <the state before>
- **WHEN** <the action or event>
- **THEN** <the observable result>
- **Test:** `<test file path>` › "<test title, exactly as written in the file>"

#### Scenario: <a case nothing tests yet>

- **GIVEN** <the state before>
- **WHEN** <the action or event>
- **THEN** <the observable result>
- **Test:** Not covered — <why: no runner for this layer, device only, a known gap>

## Open questions

- **Q1** — <what a document says, with its citation, against what the code does, with its
  citation>. The owner decides; the requirement above states the code.

<!--
Rules (openspec/README.md § 2.2; verify:specs checks the shape):
- IDs are <PREFIX>-NN, unique, never reused once removed.
- One SHALL per requirement; split a requirement that needs two.
- Every path in backticks must exist; a `path:line` must name a line the file has.
- A test line names an existing file; the quoted title must appear in it verbatim.
- Write what the code does. A document that disagrees is an open question, not a requirement.
- Omit "Open questions" when there is none.
-->
