# Infrastructure standard — hosting & edge security

Default hosting and edge-security configuration for projects built on this template.
Every project that ships to production should follow this standard unless a documented
ADR explicitly overrides it.

---

## Hosting

| Layer                | Default                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web app              | **Vercel** — Next.js 15 (App Router, RSC, ISR) runs natively. Best DX; no custom CDN tuning needed for build output.                                                |
| Edge / security      | **Cloudflare** — DNS proxy only (WAF, DDoS, CDN, Turnstile, rate limiting). The Next.js runtime does NOT move to Workers or Pages.                                  |
| Public static assets | **Cloudflare R2 + CDN** — logos, PWA icons, marketing assets, downloadable binaries. Free egress. Next's own `_next/static` stays on Vercel's CDN — don't fight it. |
| Private user files   | **Supabase Storage** (RLS-integrated), optionally fronted by Cloudflare CDN. No R2 for private files by default — re-implementing auth is not worth it.             |

---

## What Cloudflare does NOT protect

Cloudflare only protects traffic that flows **through** it (i.e. through your proxied domain):

- **Supabase API** (`*.supabase.co`) has its own infrastructure protection. Fronting it
  through your Cloudflare requires a Supabase custom domain (paid feature) plus a Worker
  proxy — not included in this default.
- **Mobile apps** that call Supabase or other services directly bypass your Cloudflare zone
  entirely. Cloudflare protects the **web** surface only.

---

## Security & DDoS checklist

Apply these in order. Each item mitigates a distinct class of attack.

### 1. DNS proxied (orange cloud)

Turn on the Cloudflare proxy for your apex and `www` records. This gives automatic
unmetered L3–L7 DDoS protection for free.

### 2. Lock the origin

Vercel does not have a fixed origin IP, so you cannot use Cloudflare's IP allowlist.
Instead:

1. Generate a random secret string (e.g. `openssl rand -hex 32`) — this is `CF_ORIGIN_SECRET`.
2. Configure a Cloudflare **Transform Rule** (or a Workers header injection) to add
   `X-CF-Origin-Secret: <value>` to every request before it reaches Vercel.
3. In **Next.js middleware** (`middleware.ts`), verify the header on every incoming
   request; respond `403` if it is absent or wrong.
4. Optionally also enable **Vercel Deployment Protection** (password or OIDC) as a
   second layer.

This blocks attackers who discover the `*.vercel.app` URL and try to hit it directly,
bypassing Cloudflare's WAF and rate limiting entirely.

### 3. WAF managed ruleset (OWASP)

Enable the Cloudflare **OWASP managed ruleset** under Security → WAF. Leave it in
"Log" mode for 24–48 hours to check for false positives before switching to "Block".

### 4. Rate limiting

Add rate-limiting rules for abuse-prone endpoints:

- `/api/auth/*` — authentication endpoints
- `/api/signup` or equivalent — new-account creation
- Any webhook receiver or public write endpoint

Start conservative (e.g. 60 req / min per IP) and tune from Cloudflare analytics.

### 5. Turnstile on abuse-prone forms

Add **Cloudflare Turnstile** (invisible CAPTCHA) to signup forms and any other
form that is a multi-account-abuse vector. Validate the Turnstile token server-side
in your API route using `TURNSTILE_SECRET_KEY` before processing the request.

### 6. Bot Fight Mode

Enable **Bot Fight Mode** (free) or **Super Bot Fight Mode** (Pro/Business). Blocks
known bad bots without touching legitimate crawlers.

### 7. TLS Full (Strict) + HSTS

Set SSL/TLS mode to **Full (Strict)** — never "Flexible" (see gotchas below). Enable
**Always Use HTTPS** and add a Cloudflare **HSTS** header (`max-age` ≥ 31536000).

### 8. Security headers in code

Define all security headers in `apps/web/next.config.ts` (or `middleware.ts`) so they
are versioned with the codebase, not only set in the Cloudflare dashboard:

```ts
// next.config.ts
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // tighten before prod
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https:"
    ].join('; ')
  }
]
```

---

## Vercel-behind-Cloudflare gotchas

These issues are silent — they will not produce obvious errors, just corrupt behavior
or security regressions.

| Issue                                                             | Cause                                | Fix                                                                                   |
| ----------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------- |
| **Infinite redirect loop**                                        | SSL mode set to "Flexible"           | Set SSL to **Full (Strict)**                                                          |
| **Hydration errors / broken assets**                              | Rocket Loader or Auto-Minify enabled | Disable both in Cloudflare Speed settings                                             |
| **Email addresses corrupted**                                     | Email Obfuscation enabled            | Disable in Cloudflare Scrape Shield                                                   |
| **Stale HTML / RSC / API responses served from Cloudflare cache** | Cache rules too broad                | Bypass cache for all non-static content (see below)                                   |
| **`Set-Cookie` cached**                                           | Cache rules too broad                | Never cache responses that include `Set-Cookie`                                       |
| **Domain not verified on Vercel**                                 | Wrong DNS record type                | CNAME apex/`www` to `cname.vercel-dns.com` (proxied) and confirm in Vercel dashboard  |
| **Double-CDN revalidation fights**                                | Both Vercel and CF serve cached HTML | Cache only `/_next/static/*`, fonts, and images in Cloudflare; bypass everything else |

### Cache rules (Cloudflare Page Rules or Cache Rules)

```
Cache STATIC:
  /_next/static/*     → Cache Everything, Edge TTL: 1 year
  /images/*           → Cache Everything, Edge TTL: 7 days
  /fonts/*            → Cache Everything, Edge TTL: 7 days

BYPASS cache (all others, including):
  /*                  → Bypass Cache
  (implicit: HTML, RSC payloads, API routes, any response with Set-Cookie)
```

---

## Static-asset split

| Asset type                                         | Where                                        | Why                                                 |
| -------------------------------------------------- | -------------------------------------------- | --------------------------------------------------- |
| Next.js build output (`_next/static`)              | Vercel CDN (automatic)                       | Vercel manages cache busting with content hashes    |
| Public marketing assets, icons, downloadable files | Cloudflare R2 + CDN                          | Zero egress cost; independent of Vercel deployments |
| Private user-uploaded files                        | Supabase Storage (+ optional Cloudflare CDN) | RLS and auth already built in                       |

---

## Environment variables

See `.env.example` for the Cloudflare/edge key block. Required keys:

| Key                    | Purpose                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `CF_ORIGIN_SECRET`     | Shared secret injected by Cloudflare and verified in Next.js middleware |
| `TURNSTILE_SITE_KEY`   | Public key for the Turnstile widget in the browser                      |
| `TURNSTILE_SECRET_KEY` | Server-side key for Turnstile token validation                          |
| `R2_ACCOUNT_ID`        | Cloudflare account ID (only needed if using R2)                         |
| `R2_ACCESS_KEY_ID`     | R2 access key (only needed if using R2)                                 |
| `R2_SECRET_ACCESS_KEY` | R2 secret key (only needed if using R2)                                 |
| `R2_BUCKET`            | R2 bucket name (only needed if using R2)                                |
