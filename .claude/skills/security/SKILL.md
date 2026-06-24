---
name: security
description: >
  Security audit repositioned to the template posture: provider-behind-ports +
  RLS-in-adapter + scrubPII/PII_KEYS. Checks edge/CDN/deployment security (origin-lock
  header, security headers versioned in code, cache-safety for HTML/RSC/API/Set-Cookie,
  bot/CAPTCHA on abuse-prone forms, rate limiting on auth, TLS Full Strict + HSTS, CDN
  gotchas, static-asset split) PLUS template-specific: backend access via @app/core ports
  only, Row-Level-Security enforced in the *.adapter.ts/service layer, PII scrubbed via
  scrubPII/PII_KEYS before logging/query keys. Report-only, severity-grouped. Does NOT fix.
  This skill feeds validate-all's G-security group.
  USE WHEN: "audit security", "check edge security", "security review", "check origin lock",
  "security headers", "rate limiting", "cache safety", "check CSP", "PII exposure".
---

# Security Audit

> Reports findings grouped by severity. Does NOT fix — reports only.
>
> This skill feeds `validate-all`'s G-security group. For the full post-generation
> harness, run `validate-all`.

---

## Audit Scope

- Single file: audit that file for applicable checks (middleware, next.config, env vars)
- Directory: audit all files in the directory
- `all` / no argument: audit the full project — middleware, next.config, env files,
  and any Cloudflare or edge configuration present in the repository

---

## Template-Specific Checks (Check these first)

### Check T1 — Backend Access via @app/core Ports Only

**BLOCKER if vendor SDK is imported directly in a feature or hook.**

All database and authentication calls must go through the ports defined in `@app/core`:
- `IBackendClientProvider` — database/backend client
- `IAuthGateway` — authentication

```typescript
// ❌ Direct vendor import in a feature
import { createClient } from '@supabase/supabase-js'

// ✅ Access via port in the adapter / lib layer only
import type { IBackendClientProvider } from '@app/core'
```

What to look for:
- `rg -rn 'from .@supabase'` — should return hits only inside `packages/supabase/`
  or `src/lib/supabase/`
- `rg -rn 'from .@stripe' | '@resend'` — should return hits only in lib wrappers
- Any vendor SDK import directly in `src/screens/`, `src/services/`, or `src/hooks/` → BLOCKER

---

### Check T2 — Row-Level-Security and Auth-Scoped Filtering in Adapter Layer

**BLOCKER if auth-scoped filtering is trusted from the client.**

RLS and access control must be enforced in the `*.adapter.ts` / service layer,
never trusted from client-side request parameters alone.

What to look for:
- Service functions that pass `contextId`/`userId` from the client without
  server-side validation (the adapter or backend must re-validate identity)
- Any screen or hook that constructs a query with a user-supplied ID and sends
  it directly to the database without RLS enforcement in the adapter

---

### Check T3 — PII Scrubbed Before Logging or Query Keys

**WARNING if PII appears raw in logs or query keys.**

The template provides `scrubPII`, `PII_KEYS`, and `sanitizeQueryKey` from `@app/core`.

```typescript
// ❌ Email in a query key — logged by TanStack Query DevTools and error reporters
queryKey: ['user', userEmail]

// ✅ Sanitized
import { sanitizeQueryKey } from '@app/core'
queryKey: sanitizeQueryKey({ key: ['user', userEmail] })
```

What to look for:
- `rg -n 'queryKey:' --glob '*.hook.ts'` — check for raw email, name, phone
- Error reporting calls (`captureException`, Sentry `beforeSend`) — verify
  `scrubPII` is applied to breadcrumb/event data
- Mock data files that contain fields in `PII_KEYS` with non-fake values

---

## Edge and Deployment Checks

### Check 1 — Origin Lock: Edge Secret Verified in Middleware

**CRITICAL if absent.**

The edge layer (Cloudflare Transform Rule, Worker, or equivalent) must inject a
shared secret header. Next.js middleware must verify it and return `403` for
requests without it — prevents bypassing WAF via the bare `*.vercel.app` URL.

What to look for:
- `middleware.ts` checking a header like `x-cf-origin-secret` against an env var
- Env var present in `.env.example` with a comment
- FAIL if neither exists

---

### Check 2 — Security Headers Versioned in Code

**WARNING if absent or incomplete.**

Headers must be defined in `next.config.ts` (`headers()`) or `middleware.ts`.
Dashboard-only settings are not versioned and will be lost.

Required headers:

| Header                      | Minimum value                            |
| --------------------------- | ---------------------------------------- |
| `X-Frame-Options`           | `SAMEORIGIN` or `DENY`                   |
| `X-Content-Type-Options`    | `nosniff`                                |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`        |
| `Permissions-Policy`        | any value restricting unused APIs        |
| `Strict-Transport-Security` | `max-age` ≥ 31536000                     |
| `Content-Security-Policy`   | any value (flag `unsafe-eval + unsafe-inline` together without nonce) |

---

### Check 3 — Cache Safety

**CRITICAL if authenticated responses are cached.**

No CDN layer must ever cache: HTML pages, RSC payloads, API routes (`/api/*`),
responses with `Set-Cookie`, or responses with `Cache-Control: private/no-store`.

What to look for:
- `next.config.ts` `headers()` adding `Cache-Control: no-store` on API routes
- Any CDN cache config (Cloudflare cache rules, `wrangler.toml`) — verify it
  explicitly bypasses the categories above

---

### Check 4 — CAPTCHA on Abuse-Prone Forms

**WARNING if absent on signup or resource-intensive forms.**

Forms that create accounts or trigger paid operations must be protected by
Turnstile (Cloudflare invisible CAPTCHA) or equivalent with server-side token validation.

---

### Check 5 — Rate Limiting on Auth Endpoints

**WARNING if absent.**

Auth and account-creation endpoints must be rate-limited at the edge (Cloudflare)
or in middleware (e.g. `@upstash/ratelimit`).

---

### Check 6 — TLS Full (Strict) + HSTS

**CRITICAL if TLS mode is not Full (Strict).**

"Flexible" mode causes infinite redirect loops with Vercel. "Full (Strict)" is required.

---

### Check 7 — CDN Configuration Gotchas

**SUGGESTION for each misconfiguration found.**

| Gotcha                   | Problem                                            |
| ------------------------ | -------------------------------------------------- |
| Rocket Loader enabled    | Corrupts Next.js hashed JS/CSS and hydration       |
| Email Obfuscation on     | Corrupts server-rendered email addresses           |
| CNAME not on Vercel DNS  | Domain verification on Vercel fails                |

---

### Check 8 — Static-Asset Split Documented

**SUGGESTION if absent.**

Public assets (CDN/R2) vs private/authenticated files must be documented so
developers know where to put new asset types.

---

## Audit Report Format

```markdown
# Security Audit — {scope}

**Scope**: {file, directory, or "full project"}

## Summary

| Check                              | Status            | Severity   |
| ---------------------------------- | ----------------- | ---------- |
| T1. Backend via @app/core ports    | PASS / FAIL / N/A | BLOCKER    |
| T2. RLS in adapter layer           | PASS / FAIL / N/A | BLOCKER    |
| T3. PII scrubbed                   | PASS / FAIL / N/A | WARNING    |
| 1. Origin lock                     | PASS / FAIL / N/A | CRITICAL   |
| 2. Security headers in code        | PASS / FAIL / N/A | WARNING    |
| 3. Cache safety                    | PASS / FAIL / N/A | CRITICAL   |
| 4. CAPTCHA on abuse-prone forms    | PASS / FAIL / N/A | WARNING    |
| 5. Rate limiting on auth endpoints | PASS / FAIL / N/A | WARNING    |
| 6. TLS Full (Strict) + HSTS        | PASS / FAIL / N/A | CRITICAL   |
| 7. CDN config gotchas              | PASS / FAIL / N/A | SUGGESTION |
| 8. Static-asset split              | PASS / FAIL / N/A | SUGGESTION |

## Findings

### BLOCKER / CRITICAL

#### {Check name}

- **File**: `{path}:{line}` (or "not found in repo")
- **Issue**: {description}
- **Fix**: {concrete remediation step}

### WARNING / SUGGESTION

...

## Passed checks

{List with one-line confirmation of where the implementation was found}
```
