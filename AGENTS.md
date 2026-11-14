# AGENTS.md

Agent instructions for this template, read by every runtime (Claude Code,
Cursor, Codex, Gemini CLI and others that read `AGENTS.md`). This is the single
instruction file: there is no `CLAUDE.md`, and a tracked `CLAUDE.md`,
`.claude/CLAUDE.md` or `CLAUDE.local.md` would stop Claude Code from reading
this one.

---

## Quick orientation

- **What**: production-ready pnpm + Turborepo monorepo template. Provides the
  structural baseline (Clean + Fractal architecture, linting, type-checking,
  testing, validation gates, edge-security docs) for Next.js + Expo projects
  backed by Supabase. It is not a runnable product: projects bootstrap from it
  and then extend it with product-specific code.
- **Stack**: pnpm workspaces · Turborepo · Next.js 16.2.9 (App Router) · Expo SDK 58
  (React Native) · Supabase (Postgres, Auth, RLS) · Cloudflare (edge/CDN/WAF).
- **Architecture**: Clean + Fractal. Framework-agnostic domain in
  `packages/core`. Platform adapters in `*.adapter.ts` files. See
  `docs/architecture/`.

---

## Shared memory

This template's projects share a versioned Engram memory mirror at
**https://github.com/dantecarlo/orquestador-engram-memory**.

At the start of every session, load the shared memory into the project's Engram.
Contribute portfolio-level decisions, cross-project conventions, and reusable
architecture knowledge back to the shared repo after they are made.

See `docs/memory.md` for the LOAD and CONTRIBUTE flow.

---

## Key docs

| Doc                                    | Purpose                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `docs/code-standards.md`               | Binding code conventions — read before writing any code                 |
| `docs/architecture/shared.md`          | Monorepo and cross-package sharing model                                |
| `docs/architecture/web.md`             | Next.js App Router fractal structure                                    |
| `docs/architecture/mobile.md`          | Expo Router fractal structure                                           |
| `docs/infrastructure.md`               | Hosting, edge security, origin-lock, cache rules                        |
| `docs/e2e.md`                          | End-to-end testing harness (Playwright via dlx)                         |
| `docs/propagation.md`                  | How to sync template improvements into downstream projects              |
| `docs/maps/global-map.md`              | Navigable index of every shared and global artifact                     |
| `docs/memory.md`                       | Shared Engram memory — load at session start, contribute decisions back |
| `docs/manifest.md`                     | Template manifest — file ownership and propagation                      |
| `.claude/agents/validator.md`          | Adversarial standards validator subagent                                |
| `.claude/skills/validate-all/SKILL.md` | Full validation harness                                                 |

---

## Validation gate

Nothing is "done" until the validation gate is green:

```bash
ATL_TEMPLATE_SELF=1 pnpm validate
```

`pnpm validate` runs `turbo run lint typecheck test build format:check`, then
`pnpm verify:tests`, the spec gates (`verify:specs`, and `report:spec-drift`, which
only reports), `pnpm verify:english` and `pnpm verify:maps`. All must pass.

The manifest gates run first (they are instant, so structural drift fails
before anything expensive). `pnpm verify:tests` checks tests-per-unit presence
and `pnpm verify:maps` checks architecture-map integrity and the magic-literal
audit. Every failure is a blocker.

| Manifest gate                   | What it proves                                            |
| ------------------------------- | --------------------------------------------------------- |
| `pnpm verify:manifest`          | `template.manifest.json` is well formed                   |
| `pnpm verify:manifest:coverage` | Every tracked file has exactly one owner, no stale claims |
| `pnpm verify:manifest:test`     | The pure engine behind both still behaves                 |

A new file with no owner fails the gate — that is deliberate. See
`docs/manifest.md`.

Two additional runtime smokes also run outside `pnpm validate` (CI-only jobs,
never in the offline gate):

```bash
pnpm smoke:mobile   # expo export + Hermes bundle assertion (iOS + Android)
pnpm smoke:web      # next build + next start probe (HTTP 200 + marker check)
```

See `docs/e2e.md` and `docs/responsive.md` for details.

E2E tests (`pnpm test:e2e`) are a separate stage — they require a running
server and run after `pnpm validate` in CI, not inside it.

## Spec-driven changes

A change that adds, modifies or removes a requirement of a living spec, or creates
a unit no spec describes yet, runs the SDD lifecycle: load the `sdd` skill and
follow `openspec/README.md` (proposal, spec deltas, a design only for an
architecture decision, tasks, apply test first, verify, archive). A small change
needs no spec; its commit and pull request are the record. Owner requests are
quoted in English, translated and marked when written in another language.

---

## Agent skills

Project-level skills live under `.claude/skills/`. Each skill provides a
`SKILL.md` with its trigger contract.

| Skill                     | Trigger                                                                                                                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `validate-all`            | After any multi-file change; before marking done                                                                                                                                                                         |
| `propagate-from-template` | Syncing template improvements into a downstream project                                                                                                                                                                  |
| `product-discovery`       | Structuring a raw product idea into a buildable plan                                                                                                                                                                     |
| `fractal-verify`          | Auditing a single screen or component block                                                                                                                                                                              |
| `security`                | Edge/DDoS/headers/Turnstile/origin-lock audit                                                                                                                                                                            |
| `archify`                 | Diagram the architecture, a workflow, a request sequence, a data pipeline or a state machine — and the HTML counterpart every generated document ships. Spec in `docs/diagrams/*.json`, render with `pnpm docs:diagrams` |

---

## Conventions

- Conventional commits only. No AI attribution or Co-Authored-By in commits.
- Domain and application layers must not import framework or vendor SDKs.
- Every `*.service.ts` is paired with a `*.adapter.ts` — no fetch in components.
- `pnpm validate` must be green before any work is reported as done.
- Arrow functions only — no `function` keyword.
- Alias imports only — `@app/*` paths, `@/` inside an app, `#src/` inside a package; no `../`
  outside an app barrel `index.ts`.
- File suffixes are binding: `.component.tsx`, `.hook.ts`, `.service.ts`, `.adapter.ts`,
  `.type.ts`, `.constant.ts`, `.style.ts`, `.test.ts`.
- Naming: `I{Name}` interfaces, `{Name}Type` types, `{Name}Enum` enums,
  `ALL_CAPS_PURPOSE` consts.
- Single-object params — destructure from one typed object; no positional args.
- No magic numbers or strings — enums and constants always.
- Max 500 lines per file.
- Tests: `test()` not `it()`; semantic queries; no `data-testid`.
- English everywhere — identifiers, comments, docs. UI strings via i18n catalogs, the only
  place Spanish may appear; `pnpm verify:english` fails on a Spanish line anywhere else.

---

## Stack

| Layer           | Technology                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| Monorepo        | pnpm workspaces + Turborepo                                                                              |
| Web             | Next.js 16.2.9 (App Router, RSC, ISR)                                                                    |
| Mobile          | Expo SDK 58, React Native 0.88 (dev builds)                                                              |
| Styling         | Tailwind CSS 4 (web), NativeWind 4 (mobile)                                                              |
| Language        | TypeScript 6, React 19.3                                                                                 |
| Runtime         | Node 24                                                                                                  |
| Shared packages | `packages/core` (domain), `packages/cloudflare`, `packages/i18n`, `packages/supabase`, `packages/tokens` |
| Database / Auth | Supabase Cloud (Postgres, Auth, RLS, Edge Functions)                                                     |
| Edge / Security | Cloudflare (DNS proxy, WAF, DDoS, Turnstile, CDN)                                                        |
| Hosting         | Vercel (Next.js)                                                                                         |

---

## Architecture

Clean + Fractal. The domain and application layers live in `packages/core` and
must never import framework or vendor SDKs. Infrastructure adapters
(`*.adapter.ts`) implement port interfaces from the core and are the only layer
that may import Supabase, Next.js, or other framework APIs.

See `docs/architecture/shared.md`, `docs/architecture/web.md`, and
`docs/architecture/mobile.md`.

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

| File                     | Read by                | Holds                                                                                       |
| ------------------------ | ---------------------- | ------------------------------------------------------------------------------------------- |
| `packages/supabase/.env` | Supabase CLI (sourced) | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF`                     |
| `apps/web/.env.local`    | Next.js                | `NEXT_PUBLIC_SUPABASE_URL`, `_ANON_KEY`, `CF_ORIGIN_SECRET`, `TURNSTILE_SECRET_KEY`, `R2_*` |
| `apps/mobile/.env`       | Expo                   | `EXPO_PUBLIC_SUPABASE_URL`, `_ANON_KEY`                                                     |

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

## Propagating template improvements to downstream projects

See `docs/propagation.md` and `.claude/skills/propagate-from-template/SKILL.md`.
