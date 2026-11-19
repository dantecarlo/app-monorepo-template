# Proposal: one spec per unit holds a capability's part, with no exception

> **Status:** archived — 2026-11-19

## Why

Change `2026-11-19-capability-prune-claims` moved the Sentry requirements of each app into a spec
of their own, `openspec/specs/apps/web/sentry/spec.md` (WEBSENTRY) and
`openspec/specs/apps/mobile/sentry/spec.md` (MOBILESENTRY), which the `sentry` capability claims
and each app's prune removes (`template.manifest.json:199`, `template.manifest.json:240`,
`template.manifest.json:334-335`). The reason was the `Governs` line: `scripts/specs.detect.mjs`
keeps only the last line it reads (`scripts/specs.detect.mjs:64`), so a capability's governed
paths could not sit in a region of the app's spec. The layout is an exception to § 2.1 of
`openspec/README.md`, one spec per architectural unit, and one sentence of that section allows
it. It also leaves a stale claim: a `mobile-expo` prune deletes
`openspec/specs/apps/mobile/sentry/spec.md` while the kept `sentry` capability still claims it,
one of the stale claims follow-up F64 counts.

Follow-up F63 of `docs/INIT_AND_HARNESS_PLAN.md` asks to adapt the rule and fold the two specs
back.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-19 (translated from Spanish), on F63: "I approve option 1, continue with the plan, but
  we also have to find a way to centralize it anyway. Because rather than opening exceptions, we
  have to see how we can adapt it."
- 2026-11-19 (translated from Spanish), on the design of this change: "approved"

## What changes

- **A spec header may hold several `Governs` lines.** `parseSpec` reads their union, so
  `verify:specs` and `report:spec-drift` read every governed path of a spec. A spec still needs at
  least one `Governs` line naming a backticked path.
- **A capability's part stays in the unit's spec, inside a region it owns.** The Sentry `Governs`
  line of each app becomes a `Governs` line inside a `sentry` region of the header of
  `openspec/specs/apps/web/spec.md` and `openspec/specs/apps/mobile/spec.md`, and the Sentry
  requirements go back into those specs inside a `sentry` region. A `sentry` prune drops the
  regions; an app prune removes the whole spec.
- **The Sentry IDs retire.** The specs `openspec/specs/apps/web/sentry/spec.md` and
  `openspec/specs/apps/mobile/sentry/spec.md` are removed with WEBSENTRY-01 to WEBSENTRY-04 and
  MOBILESENTRY-01 to MOBILESENTRY-03; their requirements take the next free IDs of the app specs,
  WEB-81 to WEB-84 and MOBILE-80 to MOBILE-82. The `WEBSENTRY` and `MOBILESENTRY` prefixes are
  gone.
- **One source for the governed paths.** The table of `openspec/README.md` § 2.1 keeps the spec
  link and the ID prefix and drops the `Governs` column; each spec's header is the one place that
  states what it governs. The exception sentence goes. § 2.2 states that a header may hold
  several `Governs` lines and that a capability's part sits in a region it owns, following
  `docs/manifest.md`. The spec and delta templates and the `sdd` skill say where such a part goes.
- **The manifest.** The `sentry` capability stops claiming the two removed specs, and `web-next`
  and `mobile-expo` stop removing them; the capability owns the regions of the app specs instead.
  `docs/manifest.md` says so where it names the per-app specs.
- **The prune test.** The TOOLING-18 scenario that held the per-app Sentry specs is rewritten:
  after a `sentry` prune, the kept web and mobile specs cite no pruned file, and their regions are
  what takes the Sentry part; after a `mobile-expo` or `web-next` prune, no `sentry` claim on a
  spec is left stale.

## Out of scope

- **The six web root files of F64.** A `web-next` prune deletes `apps/web/instrumentation.ts`,
  `apps/web/next-sentry.config.ts`, the three `apps/web/sentry.*.config.ts` and
  `apps/web/__tests__/next-sentry.config.test.ts` while the kept `sentry` capability claims them.
  Dropping a claim on a file a prune removes is the prune executor's job (F64, Stage 6 step 6.2);
  this change takes the seventh stale claim of that prune, the web Sentry spec, and the only one
  of the `mobile-expo` prune.
- **The rows of a pruned spec in the § 2.1 table.** A Markdown table row cannot hold a region
  (`docs/manifest.md` § Regions), so a pruned unit's row stays, as the known-gaps row "any with a
  spec" of `docs/manifest.md` records.
- **The other prunes of F65.** The `supabase`, `mobile-expo` and `web-next` prunes keep spec
  citations of other units' files; this change touches none of them.
- **`docs/INIT_AND_HARNESS_PLAN.md`.** The parent session owns the plan and marks F63.

## Affected specs

- `openspec/specs/apps/web/spec.md`: adds WEB-81, WEB-82, WEB-83 and WEB-84, inside a `sentry`
  region, and a `Governs` line inside a `sentry` region of its header
- `openspec/specs/apps/mobile/spec.md`: adds MOBILE-80, MOBILE-81 and MOBILE-82, inside a `sentry`
  region, and a `Governs` line inside a `sentry` region of its header
- `openspec/specs/apps/web/sentry/spec.md`: removes WEBSENTRY-01, WEBSENTRY-02, WEBSENTRY-03 and
  WEBSENTRY-04; the spec is removed
- `openspec/specs/apps/mobile/sentry/spec.md`: removes MOBILESENTRY-01, MOBILESENTRY-02 and
  MOBILESENTRY-03; the spec is removed
- `openspec/specs/packages/tooling/spec.md`: modifies TOOLING-18
