# app-monorepo-template — Agent instructions

Auto-loaded by Claude Code at the start of every session.

---

## What this repo is

A production-ready monorepo template for Next.js + Expo projects backed by
Supabase. It is the structural baseline — not a runnable product. Projects
bootstrap from it and then extend it with product-specific code.

---

## Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Web | Next.js 16.2.9 (App Router, RSC, ISR) |
| Mobile | Expo SDK 56, React Native 0.85 (dev builds) |
| Styling | Tailwind CSS 4 (web), NativeWind 4 (mobile) |
| Language | TypeScript 6, React 19.2 |
| Runtime | Node 24 |
| Shared packages | `packages/core` (domain), `packages/i18n`, `packages/supabase`, `packages/tokens` |
| Database / Auth | Supabase Cloud (Postgres, Auth, RLS, Edge Functions) |
| Edge / Security | Cloudflare (DNS proxy, WAF, DDoS, Turnstile, CDN) |
| Hosting | Vercel (Next.js) |

---

## Architecture

Clean + Fractal. The domain and application layers live in `packages/core` and
must never import framework or vendor SDKs. Infrastructure adapters
(`*.adapter.ts`) implement port interfaces from the core and are the only layer
that may import Supabase, Next.js, or other framework APIs.

See `docs/architecture/shared.md`, `docs/architecture/web.md`, and
`docs/architecture/mobile.md`.

---

## Validation gate — nothing is done until this is green

```bash
ATL_TEMPLATE_SELF=1 pnpm validate
```

This runs `turbo run lint typecheck test build format:check`, then
`pnpm verify:tests` (tests-per-unit presence) and `pnpm verify:maps`
(architecture-map integrity + magic-literal audit). Every failure is a blocker.

E2E tests run separately — after the validation gate, not inside it:

```bash
pnpm test:e2e   # requires a running dev server
```

---

## Supabase workflow — Cloud only

This template targets Supabase Cloud for development. There is no local Docker
stack.

### Standing directives

- Do NOT start Docker or the local Supabase stack. Always target the cloud project.
- Do NOT run `supabase login`. Auth comes from `SUPABASE_ACCESS_TOKEN` in
  `packages/supabase/.env`.
- The Supabase CLI does not auto-read `.env` — always `source` it before any
  `supabase` command.
- Never print or paste the access token or DB password into chat or commits.
  Confirm a variable is loaded by its character count only.

### `packages/supabase/.env` (gitignored)

```dotenv
SUPABASE_ACCESS_TOKEN=sbp_...
SUPABASE_DB_PASSWORD=...
SUPABASE_PROJECT_REF=...
```

### Apply migrations

```bash
cd packages/supabase
set -a; source .env; set +a
supabase link --project-ref "$SUPABASE_PROJECT_REF"
supabase db push
supabase gen types typescript --linked > src/types.ts
```

### Env layout

| File | Read by | Holds |
|---|---|---|
| `packages/supabase/.env` | Supabase CLI (sourced) | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF` |
| `apps/web/.env.local` | Next.js | `NEXT_PUBLIC_SUPABASE_URL`, `_ANON_KEY`, `CF_ORIGIN_SECRET`, `TURNSTILE_SECRET_KEY`, `R2_*` |
| `apps/mobile/.env` | Expo | `EXPO_PUBLIC_SUPABASE_URL`, `_ANON_KEY` |

A root `.env` is not read by either framework. Never put secrets in
`NEXT_PUBLIC_` or `EXPO_PUBLIC_` namespaces.

---

## Ports and adapter seam

The adapter seam is the single most important architectural constraint:

- `packages/core/src` — domain and application layers; zero framework imports.
- `*.adapter.ts` files in `apps/` and `packages/supabase/` — the only place
  framework or vendor SDKs may appear.
- `*.service.ts` — defines the port interface; always paired with an adapter.

Verify the seam is intact:

```bash
rg "from 'react'|from 'next'|from '@supabase" packages/core/src \
  --type-add 'ts:*.ts' --type-add 'tsx:*.tsx' -l
```

Zero matches = seam intact.

---

## Conventions

- Arrow functions only — no `function` keyword.
- Alias imports only — `@app/*` paths; no `../` outside barrel `index.ts`.
- File suffixes are binding: `.component.tsx`, `.hook.ts`, `.service.ts`,
  `.adapter.ts`, `.type.ts`, `.constant.ts`, `.styles.ts`, `.test.ts`.
- Naming: `I{Name}` interfaces, `{Name}Type` types, `{Name}Enum` enums,
  `ALL_CAPS_PURPOSE` consts.
- Single-object params — destructure from one typed object; no positional args.
- No magic numbers or strings — enums and constants always.
- Max 500 lines per file.
- Tests: `test()` not `it()`; semantic queries; no `data-testid`.
- Conventional commits only. No AI attribution in commits.
- English everywhere — identifiers, comments, docs. UI strings via i18n catalogs.

---

## Propagating template improvements to downstream projects

See `docs/propagation.md` and `.claude/skills/propagate-from-template/SKILL.md`.

---

## Key docs

| Doc | Purpose |
|---|---|
| `docs/code-standards.md` | All binding rules — read before writing code |
| `docs/infrastructure.md` | Hosting, edge security, origin-lock, Cloudflare cache rules |
| `docs/e2e.md` | Playwright e2e harness — zero-dep via dlx |
| `docs/propagation.md` | Selective diff-based sync from the template |
| `docs/maps/global-map.md` | Navigable index of every shared artifact |
| `.claude/agents/validator.md` | Adversarial standards validator subagent |
| `.claude/skills/validate-all/SKILL.md` | Full validation harness |
