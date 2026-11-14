# Proposal: write the template's living specs from its code

> **Status:** open

## Why

The template adopted SDD (`2026-11-11-adopt-sdd`) but ships no living spec: the table in
`openspec/README.md` § 2.1 is empty, so a derived project starts with nothing to keep current, and
`report:spec-drift` has nothing to report. Decision 41 of `docs/INIT_AND_HARNESS_PLAN.md` has the
template ship one spec per app and package of the scaffold, written from the code and verified
against a commit, and Roadmap step 2.4 (T1b) schedules it now that the package aliases (T1c) and
the shared tooling (T1d) have landed.

The owner's words:

- 2026-11-12 (translated from Spanish): "merge everything pending, make a plan for the rest of
  what is missing, and include this with priority"
- 2026-11-14 (translated from Spanish), answering "Shall I merge template PR #12 (T1d,
  `@app/tooling`) once its CI is green, and continue with K9 to the Arquitecto and step 2.4 (T1b,
  living specs)?": "Yes, once it is green"

## What changes

- **Eight living specs**, each written from the code it governs, every requirement citing the
  `path:line` that enforces it and every scenario naming the test that proves it, or saying it is
  not covered and why: packages/core, packages/cloudflare, packages/i18n, packages/supabase,
  packages/tokens, packages/tooling, apps/web and apps/mobile.
- **The table** in `openspec/README.md` § 2.1 lists each spec, its ID prefix and what it governs.
- **The manifest** gives each spec to the owner of the code it governs, so `/init` keeps the spec
  of every capability it keeps and drops the spec of one it drops.

## Out of scope

- The harness and the validation gates, which stay unspecified (§ 2.1 of the README).
- Changing any behaviour: where a document and the code disagree, the spec states the code and
  records an open question for the owner.
- Certifipago's 26 specs, which describe its product (decision 41).

## Affected specs

- `openspec/specs/packages/core/spec.md`: added, CORE requirements
- `openspec/specs/packages/cloudflare/spec.md`: added, CLOUDFLARE requirements
- `openspec/specs/packages/i18n/spec.md`: added, I18N requirements
- `openspec/specs/packages/supabase/spec.md`: added, SUPABASE requirements
- `openspec/specs/packages/tokens/spec.md`: added, TOKENS requirements
- `openspec/specs/packages/tooling/spec.md`: added, TOOLING requirements
- `openspec/specs/apps/web/spec.md`: added, WEB requirements
- `openspec/specs/apps/mobile/spec.md`: added, MOBILE requirements

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
