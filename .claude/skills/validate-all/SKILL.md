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

## What is now deterministic

The following checks are fully covered by automated tooling and do NOT
require AI review:

- **Code standards** (naming, no-any, imports, fetch-in-views,
  logic-in-view, inline-tailwind, single-object-params, magic numbers)
  → ESLint (`eslint.rules.mjs`)
- **Fractal folder structure** → `pnpm verify:structure`
- **Service+adapter pairing** → `pnpm verify:pairing`
- **Security static analysis** (secrets in public namespaces, security
  headers, origin-lock presence, scrubPII wired at Sentry) →
  `pnpm verify:security`
- **Component-level a11y** → vitest-axe (in test suite)
- **Page-level a11y** → `@axe-core/playwright` (`e2e/axe.e2e.ts`)
- **Glass computed style** (backdrop-filter, colors, borders) →
  `e2e/glass.e2e.ts`
- **Theme sync** → `pnpm verify:theme-sync`
- **Dead exports / unused imports** → `pnpm knip`
- **Architecture map integrity + magic literals** → `pnpm verify:maps`

AI validation is scoped to the semantic residue that these tools cannot
cover. See the Groups table below.

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
- Run only **G-tests** if the changed file has a test pair; skip
  G-security and G-a11y-design-dod unless the change touches those
  areas.

For a **multi-file change** (new feature, screen, service):

- Run Step 1 always.
- Run ALL three validator groups in parallel (Step 2).

---

## Step 1 — Deterministic gate (fail-fast, always run first)

```bash
pnpm validate
```

`pnpm validate` runs the following in order:

1. `turbo run lint typecheck test build format:check` — linting (ESLint),
   type-checking, tests, Next.js build, and Prettier format check across
   all packages. Turbo respects `dependsOn`; build depends on typecheck;
   test depends on `^build`.
2. `pnpm verify:tests` (`scripts/verify-tests.mjs`) — fails if any
   `*.component.tsx` / `*.hook.ts` / `*.helper.ts` / `*.service.ts` /
   `*.adapter.ts` unit lacks a sibling `*.test.*` file. A missing test
   is a **BLOCKER**.
3. `pnpm verify:maps` (`scripts/verify-maps.mjs`) — (A) every repo path
   referenced in `docs/maps/global-map.md` must still resolve (dead
   reference = **BLOCKER**); (B) whole-tree magic-number audit — any
   stray magic number outside `*.constant.ts` / `*.styles.ts` is a
   **BLOCKER**.
4. `pnpm check:identity` — identity / branding consistency check.
5. `pnpm verify:pairing` (`scripts/verify-pairing.mjs`) — every
   `*.service.ts` must have a paired `*.adapter.ts` and vice-versa.
   Unpaired file = **BLOCKER**.
6. `pnpm verify:structure` (`scripts/verify-structure.mjs`) — fractal
   folder structure correctness. Structural violation = **BLOCKER**.
7. `pnpm verify:security` (`scripts/verify-security-static.mjs`) —
   static security checks: secrets in `NEXT_PUBLIC_` / `EXPO_PUBLIC_`
   namespaces, required security headers present, `assertTrustedOrigin`
   wired in middleware, `scrubPII` wired at Sentry `beforeSend`.
   Any failure = **BLOCKER**.
8. `pnpm verify:theme-sync` — design-token / theme synchronization check.
9. `pnpm --filter @app/i18n test` — i18n catalog parity tests.
10. `pnpm knip` — dead exports and unused imports audit.

**If this step fails:**

- Capture the full output.
- The failing task is an automatic **BLOCKER**.
- Do NOT proceed to Step 2 — report the gate failure immediately.
- Fix the failure before continuing.

---

## E2E gates (run separately, not inside `pnpm validate`)

```bash
pnpm test:e2e
```

Boots `next start` via Playwright `webServer` (requires a prior build).
Key suites:

- `e2e/glass.e2e.ts` — asserts glass-card computed style matches the
  locked recipe (backdrop-filter, background-color, border, box-shadow).
  Deterministic; replaces any AI "glass looks right" check.
- `e2e/axe.e2e.ts` — `@axe-core/playwright` page-level a11y: zero
  violations across key pages with `color-contrast` + `aria-roles` rules.
- `e2e/home.e2e.ts` and other integration suites.

Visual regression (opt-in):

```bash
E2E_VISUAL=1 pnpm test:e2e:visual
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

Spawn THREE `validator` subagents IN PARALLEL, one per GROUP. Pass each
subagent:

1. Its GROUP name (exactly as below)
2. The SCOPE (list of changed files, absolute paths)
3. The instruction to read `docs/code-standards.md` and
   `docs/error-handling.md` (if present) before starting

### Groups

| Group ID          | Focus                                                                                                                                                      | Vendored skills to load                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| G-tests           | New/changed logic has tests; `test()` not `it()`; semantic queries only; MSW for HTTP; error + loading paths tested; i18n catalog parity if new keys added | `.claude/skills/test/SKILL.md` + `.claude/skills/fix-test/SKILL.md` |
| G-security        | RLS actually enforced server-side (not client-bypassed); abuse-prone forms that need Turnstile judgment                                                    | `.claude/skills/security/SKILL.md`                                  |
| G-a11y-design-dod | Qualitative design quality: is the UI genuinely on-brand / good? Does it meet the visual intent of the dark-glass design system?                           | `.claude/skills/a11y/SKILL.md`                                      |

Each validator subagent must:

1. Read `docs/code-standards.md` + `docs/error-handling.md` first (skip if not present)
2. Read its vendored skill(s) as listed above
3. Read every file in SCOPE
4. Return a structured report (see `.claude/agents/validator.md` for the format) with
   severity-tagged findings and a PASS/FAIL verdict for its group

---

## Step 3 — Synthesize and report

Aggregate all three group verdicts into a single report:

```
## Validation Report

### Gate result
pnpm validate: PASS | FAIL
{If FAIL: paste the failing command output}

### Group verdicts
| Group             | Verdict | BLOCKERs | WARNINGs | INFOs |
|-------------------|---------|----------|----------|-------|
| G-tests           | PASS/FAIL | N | N | N |
| G-security        | PASS/FAIL | N | N | N |
| G-a11y-design-dod | PASS/FAIL | N | N | N |

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
2. Delegates Steps 2a–2c to THREE parallel `validator` subagent instances,
   one per GROUP, using the `Agent` tool with `model: "sonnet"`.
3. Collects all reports and synthesizes them (Step 3) inline.

Sub-agent launch template (repeat for each group, all in one parallel
message):

```
Agent(
  subagent_type: "validator",
  model: "sonnet",
  prompt: """
  GROUP: {G-tests | G-security | G-a11y-design-dod}

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

---

## Key files for context

- `docs/code-standards.md` — all binding rules
- `docs/error-handling.md` — error/loading/empty DoD + PII scrubbing contract (if present)
- `.claude/agents/validator.md` — validator subagent definition
- `.claude/skills/test/SKILL.md` — test golden rules + type-specific patterns
- `.claude/skills/security/SKILL.md` — security checks
- `.claude/skills/a11y/SKILL.md` — accessibility audit
