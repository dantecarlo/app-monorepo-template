# AGENTS.md

Cross-tool entry point for AI coding agents (Cursor, Codex, Gemini CLI, and
others that read `AGENTS.md`). The authoritative agent instructions for this
template live in **[CLAUDE.md](CLAUDE.md)** — read it first.

---

## Quick orientation

- **What**: production-ready pnpm + Turborepo monorepo template. Provides the
  structural baseline (Clean + Fractal architecture, linting, type-checking,
  testing, validation gates, edge-security docs) for Next.js + Expo projects
  backed by Supabase.
- **Stack**: pnpm workspaces · Turborepo · Next.js 15 (App Router) · Expo
  (React Native) · Supabase (Postgres, Auth, RLS) · Cloudflare (edge/CDN/WAF).
- **Architecture**: Clean + Fractal. Framework-agnostic domain in
  `packages/core`. Platform adapters in `*.adapter.ts` files. See
  `docs/architecture/`.

---

## Key docs

| Doc | Purpose |
|---|---|
| `docs/code-standards.md` | Binding code conventions — read before writing any code |
| `docs/architecture/shared.md` | Monorepo and cross-package sharing model |
| `docs/architecture/web.md` | Next.js App Router fractal structure |
| `docs/architecture/mobile.md` | Expo Router fractal structure |
| `docs/infrastructure.md` | Hosting, edge security, origin-lock, cache rules |
| `docs/e2e.md` | End-to-end testing harness (Playwright via dlx) |
| `docs/propagation.md` | How to sync template improvements into downstream projects |
| `docs/maps/global-map.md` | Navigable index of every shared and global artifact |

---

## Validation gate

Nothing is "done" until the validation gate is green:

```bash
ATL_TEMPLATE_SELF=1 pnpm validate
```

`pnpm validate` runs `turbo run lint typecheck test build format:check`, then
`pnpm verify:tests` and `pnpm verify:maps`. All must pass.

E2E tests (`pnpm test:e2e`) are a separate stage — they require a running
server and run after `pnpm validate` in CI, not inside it.

---

## Agent skills

Project-level skills live under `.claude/skills/`. Each skill provides a
`SKILL.md` with its trigger contract.

| Skill | Trigger |
|---|---|
| `validate-all` | After any multi-file change; before marking done |
| `propagate-from-template` | Syncing template improvements into a downstream project |
| `product-discovery` | Structuring a raw product idea into a buildable plan |
| `fractal-verify` | Auditing a single screen or component block |
| `security` | Edge/DDoS/headers/Turnstile/origin-lock audit |

---

## Conventions

- Conventional commits only. No AI attribution or Co-Authored-By in commits.
- Code, identifiers, comments, and documentation default to English.
- Domain and application layers must not import framework or vendor SDKs.
- Every `*.service.ts` is paired with a `*.adapter.ts` — no fetch in components.
- File suffixes are binding: `.component.tsx`, `.hook.ts`, `.service.ts`, etc.
- `pnpm validate` must be green before any work is reported as done.
