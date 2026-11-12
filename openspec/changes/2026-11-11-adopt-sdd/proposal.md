# Proposal: adopt SDD in the template

> **Status:** open

## Why

The template plan now runs through SDD (`docs/INIT_AND_HARNESS_PLAN.md`, decision 42), and
`/init` will offer SDD as the default workflow (decision 40). The template must therefore hold
the SDD machinery itself and prove it on its own work before a derived project relies on it.
Today it has no `openspec/`, no spec gate and no SDD skill: its steps live in a plan file and in
feature documents outside git, and one of those, Certifipago's PD1 document, was lost on
2026-11-11 when the worktree holding it was removed. Certifipago adopted SDD on 2026-11-10
(`openspec/changes/archive/2026-11-10-adopt-sdd` there), and its machinery, apart from its 26
product specs, names no product.

The owner's words, verbatim:

- 2026-11-11: "Retoma lo que falta, pero ahora tambien en el init preguntar si se desea ODD o SDD
  como en el repo de certifipago que justo se acaba de implmentar y por default dejar sdd y dejar
  los specs echos. Justo la sesion del arquitecto agrego ello. Agregalo y adapta el planm y hasta
  poedmos actualizar en algunos puntos al plan antes que nada y continua. Ademas hay nuevos
  cambios, entonces hay que ver si todo es correctoadoptarlo y corregir todo. Ademas como estamos
  haciendo ahora con sdd, lo mejor seria que todo el plan pasara por este nuevo proceso de sdd para
  validar el flujo"
- 2026-11-12: "apruebo lo de apdt-sdd" (approval of this proposal)

## What changes

- `openspec/README.md`: the operating model, from the generic sections of Certifipago's README
  (§§ 1, 2.2, 3–6); its table of living specs starts empty and is filled by the next change.
- `openspec/templates/`: the six templates (`proposal`, `spec`, `spec-delta`, `design`, `tasks`,
  `verify-report`) as Certifipago holds them, with any example name made generic.
- `openspec/config.yaml`: Certifipago's phases, `execution: single-context` and living-spec path;
  its `context:` block replaced by this template's stack, and the test command
  `ATL_TEMPLATE_SELF=1 pnpm validate`.
- `verify:specs` (the shape of every spec and change, and that each test a scenario names
  exists) and `report:spec-drift` (the living specs whose code moved past them, never blocking),
  both inside `validate`, with the helpers they import: `scripts/gate/gate.mjs` and
  `scripts/git-free-env.mjs`, the hook-safe git environment of decision 33.
- The `sdd` skill, with its evals, in `.claude/skills/sdd/`.
- `template.manifest.json`: an `sdd` capability (the README, config, templates, living specs,
  the two gates and the skill), selected by every preset until `/init` offers ODD; the
  template's own changes (`openspec/changes/**`) belong to `template-maintainer` and never ship.
- This change is itself the first OpenSpec change of the template: this proposal and its tasks
  first, for the owner's review; then one commit per task, test first; a verify report; the
  archive as the last commit.

## Out of scope

- Certifipago's 26 product specs (decision 41). The template's own living specs, one per app and
  package of the scaffold, are the next change (plan step T1b).
- The `sdd-steward` agent: it needs the agent projector of plan step T2. Until then every phase
  runs in the main session, which `execution: single-context` already allows.
- The ODD alternative and the `/init` question that chooses between them (decision 40): plan
  step T6.
- `verify:docs-freshness` over `openspec/`: the template has no docs-freshness gate yet; the
  extension lands with that gate in plan step T3.
- Pinning or projecting anything for Codex, OpenCode or Copilot: plan step T2.

## Affected specs

- None. The harness stays unspecified, as in Certifipago (its `openspec/README.md:76`), and no
  living spec exists yet in this repository; the scaffold's specs arrive with plan step T1b.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
-->
