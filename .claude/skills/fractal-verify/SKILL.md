---
name: fractal-verify
description: >
  Audit a single built block (screen or component) against the fractal /
  clean architecture contract: folder structure, constants-not-inline,
  logic-in-hook, service+adapter pairing, no fetch in components,
  tests-per-unit, naming + suffix conventions, and alias imports.
  Returns severity-tagged findings (BLOCKER / WARNING / INFO) and a
  PASS / FAIL verdict for the block. Read-only — never edits files.
  USE WHEN: "verify this screen", "check the component architecture",
  "is this block fractal-compliant", "audit the fractal structure of [X]",
  validating a freshly scaffolded screen/component before commit, or as the
  G-fractal group inside the validate-all harness.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

# fractal-verify — Fractal Architecture Audit

Audit ONE built block — a **screen** or a **component** — against the
fractal / clean architecture contract. You verify structure and layering,
not behavior. You are read-only: never edit, write, or delete files.

> The full binding rules live in `docs/code-standards.md`. This skill
> encodes the **fractal-specific** subset and the per-block structure
> contract. When a check maps to a numbered rule, cite it.

---

## Inputs

- **BLOCK**: the absolute path to the block's root folder (e.g.
  `apps/web/src/screens/Dashboard`) OR a single file inside it. If given a
  file, resolve to the enclosing block folder before auditing.
- **KIND** (optional): `screen` or `component`. If omitted, infer from the
  folder: presence of a `*.screen.tsx` → screen; a `*.component.tsx` →
  component.

---

## Step 0 — Load context (REQUIRED before any analysis)

1. Read `docs/code-standards.md` — binding for suffixes, naming, imports.
2. Read the block folder tree:
   ```bash
   eza -RT -a <BLOCK_ROOT>
   ```
   (fall back to `fd -t f . <BLOCK_ROOT>` if `eza` is unavailable).
3. Read every source file in the block. Do not assume a file is clean
   without reading it.

---

## Step 1 — Structure contract

### Screen block

A screen folder MUST contain:

| Member          | Required | Notes                                                       |
| --------------- | -------- | ----------------------------------------------------------- |
| `*.screen.tsx`  | yes      | the container; owns layout + composition                    |
| `*.styles.ts`   | yes\*    | Tailwind class constants (\*or a `*.constant.ts` for styles) |
| `index.ts`      | yes      | barrel — single public entry point                          |
| `components/`   | when ≥1  | private presentational components of this screen            |
| `hooks/`        | when ≥1  | logic hooks (`use*.hook.ts(x)`)                             |
| `models/`       | when ≥1  | block-local `*.type.ts` (+ optional `*.constant.ts`)       |

A screen MAY also have `services/` (`*.service.ts` + `*.adapter.ts`) when it
owns its own data layer.

### Component block

A component folder MUST contain:

| Member            | Required | Notes                                          |
| ----------------- | -------- | ---------------------------------------------- |
| `*.component.tsx` | yes      | presentational; no data fetching               |
| `*.styles.ts`     | yes      | Tailwind class constants                       |
| `index.ts`        | yes      | barrel — single public entry point             |

A component MAY have a sibling `*.hook.ts(x)`, `*.type.ts`, and
`*.test.tsx`.

**Findings**

- Missing `*.screen.tsx` / `*.component.tsx` → **BLOCKER**.
- Missing `index.ts` barrel → **BLOCKER**.
- Missing styles file (`*.styles.ts` or styles `*.constant.ts`) →
  **WARNING** (BLOCKER if the screen/component file contains inline class
  strings — see Step 2).
- Logic hooks placed at the block root instead of `hooks/` when the block
  has multiple → **WARNING**.
- Block-local types defined inline in `.screen`/`.component` instead of
  `models/` / `*.type.ts` → **WARNING**.

---

## Step 2 — Constants, not inline

In `*.screen.tsx` and `*.component.tsx`:

- **No inline Tailwind class strings** in JSX `className`. Class strings
  belong in the `*.styles.ts` constant and are referenced by name.
  Inline `className="flex gap-2 ..."` → **BLOCKER** (Rule 7, magic strings).
- **No magic numbers / string literals** used as config, labels, limits,
  keys, or URLs. They belong in a `*.constant.ts` (or i18n catalog for
  user-facing copy) → **BLOCKER**.
- User-facing copy hardcoded instead of pulled from the i18n catalog →
  **BLOCKER**.

A single inline literal that is genuinely structural (e.g. `key={item.id}`)
is fine — do not flag identifiers, `key` props, or boolean/`null` literals.

---

## Step 3 — Logic in hook, not in the view

`*.screen.tsx` and `*.component.tsx` must be thin. Flag in the view file:

- `useEffect`, `useMemo`, `useCallback`, `useState` carrying business or
  derived logic → **BLOCKER**. Move it into a `use*.hook.ts(x)`.
- Data transformation, filtering, sorting, or computation inline in the
  render body → **BLOCKER**.
- Inline event-handler bodies with non-trivial logic (more than a direct
  call/dispatch) → **WARNING** (extract to the hook).
- Direct store reads/writes with logic in the view → **WARNING**.

The view may call exactly one block hook (e.g. `const vm = useDashboard()`)
and render its return. Presentational components receive everything via
props.

---

## Step 4 — Service + Adapter pairing & no fetch in views

- Every `*.service.ts` in the block MUST have a paired `*.adapter.ts`
  (and vice-versa). Orphan service or adapter → **BLOCKER** (Rule 6).
- `fetch(` (or any raw HTTP client) called inside a `*.screen.tsx`,
  `*.component.tsx`, or a hook → **BLOCKER**. Data goes through a service
  function; the view/hook consumes it via `useAppQuery` / `useAppMutation`.
- A screen that fetches data but does not go through a service layer →
  **BLOCKER**.

```bash
rg -n 'fetch\(' <BLOCK_ROOT> --glob '*.screen.tsx' --glob '*.component.tsx' --glob '*.hook.ts*'
```

### Services folder-grouping audit (global `src/services/`)

When auditing shared services (not screen-local ones), also check:

- Any `.service.ts` or `.adapter.ts` found directly under `src/services/`
  (i.e. **not** inside a `src/services/<Domain>/` subfolder) →
  **BLOCKER**: services must be grouped in a PascalCase domain folder.
- Each `src/services/<Domain>/` folder must contain an `index.ts` barrel.
  Missing barrel → **BLOCKER**.
- The barrel must re-export service functions and adapter functions only.
  Constants or test utilities re-exported from the barrel → **WARNING**.

```bash
# Flag any service/adapter files at the flat services root (should be 0):
fd -t f '\.(service|adapter)\.ts$' src/services --max-depth 1

# Check each Domain folder has an index.ts barrel:
fd -t d . src/services --max-depth 1 | while read d; do
  [ -f "$d/index.ts" ] || echo "Missing barrel: $d"
done
```

---

## Step 5 — Tests per unit

Every logic-bearing unit in the block MUST have a sibling test:

- `*.component.tsx` → `*.test.tsx`
- `use*.hook.ts(x)` → `*.hook.test.ts(x)` (or sibling `*.test.ts(x)`)
- `*.service.ts` → `*.test.ts`
- `*.adapter.ts` → `*.test.ts`
- `*.helper.ts` → `*.test.ts`

A `*.screen.tsx` SHOULD have a test; missing screen test → **WARNING**.
Any missing test for component / hook / service / adapter / helper →
**BLOCKER** (mirrors `pnpm verify:tests`).

```bash
fd -t f '\.(component|hook|service|adapter|helper)\.tsx?$' <BLOCK_ROOT>
```

For each hit, confirm a matching `*.test.*` sibling exists.

---

## Step 6 — Naming, suffixes & alias imports

Cite `docs/code-standards.md` rule numbers.

- **Suffixes (Rule 3)**: every file uses the correct suffix from the table
  (`.screen.tsx`, `.component.tsx`, `.hook.tsx`, `.service.ts`,
  `.adapter.ts`, `.type.ts`, `.constant.ts`, `.styles.ts`, `.test.tsx`).
  Wrong or missing suffix → **BLOCKER**.
- **Naming (Rule 4)**: interfaces `I{Name}`, type aliases `{Name}Type`,
  enums `{Name}Enum`, constants `ALL_CAPS_BY_PURPOSE`. Violations →
  **BLOCKER**.
- **Alias imports (Rule 2)**: only `@/*` and `@app/*`; `../` is banned
  everywhere except inside a barrel `index.ts`. Any `../` outside a barrel →
  **BLOCKER**. `./` is allowed only inside the barrel re-exporting siblings.
  ```bash
  rg -n "from '\.\./" <BLOCK_ROOT> --glob '!**/index.ts'
  ```
- **Single named export per component/screen file** — no default exports,
  no multiple components in one file → **BLOCKER**.
- **Inline component definitions** — a component declared inside another
  component → **BLOCKER**.
- **English-only (Rule 15)** identifiers, comments, file names →
  **BLOCKER** if violated.

---

## Step 7 — Output format

Return ONLY the structured report. No prose outside it.

```
## fractal-verify Report — {block name} ({KIND})

### Scope
{block root path}
{files reviewed}

### Findings

#### BLOCKER — must fix (fails the block)
- [{file}:{line}] {check} ({rule ref}): {what was found} → {required fix}
  (none if clean)

#### WARNING — should fix (does not fail)
- [{file}:{line}] {check}: {what was found} → {recommended fix}
  (none if clean)

#### INFO — advisory
- [{file}:{line}] {observation}
  (none if clean)

### Verdict
{block name}: PASS | FAIL

FAIL if any BLOCKER exists. PASS if zero BLOCKERs.
```

---

## Severity classification

| Severity | Criteria                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BLOCKER  | Missing required structure member; inline classes/magic values; business logic in the view; broken service+adapter pairing; fetch in view/hook; missing required test; wrong suffix/naming; relative import outside a barrel |
| WARNING  | Missing screen test; hooks/types not foldered when they should be; non-trivial inline handler; missing styles file without inline classes                              |
| INFO     | Style nudge; minor naming inconsistency; suggestion to extract a constant or split a file                                                                              |

---

## Constraints

- **Read-only**: never edit, write, or delete any file.
- **One block per run**: audit a single screen or component. For a whole
  feature, run once per built block.
- **Cite every finding** with a file path + line number; confirm with a
  `Read` or `rg` result before reporting. Do not fabricate violations — if
  you cannot confirm it, omit it.
- This skill validates **fractal structure and layering only**. Code-style,
  tests-quality, security, and a11y are covered by the other validate-all
  groups (G-standards, G-tests, G-security, G-a11y-design-dod).

---

## Key files for context

- `docs/code-standards.md` — binding rules (suffixes, naming, imports)
- `.claude/agents/validator.md` — sibling validator subagent format
- `.claude/skills/validate-all/SKILL.md` — the harness that runs this as the
  G-fractal group
