---
name: general-plan
description: >
  Produce or refresh a project's single source-of-truth planning document at
  docs/GENERAL_PLAN.md — a handoff-grade snapshot that lets any owner or fresh
  agent grok the product, trust the baseline, and pick up mid-stream. Captures
  product vision/scope, exact stack & architecture, what is DONE (with technical
  evidence and a REAL-vs-MOCK service distinction), the prioritized PENDING
  backlog (effort sizing + BLOCKING markers), what is NEEDED FROM THE OWNER
  (credentials/env/product/legal), a gated path to launch, conventions & gotchas,
  and risks. Fills DONE/PENDING from the project's REAL current state (code,
  migrations, commits) — never from feel.
  USE WHEN: "general plan", "GENERAL_PLAN.md", "project plan doc", "status of the
  project", "what's done / what's pending", "where does the project stand",
  "refresh the plan", "handoff doc", "what do we need from the owner", "path to
  launch", "build plan".
  DO NOT USE: structuring a brand-new idea with no code yet (use product-discovery),
  a single feature spec, or pure architecture/code tasks.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Use to author or refresh `docs/GENERAL_PLAN.md`: the one document a fresh agent
or the owner reads to understand what the product is, where it stands, what is
truly built, what is left, what only the human can unblock, and how it ships.

It is grounded in the project's REAL current state — you read code, migrations,
package manifests, and commit history to fill DONE and PENDING with technical
detail, not optimistic guesses.

Skip for: a greenfield idea with no code (use `product-discovery` first), a
single-feature spec, or pure refactor/code tasks.

## Canonical Output

- **Path (fixed):** `docs/GENERAL_PLAN.md` — always this path, one per repo.
- **Template:** `general-plan.template.md` (next to this SKILL.md).
- **Validator:** `validate-general-plan.mjs` — must exit 0 before done.

## Hard Rules

- **One doc, fixed path.** Never fork it into `PLAN-v2.md`; refresh in place.
- **Evidence over feel.** Every DONE claim cites a file, migration, table, or
  commit. Every PENDING row names the concrete objects to build (files, tables,
  RPCs, endpoints) — not "finish the dashboard".
- **REAL vs MOCK is mandatory.** In the DONE services list, mark each service
  REAL (wired to its real backend/adapter) or MOCK (returns fixtures). This is
  the single most handoff-critical signal: it exposes screens that look built
  but are not wired.
- **Quantify the snapshot.** Base Built-% on counted units where possible
  (e.g. "13 of 33 views"), so the status reads as fact, not vibes.
- **Don't dump owner asks into one giant table.** Group NEEDS FROM OWNER into
  Accounts/credentials · Env files · Product decisions · Legal/compliance. Each
  credential row names the env vars and the target `.env` file it lands in.
- **Secrets discipline.** Admin/server secrets NEVER go in `NEXT_PUBLIC_` /
  `EXPO_PUBLIC_` namespaces; say so explicitly where credentials are listed.
- **Gotchas live in their own section**, not buried inside Risks. A gotcha is a
  confirmed bug/edge case with root cause + fix; a risk is a future threat to
  the plan. Different readers, different moments.
- **Auditable stack.** The versions table carries a `Source` column pointing at
  where each version is declared (package.json, app.json, etc.).
- **Doc language:** planning prose may be neutral/professional Spanish if that
  is the project's product-doc language; code, identifiers, file paths, env var
  names, and UI labels stay in English/their real form. Never inject slang.
- **Required vs optional sections:** keep all REQUIRED headings even if a
  subsection is "none yet"; drop OPTIONAL ones only when the project genuinely
  has nothing for them.

## Required vs Optional Sections

Required (must be present and non-trivial):

- Header & Snapshot
- Status Snapshot
- Product Vision & Scope
- Current Stack & Architecture
- What's DONE (with technical evidence)
- What's PENDING (the agent's backlog)
- NEEDS FROM OWNER (blockers the agent cannot resolve)
- Path to Launch (gated roadmap)
- Technical Details, Conventions & Gotchas
- Risks & Open Decisions

Optional (keep only if the project has content):

- Locked Decisions & ADRs
- Agent Build Plan (ordered) — skip if PENDING is already strictly phase-ordered
- Agent-Blocking Decisions — fold into NEEDS FROM OWNER if there are few

## Standard Section Structure

Use these `##` headings, in this order (mirrors the template file):

1. **Header & Snapshot** — one-line product description + a dated blockquote
   (as-of date, full-stack one-liner, namespace, the single most important
   baseline fact e.g. "`pnpm validate` is GREEN, N tests"). Then a short list of
   authoritative source docs that win on conflict.
2. **Status Snapshot** — one table: `Area | Built % | State note`, covering
   foundation, DB/backend, design system, screens (per surface), services,
   connectors, security, CI. Quantify from counted units.
3. **Product Vision & Scope** — core loop in 2–3 verbs, value prop /
   differentiator, market + locale + currency, target users/roles, MVP IN,
   MVP OUT, explicit non-goals.
4. **Current Stack & Architecture** — exact versions table with a `Source`
   column; monorepo namespace + folder tree; the validation gate command and
   its state; ports/adapters seam summary; recent modernization note.
5. **What's DONE (with technical evidence)** — by layer: DB (migration-by-
   migration table with filenames + contents), services (with a REAL/MOCK
   column), design system/components, screens (disk paths + ✓/◑/○ markers),
   infra/CI. Note any doc-drift found and whether it is agent-fixable.
6. **Locked Decisions & ADRs** *(optional)* — numbered D1, D2… with a one-line
   rationale and links to ADRs/discovery docs.
7. **What's PENDING (the agent's backlog)** — by phase or area; every row has
   technical detail, effort size (S/M/L), a 🔴 BLOCKING marker for launch-
   critical items, and any ⛔ blocked-by dependency. Call out schema-blocked /
   not-just-UI gaps with the exact missing objects.
8. **Agent Build Plan (ordered)** *(optional)* — numbered table
   `# | Task | Layer | Depends on`.
9. **NEEDS FROM OWNER (blockers the agent cannot resolve)** — four subsections:
   (1) Accounts & credentials (`item | env vars | target .env file | what it
   blocks`), (2) Env files (exact key names per file), (3) Product decisions,
   (4) Legal/compliance (separate the code chokepoint from the non-code legal
   blocker).
10. **Agent-Blocking Decisions** *(optional)* — `question | module/phase | risk
    if unanswered` for technical forks the agent needs steered.
11. **Path to Launch (gated roadmap)** — ordered GATEs; each states its content
    (mapped to backlog items), what it unlocks, and a validation checkpoint
    that must pass before the next gate. Mark owner-driven gates as parallel/
    blocking.
12. **Technical Details, Conventions & Gotchas** — env/secrets layout (which
    framework reads which file), coding conventions, validation-gate breakdown,
    and confirmed GOTCHAS with root cause + fix.
13. **Risks & Open Decisions** — numbered risk table (R1, R2…) with severity +
    mitigation, cross-referenced from dependent phases; then a short list of
    still-open decisions with an owner column.

The template also includes a `## Necesito del usuario / Needs from user`
bilingual anchor for section 9 so Spanish-language product docs read naturally.

## Execution Steps

Run in order. Reading code is the point — do not write the doc from memory.

1. **Locate & seed.** Check for an existing `docs/GENERAL_PLAN.md`. If present,
   you are REFRESHING (preserve owner-authored vision/decisions, update the
   factual sections). If absent, copy `general-plan.template.md` to
   `docs/GENERAL_PLAN.md` and fill the frontmatter (`project`, `last_updated`
   = today, `status`).
2. **Establish the baseline fact.** Run the project's validation gate (e.g.
   `pnpm validate`) and record GREEN/RED + test count in the Header snapshot.
   This is the trust anchor for everything below.
3. **Read the stack truth.** Parse `package.json`/`app.json`/lockfile for exact
   versions; fill the versions table with a `Source` per row. Capture the
   monorepo namespace and folder tree.
4. **Inventory DONE with evidence.** Walk migrations (list each file + what it
   creates), services/adapters (REAL vs MOCK — open the adapter to confirm it
   talks to a real backend, not fixtures), components, and screens (disk paths
   + ✓/◑/○). Use `rg`/`fd`/`bat`/`eza`, never `cat`/`grep`/`find`/`ls`.
5. **Quantify the Status Snapshot.** Convert the inventory into counted Built-%
   per area (e.g. screens built / screens total).
6. **Derive PENDING from the gap.** Everything the product needs that the
   inventory did not find becomes a backlog row with technical detail, S/M/L,
   🔴 BLOCKING, and ⛔ dependencies. Flag schema-blocked items explicitly.
7. **Separate the blockers.** Sort what only the human can supply into the four
   NEEDS FROM OWNER subsections; sort technical forks into Agent-Blocking
   Decisions (or fold them into owner asks if few).
8. **Sequence the gates.** Order PENDING into hard GATEs with a validation
   checkpoint per gate; mark owner-driven gates parallel/blocking.
9. **Preserve the tacit knowledge.** Mine commits/PRs/code comments for
   confirmed gotchas (root cause + fix) and conventions; capture risks (R1…)
   cross-referenced from the phases they threaten.
10. **Validate and keep green.** Run the validator and fix any FAIL line:

    ```bash
    node .claude/skills/general-plan/validate-general-plan.mjs docs/GENERAL_PLAN.md
    ```

    The doc is not done until the validator prints all PASS and exits 0. On a
    refresh, bump `last_updated` to today.

## DO vs DON'T

| DO | DON'T |
|---|---|
| Keep one doc at `docs/GENERAL_PLAN.md`, refreshed in place | Fork `PLAN-final.md`, `PLAN-v2.md` |
| Cite a file/migration/commit for every DONE claim | Mark things done from memory or optimism |
| Mark each service REAL or MOCK | Trust a screen because its UI exists |
| Quantify Built-% from counted units | Write "mostly done" / "~80%" by feel |
| Group owner asks into 4 subsections with target `.env` | Dump 30 owner items into one flat table |
| Put gotchas in their own section with root cause + fix | Bury gotchas inside the risk table |
| Add a `Source` column to the versions table | List versions with no provenance |
| Keep secrets out of `NEXT_PUBLIC_`/`EXPO_PUBLIC_` | Suggest admin keys in public env namespaces |
| Run the validator and leave it green | Call it done with the validator red |

## References

- `general-plan.template.md` — copy-paste skeleton, all section headings with
  inline guidance comments.
- `validate-general-plan.mjs` — zero-dep structural validator.
