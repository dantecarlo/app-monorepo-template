# Proposal: keep the template in English

> **Status:** open

## Why

The template is the shared baseline for every derived project and for client teams, so a
language one owner happens to speak should not leak into it. `CLAUDE.md` already says "English
everywhere", but nothing holds it: a scan of the tracked files on 2026-11-12, outside the
translation catalogs, found 67 Spanish lines in three files — 48 owner quotes in
`docs/INIT_AND_HARNESS_PLAN.md`, the 18-line PRD skeleton of
`.claude/skills/product-discovery/assets/templates.md` (whose own header says prose follows the
project's doc language, default English), and one test fixture name in
`apps/web/src/services/Items/Items.adapter.test.ts`.

The owner's words:

- 2026-11-12 (translated from Spanish): "Something we have to make sure of is that everything in
  the template is in English, no matter what, no parts in Spanish or anything; the only Spanish
  would be the translations, and nothing else beyond that."
- 2026-11-13 (translated from Spanish): "I approve the english only" (approval of this proposal)

## What changes

- `docs/INIT_AND_HARNESS_PLAN.md`: every owner quote in English, translated faithfully and marked
  `(translated from Spanish)`; the verbatim originals stay in the pull request conversations and in
  the project memory, not in the repository.
- `.claude/skills/product-discovery/assets/templates.md`: the PRD skeleton in English.
- `apps/web/src/services/Items/Items.adapter.test.ts`: an English fixture name with the same
  whitespace shape, so the test still proves what its name says.
- `verify:english`, a gate inside `validate`: it fails on a line of a tracked text file that holds
  a Spanish-only character (an n with a tilde, an inverted question or exclamation mark, an
  accented vowel, a u with a diaeresis) or two or more distinct Spanish function words, outside the
  translation catalogs (`packages/i18n/src/locales/**`). The detector writes those characters as
  Unicode escapes, so its own source passes it. A line that must keep
  such text for a reason (a person's name a test needs, a quoted product label) is listed with
  that reason in an allowlist the gate reads; the gate refuses an allowlist entry that matches
  nothing.
- The gate's cases, test first: a planted Spanish sentence, a planted accented word and an
  unlisted catalog outside `packages/i18n` each fail; English text, the catalogs and an allowed
  line pass.
- `template.manifest.json`: the gate, its cases and its allowlist owned by `core`; `docs/harness.md`,
  `docs/maps/global-map.md` and the "English everywhere" line of `AGENTS.md` name the gate (`CLAUDE.md` is being retired in a parallel change).

## Out of scope

- Certifipago: the rule is the template's; Certifipago keeps its own language choices (parity
  ledger: not applicable, with this reason).
- Languages other than Spanish: the gate looks for Spanish, the only other language found; the
  Chinese strings in the vendored archify viewer are its own UI translations.
- The conversation with the owner, which stays in the owner's language.

## Affected specs

- None. The harness stays unspecified, as decided in `2026-11-11-adopt-sdd`.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
-->
