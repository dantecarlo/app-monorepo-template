# Proposal: an allowlist entry of the dependency seam counts only under an open migration

> **Status:** open

## Why

F59 of `docs/INIT_AND_HARNESS_PLAN.md`, found by F.8 unit 9: with F.8 closed and the allowlist
empty, `pnpm verify:dependency-seams` still accepts a new entry of
`eslint-dependency-seam-allowlist.json` whose reason starts with an F.8 unit from 2 to 8 while
its import breaks the rule (`scripts/dependency-seams.detect.mjs:63-64`,
`scripts/dependency-seams.detect.mjs:295`), and `local/dependency-seam` skips any listed pair
whatever its reason says (`eslint-local-rules/dependency-seam.detect.mjs:207-211`). The unit an
entry belongs to is named only in prose, and nothing says whether that unit is still open, so
only review keeps the allowlist empty.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-19 (translated from Spanish), the option chosen for F59: "Only open migrations"
- 2026-11-19 (translated from Spanish), the option as the owner read it: "Every exception must
  name a migration the project declares open in the registry. The template declares none, so it
  refuses any exception. Certifipago declares its units 2 to 7 and keeps working; when each one
  closes, its exceptions stop counting. The same code serves both repos."

## What changes

- **The registry declares its open migrations.** `.agents/contracts/dependencies.json` gains an
  optional `openMigrations`, a list of `{ id, note }`: the migrations still in progress, each with
  an id no other declaration repeats and a note that says what it moves. A registry without the
  field declares none, so the change is additive. The template's list is `[]`. A declaration that
  breaks this shape is a malformed registry, refused alone like a malformed entry. The design is
  in `design.md`.
- **Every allowlist entry names an open migration.** An entry of
  `eslint-dependency-seam-allowlist.json` becomes `{ path, package, migration, reason }`, where
  `migration` is the id of one open migration. `pnpm verify:dependency-seams` refuses an entry
  with no migration and one whose migration the registry does not declare open, and fails a
  declared migration that no entry names: it is stale, and it is closed by removing it.
- **The lint and the gate read open migrations with one detection.** The index the rule and the
  gate both build from the registry (`indexRegistry` of
  `eslint-local-rules/dependency-seam.detect.mjs`) holds the open ids, and one predicate there
  decides whether an entry names one; `local/dependency-seam` skips a listed pair only when it
  does, and the gate's shape check calls the same predicate.
- **Nothing an entry excuses today changes while its migration is open.** The template's
  allowlist is empty, so on this repository the lint and the gate report the same before and
  after; the verify report records the differential.
- **The docs follow.** `docs/code-standards.md` § 23 and its § 21 row,
  `docs/decisions/0002-every-library-behind-an-adapter.md`, `docs/harness.md`,
  `docs/maps/global-map.md`, the `lib` skill and the registry's own `$comment`.

**Certifipago.** Its `eslint-dependency-seam-allowlist.json` holds 711 entries, each with a reason
that starts with its F.8 unit (367, 138, 38, 51, 64 and 53 entries for units 2 to 7, read at its
`origin/master` `c81fd63eb`). Its registry would declare six open migrations, one per unit,
`{ "id": "f8-unit-2", "note": "F.8 unit 2 (TASK-i18n-seam): the translators move behind lib/i18n." }`
through `f8-unit-7`, and each entry would gain `"migration": "f8-unit-N"`, the N its reason
already starts with, and keep its reason as it is: a mechanical rewrite of the prefix into the
field, with no entry added or removed. When a unit closes, the gate calls its last entries
stale as their imports move, and then the unit's declaration, which no entry names any longer;
removing the declaration first instead makes the unit's remaining entries malformed and their
imports unlisted, so they stop counting at once. The same gate and rule code serve both
repositories; only the registry's list and the entries differ.

**Assumptions.**

- **A1 (assumption).** The reason stays required, as free text, and its F.8-unit prefix check
  (`/^F\.8 unit [2-8]\b/`) goes: the migration an entry belongs to is named by the `migration`
  field now, so the prose prefix would only duplicate it, and an id outside F.8 would be refused
  for no reason.
- **A2 (assumption).** `local/dependency-seam` applies the open-migration rule too, so an entry
  whose migration closed stops silencing the lint as well as the gate. The rule's other leniency
  stays as it is: it does not judge an entry's reason or its keys, which the gate refuses.
- **A3 (assumption).** A migration is named by every entry whose `migration` is its id, whatever
  else is wrong with that entry, so a malformed entry is reported once and does not also make
  its migration stale. While the allowlist cannot be read, no migration is called stale, as no
  registry entry is while a `package.json` cannot be read (SEAM-08).
- **A4 (assumption).** An id is any non-empty text; the gate imposes no format.
- **A5 (assumption).** "The outputs are identical" holds for the lint's messages and for the
  gate's exit code, stderr and verdict. The gate's PASS line also prints its `claims` and
  `notCovered` (`scripts/gate/gate.mjs:71-73`), which state the rule this change alters, so those
  two sentences change with it; the differential compares everything else byte for byte.

## Out of scope

- **Certifipago itself.** Its registry, entries and gate change when this propagates
  (`docs/propagation.md`); this change touches none of them.
- **Whether a migration declared open is still in progress.** The gate sees that an open
  migration names entries, not whether its work goes on; review reads that, and the note says
  what the migration moves.
- **A new entry for a new import under a migration still open.** A project with an open
  migration can still list a new import under it; only review refuses that, as today.
- **`docs/INIT_AND_HARNESS_PLAN.md`**, whose row F59 the parent session updates.

## Affected specs

- `openspec/specs/harness/dependency-seams/spec.md`: modified SEAM-07; added SEAM-16.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
