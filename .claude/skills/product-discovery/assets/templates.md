# Product Discovery — Artifact templates

Fill-in skeletons for each phase. Keep prose tight; one idea per cell in tables.
**Codes** are 3–4 letters, stable, reused across SERVICES / COMPONENTS / MAP so any
table cross-references cleanly. **Status:** ✓ exists · ○ to build.
**Language:** prose follows the project's doc language (default English); screen names
stay in the product's real UI locale (they are the literal labels).

---

## PRD.md

```markdown
# {Product} — PRD
> Status: Draft v1 · Date: {date} · Owner: {owner}

## 1. Vision            — what it is, in one idea; the engines that feed each other
## 2. Problem           — what hurts today and why
## 3. Users             — personas + main need; initial market
## 4. Product decisions — the ones already made; LOCKED: not reopened without a recorded justification
## 5. Value proposition / differentiators
## 6. MVP scope         — In scope · Out of the MVP · No-goals
## 7. Features by engine/area
## 8. Business rules + legal + anti-fraud
## 9. Monetization      — see ECONOMY.md
## 10. Domain model (high level) — entities + relationships
## 11. KPIs
## 12. Risks and mitigations
## 13. Roadmap by phase
## 14. Open assumptions (checklist [ ]/[x])
```

## USER-FLOWS.md

```markdown
# {Product} — User flows (MVP)
Overall map (text diagram).
Per flow: numbered steps + key rule/edge. Cover: onboarding, dashboard,
search, value action (paywall/conversion), contribute, report, reputation,
and the staff/admin flow if there is a back office.
```

## ECONOMY.md (if there is monetization)

```markdown
# {Product} — Economy
Principles (the balance; decoupling currency↔money).
Currency / monetizable unit. Earn (table). Buy (bundles).
Plans/subscription. New-user activation. Payment gateway + local methods.
Crossover point (no path cannibalizes another). Rules. Open decisions.
```

## SCREENS.md

```markdown
# {Product} — View inventory
By surface (app/web/admin) and area. Give each view a stable ID.
Each view: purpose + one SCOPE line (what it does + what the user can/cannot
do + free/paid gating). Summary (count per surface + per role).

## {Area}
| ID | Screen | Platform | Role | Scope (what it does + can/cannot + gating) |
```

## SERVICES.md

```markdown
# {Product} — Views ↔ Services

## SERVICES
| Code | Module   | What it does | Status |   ← owned (to build)
| Code | Service  | Covers       | Status |   ← managed (third-party/SaaS)

## View → services map
| Screen | Owned | Managed |        ← same views/IDs as SCREENS
Rules: one idea per cell; 3–4 letter codes consistent across tables.
Cross-cutting concerns (DB backbone, i18n, edge, observability) are omitted per row and
listed once as "cross-cutting".
```

## DATA-MODEL.md

```markdown
# {Product} — Data Model (conceptual)
Derived from PRD §10 (domain) + owned services. Conceptual only; physical → DB-SCHEMA.md.

## Entities + relationships
| Entity | Key attributes | Relations | Owned by service (code) |

## Value objects / enums (conceptual)
| Name | Values / shape | Used by |

## Access model (if multi-tenant / RBAC)
Roles + scoping rule (who sees what) + tenancy boundary. RLS intent per entity.

## Retention / lifecycle
Per entity: created by · updated by · retention/TTL · soft vs hard delete.
```

## DB-SCHEMA.md

```markdown
# {Product} — DB Schema (physical)
Implements DATA-MODEL.md. Codes match SERVICES.md so the service↔DB map cross-references.

## Enums
| Enum | Values |

## Tables
| Table | Columns (type) | Keys / FKs | Indexes | Constraints |

## Access / RLS (if applicable)
Helper functions (security-definer) + per-table policies (default deny). Triggers.

## RPCs / functions
| Name | Signature | Purpose | Security |

## Service ↔ DB map   ← the "services taken to a database" map
| Service (code) | Owns (tables) | Reads | Writes / RPCs |

## Reference / seed catalogs
Tables seeded with fixed rows (e.g. plans/entitlements, categories, statuses).

## Migrations plan
Ordered migration files (one concern each): schema → RLS/policies → seed.
```

## COMPONENTS.md

```markdown
# {Product} — Components Map
Cut rule (fractal): shared by ≥2 views → root `components/`; one view → screen-local.
Codes: 3–4 letters, stable, reused across maps. Status: ✓ exists · ○ to build.

## Transversal components (root `components/`)
### Base / primitives
| Code | Component | What it is | Status |
### State & resilience (DoD per screen)
| Code | Component | What it is | Status |
### Data & lists
| Code | Component | What it is | Status |
### Navigation & layout
| Code | Component | What it is | Status |
### Overlays & feedback
| Code | Component | What it is | Status |
### {Domain} shared (auth / monetization / …)
| Code | Component | What it is | Status |

## Screen-specific components (`screens/<S>/components/`)
| View | Specific components |   ← bespoke only; "—" = pure composition

## Build implication
N of M transversal exist; the rest are the foundation — build them before screens,
highest-reuse first.
```

## MAP.md (general map — hand-off to architecture)

```markdown
# {Product} — General Map (screens ↔ services ↔ components)
Single source that crosses everything. IDs from SCREENS; codes from SERVICES + COMPONENTS.
Legends: status ✓ exists · ○ to build. Cross-cutting infra (backbone DB, i18n, edge,
observability) is omitted per-row and listed once below.

| View (ID) | Area | Scope + gating | Services (own / managed) | Components | Status |

## Cross-cutting (applies to all views)
{backbone services + global overlays/chrome listed once}

## Build order
{dependency-ordered blocks of views; foundation + transversal components first}
```

## LAUNCH.md

```markdown
# {Product} — Launch Readiness
Forward checklist surfaced in discovery, tracked to go-live. Status: ☐ todo · ◐ wip · ☑ done.

## Legal & compliance
ToS · Privacy Policy · consent/cookies · data-protection law ({region}) · refunds · business/invoicing.
## Payments & billing (live)
Prod gateway keys · taxes/invoicing · receipts · refunds/chargebacks · dunning · plan change/proration.
## Analytics & instrumentation
North-star + funnel events wired · dashboards · conversion/attribution.
## Observability & reliability
Error monitoring live · alerting/on-call · uptime · logging · perf budgets · backups/DR.
## Security & privacy
Security review/pentest · secrets mgmt · access/RLS verified · rate limit · WAF/DDoS · PII handling.
## Release & delivery
CI/CD · staging+prod envs · feature flags · rollback · store submission (Play / App Store / PWA) · versioning/OTA.
## Support & ops
Support channel · help/FAQ · runbooks/incident response · status page · cancellation flow.
## Growth & GTM
Landing/pricing page · store listing assets · SEO · launch comms · waitlist/referral.
## Onboarding & activation
First-run · activation metric · demo/sample data · time-to-value · empty states.
## Quality gates
a11y · i18n complete · device/browser matrix · load/perf test · beta/QA sign-off.

## Owners & dates
| Item | Owner | Target | Status |
```

---

## Question-round guide (per phase)

Ask 1 question at a time, recommend a default, let the user redirect.

### Product-thinking round (before/with PRD)
- The core problem and who feels it most (target user + situation).
- The engines/loops that feed each other (what makes the product compound).
- What is already decided and must be treated as LOCKED (PRD §4).
- The single value-action that proves the product works.
- Initial market/launch scope (single segment vs multi).

### Scope & monetization round
- Legal/posture, monetization model, launch scope (single vs multi).
- Payment provider (verify local methods), pricing philosophy.
- Validation/moderation model (manual vs auto vs hybrid).
- New-user activation (welcome / first-action bonus).
- Platform (app-first / web / both), build-now vs later.

### Data-modeling round (with phase 7)
- The core entities and which owned service owns each.
- Tenancy/access boundary (multi-tenant? per-user? roles) → RLS intent.
- Idempotency / dedup needs (natural keys, hashes) for event-like data.
- Retention/lifecycle (TTL, soft delete) per entity.
- Reference/seed catalogs that ship with the schema (plans, categories, statuses).

### Component-cut round (with phase 8)
- Per view: what is bespoke vs reused from another view.
- Which parts appear in ≥2 views → promote to transversal (assign a code).
- Which already exist (✓) vs must be built (○); pick the highest-reuse to build first.
- Cross-cutting overlays/chrome (toast, modal, paywall, offline, nav) → transversal.

### Launch-readiness round (with phase 10)
- Legal posture: which docs are mandatory in {region} (ToS, privacy, data law, invoicing)?
- Payments go-live: prod keys, taxes/receipts, refunds, dunning — who owns each?
- The one activation + the one north-star metric to instrument before launch.
- Observability + on-call: who gets paged when it breaks, and how is it monitored?
- Distribution: app store(s) / PWA / web — submission assets and timeline.
- The minimum GTM surface (landing/pricing/store listing) needed on day one.
