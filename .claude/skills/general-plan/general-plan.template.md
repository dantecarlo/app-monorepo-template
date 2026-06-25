---
project: <project-slug>
last_updated: <YYYY-MM-DD>
status: <planning | in-progress | launch-ready | shipped>
---

<!--
  This is the single source-of-truth plan for the project. One file per repo,
  always at docs/GENERAL_PLAN.md. Refresh it in place; never fork it.
  Prose may be neutral Spanish if that's the product-doc language; code,
  identifiers, paths, env var names, and UI labels stay English/real form.
  Validate with: node .claude/skills/general-plan/validate-general-plan.mjs docs/GENERAL_PLAN.md
-->

# <Product Name> — General Plan

<!--
  HEADER & SNAPSHOT — let any reader grok the product and where it stands in
  under 30s. One-line product description, then the dated blockquote, then the
  authoritative-source-docs list (these win on conflict).
-->

One-line description of what the product is and who it's for.

> **As of <YYYY-MM-DD>** · Stack: <full-stack one-liner> · Namespace: `@app/<ns>`
> · Baseline: <single most important fact, e.g. `pnpm validate` is GREEN, N tests>.

**Authoritative source docs** (win on conflict with this plan):

- `docs/architecture/*.md` — architecture contract
- `docs/code-standards.md` — binding rules
- `<other canonical doc>` — <what it governs>

## Status Snapshot

<!--
  Quantified, scannable triage table. Base Built-% on COUNTED units where
  possible (e.g. "13 of 33 views") so it reads as fact, not feel.
-->

| Area | Built % | State note |
|---|---|---|
| Foundation / monorepo |  |  |
| DB / backend |  |  |
| Design system |  |  |
| Screens — <surface A> |  | _N of M_ |
| Screens — <surface B> |  | _N of M_ |
| Services |  | _REAL vs MOCK split_ |
| Connectors / integrations |  |  |
| Security |  |  |
| CI / validation gate |  |  |

## Product Vision & Scope

<!--
  Anchor every technical decision in product intent. Keep product-level but
  concrete.
-->

- **What it is** — core loop in 2–3 verbs.
- **Value proposition** — differentiator vs <competitor/alternative>.
- **Market / locale / currency** — <market>, `<locale>`, `<currency>`.

**Target users / roles**

| Role | What they do |
|---|---|
|  |  |

- **MVP IN** — <smallest thing that proves value>.
- **MVP OUT** — <deferred / pluggable>.
- **Non-goals** — <explicitly not building>.

## Current Stack & Architecture

<!--
  Exact, verifiable ground truth. The Source column makes every version claim
  auditable.
-->

| Layer | Technology | Version | Source |
|---|---|---|---|
| Runtime |  |  | `package.json` |
| Web |  |  | `apps/web/package.json` |
| Mobile |  |  | `apps/mobile/app.json` |
| DB / Auth |  |  | `<file>` |

- **Namespace:** `@app/<ns>`
- **Folder layout:**

  ```
  apps/
    web/
    mobile/
  packages/
    core/        # domain — zero framework imports
    ...
  ```

- **Validation gate:** `<command>` — current state: <GREEN | RED>.
- **Ports/adapters seam:** <one-line summary of the seam and how it's enforced>.
- **Recent modernization:** <note, if relevant>.

## What's DONE (with technical evidence)

<!--
  Record what is actually built and wired, with evidence, so a fresh agent
  trusts the baseline and doesn't rebuild it. The REAL-vs-MOCK column on
  services is the most handoff-critical signal in this whole doc.
-->

**Database (migration-by-migration)**

| Migration file | Creates / changes |
|---|---|
| `<NNNN_name>.sql` | <tables / columns / RLS / RPCs> |

**Services**

| Service | Port file | Adapter | REAL / MOCK |
|---|---|---|---|
| `<Name>Service` | `*.service.ts` | `*.adapter.ts` | REAL · MOCK |

**Design system / components**

| Component | Path | Status |
|---|---|---|
|  | `components/...` | ✓ / ◑ / ○ |

**Screens**

| Screen | Path | Status |
|---|---|---|
|  | `apps/.../screens/...` | ✓ / ◑ / ○ |

**Infra / CI** — <what is wired (Vercel, Supabase, CI jobs) and its state>.

**Doc drift found** — <discrepancies between docs and reality; note whether
agent-fixable or an owner call>.

## Locked Decisions & ADRs

<!-- OPTIONAL. Numbered locked decisions with one-line rationale + ADR links. -->

- **D1** — <decision>. Rationale: <one line>. → `<adr/discovery link>`
- **D2** — <decision>. Rationale: <one line>.

## What's PENDING (the agent's backlog)

<!--
  The heart of the doc. Organize by phase or area. Every row: technical detail
  (files, tables, RPCs, endpoints), effort S/M/L, 🔴 BLOCKING for launch-
  critical items, ⛔ blocked-by dependency. Call out schema-blocked / not-just-
  UI gaps with the exact missing objects.
-->

### Phase / Area: <name>

| Item | Technical detail | Size | Flags |
|---|---|---|---|
| <task> | <files / tables / RPCs / endpoints> | S/M/L | 🔴 BLOCKING · ⛔ <dep> |

**Schema-blocked gaps** — <items that need missing DB objects, with the exact
tables/columns/RPCs to add — not just UI>.

## Agent Build Plan (ordered)

<!--
  OPTIONAL — skip if PENDING above is already strictly phase-ordered. The
  "what I'll do next, in order" view, with explicit dependencies.
-->

| # | Task | Layer | Depends on |
|---|---|---|---|
| 1 |  |  | — |
| 2 |  |  | 1 |

## Necesito del usuario / Needs from user

<!--
  NEEDS FROM OWNER — the credentials, decisions, content, and legal items only
  the human can supply. Do NOT collapse into one giant table — keep the four
  subsections. Never put admin/server secrets in NEXT_PUBLIC_/EXPO_PUBLIC_.
-->

### 1. Accounts & credentials

| Item | Env vars involved | Target `.env` file | Blocks |
|---|---|---|---|
| <e.g. Supabase project> | `SUPABASE_*` | `packages/supabase/.env` | <what it blocks> |

> Server/admin secrets must never live in `NEXT_PUBLIC_` / `EXPO_PUBLIC_`.

### 2. Env files (exact keys)

- `apps/web/.env.local` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, …
- `apps/mobile/.env` — `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, …
- `packages/supabase/.env` — `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, …

### 3. Product decisions (owner only)

- <decision the owner must make>

### 4. Legal / compliance

- **Code chokepoint (in scope now):** <e.g. consent gate, retention switch>.
- **Non-code legal blocker (owner):** <e.g. ToS, privacy policy, DPA>.

## Agent-Blocking Decisions

<!--
  OPTIONAL — technical forks the agent surfaces but may need steered. Fold into
  Needs-from-user if there are only a couple.
-->

| Question | Module / phase | Risk if unanswered |
|---|---|---|
| <e.g. AVIF+WebP vs WebP only> | <phase> | <risk> |

## Path to Launch (gated roadmap)

<!--
  Hard, ordered gates so launch readiness is unambiguous. Each gate: its content
  (mapped to backlog items), what it unlocks, and a validation checkpoint that
  MUST pass before the next gate. Mark owner-driven gates parallel/blocking.
-->

| Gate | Content (backlog items) | Unlocks | Checkpoint |
|---|---|---|---|
| GATE 0 | <foundation items> | <what> | `<validate>` green |
| GATE 1 |  |  | `<validate-all>` |
| GATE 2 |  |  | `<runtime-verify>` |

> Owner-driven gates (legal, live prices): <parallel / blocking> — <which>.

## Technical Details, Conventions & Gotchas

<!--
  The section a future agent greps first when something breaks. Preserve the
  non-obvious knowledge. Gotchas carry ROOT CAUSE + FIX.
-->

**Env / secrets layout** — which framework reads which file (see Needs-from-user §2).

**Coding conventions** — service+adapter pairing, never fetch in components,
naming/suffixes, max file size, etc.

**Validation gate breakdown** — what `<command>` runs, step by step.

**Confirmed gotchas**

| Gotcha | Root cause | Fix |
|---|---|---|
| <symptom> | <why it happens> | <the fix that worked> |

## Risks & Open Decisions

<!--
  Things that THREATEN the plan (distinct from Needs-from-user, which is things
  we need handed to us). Cross-reference risks from the phases that depend on
  them.
-->

| # | Risk | Severity | Mitigation | Referenced by |
|---|---|---|---|---|
| R1 |  | High/Med/Low |  | <phase/gate> |
| R2 |  |  |  |  |

**Still-open decisions**

| Decision | Owner |
|---|---|
|  |  |
