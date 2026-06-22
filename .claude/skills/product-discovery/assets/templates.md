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
> Estado: Draft v1 · Fecha: {date} · Owner: {owner}

## 1. Visión            — qué es, en una idea; los motores que se retroalimentan
## 2. Problema          — qué duele hoy y por qué
## 3. Usuarios          — personas + necesidad principal; mercado inicial
## 4. Decisiones de producto — las definidas; CERRADAS: no se reabren sin justificación registrada
## 5. Propuesta de valor / diferenciadores
## 6. Alcance del MVP   — En alcance · Fuera del MVP · No-goals
## 7. Funcionalidades por motor/área
## 8. Reglas de negocio + legal + anti-fraude
## 9. Monetización      — ver ECONOMY.md
## 10. Modelo de dominio (alto nivel) — entidades + relaciones
## 11. KPIs
## 12. Riesgos y mitigaciones
## 13. Roadmap por fases
## 14. Supuestos abiertos (checklist [ ]/[x])
```

## USER-FLOWS.md

```markdown
# {Product} — Flujos de usuario (MVP)
Mapa general (diagrama de texto).
Por flujo: pasos numerados + Regla/edge key. Cubrir: onboarding, dashboard,
buscar, acción-de-valor (paywall/conversión), aportar, reportar, reputación,
y el flujo de staff/admin si hay back-office.
```

## ECONOMY.md (si hay monetización)

```markdown
# {Product} — Economía
Principios (la balanza; desacople moneda↔dinero).
Moneda / unidad monetizable. Ganar (tabla). Comprar (paquetes).
Planes/suscripción. Activación del usuario nuevo. Pasarela + métodos locales.
Punto de cruce (que ninguna vía canibalice a otra). Reglas. Decisiones abiertas.
```

## SCREENS.md

```markdown
# {Product} — Inventario de vistas
Por superficie (app/web/admin) y área. Asigná a cada vista un ID estable.
Cada vista: propósito + una línea de ALCANCE (qué hace + qué puede/no puede el
usuario + gating gratis/pago). Resumen (conteo por superficie + por rol).

## {Área}
| ID | Pantalla | Plataforma | Rol | Alcance (qué hace + puede/no + gating) |
```

## SERVICES.md

```markdown
# {Product} — Vistas ↔ Servicios

## SERVICIOS
| Código | Módulo   | Qué hace | Status |   ← propios (a construir)
| Código | Servicio | Cubre    | Status |   ← gestionados (terceros/SaaS)

## Mapa vista → servicios
| Pantalla | Propios | Gestionados |        ← mismas vistas/IDs de SCREENS
Reglas: una idea por celda; códigos 3–4 letras consistentes entre tablas.
Lo transversal (DB backbone, i18n, edge, observabilidad) se omite por fila y se
lista una sola vez como "cross-cutting".
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

### Component-cut round (with phase 7)
- Per view: what is bespoke vs reused from another view.
- Which parts appear in ≥2 views → promote to transversal (assign a code).
- Which already exist (✓) vs must be built (○); pick the highest-reuse to build first.
- Cross-cutting overlays/chrome (toast, modal, paywall, offline, nav) → transversal.
