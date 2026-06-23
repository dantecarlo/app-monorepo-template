---
name: validate-all
description: >
  Validation harness. Runs after every generation unit:
  deterministic gate (pnpm validate) + grouped adversarial validator
  subagents in parallel. Produces a single aggregated report with an
  overall DONE / NOT-DONE verdict. Nothing is DONE until this is green.
---

# validate-all — Validation Harness

> **Standing rule**: nothing is DONE until this harness is green.
> Run it at the end of every feature, change, or fix before reporting
> completion to the user.

---

## When to run

- After any `/feature`, `/component`, `/screen`, `/service`, `/store`, `/lib`
  scaffold
- After any multi-file edit session
- Before marking a task complete in an SDD apply phase
- Whenever the user asks "is this done?" or "does this pass standards?"

---

## Scale to the change size

For a **one-file tweak** (e.g. renaming a constant, fixing a typo):

- Run Step 1 (deterministic gate) always.
- Run only **G-standards** as the validator group; skip G-tests, G-security,
  and G-a11y-design-dod unless the change touches those areas.

For a **multi-file change** (new feature, screen, service):

- Run Step 1 always.
- Run ALL five validator groups in parallel (Step 2).

For a **single built block** (one freshly scaffolded screen or component),
always run **G-fractal** scoped to that block — it is the cheapest way to
catch a structural regression before it spreads. Run G-fractal once per
built block (not once for the whole diff).

---

## Step 1 — Deterministic gate (fail-fast, always run first)

```bash
pnpm validate
```

`pnpm validate` runs `turbo run lint typecheck test build format:check` across all
packages, then runs `pnpm verify:tests` (the tests-per-unit presence check).
Turbo runs lint and typecheck in the order defined by `dependsOn`;
build depends on typecheck; test depends on ^build (package deps must build
first). Only `apps/web` defines a `build` task (Next.js build); packages
that do not define `build` are skipped by Turbo automatically.

`pnpm verify:tests` (`scripts/verify-tests.mjs`) fails if any
`*.component.tsx` / `*.hook.ts` / `*.helper.ts` / `*.service.ts` /
`*.adapter.ts` unit lacks a sibling `*.test.*` file. A missing test is a
**BLOCKER** — add the sibling test before proceeding.

**If this step fails:**

- Capture the full output.
- The failing task (lint / typecheck / test / build) is an automatic
  **BLOCKER**.
- Do NOT proceed to Step 2 — report the gate failure immediately.
- Fix the failure before continuing.

**Optional i18n parity check** (run if any `packages/i18n` or locale files
were changed, or if new i18n keys were introduced):

```bash
pnpm --filter @app/i18n test
```

---

## Step 2 — Grouped adversarial review (parallel validator subagents)

Determine the changed scope:

```bash
# For staged changes (pre-commit context):
git diff --name-only --cached

# For working-tree changes (post-generation context):
git diff --name-only HEAD

# For a specific set of files already known:
# pass the list directly to each validator
```

Spawn FIVE `validator` subagents IN PARALLEL, one per GROUP. Pass each
subagent:

1. Its GROUP name (exactly as below)
2. The SCOPE (list of changed files, absolute paths)
3. The instruction to read `docs/code-standards.md` and
   `docs/error-handling.md` (if present) before starting

### Groups

| Group ID          | Focus                                                                                                                                                                                            | Vendored skills to load                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| G-standards       | Code-standards compliance: arrow-only, alias imports, file suffixes, naming, single-object params, service+adapter pairing, no magic values, no inline component defs, English-only, Prettier    | `.claude/skills/quality/SKILL.md` + `.claude/skills/pre-commit/SKILL.md` |
| G-tests           | New/changed logic has tests; `test()` not `it()`; semantic queries only; MSW for HTTP; error + loading paths tested; i18n catalog parity if new keys added                                       | `.claude/skills/test/SKILL.md` + `.claude/skills/fix-test/SKILL.md`      |
| G-security        | PII scrubbing on all monitoring sinks; no raw sensitive data in logs/toasts; security headers present; origin-lock on API routes; Turnstile on abuse-prone forms; cache-safety on user responses | `.claude/skills/security/SKILL.md`                                       |
| G-a11y-design-dod | Accessibility (interactive labels, semantic HTML, keyboard nav); design-system token adherence (dark-glass tokens, no inline colors); error-handling DoD (loading/empty/error states + boundary) | `.claude/skills/a11y/SKILL.md`                                           |
| G-fractal         | Fractal architecture per built block: folder structure (screen/component members + barrel), constants-not-inline, logic-in-hook (no business logic/useEffect/useMemo in views), service+adapter pairing, no fetch in views, tests-per-unit, suffix/naming conventions, alias imports | `.claude/skills/fractal-verify/SKILL.md`                                 |

Each validator subagent must:

1. Read `docs/code-standards.md` + `docs/error-handling.md` first (skip if not present)
2. Read its vendored skill(s) as listed above
3. Read every file in SCOPE
4. Return a structured report (see `.claude/agents/validator.md` for the format) with
   severity-tagged findings and a PASS/FAIL verdict for its group

**G-fractal scoping note**: G-fractal audits one built block at a time
(a screen folder or a component folder), not a flat file list. Derive the
distinct block roots from the changed files (the enclosing
`screens/<Name>` or `components/<Name>` folder) and pass each block root to
the validator. If more than one block changed, launch one G-fractal
validator per block (still in the same parallel batch). The validator reads
`.claude/skills/fractal-verify/SKILL.md` and follows its per-block contract.

---

## Step 3 — Synthesize and report

Aggregate all five group verdicts into a single report:

```
## Validation Report

### Gate result
pnpm validate: PASS | FAIL
{If FAIL: paste the failing command output}

### Group verdicts
| Group             | Verdict | BLOCKERs | WARNINGs | INFOs |
|-------------------|---------|----------|----------|-------|
| G-standards       | PASS/FAIL | N | N | N |
| G-tests           | PASS/FAIL | N | N | N |
| G-security        | PASS/FAIL | N | N | N |
| G-a11y-design-dod | PASS/FAIL | N | N | N |
| G-fractal         | PASS/FAIL | N | N | N |

### BLOCKERs — must fix before DONE
{List every BLOCKER from all groups, with file:line + rule + fix}
(none if clean)

### WARNINGs — should fix
{List every WARNING from all groups}
(none if clean)

### INFO
{List INFOs from all groups}
(none if clean)

---

## Overall verdict: DONE | NOT-DONE

DONE only when:
  - pnpm validate: PASS
  - Zero BLOCKERs across all groups

NOT-DONE if:
  - pnpm validate failed, OR
  - Any group returned a BLOCKER finding
```

---

## Delegation model

This skill is executed by the **orchestrator**. The orchestrator:

1. Runs `pnpm validate` inline (Step 1) — it is a single bash command.
2. Delegates Steps 2a–2e to FIVE parallel `validator` subagent instances,
   one per GROUP (G-fractal gets one instance per changed block), using the
   `Agent` tool with `model: "sonnet"`.
3. Collects all reports and synthesizes them (Step 3) inline.

Sub-agent launch template (repeat for each group, all in one parallel
message):

```
Agent(
  subagent_type: "validator",
  model: "sonnet",
  prompt: """
  GROUP: {G-standards | G-tests | G-security | G-a11y-design-dod | G-fractal}

  SCOPE (changed files):
  {absolute path list}

  Read docs/code-standards.md and docs/error-handling.md (if present) first.
  Then read the vendored skill for your group.
  Then validate only your GROUP against the SCOPE.
  Return the structured report with BLOCKER/WARNING/INFO findings
  and a PASS/FAIL verdict.
  """
)
```

For **G-fractal**, scope is a single block root (not a flat file list):

```
Agent(
  subagent_type: "validator",
  model: "sonnet",
  prompt: """
  GROUP: G-fractal
  BLOCK: {absolute path to the screen/component folder, e.g.
          apps/web/src/screens/Dashboard}

  Read docs/code-standards.md first.
  Then read .claude/skills/fractal-verify/SKILL.md and follow its
  per-block contract.
  Audit only this BLOCK. Return the fractal-verify structured report
  with BLOCKER/WARNING/INFO findings and a PASS/FAIL verdict.
  """
)
```

---

## Key files for context

- `docs/code-standards.md` — all binding rules
- `docs/error-handling.md` — error/loading/empty DoD + PII scrubbing contract (if present)
- `.claude/agents/validator.md` — validator subagent definition
- `.claude/skills/quality/SKILL.md` — quality audit
- `.claude/skills/pre-commit/SKILL.md` — pre-commit dimension checks
- `.claude/skills/test/SKILL.md` — test golden rules + type-specific patterns
- `.claude/skills/security/SKILL.md` — security checks
- `.claude/skills/a11y/SKILL.md` — accessibility audit
- `.claude/skills/fractal-verify/SKILL.md` — per-block fractal architecture audit
