---
name: product-discovery
description: >
  Turn a raw product/app idea into a buildable plan BEFORE architecture or code:
  product thinking, locked decisions, scope/MVP, monetization, screens, the full
  screens↔services↔data↔components decomposition into one general map, plus a
  launch-readiness checklist (what it takes to ship).
  USE WHEN: "structure a product idea", "PRD", "MVP scope", "user flows",
  "monetization/economy", "screen inventory", "components map", "services map",
  "data model", "db schema", "decompose the product into software", "general map",
  "launch readiness", "what do we need to launch", "go-to-market checklist".
  DO NOT USE: a single feature, pure architecture/code tasks, or trivial changes
  (use feature/component/service skills for those).
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.2"
---

## Activation Contract

Use to take a raw product/app idea and structure it into a buildable plan, BEFORE
architecture or code. Covers product definition, locked decisions, scope,
monetization, screens, the full views↔services↔data↔components map, and the
launch-readiness checklist (what it takes to ship).

Skip for: a single feature, pure technical/architecture tasks, or trivial changes.

## Hard Rules

- Ask ONE focused question at a time, then STOP and wait.
- Recommend a choice with its tradeoffs; never dump option menus.
- MVP-first: cut to the smallest thing that proves value; defer the rest as post-MVP.
- Verify market/tech/pricing claims (web) before asserting; correct the user with evidence.
- Proactively surface risks: legal/ToS, fraud/abuse, privacy, cost, cold-start.
- Persist every decision as an artifact immediately; keep docs coherent across phases.
- **Locked decisions**: once a product decision is made it goes to PRD §4 and is NOT
  reopened without an explicit, logged justification. New ideas → post-MVP, not churn.
- **Stable codes**: every owned service, managed service, and component gets a 3–4
  letter code, stable and unique, reused verbatim across ALL maps so any table
  cross-references cleanly. Screens use their catalog IDs.
- **Fractal cut rule (components)**: a part shared by ≥2 views is transversal (root
  `components/`); a part used by ONE view is screen-local (`screens/<S>/components/`).
- **Data model**: derive the schema from the domain (PRD §10) + the owned services;
  split conceptual (entities/relations/access) from physical (tables/keys/indexes/RLS).
  Every owned service maps to the tables it owns/reads/writes (service↔DB map).
- **Status column**: services and components carry `✓ exists · ○ to build` so the map
  doubles as a build checklist.
- **Launch readiness**: surface go-live requirements during discovery (legal,
  payments-live, analytics, observability, security, release, support, GTM) so none
  of them block launch as a late surprise.
- **Doc language**: prose/headers follow the project's doc language; screen names stay
  in the product's real UI locale (they are the literal labels). Default English prose.
- Discovery only — do NOT write code or design architecture here.
- Conversational tone in chat; artifacts stay neutral/professional, no slang.

## Decision Gates

| Situation | Action |
|---|---|
| Requirement ambiguous, can't infer | Ask ONE targeted question |
| ≥2 viable approaches, real tradeoffs | Recommend one + list tradeoffs |
| Market/tech/price claim | Verify (web) before stating |
| Scope inflating | Push to MVP; log extras as post-MVP |
| Out-of-scope idea appears | Capture as post-MVP, continue |
| Decision already made | Treat as locked (PRD §4); reopen only with logged justification |
| Economy/pricing set | Coherence check — no path cannibalizes another |
| A part appears in ≥2 views | Promote to transversal; give it a code |
| A view needs a bespoke part | Keep it screen-local; list under that view |
| An owned service persists data | Define its table(s) + access/RLS; add it to the service↔DB map |
| A go-live requirement appears (legal/billing/analytics/ops) | Log it in LAUNCH.md with owner + status |

## Execution Steps

Run in order; each phase = ask gating questions → recommend → write the artifact →
confirm → advance. Use `assets/templates.md` skeletons. Phases 1–5 define WHAT the
product is; phases 6–9 decompose it into WHAT TO BUILD (services → data → components →
map); phase 10 captures WHAT IT TAKES TO SHIP.

1. **PRD** — vision, problem, users, **locked product decisions**, MVP scope + no-goals,
   business rules, monetization, risks, phased roadmap.
2. **User flows** — key journeys step by step (onboarding → core loop → contribution → …).
3. **Economy** (if monetized) — currency, prices, earn/spend, plans; verify coherence.
4. **Considerations sweep** — gap analysis: legal/ToS, fraud, privacy, content modeling,
   ops/admin, analytics, cost; resolve each. Feeds the launch-readiness checklist (phase 10).
5. **Screen inventory** — all views grouped by area/surface; each with purpose, one-line
   **scope + free/paid gating**. Assign each view a stable ID.
6. **Views↔services map** — owned modules (to build) vs managed/SaaS (to integrate) with
   3–4 letter codes + status; map each view → services.
7. **Data model & DB schema** — derive from the domain (PRD §10) + the owned services.
   Conceptual first (`DATA-MODEL.md`: entities + relations + value objects + access/
   multi-tenancy/RLS intent + retention), then physical (`DB-SCHEMA.md`: enums, tables,
   columns, keys, indexes, constraints, RLS helpers/policies, RPCs/triggers, seed/reference
   catalogs, migrations plan). Include the **service↔DB map**: each owned service code →
   the tables it owns/reads/writes + any RPCs. This is "the services taken to a database".
8. **Views↔components map** — apply the fractal cut rule. List **transversal** components
   (grouped: Base · State/resilience · Data & lists · Nav & layout · Overlays · domain-shared)
   with code + status, then **screen-specific** components per view (bespoke only). Note
   what already exists (✓) vs to build (○) so the transversal set is built first.
9. **General map** — one consolidated `MAP.md`: a single row per view crossing
   area · scope/gating · services (own/managed) · components · status. This is the
   hand-off to architecture (the data model is its sibling backend artifact).
10. **Launch readiness** — surface what it takes to SHIP beyond the build, grouped:
    legal/compliance · payments-live · analytics/instrumentation · observability/reliability ·
    security/privacy · release/CI-CD + store/deploy · support/ops · growth/GTM ·
    onboarding/activation · quality gates. Capture as `LAUNCH.md` with owner + status per
    item; populated during discovery and tracked through build to go-live.

Close phases 1–9 before proposing architecture; phase 10 (`LAUNCH.md`) is the forward
checklist tracked through build to launch.

## Output Contract

A coherent docs set, one file per phase, cross-linked, each updated as decisions land:
`PRD.md` · `USER-FLOWS.md` · `ECONOMY.md` (if monetized) · `SCREENS.md` · `SERVICES.md` ·
`DATA-MODEL.md` · `DB-SCHEMA.md` · `COMPONENTS.md` · `MAP.md` · `LAUNCH.md`. Report decided
vs still-open items. Final state: product defined, decomposed
(screens↔services↔data↔components), and with a tracked path to launch.

## DO vs DON'T

| DO | DON'T |
|---|---|
| Ask one question, wait, then write the artifact | Dump a questionnaire or option menu |
| Lock decisions in PRD §4 and move on | Re-litigate settled decisions every phase |
| Give every service/component a stable 3–4 letter code | Invent ad-hoc names that differ between maps |
| Derive tables from the domain + services; map each service to its tables | Invent tables with no owning service or leave persistence implicit |
| Promote a part to transversal once a 2nd view needs it | Duplicate the same part per screen |
| Mark ✓ exists / ○ to build on every part | Leave the reader guessing what already exists |
| Surface launch requirements (legal, payments-live, analytics, support) up front | Discover at launch you have no ToS, live billing, or analytics |
| Keep screen names in the real UI locale | Translate UI labels in the catalog |
| Stay in discovery; stop at the launch-readiness checklist | Start architecture or write code here |

## References

- `assets/templates.md` — fill-in skeletons + question-round guide for each phase.
