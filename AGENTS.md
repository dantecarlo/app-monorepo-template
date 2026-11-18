# AGENTS.md

Agent instructions for this template, read by every runtime (Claude Code,
Cursor, Codex, Gemini CLI and others that read `AGENTS.md`). This is the single
instruction file: there is no `CLAUDE.md`, and a tracked `CLAUDE.md`,
`.claude/CLAUDE.md` or `CLAUDE.local.md` would stop Claude Code from reading
this one. `pnpm verify:instruction-entry` fails on one in any folder.

---

## Quick orientation

- **What**: production-ready pnpm + Turborepo monorepo template. Provides the
  structural baseline (Clean + Fractal architecture, linting, type-checking,
  testing, validation gates, edge-security docs) for Next.js + Expo projects
  backed by Supabase. It is not a runnable product: projects bootstrap from it
  and then extend it with product-specific code.
- **Stack**: pnpm 11 workspaces · Turborepo · Next.js 16.2.9 (App Router) · Expo SDK 58
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
| `docs/mcp.md`                          | MCP servers — what each is for, unpinned; refresh with `pnpm mcp:docs`  |
| `.agents/agents/validator.agent.md`    | Adversarial standards validator subagent (neutral source)               |
| `.claude/skills/validate-all/SKILL.md` | Full validation harness                                                 |

---

## Validation gate

Nothing is "done" until the validation gate is green:

```bash
ATL_TEMPLATE_SELF=1 pnpm validate
```

`pnpm validate` starts with `pnpm agent-harness:projection-check` and
`pnpm agent-harness:test`, runs `turbo run lint typecheck test build format:check`, then
`pnpm verify:tests`, the spec gates (`verify:specs`, and `report:spec-drift`, which
only reports), `pnpm verify:english`, `pnpm verify:instruction-entry`,
`pnpm codex-budget:test` and `pnpm verify:maps`. All must pass.

The projection check and the manifest gates run first (they are instant, so
structural drift fails before anything expensive). An agent is written once, in
`.agents/agents/<name>.agent.md`; `pnpm agent-harness:generate` writes what each
runtime reads (`.claude/agents/`, `.codex/`, `.opencode/agents/`, `opencode.json`,
`.github/agents/`), and `pnpm agent-harness:projection-check` fails when one of
those files is missing, extra, edited by hand or not committed. Never edit them:
edit the source and regenerate. `pnpm verify:tests` checks that every unit has a
test, in the `__tests__/` of its own folder and named after it, and
`pnpm verify:maps` checks architecture-map integrity and the magic-literal
audit. `pnpm verify:instruction-entry` checks that `AGENTS.md` and `README.md`
exist and that no path git lists, tracked or not yet added, is a `CLAUDE.md` or
`CLAUDE.local.md`. `pnpm codex-budget:test` fails when this file, counted with
CRLF endings, outgrows the `project_doc_max_bytes` that `.codex/config.toml`
sets: Codex loads only that many bytes of it and drops the rest. Every failure
is a blocker.

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

## The LAWs

Binding on every agent, whichever runtime reads this file. Each LAW says what
it applies to and what holds it.

### Look in `ui/` before creating a component — LAW

Applies to every app in the monorepo, each of which keeps its own
`src/components/ui/`; an app added later brings its own.

Before creating a component, **open that app's `ui/` and look**. Search for the
concept, not only the name you had in mind: a `Tag` you were about to write may
already exist as `Chip`. Query CodeGraph when the repository is indexed, and
sweep by suffix when it is not (`docs/code-standards.md` §0). If the primitive
is there, render it.

**A same-named component outside `ui/` is legitimate in exactly one shape**: a
container that renders the primitive and adds what the primitive must not know,
such as the domain, the router or the data.

**What this forbids**: re-implementing a `ui/` block under its own name;
copying a primitive into a screen to tweak it; rendering, in a view, a raw
element or primitive that a `ui/` block already wraps; and creating in one app
what the other already solved, without at least reading how.

**Enforced by review**: no lint rule or gate checks it yet. `knip` and
`verify:maps` catch only the leftovers once a duplicate exists, and a duplicate
under a different name has no import to detect.

### Styling lives in the components — LAW

Applies to `apps/web` and `apps/mobile`, and to every app added later. The
owner decided it on 2026-11-14 (translated from Spanish): "move everything to
ui, that rule is a pillar. The screen or section files must contain only
positioning, and the components are what must hold the other styles, but
everything centralized in styles and the tokens." And, for the kit behind it,
on 2026-11-15 (translated from Spanish): "if for example tomorrow shadcn is
not used and Material UI or another is wanted, the change should be
relatively decoupled and 'easy' to make".

**A component block owns its look**: a block under `src/components/ui/`, or
under a screen's own `components/` for a look only that screen has. Its
`*.style.ts` holds colour, background, border, radius, typography, shadow,
opacity, states and variants. **Every other file only positions**: a screen,
a section (a route entry under `src/app/`, a container under
`src/components/<Name>/`) and `src/helpers/layout.style.ts`. Its classes,
StyleSheet entries and style props hold flex and grid, gap, order,
alignment, position and inset, z-index, the size that places a block, and the
space between blocks.

**Every value comes from the tokens**: `packages/tokens`, through the Tailwind
and NativeWind presets or the token constants, or a step of Tailwind's own
scale. No raw colour, no Tailwind palette colour, no arbitrary value (`[…]`),
no inline style object with a visual key. A value no token carries becomes a
token in `packages/tokens`.

**The look and the kit live in one replaceable layer.** Only a `ui/` block
imports a UI kit, its primitives or its class helpers: shadcn's
`class-variance-authority`, Radix, `tailwind-variants`, a future `@mui/*`, and
`expo-linear-gradient` or `react-native-svg` on mobile. Screens, sections and
screen-local components import the `ui/` blocks, so swapping the kit rewrites
`ui/` and nothing else.

**A different look is a change to the block**, as a variant or a prop of an
existing `ui/` block, or a new block when none fits (the LAW above); never a
class added in the screen. The document's own base, `html` and `body`, lives
in the base styles of `apps/web/src/app/globals.css`.

**What this forbids**: a colour, size, weight or radius in a screen's or a
route's style; a hex or an arbitrary value in any style file; restyling a
`ui/` block from outside through `className` or `style`; importing a kit
primitive outside `ui/`.

**Backed by** three ESLint rules at `error`, `local/style-positions-only`,
`local/style-token-values` and `local/ui-kit-boundary`, and by
`verify:allowlist-freshness`, which keeps `eslint-style-positioning-allowlist.json`
shrinking: it ships empty, an entry names its file, its rule and why the value
cannot move, and the gate fails an entry whose file no longer breaks its rule.
`docs/code-standards.md` §22 says what they do not see.

### A rule is not edited to fit the work — LAW

Applies to every skill, every gate, every allowlist, every row of the
enforcement table (`docs/code-standards.md` §21), and every LAW in this file,
including this one.

**They change only when the owner asks for that change, in words, as the
request.** Not as a step toward something else, not because a rule is in the
way, not because a gate is red, not because a lint rule rejected a comment you
liked. A rule discovered mid-task is a constraint on the task, never a
candidate for edit.

**What this forbids**, concretely: relaxing a threshold so a measurement
passes; adding an entry to an allowlist so a gate goes green; widening a gate's
`notCovered` clause so a finding stops applying; editing a skill's steps or
contract because the files it emits were inconvenient; softening a LAW you were
about to violate; and rewriting an enforcement row so it agrees with what you
did.

**When a rule looks wrong, say so and stop.** Name the rule, name what it cost
you, and propose the change as a question. The owner decides. A rule that
survives that conversation is stronger than one nobody questioned; a rule
edited quietly is not a rule at all, it is a note-to-self the next agent
inherits as fact.

The one exception is the request itself: when the owner asks for a rule, a
gate, a LAW or a skill to change, that IS the work, and it is done in full.

The escape hatches of `docs/code-standards.md` §20 stay what they are: a
justified inline disable, or a `verify:english` allowlist entry, each with its
written reason, records a false positive. Reaching for one to silence a finding
that is true is what this LAW forbids.

**Enforced by review**: no gate can tell why a rule changed.

### Every change is architectural — LAW

Applies to every agent that touches this repository, and to every change,
however small it looks. A one-line fix is still a change to a system.

**Understand before editing.** Read the code around the change, its callers,
its tests, and the docs that own the concern: `docs/code-standards.md` and its
enforcement table (§21), `docs/architecture/`, the decision records in
`docs/decisions/`, and the living spec of the unit in `openspec/specs/`. Look
for an existing service, adapter, hook, component or screen before creating
one, so it is reused rather than duplicated (`docs/code-standards.md` §0).

**Fix the cause, at its altitude.** A change that makes one symptom go away
while the mechanism behind it stands is not a fix; it is a second defect
wearing the first one's clothes. Ask what else shares that mechanism, and say
what the answer was.

**Name the blast radius.** Before editing, state what else reads the thing you
are changing: other callers, other tests, other agents' branches, the database,
generated output. After editing, check those, not only the file you opened.

**Leave the invariants intact.** A fixture, a gate, an allowlist and a
generated file each exist because something was measured. Changing one without
reading why it exists trades a known cost for an unknown one.

**What this forbids**, concretely: editing a file because it is the one the
error names; making a test pass by weakening what it asserts; adding a second
spelling of something that already has an owner; changing generated output
instead of its generator; and reporting a change as done without saying what
it touched beyond the diff.

The cost is real and accepted: this is slower per change. It is the trade the
enforcement table and the validation gate already make, comprehension bought
with time.

**Enforced by review.**

### Reply shape — LAW

Applies to every reply addressed to a human in this repository. It does NOT
apply where the output contract is machine-readable (a JSON envelope, a
structured tool result, a commit message, a generated file), since prose
appended there is malformed output, not a summary.

1. **Be concise.** Say the finding, not the path taken to it. No narrating tool
   calls, no restating what was just done, no reasoning out loud. Long output is
   spam: it buries the one line that mattered. If a number, a file and a verdict
   answer the question, that is the whole reply.
2. **One question at a time**, and only when the answer changes what happens
   next. It goes in the **Pending** section below, never buried in the body.
3. **Close the WORK with two summaries, once.** They go at the end of the whole
   exchange, not after each step of it. While work is still in flight (a
   background job running, a gate pending, more steps queued), say so in one
   line and stop; no summary yet. Two summaries inside one piece of work is the
   spam this LAW exists against. They are the LAST content of that final turn,
   clearly labelled, and in THIS order:
   - **Non-technical** — first. What it means in plain language: what works now
     that did not, what it costs, what is still open. No identifiers, no jargon.
   - **Technical** — second. What changed: files, commands, shas, measurements,
     gate results. Enough for another engineer to pick it up.
   - **Pending** — last, and only when there IS something: an open question, a
     decision waiting on the owner, work left undone. One line each. A turn that
     leaves nothing open omits the section rather than padding it.

The three labels follow the language of the reply: a reply written in another
language writes them in that language.

Evidence still outranks brevity: never drop a measurement, a caveat or a
`Not covered` clause to make a reply shorter. Cut the narration, not the facts.

**Enforced by review.**

---

## Router — natural language → skill → gate

Resolve the task to a skill from these tables, one per phase of a change, in
the order a change moves through them: understand, define, scaffold, build,
test, review, operate, harness; the last, process, routes the ticket flow that
carries a change from one session to the next. Then **load that skill and follow it**: the
skill holds its file set and its steps, and these tables do not restate them. A
phase with no routed skill has no table. **Validated by** names the `pnpm`
script that checks the result, or says `review` when no gate does. Every skill
lives at `.claude/skills/<name>/SKILL.md`.

### understand

| If the task means…                                                                                                                                                  | Load skill | Validated by          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------- |
| architecture and conventions: "how do I name or structure X", which layer a thing belongs to, the folder tree                                                       | `arch`     | review                |
| **diagram** the architecture, a workflow, a request sequence, a data pipeline or a state machine; the spec lives in `docs/diagrams/*.json`, rendered by `pnpm docs:diagrams` | `archify`  | `docs:diagrams:check` |

### define

| If the task means…                                                                                                                                                                                                                         | Load skill          | Validated by   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- | -------------- |
| run a **large change** as SDD, a new feature or any change to what a living spec states: propose, specify its deltas, plan, build test first, verify, archive; or **write, sync or discard** one living spec or change ("new feature", "run this as SDD", "update the spec of X", "archive the change") | `sdd`               | `verify:specs` |
| structure a **raw product idea** into a buildable plan before any code: scope and MVP, screens, services, data and components in one map, launch readiness ("PRD", "MVP scope", "decompose the product")                                      | `product-discovery` | review         |
| produce or refresh the **general plan**: what is done and pending, what is needed from the owner, the path to launch ("general plan", "what's pending", "refresh the plan")                                                                   | `general-plan`      | review         |

### scaffold

| If the task means…                                                                                                | Load skill  | Validated by                          |
| ----------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------- |
| create a **presentational component**, after checking the app's `ui/` (§ The LAWs)                                 | `component` | `verify:structure` · `verify:tests`   |
| create a **screen, page or container** that owns its data fetching and its loading, error and empty states        | `screen`    | `verify:structure`                    |
| add a **service or API call**: the client service and adapter pair of a domain, and its query hooks               | `service`   | `verify:pairing` · `verify:tests`     |
| build a full **feature slice**: domain types, service, query hook, components, screen and route, in that order    | `feature`   | `verify:structure` · `verify:pairing` |
| create a **Zustand store** for cross-feature state                                                                | `store`     | `lint`                                |
| **wrap a third-party library** behind a project-internal API, so features never import the vendor directly       | `lib`       | `lint`                                |
| add a **mock**: an MSW handler and the mock data of an HTTP endpoint                                              | `mock`      | review                                |

### build

| If the task means…                                                                                         | Load skill | Validated by |
| ---------------------------------------------------------------------------------------------------------- | ---------- | ------------ |
| **modify** an existing component or screen: add a prop, move logic into its hook, add a variant, refactor | `modify`   | `validate`   |

### test

| If the task means…                                                     | Load skill | Validated by   |
| ---------------------------------------------------------------------- | ---------- | -------------- |
| **write or expand tests** for a component, hook, helper or store       | `test`     | `verify:tests` |
| **fix or migrate** an existing test to the current conventions         | `fix-test` | `verify:tests` |

### review

| If the task means…                                                                                                                  | Load skill       | Validated by       |
| ----------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------ |
| **audit code quality** against `docs/code-standards.md`, finding by rule number; report only                                       | `quality`        | review             |
| review a **staged diff before a commit**, beyond what lint and types decide                                                          | `pre-commit`     | review             |
| review a component's or hook's **performance** ("perf review", "check re-renders", "why is it slow")                                 | `perf`           | review             |
| **security** audit: edge and headers, origin lock, cache safety, rate limiting, row-level security in the adapters, **PII exposure** | `security`       | `verify:security`  |
| audit a scope for **accessibility**: semantics and ARIA, keyboard, labels, WCAG 2.1 AA                                              | `a11y`           | `lint` (jsx-a11y)  |
| check one block obeys the **fractal contract**: folder shape, logic in its hook, service and adapter pairing, tests                 | `fractal-verify` | `verify:structure` |
| decide a change is **done**: the deterministic gate plus the grouped validator subagents, one verdict                               | `validate-all`   | `validate`         |

### operate

| If the task means…                                                              | Load skill       | Validated by                 |
| ------------------------------------------------------------------------------- | ---------------- | ---------------------------- |
| prove a change works **in the running app**, web and mobile, beyond its tests | `runtime-verify` | `smoke:web` · `smoke:mobile` |

### harness

| If the task means…                                                                                   | Load skill                | Validated by                 |
| ---------------------------------------------------------------------------------------------------- | ------------------------- | ---------------------------- |
| create a **new skill**                                                                               | `new-skill`               | review                       |
| **audit or improve** an existing skill; nothing changes before the findings are shown and confirmed | `improve-skill`           | review                       |
| build or refresh the **skill index**, `.claude/skill-registry.md`                                    | `registry`                | review                       |
| **sync template improvements** into a downstream project                                             | `propagate-from-template` | `validate`, in that project |

### process

Every role loads `ticket-flow` first; with no `docs/process/ticket-flow.md`, run `process-intake`.

| If the task means…                                                                                                  | Load skill       | Validated by                                |
| ------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------- |
| the **ticket flow** itself: the states, the board operations, the messages, the rules a role follows               | `ticket-flow`    | `verify:skills:test`                        |
| **PO**: a client requirement becomes a ticket with its target version; a scope or version change; the plan on close | `po-ticket`      | review                                      |
| **architect**: refine a ticket into specs and a plan, dispatch every ready state, group a release                   | `refine-ticket`  | `verify:specs`                              |
| **dev**: build a ticket test first in its own worktree, up to Ready for QA                                          | `dev-ticket`     | `validate` · `verify:ticket-branch`         |
| **QA**: check a ticket with evidence, bring it current, merge one at a time under the merge policy                 | `qa-ticket`      | `test:e2e`                                  |
| **CI/CD**: deploy a release target by target on the owner's word, check production, a hotfix                        | `release-ticket` | review                                      |
| **set up** a project's ticket flow: its board adapter, states, roles, approvals, deploy targets and branching       | `process-intake` | review                                      |

---

## Conventions

- Conventional commits only. No AI attribution or Co-Authored-By in commits.
- Domain and application layers must not import framework or vendor SDKs.
- A package is imported only inside its seam, per `.agents/contracts/dependencies.json` (code-standards §23).
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
- A screen or section only positions; the look lives in `components/ui/**` (or a screen's own
  `components/`), every value comes from the tokens, and only `ui/` imports a UI kit (LAW above).
- English everywhere — identifiers, comments, docs. UI strings via i18n catalogs, the only
  place Spanish may appear; `pnpm verify:english` fails on a Spanish line anywhere else.

---

## Stack

| Layer           | Technology                                                                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo        | pnpm 11 workspaces + Turborepo                                                                                                                                 |
| Web             | Next.js 16.2.9 (App Router, RSC, ISR)                                                                                                                          |
| Mobile          | Expo SDK 58, React Native 0.88 (dev builds)                                                                                                                    |
| Styling         | Tailwind CSS 4 (web), NativeWind 4 (mobile)                                                                                                                    |
| Language        | TypeScript 6, React 19.3                                                                                                                                       |
| Runtime         | Node 24                                                                                                                                                        |
| Shared packages | `packages/core` (domain), `packages/cloudflare`, `packages/i18n`, `packages/supabase`, `packages/tokens`, `packages/tooling` (shared test and process scripts) |
| Database / Auth | Supabase Cloud (Postgres, Auth, RLS, Edge Functions)                                                                                                           |
| Edge / Security | Cloudflare (DNS proxy, WAF, DDoS, Turnstile, CDN)                                                                                                              |
| Hosting         | Vercel (Next.js)                                                                                                                                               |

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
- A function `postgres` creates outside the `public` and `extensions` schemas is
  executable by its owner only (`0004_auth_helpers.sql` revokes PUBLIC's default
  EXECUTE). Grant EXECUTE to the roles that call it in the same migration, or the
  call fails at run time. See `packages/supabase/docs/database.md`.

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
pnpm --filter @app/supabase gen:types
```

### Env layout

| File                     | Read by                | Holds                                                                                                                                                                          |
| ------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/supabase/.env` | Supabase CLI (sourced) | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF`                                                                                                        |
| `apps/web/.env.local`    | Next.js                | `NEXT_PUBLIC_SUPABASE_URL`, `_ANON_KEY`, `CF_ORIGIN_SECRET`, `TURNSTILE_SECRET_KEY`, `R2_*`, `NEXT_PUBLIC_POSTHOG_KEY`, `_HOST`, `_CONSENT`, optional `NEXT_PUBLIC_SENTRY_DSN` |
| `apps/mobile/.env`       | Expo                   | `EXPO_PUBLIC_SUPABASE_URL`, `_ANON_KEY`, `EXPO_PUBLIC_POSTHOG_KEY`, `_HOST`, `_CONSENT`, optional `EXPO_PUBLIC_SENTRY_DSN`                                                     |

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
