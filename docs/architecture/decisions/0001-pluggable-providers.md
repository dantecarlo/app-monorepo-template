# ADR 0001 — Providers are pluggable behind ports

- Status: Accepted
- Date: 2026-06-25
- Deciders: Template maintainers

## Context

The template integrates third-party providers for several cross-cutting
concerns: a backend (Supabase), error/diagnostics observability (Sentry), and
edge security (Cloudflare Turnstile bot protection + origin lock). If any
concern imported its vendor SDK directly from feature code, swapping the
provider — or running credential-free in dev — would require scattered edits
and would couple the domain to a vendor.

Supabase already proved a clean seam in this template: a port in `@app/core`,
an adapter that is the only file importing the vendor SDK, and a per-app
composition root that wires the singleton.

## Decision

All provider integrations follow the same ports-and-adapters seam, and the
default provider for each concern is a **swappable adapter**:

1. **Port in `@app/core`** — a pure TypeScript interface (`I`-prefixed,
   single-object params, neutral domain types). Zero framework or vendor
   imports. Verified by the seam check:
   `rg "from '@sentry|from 'next'|from '@supabase" packages/core/src` returns
   zero matches.

2. **Adapter behind the vendor SDK** — the only files importing the vendor:
   - `packages/supabase/*.adapter.ts` (Supabase) implements `IAuthGateway` +
     `IBackendClientProvider`.
   - `apps/{web,mobile}/src/lib/observability/createSentryObservability.adapter.ts`
     (Sentry) implements `IObservabilityPort`. Per-app because
     `@sentry/nextjs` and `@sentry/react-native` cannot cross the DOM/RN
     boundary.
   - `packages/cloudflare/*.adapter.ts` (Cloudflare) implements
     `IBotProtectionPort` + `IOriginGuardPort`. Shared package, web-only
     consumption, dependency-light (only `@app/core`).

3. **Composition root per app** — a one-const module that binds the singleton
   to one factory. Swapping the provider is a one-line edit:
   - `observability.adapter.ts` → Sentry / Console / Noop
   - `botProtection.adapter.ts` → Turnstile / Permissive
   - `originGuard.adapter.ts` → Cloudflare / Pass-through
   - `src/lib/supabase/*.adapter.ts` → Supabase / other backend package

4. **Graceful degradation** — every default adapter no-ops when its
   credential is absent: no Sentry DSN → no capture; no `TURNSTILE_SECRET_KEY`
   → `verifyToken` resolves `{ success: true }`; no `CF_ORIGIN_SECRET` → origin
   guard returns `{ trusted: true, reason: NOT_CONFIGURED }`. Build and
   `ATL_TEMPLATE_SELF=1 pnpm validate` stay green with no real credentials.

## Consequences

- Sentry, Cloudflare, and Supabase are the **default** providers but are not
  load-bearing in the domain — any can be replaced by writing a new adapter and
  editing one composition-root line.
- `setUser` / `addBreadcrumb` were added to `IObservabilityPort` as OPTIONAL
  methods so existing noop/console and any third-party adapters stay valid.
  Consumers must null-check (`observability.setUser?.(…)`).
- `scrubPII` is applied in every adapter before any payload reaches a sink; the
  org rule "never include PII" makes this mandatory on the new `setUser` /
  `addBreadcrumb` paths too.
- The permissive/pass-through degrades are a production footgun: production
  must set the real secrets. Documented in `docs/infrastructure.md`.
