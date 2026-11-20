# Generic template, `/init` and a centralized harness — plan

The template becomes fully generic and is configured head to toe by one `/init`
interview. The interview writes only data (an answers file); a deterministic
executor turns that data into files through the manifest's closed verbs. One
harness core serves every agent runtime. Skills carry procedure only and read
project facts from a small set of contract files that `/init` writes.

This plan supersedes the order of phases 3–11 in
[GENERALIZATION_PLAN.md](GENERALIZATION_PLAN.md). That file stays the item
ledger (rows, checkboxes, verdicts); this one is the strategy and the sequence.
Both are living documents: update them at the end of every step.

- **Written:** 2026-11-04
- **Rebuilt:** 2026-11-05, from PD1 and its tests on Certifipago (decisions
  29–36, PS round 3, PD1 status).
- **Donor read at:** `verifipagos@6bf0e179` (2026-10-30), 2309 commits after the
  last harvest point `bcf7310b` (2026-09-11). Read-only (decision 8).
- **Other inputs:** the Qik workspace (a folder on the owner's machine), this
  repo's state at `a6b9d50` + 351 staged paths, Claude Code documentation.
- **Agent consultations:** the Certifipago architect session did not receive
  the first request (held, then expired: different permission mode); after the
  modes were aligned it was sent again and delivered. The Qik frontend session
  was offline; the request is queued. Their answers, when they arrive, are
  appended to the Log at the end.

---

## Quick path

1. **PA** — first, with nothing committed or copied: complete the inputs (the
   Certifipago architect's and Qik frontend's answers, a deep analysis of both
   codebases against the objective) and audit everything (usage, health,
   correctness, fit). Only items with a keep or fix verdict travel.
2. **P0** — land the 351 staged paths **per verdict**: keep and fix are
   committed as reviewable units; drop is unstaged and reverted (needs the
   owner's OK).
3. **P1–P2** — one router (`AGENTS.md`), a harvested harness core under
   `.agents/`, projections for each runtime, gated for drift.
4. **P3–P4** — gate registry (closes B2), project facts in one config file plus
   contracts, brand gate (closes B3), region markers (closes B4).
5. **PS** — skills regrouped into a small default set plus opt-in packs, one
   front door per concern, every skill fixed against one quality bar and
   proven to trigger on the right requests.
6. **PF** — the canonical end-to-end flows as specs, with their approval points
   enforced and an end-to-end test each; the router is generated from them.
7. **PD** — Certifipago: PD1 fixed its own harness and is merged
   (2026-11-05); what it taught is decisions 29–39, and its follow-ups are in
   "Next steps".
   PD2 moves it onto the versioned core once the core exists.
8. **P5–P7** — manifest v2, deterministic executor, then the `/init` skill.
9. **P8–P12** — design-system intake, the remaining harvest, adopt mode with
   living docs, round-trip proof per preset, other derived projects.

Exit condition for the whole plan: every preset, initialized from a clean clone
in a scratch directory, passes `pnpm validate`, and the brand gate finds zero
donor vocabulary.

---

## Roadmap (2026-11-13)

Owner, 2026-11-13 (translated from Spanish): "we are now at a maturity level where any
project can start from here. So now you are the reference, and what we bring from other
projects will be adapted to you, and you will ask the others to adapt to the new standards"
(decision 47). This roadmap orders all remaining work; the "Next steps" tables below keep
their detail. Every template step is an OpenSpec change (decision 42) unless it says
"small". "Template" is this repository's session; "Arquitecto" is the Certifipago session
that conforms Certifipago or routes the work to its App and Web sessions.
Owner rule of 2026-11-13, relayed by the Arquitecto (translated from Spanish): when Certifipago
finishes a harness or architecture change, it tells the template, which applies it too; each
such report becomes a parity-ledger row.

### Where things stand (2026-11-16)

Requested by the owner: everything below "Next" and "Pending", in that order (L61 to L66).

**Done, merged into `main`:**
- Stages 0 to 2.
- Step 3.1, `AGENTS.md` as the router (#17).
- Step 3.2 part A, the agent projector (#18).
- The living specs (#13).
- F1 to F7 and F9 (#14, #15, #16).
- The rebuilt plan (#19).
- F.3, the package follow-ups (#20).
- F.1, the styling pillar (#22).
- F.4, tests in `__tests__/` per block, with the strict `verify:tests` and the shipped codemod (#24).
- F30 and F31: the shared `tv` keeps the token font sizes, and the web fonts are self-hosted (#25).
- F.9, the MCP documentation updater: the catalog `.agents/contracts/mcp-servers.json`, `pnpm mcp:docs` and the offline `verify:mcp-docs` (#26).
- F.12, the generated token outputs: one source, one generator, and `verify:theme-sync` as the regenerate-and-diff check (#27).
- F32: the web fonts are Certifipago's Latin variable woff2 files, 84 KB in all (#28).
- F34: tailwind-merge knows every token name, from the generated `themeNames` (#29).
- F.5, the app behaviour: F11 (sign-in through the auth gateway, origin-guard tests), F12 (the mobile light theme from the root, the NativeWind preset reading `var(--c-*)`, the count once, a stable `useSession`, no actionless mobile buttons), F23 (query keys with a trailing params object), F24 (UPPER_SNAKE_CASE enum members, lint-enforced) and F25 (query errors on the screen, boundary crashes reported once) (#30; the independent verifier passed it with no blockers).
- F36: the origin-guard matcher anchors its exempt paths (#31).
- F.6, the i18n follow-ups: F10 (web client components and `<html lang>` follow the active locale, the switcher works both ways) and F14 (every block label and the item age from the catalogs in both apps, catalog keys typed by the default catalog, parity across every catalog, named sign-in failures) (this change).
- F.7, observability: PostHog is the default adapter in both apps, with privacy defaults, one port contract suite every adapter runs, and Sentry an optional `sentry` capability `/init` can prune with no dangling import (this change).
- F.8 unit 1: the dependency registry `.agents/contracts/dependencies.json`, the `local/dependency-seam` rule applied by pattern, and the `verify:dependency-seams` gate, with today's imports frozen in an allowlist that only shrinks (this change).
- F46: PostHog's consent mode, `granted` by default or `opt-in` or `memory`, behind a provider-agnostic `IConsentPort`, and the key-value storage port `IKeyValueStoragePort` with `lib/storage/keyValueStorage.adapter.ts` as the AsyncStorage seam (this change).
- F54 and F48: under `opt-in` PostHog starts only after a grant, so nothing reaches it before consent, and `posthog-js` is loaded by dynamic import only when it may run, out of every page's start-up scripts (this change).
- F.8 unit 1b: every ESLint block applies by pattern, and the React, Next.js and Expo blocks by what each `apps/*/package.json` declares, proven by identical findings before and after and by plain React, Next.js and Expo fixture apps (this change).
- F.8 unit 2: one `IAppTranslator` for both apps behind each app's `lib/i18n`, every next-intl and react-i18next import migrated, and a visible-text record test per app (this change).
- F.8 unit 5: every UI library behind its own `ui/` block: variant unions held to each `tv()` config by typecheck, and new `ui/Image`, `ui/Gradient` and `ui/StatusBar` blocks, with the rendered output recorded unchanged (#47).
- F.8 units 3 and 4: the query hooks with project-owned option and result types (the options downstream projects pass included, results stable across renders), `AppQueryProvider`, `useInvalidateAppQuery` and `useIsAppMutating`; `createAppStore` as the one zustand import; the mobile theme and language choices through the key-value storage port. The allowlist holds 22 entries, units 6 and 7 (this change).
- The ticket-flow defaults from adoption: the architect keeps the merge queue and merges, every ticket carries a target version, and the production branch is the one the layer names (#45).
- F.8 unit 6: `next/navigation` behind `useAppRouter` of `apps/web/src/lib/routing/` and `next/cache` behind `applyCachePolicy` of `apps/web/src/lib/cache/`, tests mocking `@/lib/routing` through one shared double (#49); and the mobile root layout booted through `useAppBootstrap` of `apps/mobile/src/lib/bootstrap/`, every theme through `applyTheme` (#50).
- F.8 unit 7: `createSupabaseClient` and `createSupabaseServerClient` return the opaque `BackendClientType`, which only `packages/supabase/src/backendClient.adapter.ts` unwraps, and mobile gets its own `lib/supabase/authGateway.adapter.ts`; the allowlist is empty (#50).
- The board is the source of every open ticket: the general plan keeps a closed ticket catalog the PO writes in one pull request per close or release, and names no open ticket (parity with Certifipago #879; this change).
- F.8 unit 8: `local/wrapped-import`, the rule for the names a wrapper owns: a `react-native` primitive a `ui/` block is named after passes only under that block, the blocks read from disk, and an `expo-router` hook or its `router` only under `lib/routing`; every mobile text renders through `ui/Text`, with the rendered output recorded unchanged (#52).
- F.8 unit 9: ADR 0002, every library behind an adapter; the `lib` skill as the one procedure for wrapping a library; the two `AGENTS.md` LAW sentences and the `docs/code-standards.md` §21 rows that name `local/dependency-seam`, `local/wrapped-import` and `verify:dependency-seams`; the parity row of F.8 for Certifipago (this change).
- F.2, the Supabase hardening (#21; the native review did not fit its context budget, and the owner chose to merge on the independent verifier).
- The ticket flow: seven skills (`ticket-flow`, `po-ticket`, `refine-ticket`, `dev-ticket`, `qa-ticket`, `release-ticket`, `process-intake`), the board and the deploy targets as adapters, the release stage and the target version, the pure `verify:ticket-branch` check, and the living spec harness/ticket-flow (this change; Certifipago adopts it with its own project layer).
- The ticket flow's adoption fixes: the merge policy (#34), the project's ticket identity and neutral examples (#37), and the QA checkout detached at the remote branch, a branch brought current by merging its base, and a hotfix held at Ready to merge and shipped only as its release (this change).

**In flight:** none.

**Next:** `verify:router-coverage` (F27), the rest of Step 3.2 part B, then Step 3.3.

**Pending, in order:**
- Step 3.2 part B: `verify:router-coverage` (F27). `gradedBy` and `sdd-steward` are done: every agent names its grading skill in `.agents/agent-context.json`, which `verify:agent-context` holds, and `sdd-steward` runs one SDD change in one context.
- Step 3.3: the hook-safe test helper `withHookGitDir`, with a hook case in every suite that spawns git, and the worktree pruner behind `.husky/post-merge` are built. Still to come: the agent write guard, designed together with F66's rule-file guard, and the pruner's Claude Code hook, which needs the merge-command recognizer of step 4.1.
- Stages 4 to 7; F.11 lands with Stage 6, whose executor its questions need.
- F33, when the owner decides it.

**Waiting on Certifipago (F.10):**
- Done there: #823 (the D-S2 revert), #824 (the strict `verify:test-location`, with 29 frozen tests) and #827 (the projector YAML and TOML fix).
- When the template gates merge, it unfreezes its 5 tests of units outside `src/`, and adopts the F.8 registry.
- `nodeLinker` waits until after App's release train, by the owner's timing.
- K11 is pending as a pull request.
- On #15:
  - Mobile adopts it after the release train.
  - Web already has it.
- On #16:
  - Backend adopted 1a.
  - 1b (the anon EXECUTE sweep) and the profile column grants are proposals that wait on the owner.
- Web has K3 adopted but not yet pushed.
- Its `.mcp.json` runs `npx -y @shadcn/mcp-server`, which npm answers with 404; the fix is `npx -y shadcn mcp` (told 2026-11-15).
- F30 was already there (`apps/web/src/lib/tv.helper.ts`); a raw `tv` import leaked in its `ui/Stepper`, and Web is fixing it.

### Stage 0 — land what is open

| #   | Step                                                                                    | Who          | Waits on                                                        | Done when                                          |
| --- | --------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------- | -------------------------------------------------- |
| 0.1 | Template #4, SDD-0 (`adopt-sdd`), with the Expo 58 stack line in `openspec/config.yaml` | owner merges | its CI (two web jobs re-run after a Google Fonts fetch failure) | merged                                             |
| 0.2 | Template #6, this plan                                                                  | owner merges | 0.1                                                             | merged                                             |
| 0.3 | Certifipago #785: hooks through `pnpm exec`, one layer list                             | owner merges | nothing                                                         | merged                                             |
| 0.4 | `english-only`: `verify:english` and the plan, skill asset and fixture in English       | Template     | owner approves the proposal; 0.1                                | change archived and merged; `verify:english` green |

### Stage 1 — conventions, decided 2026-11-13

Owner, 2026-11-13 (translated from Spanish): "apply the recommendations you mention". Each
decision below follows its recommendation under "Open decisions"; the template applies its
side in step 2.0 and 2.3, and Certifipago its side through the conformance track (K8).

| #    | Decision                                                | Template today                            | Certifipago today                                        |
| ---- | ------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------- |
| D-S1 | style-constant suffix                                   | `.styles.ts`                              | `.style.ts` (156 files in `apps/web`)                    |
| D-S2 | test location                                           | beside the unit (`*.test.tsx`)            | `__tests__/` (code-standards §9, `verify:test-location`) |
| D-S3 | Markdown formatted by Prettier                          | yes                                       | no (`.prettierignore`)                                   |
| D-S4 | decision records                                        | `docs/architecture/decisions/` (1 record) | `docs/decisions/` (10 records)                           |
| D-S5 | language of owner quotes in Certifipago's SDD artifacts | English, translated and marked            | verbatim Spanish                                         |
| D-S6 | pnpm version                                            | 9.15.9                                    | 11.9.0, `nodeLinker: hoisted`                            |

### Stage 2 — template foundations

| #   | Step                                                                                                             | Who                       | Waits on | Done when                                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------- | ------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| 2.0 | Conventions change (D-S1, D-S3, D-S4): `.styles.ts` becomes `.style.ts` (56 files and their references); Prettier no longer formats Markdown; the decision record moves to `docs/decisions/` | Template | 0.4 | `validate` green; no `.styles.ts` left; `docs/decisions/0001-pluggable-providers.md` with its links |
| 2.1 | T1c `#src` package aliases (decision 45), after Certifipago #792                                                 | Template                  | 0.1      | `validate` green; no relative import in `packages/*/src`                                  |
| 2.2 | T1d `@app/tooling` (decision 46); then the Arquitecto replaces Certifipago's 12 cross-workspace relative imports | Template, then Arquitecto | 2.1 | no workspace imports a root script by path; a change to a tooling script or a root config changes the hash of every cached task that reads it (`test` is not cached) |
| 2.3 | T1e pnpm 11.9.0 (D-S6, decided): `packageManager`, lockfile, CI and `.npmrc` follow Certifipago's proven setup | Template | 2.0 | `validate` green on the new pnpm; `packageManager` and lockfile updated |
| 2.4 | T1b living specs, one per app and package, verified against a commit                                             | Template                  | 2.1, 2.2 | every spec passes `verify:specs`; `report:spec-drift` empty                               |

### Stage F — the follow-ups and the owner's decisions of 2026-11-14 and 2026-11-15

Owner, 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The
screen or section files must contain only positioning, and the components are what must hold the
other styles, but everything centralized in styles and the tokens. Fix everything you mention
applying what is recommended, and once everything is fixed tell the Arquitecto to integrate it
and fix everything". Owner, 2026-11-15 (translated from Spanish): "Let's rebuild the plan and
update it at the same time; detail what needs to be done and with that start executing it". The
rest of the owner's words of these two days are in L61. Stage F runs before the rest of Stage 3,
except where a step touches no app (3.2), and every template step is an OpenSpec change unless
it says "small".

| #    | Step | Who | Waits on | Done when |
| ---- | ---- | --- | -------- | --------- |
| F.1  | The styling pillar (decision 50) and the UI kit behind `components/ui` (decision 51): `local/style-positions-only` for both apps, an allowlist that only shrinks with `verify:allowlist-freshness`, every visual class moved into components, values from tokens; F13 (the web loads the tokens' preset, `verify-theme-sync` compares light colours) | Template | — | the rule and its gate green, the allowlist empty, both apps build |
| F.2  | Supabase hardening, F19 to F22 and F28: no EXECUTE for anon on `has_capability`; no TRUNCATE, TRIGGER, REFERENCES or MAINTAIN for the API roles; an append-only audit log; a user updates only `display_name`; an offline migration-order check; `gen:types` never empties `types.ts` | Template | — | the independent verifier and the native review pass |
| F.3  | Package follow-ups F8, F15 to F18: `verifySignedImageUrl` (signature, expiry, constant time), the Cloudflare Images fallback, the Turnstile test title, the `signalProcessTree` contract, `package-src-alias` fixes only what resolves back, the `scrubPII` shared-copy note | Template | — | the independent verifier and the native review pass |
| F.4  | Tests in `__tests__/` inside each block (decision 57): a codemod moves every unit test, `verify:tests` requires the test in the unit's own folder's `__tests__/` with the unit's stem, and the docs, skills and living-spec citations follow | Template, then Arquitecto | F.1 to F.3 merged | no unit test outside its block's `__tests__/`; the gate proven by planted violations |
| F.5  | App behaviour, decided as recommended (decision 58): F11 (sign-in calls the auth gateway; the origin guard tested), F12 (mobile fixes), F23 (dynamic query-key values in a trailing params object), F24 (enum members in UPPER_SNAKE_CASE, with a lint selector), F25 (a failed query shows the screen's `ErrorState`, a mutation the toast, a boundary crash is reported once) | Template | F.4 | `validate` green; both apps build and export |
| F.6  | i18n, F10 and F14: the active locale in client components and `<html lang>`; every user-facing string from the catalogs; the key type from the default locale; a missing-key test | Template | F.5 | `validate` green |
| F.7  | Observability (decision 53): PostHog as the default adapter behind the observability port in both apps; Sentry an optional capability with an install guide | Template | F.5 | `/init` can drop Sentry; both adapters satisfy the same port tests |
| F.8  | One rule set and every library behind an adapter (decisions 51 and 52): the per-package strategy below, a registry of allowed import sites, a rule that fails closed on an unregistered package, one configuration applied to `apps/*` and `packages/*` by pattern, and a fixture app proving a new app inherits every rule | Template | F.6, F.7 | the rule and its registry green; the fixture app inherits every gate |
| F.9  | The MCP documentation updater (decision 55): a command that reads the configured MCP servers, finds their latest releases and refreshes the documentation that names them | Template | — | the command and its test |
| F.10 | Certifipago integrates F.1 to F.9 and the owner's Certifipago decisions: the isolated linker (decision 56), Sentry removed with PostHog the default (decision 53), K3 as the web does, the strict test-location gate now (decision 57) | Arquitecto | each template pull request | a parity row closed for each |
| F.11 | The `/init` questions of decisions 53, 54 and 51: observability, backend, UI kit and the libraries behind adapters (sections 4 and 11 of the `/init` table) | Template | Stage 6 | the questions in the interview, each removing what the answer drops |
| F.12 | Generated token outputs (decision 59): a generator writes the web `@theme` block and the `[data-theme]` vars, the NativeWind preset and the mobile `themeVars` from `packages/tokens/src/tokens.constant.ts`, each with one writer and a drift gate; the web drops the `@config` bridge; `verify:theme-sync` becomes the regenerate-and-diff check | Template, then Arquitecto | F30, F31 | the gate green; compiled web CSS values identical; a render check in both themes |

**Every library behind an adapter (F.8).** The owner, 2026-11-15 (translated from Spanish):
"every package that is not core must be decoupled and have an adapter, in ui as a wrapper for
example, and so think a strategy for each one; currently the Certifipago project already more or
less does it, but evaluate and analyze and put it in the plan". The analysis of every dependency
of the template, its importers and Certifipago's approach is the table that follows; it is filled
by the inventory of 2026-11-15.

Inventory of `origin/main` at `e8a4489`, read as git objects. Today `no-restricted-imports` guards only
`@supabase/*`, `@stripe/*` and `@sentry/*`, so nothing guards i18n, query, state, UI or Expo packages.
In the table, **Direct** counts the non-test files that import the package outside its target seam.

| Package | Category | Direct | Target seam | Effort |
| --- | --- | --- | --- | --- |
| `react`, `react-dom`, `next`, `react-native`, `expo`, `expo-router`, `typescript`, `@app/core`, `@app/i18n`, `@app/tokens` | core | — | used directly (`next/cache`, `next/navigation`, `next/image` and the `expo-router` hooks narrowed, below) | — |
| `tailwindcss`, `nativewind` | styling engine, core: screens only position, and the look lives in `ui/`, so a UI kit swap rewrites `ui/` | 0 | `lib/theme` and the config files | — |
| `next-intl` | infra | 21 | `apps/web/src/lib/i18n/` | medium |
| `react-i18next` | infra | 18 | `apps/mobile/src/lib/i18n/` | medium |
| `i18next`, `i18next-icu`, `@formatjs/intl-pluralrules`, `expo-localization` | infra | 0 | `apps/mobile/src/lib/i18n/` | small |
| `@tanstack/react-query` | infra | 2, and its option and result types leak through `useAppQuery` | `apps/*/src/lib/query/` with project-owned option and result types, `AppQueryProvider`, `useInvalidateAppQuery` | medium |
| `zustand` | infra | 7 stores | `apps/*/src/lib/store/createAppStore.helper.ts` | small |
| `zod` | infra | 0 | `apps/*/src/validation/`, returning a project validation result | small |
| `@react-native-async-storage/async-storage` | infra | 2 | `apps/mobile/src/lib/storage/keyValueStorage.adapter.ts` behind an `IKeyValueStoragePort` in `@app/core` | small |
| `expo-splash-screen`, `@expo-google-fonts/*` | infra | 1 each | `apps/mobile/src/lib/bootstrap/` | small |
| `tailwind-variants` (`tailwind-merge` its peer) | ui | 0, and 9 ui types leak `VariantProps` | `apps/web/src/components/ui/variants.helper.ts` (F30) as the one value-import site, enforced by lint on every file (today a test covers only `*.style.ts`; Certifipago's `ui/Stepper` leaked a raw `tv`); explicit variant unions in `*.constant.ts` | medium |
| `react-error-boundary` | ui | 0, and its `FallbackProps` leak | `components/ui/AsyncBoundary` with its own fallback props | small |
| `expo-linear-gradient` | ui | 2 | a new `components/ui/Gradient` | small |
| `expo-blur`, `react-native-svg`, `react-native-reanimated` | ui | 0 | their existing `ui/` blocks | small |
| `react-native-safe-area-context` | ui | 1 app root | `ui/AuthShell` and `lib/bootstrap` | small |
| `expo-status-bar` | ui | 2, and its `StatusBarStyle` leaks | a new `components/ui/StatusBar` with its own style type | small |
| `@sentry/nextjs`, `@sentry/react-native` | vendor | 0 | `lib/observability/*.adapter.ts` and the framework config files (optional capability, decision 53) | small |
| PostHog | vendor | — | `lib/observability/*.adapter.ts`, the default adapter (F.7) | medium |
| `@supabase/supabase-js`, `@supabase/ssr` | vendor | 0, and `SupabaseClient<Database>` leaks into the apps | `packages/supabase/src/*.adapter.ts`, the client typed opaquely behind `IBackendClientProvider` | medium |
| `@app/supabase`, `@app/cloudflare` | vendor packages | 2 app roots, 0 | `apps/*/src/lib/supabase/`, `apps/web/src/lib/{bot-protection,origin-guard}` | small |
| `next/cache`, `next/navigation`, `next/image` | core, narrowed | 1, 1, 1 | `lib/cache`, `lib/routing`, `components/ui/Image` | small |
| `react-native` primitives that have a `ui/` wrapper (`Text`, `Pressable`, `TextInput`) | core, narrowed | 14 | `components/ui/*`; `View` and layout primitives stay direct | medium |

Rows outside scope: build and dev packages (ESLint, Vitest, MSW, Testing Library, Playwright, Turbo) and the framework
peers never imported (`react-native-screens`, `react-native-web`, `react-native-worklets`, `expo-constants`, `expo-font`,
`expo-linking`, `@expo/metro-runtime`).

**Enforcement.**
- **Registry.** `.agents/contracts/dependencies.json` names the core packages, the peers, and each other package's category and seam globs.
- **Rule.** `local/dependency-seam` applies to `apps/*/**` and `packages/*/**` by pattern, so a new app inherits it. It reads static and dynamic imports, re-exports, `require` and `vi.mock`, and type-only imports too. A registered package passes only inside its seam; an unregistered one fails, closed. It replaces the `@supabase`/`@stripe`/`@sentry` patterns, because `no-restricted-imports` is replace-not-merge across config blocks.
- **Gate.** `verify:dependency-seams` checks that every dependency of every `package.json` is registered, that no entry is stale, that every seam glob matches a file, and the config files ESLint ignores.
- **Tests.** A test inherits its unit's seam. `src/test/**` is the test-infrastructure seam. Tests mock `@/lib/*` and `@/components/ui/*`, not the vendor.
- **Migration.** Existing imports are frozen in an allowlist that only shrinks, as Certifipago does.

**Certifipago, evaluated.**
- **What works there:**
  - `local/view-import-boundary` fails closed on unknown packages in views;
  - the `ui/`-only category;
  - wrapper detection reads the `ui/` blocks from disk;
  - the raw TanStack hooks are banned;
  - one `lib/` adapter per Expo capability;
  - a name-registry `Icon`;
  - centralized seam mocks.
- **What is missing there:**
  - the boundary covers views only, so hooks, services, stores and packages escape it;
  - `next-intl`, `react-i18next`, `expo-*` and `react-native-*` pass as platform, so about 200 files import i18n directly;
  - type-only imports are exempt;
  - there is no single registry and no `package.json` check;
  - tests mock the vendors.

The template adopts what works and closes those gaps.

**Decided as recommended (decision 58):**
- the class dialect of Tailwind and NativeWind is core;
- type-only imports are governed too;
- `react-native` primitives that have a wrapper, and the `expo-router` hooks, go through `ui/` and `lib/routing`;
- one i18n API for both apps (`IAppTranslator` in `@app/i18n`);
- zod schemas stay per app until one is shared;
- the apps drop the `@supabase/*` dependencies they never import;
- a new dependency fails closed at once.

F.8 work units, in order:
1. the registry, the rule and the gate, with the frozen allowlist (done: 143 frozen imports, by unit: 2 → 82, 3 → 8, 4 → 11, 5 → 20, 6 → 20, 7 → 2);
1b. every ESLint block applied to `apps/*` and `packages/*` by pattern, not per app (decision 52), so the fixture app inherits every rule, not only `local/dependency-seam` (done: framework blocks by what each app declares; identical findings before and after);
2. the i18n seam in both apps (done: one `IAppTranslator` in `@app/i18n`, the 82 frozen imports migrated, the allowlist from 143 to 61);
3. the query seam's own types and provider (done: project-owned option and result types, `AppQueryProvider`, `useInvalidateAppQuery` and `useIsAppMutating`, #48);
4. `createAppStore` and the key-value storage port (done: #48; the allowlist from 61 to 42);
5. the `ui/` leaks (AsyncBoundary, variant unions, Gradient, StatusBar, Image) (done: #47; with units 3 and 4, the allowlist at 22);
6. `lib/bootstrap`, `lib/cache` and `lib/routing` (done: web #49, mobile #50; mobile calls no `expo-router` hook, so its `lib/routing` waits for the first one);
7. the opaque Supabase client (done: `BackendClientType`, #50; the allowlist empty);
8. the primitive-wrapper rule (done: `local/wrapped-import` holds the `react-native` primitives a `ui/` block is named after, read from disk, and the `expo-router` hooks; every mobile text through `ui/Text`; the allowlist stays empty);
9. an empty allowlist and the docs, ADR and `lib` skill, then the parity hand-off to Certifipago (done: the allowlist empty since unit 7, `docs/decisions/0002-every-library-behind-an-adapter.md`, the `lib` skill as the one procedure, and the F.8 row of the Template → Certifipago parity ledger).

### Stage 3 — the harness core (T2: P1–P2)

| #   | Step                                                                                                                                                                                                                                                                                                                                                                                                     | Who      | Waits on | Done when                                       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- | ----------------------------------------------- |
| 3.1 | `AGENTS.md` as the router: the LAWs, the Router tables (knowledge rows included), the Codex project-doc budget and its test; `verify:instruction-entry`, which also refuses a `CLAUDE.md` (Certifipago #791)                                                                                                                                                                                             | Template | Stage 2  | gates green; `AGENTS.md` under the Codex budget |
| 3.2 | `.agents/` structure, the four-runtime projector and `projection-check`; agents with `gradedBy`; `sdd-steward`                                                                                                                                                                                                                                                                                           | Template | 3.1      | `projection-check` green                        |
| 3.3 | Hook-safe test helpers (`withHookGitDir` beside `gitFreeEnv`); the agent write guard; the worktree pruner with Certifipago's ignored-files fix (#789), which also fast-forwards the main checkout last when it is on the default branch (`git merge --ff-only`; when git refuses, it stays and a line says why; a dry run moves nothing; files that differ only in line endings count as local changes and block it), because every Claude Code hook runs from `${CLAUDE_PROJECT_DIR}`, the main checkout, which nothing else moves (Certifipago #846: it sat 1387 commits behind, and a merge gate ran stale for 10 days), and whose test waits for the detached prune to release its scratch before removing it (the Windows EPERM fix of #846); `.claude/launch.example.json`; `core.hooksPath` stays the relative `.husky/_` husky writes at repository level, never per worktree and never absolute (Certifipago found git 2.55 copying an absolute per-worktree value into every new worktree) | Template | 3.2      | each hook has its suite, run in `validate`      |

### Stage 4 — gates (T3: P3–P4)

| #   | Step                                                                                                                                                                                                                               | Who      | Waits on | Done when                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- | ------------------------------------------------------------------------------- |
| 4.1 | Gate registry; review verdict; merge gate; the merge-policy setting (decision 38)                                                                                                                                                  | Template | Stage 3  | registry lists every gate; verdict and merge hooks refuse what they cannot read |
| 4.2 | Architecture contract and `verify:architecture`; skill completeness; project facts                                                                                                                                                 | Template | 4.1      | contract per app and package; gates green                                       |
| 4.3 | `verify:workflow-hardening`; `no-dynamic-inner-html`; `no-unbounded-network` with `verify:scope-coverage` (and the group-wildcard fix of Certifipago #788); `verify:docs-freshness` over `openspec/`; a `format:check` that checks | Template | 4.1      | each gate has a companion test and a rule-enforcement row                       |

### Stage 5 — skills (T4: PS) and flows (T5: PF)

| #   | Step                                                                                                                                                                     | Who      | Waits on | Done when                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | -------- | ------------------------------------------------- |
| 5.1 | Skill modules, each complete; vendored skills adapted through overlays; the security skills with their evals; eval fixtures outside the portable skills, blind eval runs | Template | Stage 4  | `verify:skill-completeness` green; evals runnable |
| 5.2 | Knowledge routing from the build step, the knowledge-routing hook (Certifipago #758, #779)                                                                               | Template | 5.1      | the router table and the hook contract agree      |
| 5.3 | Flow specs; design review owed by changed paths (Certifipago #760)                                                                                                       | Template | 5.2      | one end-to-end test per flow                      |

### Stage 6 — manifest v2, executor and `/init` (T6: P5–P7)

| #   | Step                                                                                                                                                                                       | Who      | Waits on | Done when                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | -------- | ------------------------------------------- |
| 6.1 | Manifest v2 capabilities (sentry, posthog, vercel, workflow, docs, skill packs, runtimes)                                                                                                  | Template | Stage 5  | `verify:manifest` and coverage green        |
| 6.2 | Executor: plan, apply, journal, rollback                                                                                                                                                   | Template | 6.1      | idempotent on a scratch clone               |
| 6.3 | `/init` sections 0–10 with: owners and merge policy (decision 38), workflow SDD or ODD (decision 40), toolchain install (decision 44), artifact language, English by default (decision 48) | Template | 6.2      | every preset initialised in a scratch clone |

### Stage 7 — Certifipago on the core, then the rest (T7: PD2, P8–P12)

| #   | Step                                                                                             | Who                      | Waits on | Done when                                           |
| --- | ------------------------------------------------------------------------------------------------ | ------------------------ | -------- | --------------------------------------------------- |
| 7.1 | PD2: Certifipago onto the versioned core (`harness-lock.json`, generated mirror and projections) | Arquitecto with Template | Stage 6  | `harness:update` moves Certifipago between versions |
| 7.2 | P8 design-system intake, carrying Certifipago's motion pairs, stagger and exit tokens (#713)     | Template                 | Stage 6  | `verify:theme-sync` and the motion gate green       |
| 7.3 | P9–P12: remaining harvest, adopt mode and living docs, round trip, other derived projects        | Template                 | 7.1      | per the Phases table                                |

### Conformance track — Certifipago onto the template's standards (Arquitecto, in parallel)

| #   | Item                                                                                                                                                        | Status                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| K1  | `.gitattributes` pins `.husky/* text eol=lf`                                                                                                                | closed: Certifipago #801 (`084e204fd`)                                       |
| K2  | hooks run `commitlint` and `lint-staged` through `pnpm exec`                                                                                                | closed: Certifipago #785, merged 2026-11-14                                  |
| K3  | `E2E_BASE_URL` falls back to localhost on an empty value, not only on an unset one (`playwright.config.ts:234`, `apps/web/e2e/fixtures/global-setup.ts:47`) | routed to Web                                                                |
| K4  | `engines.node: ">=24.2.0"`                                                                                                                                  | closed: Certifipago #801 (`084e204fd`)                                       |
| K5  | the alias rule names `#src/` (`openspec/config.yaml:70`, `.github/copilot-instructions.md:35-36`)                                                           | closed: Certifipago #801 (`084e204fd`)                                       |
| K6  | `openspec/README.md:9` stops calling Certifipago the template                                                                                               | closed: Certifipago #801 (`084e204fd`)                                       |
| K7  | `claudeMdExcludes` covers the `.agents/skills` mirror                                                                                                       | closed, not a defect: Claude Code reads no file under a `.agents/` directory |
| K8 | D-S2: tests move from `__tests__/` beside their units, `verify:test-location` adapted; D-S5: owner quotes in SDD artifacts translated into English and marked | in Certifipago #820                                              |
| K9 | the 12 cross-workspace relative imports move to `@app/tooling` | closed: Certifipago #813 (`e365b35cf`) |
| K10 | `package-src-alias`: package sources hold `#src/` over imports, re-exports and `import()`, fixed from the file's own path; `no-relative-import-paths` misses re-exports and its fix writes `@/` (template #10) | closed: Certifipago #814 (`b6203bd23`) |
| K11 | `scrubPII` keeps the scrubbed copy of each object it walks, so a shared object costs one walk, not one per path; `sanitizeQueryKey` takes `structuralSegments` and each app passes the values of its `QueryKeySegmentEnum` (template `2026-11-14-scrub-and-query-key`) | adopted on Certifipago `fix/scrub-pii-query-key`, its pull request pending |

## Next steps (2026-11-05, updated 2026-11-12)

PD1 is merged on Certifipago. What follows, in order. Each line names who
decides and what proves it done.

### Certifipago — PD1 follow-ups

| #   | Step                                                                                                                                                                                                                         | Waits on                       | Done when                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| C1  | Instruction files (T11): the LAWs in `AGENTS.md`, product and workflow lines in docs, Codex's project-doc budget raised (decision 39)                                                                                        | the owner's merge              | merged; Codex quotes the last section of `AGENTS.md` from its loaded instructions                    |
| C2  | Route knowledge skills (T16, decision 30): the lifecycle step that needs a knowledge skill names it; a router hook is added only if the measure stays low                                                                    | C1 (both edit `AGENTS.md`)     | the T12 build-skill probes, re-run on the same 32 prompts, load the target more often than 10 of 32  |
| C3  | Merge policy as a setting (T17, decision 38): `manual` stays the default                                                                                                                                                     | C1                             | one documented setting; the merge rule and the merge gate read it; `manual` behaves exactly as today |
| C4  | Design review by change (T15): changed screens, components and sections owe their review skills before a PR                                                                                                                  | nothing (#752 has merged)      | the PR hook refuses a verdict that lacks a skill the changed paths require                           |
| C5  | Backlog "PD1 findings": the reviewer keys on cited lines, the flaky launcher test, one layer list, declarations in packages, the `registry` name collision, `CLAUDE.md` retired (owner decision 2026-11-12, see decision 12) | each passes the five questions | each item checked off or carrying its reason                                                         |

### Template — this repository

| #   | Step                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Waits on                     | Done when                                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| T1  | **P0**: the 351 staged paths landed per verdict, with three CI fixes the first green `validate` surfaced — merged (#2, `9d7787f`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | the owner's OK               | the staged set is committed as reviewable units or reverted per verdict; `ATL_TEMPLATE_SELF=1 pnpm validate` is green            |
| T1a | **SDD-0**: SDD adopted as this repository's first OpenSpec change (decision 42), done on `feat/adopt-sdd` and archived at `openspec/changes/archive/2026-11-11-adopt-sdd/`: `openspec/`, the `sdd` skill, `verify:specs`, `report:spec-drift`; push, pull request and the owner's merge remain; the `sdd-steward` agent moves to T2                                                                                                                                                                                                                                                                                                                                              | T1                           | `verify:specs` green; the change archived                                                                                        |
| T1c | **Priority. `#src` package aliases** (decision 45): each package another workspace consumes from source (`core`, `cloudflare`, `i18n`, `supabase`, `tokens`) declares `"imports": { "#src/*": "./src/*.ts" }` (`i18n` also `"#src/*.json": "./src/*.json"`); its 37 files with relative imports move to `#src/…`; the ESLint overrides that turn `no-relative-import-paths` off in packages go (the core one added in P0 included); `core-import-boundary` accepts `#src/` with a test that pins core's mapping to `./src/*.ts`; code-standards §2 updated. Reference: Certifipago #792, merged as `4784c939b` — merged (#10, `45af225d7`) | T1a | `validate` green; no relative import left in `packages/*/src`; Turbopack, Metro, TypeScript and Vitest resolve `#src` |
| T1d | **Priority. `@app/tooling`** (decision 46): a workspace package, naming no product, holding the test and process scripts every workspace shares (`vitest-sequence.mjs`, `vitest-package-base.mjs`, `process-tree.mjs`, harvested from Certifipago `scripts/`); each workspace declares it as a `workspace:*` devDependency and imports it by name, never `../../scripts/…`; turbo then tracks a change to it, which today it does not (`turbo.json` declares no `globalDependencies` and `test` no inputs); the header comment of `scripts/init-project.mjs`, which says it walks only `.ts .tsx .cjs .js .md` though its `TEXT_EXTENSIONS` covers `.mjs` and `.json`, corrected — done as the OpenSpec change `2026-11-14-tooling-package`: `vitest-package-base` without `fsModuleCache` (a Vitest 5 option), `signalProcessTree` returning false when the tree could not be signalled and is still running, every suite shuffled; `test` is not cached, and the gaps the change found were the root configs no cached task hashed, now `globalDependencies`, and the root `format:check` turbo never ran; `init-project` also renames under `scripts/` | T1c | `validate` green; no workspace imports a root script by relative path; a change to a tooling script or a root config changes the hash of every cached task that reads it (`test` is not cached) |
| T1b | **Living specs** (decision 41): one spec per app and package of the scaffold, written from the code after P0 and verified against a commit — done as the OpenSpec change `2026-11-14-living-specs`: eight specs (packages/core, cloudflare, i18n, supabase, tokens and tooling; apps/web and apps/mobile), 174 requirements; the defects they found are follow-ups F1 to F16 below | T1a | every spec passes `verify:specs`; `report:spec-drift` empty |
| T2  | **P1–P2**: one router and the harness core, carrying what PD1 proved: the LAWs in `AGENTS.md` (decision 12), the Codex project-doc budget gate (decision 39), hook-safe test helpers (decision 33), the read-only agent guard (decision 34); step 3.1 done as the OpenSpec change `2026-11-14-agents-router`: the router, four of the five LAWs, the Codex budget and `verify:instruction-entry` | T1                           | projections and their drift gate green; the budget test and the decoy-`GIT_DIR` tests pass                                       |
| T3  | **P3–P4**: gate registry and project facts, with the architecture contract (decision 32) and the skill-completeness gate (decision 29); the workflow-hardening gate, the `no-dynamic-inner-html` lint rule and the `.env.<name>` ignore (decision 43)                                                                                                                                                                                                                                                                                                                                                                                                                            | T2                           | `verify:architecture` and `verify:skill-completeness` run from the registry                                                      |
| T4  | **PS**: skills in modules, each complete; knowledge skills routed (decision 30); no name collisions (decision 31); the probe harness kept as a repeatable measure; vendored skills adapted through overlays, the security skills with their evals, eval fixtures outside the portable skills and blind eval worktrees (decision 43)                                                                                                                                                                                                                                                                                                                                              | T3, and C2's measured result | the probes meet the bar PS sets, measured on the real setup                                                                      |
| T5  | **PF**: flow specs that name the knowledge skill at each step, and the review routing of design review by change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | T4                           | one end-to-end test per flow                                                                                                     |
| T6  | **P5–P7**: manifest v2, executor, `/init`; section 7 asks owners and the merge policy (decision 38), section 8 the skill modules; section 8 asks the workflow, SDD by default (decision 40); section 8 installs the toolchain and MCP servers it needs, pinned (decision 44)                                                                                                                                                                                                                                                                                                                                                                                                     | T5                           | a scratch clone initialized per preset passes `pnpm validate`                                                                    |
| T7  | **PD2 and P8–P12**: Certifipago onto the versioned core, then the remaining phases                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | T6                           | as the Phases table states                                                                                                       |

Every new mechanism in either list first answers the five questions
(decision 37).

From T1a on, every template step runs as an OpenSpec change of this repository:
proposal, spec deltas, a design when an architecture decision needs one, tasks,
apply test first, verify, archive. The flow `/init` offers by default is proven
on the template's own work first (decision 42).

Order on 2026-11-12, owner (translated from Spanish): "merge everything pending, make a plan
for the rest of what is missing, and include this with priority". Open pull requests land first
(#4 SDD-0, then the retirement of `CLAUDE.md` and #3 Expo SDK 58, which resolve against it; the
`english-only` change last), then T1c and T1d, then T1b and the rest in order.

### Parity ledger

Owner, 2026-11-05 (translated from Spanish): "Remember that if something changes in
certifipago, it should also be implemented in the template and vice versa". Every harness change in one
repository gets its counterpart in the other, done in the same work or recorded
here with the step that carries it. A product-only change says why it does not
apply. A row closes when its counterpart has merged. Template to Certifipago goes
through the `propagate-from-template` skill.

The template holds none of the PD1 harness yet (no write guard, review verdict,
hook-safe test helpers, architecture contract or launch example), so the PD1
fixes reach it through the harvest steps below, which harvest from Certifipago
master after these merges.

**Certifipago → template**

| Certifipago change                                                                                                   | Merged in           | Template counterpart                                                                                                                                                        | Carried by                       | Status |
| -------------------------------------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------ |
| Dead overrides, unused web deps, stale knip ignores (T1a)                                                            | #735                | none: Certifipago's own dependencies                                                                                                                                        | not applicable                   | closed |
| `.claude/launch.json` untracked, `launch.example.json` added (T1b)                                                   | #755                | the same ignore entry and example file                                                                                                                                      | T2                               | open   |
| Product names read from config (T2)                                                                                  | #743                | the registry generator reads the product name from config                                                                                                                   | T2 (P2)                          | open   |
| Per-finding review records (T4, decision 36)                                                                         | #745                | the review record format and its gates                                                                                                                                      | T3 (P3)                          | open   |
| Codex read-only sessions do not relaunch themselves (T5)                                                             | #741                | the projector's Codex read-only launcher                                                                                                                                    | T2 (P2)                          | open   |
| Prompt-audit findings in skill files (T6)                                                                            | #742                | the same fixes in the harvested skills                                                                                                                                      | T4 (PS)                          | open   |
| Agent write guard: Bash writes, continuations, scopes (T7, decision 34)                                              | #753                | the guard and its suite                                                                                                                                                     | T2 (P2)                          | open   |
| Flow gates and hook-safe test helpers (T8, decision 33)                                                              | #752                | `gitFreeEnv`, `withHookGitDir`; the flow gates                                                                                                                              | T2, T5 (PF)                      | open   |
| Merge-result gate, client-side (T9)                                                                                  | #739                | the merge gate in the gate registry                                                                                                                                         | T3 (P3)                          | open   |
| Skill completeness gate (T10, decision 29)                                                                           | #748                | the gate and the per-skill bar                                                                                                                                              | T3, T4                           | open   |
| LAWs in `AGENTS.md`, Codex project-doc budget (T11, decisions 12 and 39)                                             | #756                | the router carries the LAWs; the budget setting and its test                                                                                                                | T2 (P1–P2)                       | closed by `2026-11-14-agents-router`, without the styling LAW (F26) |
| Architecture contract and gate (T14, decision 32)                                                                    | #749                | the contract per app and package; `verify:architecture`                                                                                                                     | T3 (P3–P4)                       | open   |
| Knowledge skills routed from the build step (T16, decision 30)                                                       | #758                | the routed table in the generated router                                                                                                                                    | T4 (PS), T5                      | open   |
| Merge policy as a setting (T17, decision 38)                                                                         | #759                | `delivery.mergePolicy` in the harness config; `/init` section 7 asks it                                                                                                     | T3 (P4), T6                      | open   |
| Design review owed by changed paths (T15)                                                                            | #760                | the path-to-review-skill contract and the PR hook                                                                                                                           | T5 (PF)                          | open   |
| SDD by size: `openspec/`, the `sdd` skill, `verify:specs`, `report:spec-drift`                                       | master `cda657025`  | the same machinery without the product specs; `c4ab3d9`–`72301ed`                                                                                                           | T1a                              | closed |
| `sdd-steward`, the agent that runs a whole SDD change in one context                                                 | master `cda657025`  | the agent and its projections                                                                                                                                               | T2 (P2)                          | closed: `.agents/agents/sdd-steward.agent.md` and its projections (Step 3.2 part B) |
| Vendored-skill overlays (`.agents/skill-overlays/`)                                                                  | #770                | overlays for the template's vendored skills                                                                                                                                 | T4 (PS)                          | open   |
| Security skills and their evals; `security-sweep` triages through `fp-check`                                         | #767, #774          | the same skills without product rows                                                                                                                                        | T4 (PS)                          | open   |
| Eval fixtures outside the portable skills, blind eval worktrees, agents name the skill that grades them (`gradedBy`) | master `cda657025`  | the same in the eval harness and the agent context                                                                                                                          | T2, T4                           | open: `gradedBy` landed in `.agents/agent-context.json` with `verify:agent-context` (Step 3.2 part B); the eval harness, its fixtures and blind worktrees wait for Stage 5 |
| Workflow-hardening gate, `no-dynamic-inner-html` lint rule, `.env.<name>` ignore                                     | master `cda657025`  | the same gate, rule and ignore line                                                                                                                                         | T3                               | open   |
| Knowledge-routing hook (PD1 T19)                                                                                     | #779 (`7c95e77e4`)  | the hook and its contract                                                                                                                                                   | T4, T5                           | open   |
| Package-private `#src` aliases                                                                                       | #792 (`4784c939b`)  | the same aliases in the five template packages                                                                                                                              | T1c                              | open   |
| Shared test and process scripts | master (`scripts/`) | moved into `@app/tooling` by the tooling-package change, `fsModuleCache` left out (Vitest 5) and `signalProcessTree` returning false when the tree could not be signalled and is still running; Certifipago then replaces its 12 cross-workspace relative imports (7 package vitest configs, 3 app vitest configs, 1 mobile script, 1 root script) | T1d, then the Arquitecto session | template done; Certifipago K9 |
| `no-unbounded-network` and `verify:scope-coverage`, with the group-wildcard fix                                      | #775, #788          | the rule, the gate and its fix                                                                                                                                              | Stage 4 (4.3)                    | open   |
| Worktree pruner that keeps worktrees holding unrebuilt ignored files                                                 | #781, #789, #846    | the pruner, the post-merge hook and the Claude hook                                                                                                                         | Stage 3 (3.3)                    | open   |
| `CLAUDE.md` retired; `verify:doc-links` refuses one                                                                  | #791                | retired here by #5; the refusal goes into `verify:instruction-entry`                                                                                                        | Stage 3 (3.1)                    | closed by `2026-11-14-agents-router` |
| Motion pairs, stagger and exit tokens, `verify:motion-pairs`                                                         | #713                | with the design-system intake                                                                                                                                               | Stage 7 (7.2)                    | open   |
| pnpm 11.9.0, `nodeLinker: hoisted` | master | adopted by the pnpm-11 change, except the linker: the template keeps `isolated` with `publicHoistPattern`, since `hoisted` put six `@sentry/core` copies in the Hermes bundle (6.97 to 9.25 MB) | Stage 2 (2.3), D-S6 | closed |
| `pnpm/action-setup` pinned by commit (`b906aff`, v4) | master | pinned the same way in every job and in the CI snippets of `docs/e2e.md` and `docs/responsive.md` | Stage 2 (2.3) | closed |
| Video skills `ffmpeg-skill` and `earshot`, the `docs/video/` convention | #810 (`54c047373`) | none: the template carries no video app; a project that vendors them carries the ffmpeg-skill ledger fixes and the earshot listen-only overlay | not applicable | closed |
| `impeccable.cmd` creates its temporary directory with an atomic `mkdir` instead of a `%RANDOM%` name                 | #790                | none until `impeccable` is vendored here                                                                                                                                    | Stage 5 (5.1), when vendored     | open   |
| The pre-push runs the review skills a change owes (from `review-routing`), each in a clean session; a BLOCKER refuses the push unless adjudicated `refuted` or `owner-accepted`; the reviewer writes `.review-verdicts/<sha>.json` with provenance and `pnpm review:verdict` is read-only; without Codex, both reviews run through a read-only `claude -p` session | #803 (`c4143717c`) | the same pre-push step, once the template has the review verdict and the review routing | Stage 4 (4.1), Stage 5 (5.3) | open |
| `scrubValue` marks only a cycle as `[circular]`, arrays included | master | `scrubPII` does the same and also keeps each walked object's scrubbed copy, since walking a shared object once per path is exponential | `2026-11-14-scrub-and-query-key` | closed by that change |
| `package-src-alias` resolves its fix back through the whole `imports` map, an exact key first, then the longest prefix (#814 hardening) | #814 (`b6203bd23`) | the template's `toSrcAlias` never reads the map, so it writes `#src/x.ts` for `./x.ts` and `#src/dir` for a folder index (F17) | F17 | open |
| Route tests sit in a `__tests__/` folder inside the Expo Router tree, which Metro's default `resolver.blockList` hides from the bundle (K8, #820) | #820 | `apps/mobile/src/app/__tests__/layout.route.test.tsx`; `apps/mobile/metro.config.js` keeps the default list | #15 | closed |
| The board is the source of open tickets: `board:create`, `move`, `comment`, `set-version` and `read` take `--apply`, `board:push` is gone, the plan catalogs only closed tickets (`board:record-closed`), every ticket carries a mandatory version, the production branch is `prod`, one merge queue owned by the Architect | #879 (`9de1f6d91`) | the process: the board as the source of every open ticket in `ticket-flow` and the process template, the closed ticket catalog in `po-ticket` and `general-plan`, held by `verify:skills:test` (TICKET-28 to TICKET-30); the mandatory version, the production branch the layer names and the architect's merge queue were already here (#45); none for the scripts, which the template does not carry | `2026-11-18-board-is-the-source` | closed by this change |
| The pre-push pgTAP run applies the branch's pending migrations inside its rolled-back transaction, through a `DO` block that `EXECUTE`s each file, which Postgres refuses to let commit (it replaced a hand-written SQL lexer) | #878 (`3482afea0`) | `test:db` runs `supabase test db --linked`, which applies no migration of the branch, so a new migration's tests fail until it is pushed | F57 | open |
| pgTAP counts scoped to the test's own rows, so foreign rows on a shared database do not break them | #875 | already holds: every count in `packages/supabase/supabase/tests/rls_profile.test.sql` filters by the test's own ids | — | closed |
| Web e2e runs isolated per run, so parallel runs no longer delete each other's seed | #880 | none: the template's e2e suite seeds no data | not applicable | closed |
| Query keys carry every dynamic value in one trailing params object, which `sanitizeQueryKey` always redacts, with a test that enumerates every factory; the scaffold registry and the service, screen and arch skills teach the shape (CORE-17, MSVC-79) | #887 (`8859d7f84`) | already holds since F.5 (F23): both apps' `queryKeys.constant.ts`, `sanitizeQueryKey` keeping only the registered segments, the test that walks every factory, and the `service`, `screen`, `arch` and `feature` skills | — | closed |

**Template → Certifipago**

| Template change                                                                      | Landed in             | Certifipago counterpart                                                                                                             | Carried by                     | Status |
| ------------------------------------------------------------------------------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------ |
| Hooks run `commitlint` and `lint-staged` through `pnpm exec` (P0 `08752d9`)          | `feat/p0-land-staged` | the same two lines in `.husky/commit-msg` and `.husky/pre-commit` (Certifipago still runs `pnpm commitlint` and `pnpm lint-staged`) | C5                             | closed |
| archify lock: a hash per file and the sigil patch recorded (P0 `e040feb`, `417ae5c`) | `feat/p0-land-staged` | Certifipago's `skills-lock.json` holds one hash per skill and no patch record; check whether its archify carries the sigil patch    | PD2 (one lock format)          | open   |
| `.gitattributes`, with `.husky/* text eol=lf` (P0 `3d31c02`, `c7737fd`)              | #2                    | Certifipago's file lacks the `.husky` pin                                                                                           | Arquitecto, #801 (`084e204fd`) | closed |
| Core console seam, suffix codemod, docs, capability manifest (P0)                    | `feat/p0-land-staged` | none: template code and template-only files                                                                                         | not applicable                 | closed |
| NUL byte escaped in the local lint rules (P0 `1d5ce1c`)                              | `feat/p0-land-staged` | none: Certifipago's rules carry no NUL byte                                                                                         | not applicable                 | closed |
| Core import rules no longer contradict (P0 `91bcd11`)                                | `feat/p0-land-staged` | checked when the lint rules are harvested                                                                                           | T3 (P3)                        | open   |
| The workflow as a setting (decision 40)                                              | this plan             | `workflow.mode: "sdd"` in `.agents/harness.config.json`, the mode it already runs                                                   | C6                             | open   |
| MCP servers pinned to the version resolved at install (decision 44)                  | this plan             | `.mcp.json` runs five servers through unpinned `npx -y`; pinning them is the owner's call                                           | C7 (owner decides)             | open   |
| `E2E_BASE_URL` falls back to localhost on an empty value (P0 `699c6cd`)              | #2                    | two fallbacks that cover only an unset value                                                                                        | Web, via the Arquitecto (K3)   | open   |
| `engines.node: ">=24.2.0"` (SDD-0)                                                   | #4                    | no `engines` field                                                                                                                  | Arquitecto, #801 (`084e204fd`) | closed |
| The template is the reference (decision 47)                                          | this plan             | `openspec/README.md:9` still calls Certifipago the template                                                                         | Arquitecto, #801 (`084e204fd`) | closed |
| `package-src-alias` holds `#src/` in package sources (T1c) | #10 | Certifipago runs `no-relative-import-paths` with `prefix: '@'` (`eslint.rules.mjs:456-458`), whose fix writes `@/` and which never sees a re-export | Arquitecto, K10 | closed |
| `init-project` renames under `scripts/`; the web smoke works on Windows | #9, this change | none: Certifipago has no `/init`, and its smoke scripts already use `process-tree` | not applicable | closed |
| `scrubPII` walks each object once; `sanitizeQueryKey` keeps only the segments the caller registers (`2026-11-14-scrub-and-query-key`) | this change | Certifipago's `scrubValue` walks a shared object once per path, which ran a React DOM node in a console breadcrumb out of memory, and its `sanitizeQueryKey` keeps any letters-only segment | Arquitecto, K11 | open |
| `verify:instruction-entry`, a gate of its own that refuses a `CLAUDE.md` and needs `AGENTS.md` and `README.md` (`2026-11-14-agents-router`) | this change | none needed: Certifipago's `verify:doc-links` refuses the same names; it may move the check into a gate of its own when it converges on the core (7.1) | not applicable | closed |
| F.8, every library behind an adapter (decisions 51, 52 and 58): the registry `.agents/contracts/dependencies.json`, `local/dependency-seam`, `local/wrapped-import` and `pnpm verify:dependency-seams`, the dependency-seam allowlist that only shrinks and ships empty, every seam (`lib/i18n`, `lib/query`, `lib/store`, `lib/storage`, `lib/theme`, `lib/bootstrap`, `lib/routing`, `lib/cache`, `lib/supabase`, `lib/observability`, the `ui/` blocks, the opaque `BackendClientType`), ADR 0002 and the `lib` skill | #40, #43, #44, #47 to #50, #52 and this change | Certifipago's `local/view-import-boundary` covers views only, lets `next-intl`, `react-i18next`, `expo-*` and `react-native-*` pass as platform, exempts type-only imports, has no single registry and no `package.json` check, and its tests mock the vendors; it adopts the registry, the two rules, the gate and the seams | the Arquitecto's adoption program: unit 1 in Certifipago #897 (`4e5dde32b`), with a 712-entry allowlist and its scaffold templates rendered by the gate; units 2 to 9 filed as 12 tickets | open |
| Every registry entry names its owning capability, and a capability owns regions of the files others keep (`2026-11-19-capability-prune-claims`) | this change | none while Certifipago has no capability manifest or `/init`; its `verify:dependency-seams` (#897) refuses an `owner` key, so a registry synced from the template needs the gate's `ENTRY_KEYS` change with it | not applicable | closed |
| A spec header holds several `Governs` lines, and a capability's part of a unit sits in a region of the unit's spec (F63, `2026-11-19-spec-capability-regions`) | #59 | none while Certifipago has no capability prune; a spec synced from the template with several `Governs` lines needs `parseSpec`'s union in its `scripts/specs.detect.mjs`, which keeps only the last line | not applicable | closed |
| The ECC review gates: `verify:skill-frontmatter` (F67), `verify:unicode-safety` (F68), `verify:workflow-pins` with every action pinned to a commit SHA (F69), and a blocking `commitlint` job on pull requests (F66, CI part) | #60 | Certifipago has none of the four: its skills are not held to a 1,024-character description with `USE WHEN:` and `DO NOT USE:`, no gate refuses invisible Unicode, its two workflows pin `actions/checkout`, `actions/setup-node` and `actions/upload-artifact` by tag, and its CI does not lint commits | the Arquitecto | open |
| A dependency-seam allowlist entry counts only under a migration the registry declares open (F59, `2026-11-19-seam-open-migrations`) | #61 | Certifipago's 711 entries name their F.8 unit only in their reason: its registry declares `f8-unit-2` to `f8-unit-7` in `openMigrations`, and each entry gains `"migration": "f8-unit-N"` from that reason, a mechanical rewrite | the Arquitecto | open |
| A Dropped ticket state apart from Closed (F60), and the architect writes, keeps current and merges the closed ticket catalog pull request, the PO doing no repository work (F61, F62) (`2026-11-19-ticket-flow-owner-decisions`) | this change | Certifipago's board and its ticket skills gain the Dropped state and the `<id> dropped` message; the Arquitecto already took over the catalog pull request on 2026-11-19 | the Arquitecto | open |

### Follow-ups the living specs found (2026-11-14)

Each spec states what the code does and records the conflict as an open question; these are the
defects behind them, for changes of their own.

| # | Unit | Defect | Next |
| --- | --- | --- | --- |
| F1 | packages/supabase | `0003_auth_helpers.sql:45` uses the `public.app_capability` type and the RBAC tables that `0004_rbac.sql:39` creates after it, so the migrations should fail at 0003 on an empty database (not checked against one) | done: `2026-11-14-supabase-migrations` (#16, `32bcc38`) |
| F2 | packages/supabase | nothing grants `authenticated` USAGE on the `auth_helpers` schema, so a direct call to `auth_helpers.is_staff()` as that role fails (measured by the supabase-migrations change: the audit-log policy at `0008_rls_policies.sql:49` worked, since a policy resolves its functions when it is created) | done: `2026-11-14-supabase-migrations` (#16, `32bcc38`) |
| F3 | packages/supabase | the profile select policy (`0008_rls_policies.sql:25`) lets every signed-in user read every profile, while its comment and its test section say a user reads their own | done: `2026-11-14-supabase-migrations` (#16, `32bcc38`) |
| F4 | packages/supabase | `rls_profile.test.sql:103` expects an error Postgres does not raise on a filtered update; the pgTAP suite runs in no gate (it needs a live database) | done: `2026-11-14-supabase-migrations` (#16, `32bcc38`) |
| F5 | packages/supabase | `package.json:22` targets the local stack `AGENTS.md:182` forbids, and `src/types.ts` is still the placeholder with no tables | done: `2026-11-14-supabase-migrations` (#16, `32bcc38`) |
| F6 | packages/core | `scrubPII` overflows on an array that holds itself, and drops an object reached under two keys as `[circular]` (`scrubPII.helper.ts:62`, `:67`) | done: `2026-11-14-scrub-and-query-key` (#14, `997a63c`) |
| F7 | packages/core | `sanitizeQueryKey` keeps any letters-only segment up to 24 characters, a username among them, against its own comment (`sanitizeQueryKey.helper.ts:21`) | done: `2026-11-14-scrub-and-query-key` (#14, `997a63c`) |
| F8 | packages/cloudflare | nothing checks the `exp` and `sig` of an R2 signed URL; the Cloudflare Images fallback returns the bare path where `docs/images.md` says the public URL | owner decides the R2 verification |
| F9 | apps/web, apps/mobile | no `Toast` viewport is mounted, so every error toast stays in the store; no ErrorBoundary ships; mobile queues a new toast on every render while a query fails | done: `2026-11-14-error-surfacing` (#15, `53bcd3c`) |
| F10 | apps/web | client components are pinned to the default language and `lang="en"` is written in the layout, so the language switcher writes Spanish and cannot switch back | i18n |
| F11 | apps/web | a valid sign-in submit never calls the auth gateway, and no test drives the origin-guard middleware | small |
| F12 | apps/mobile | the result count shows twice; `useSession` returns a new object per read; the light theme reaches part of the app; two buttons have no action | small |
| F13 | packages/tokens | the web app does not load the Tailwind preset it is documented to, and `verify-theme-sync` compares the dark colors only | small |
| F14 | packages/i18n, apps | English copy is written in components and adapters on both apps, and the catalog key type comes from the Spanish catalog | i18n |
| F15 | packages/cloudflare | a Turnstile test is titled "does not throw an unhandled rejection" and asserts that the call rejects | test title |
| F16 | packages/tooling | the `signalProcessTree` declaration does not say it needs a child spawned with `TREE_SPAWN_OPTIONS` to reach the whole tree on POSIX | doc |
| F17 | eslint-local-rules | `toSrcAlias` (`package-src-alias.detect.mjs:32-45`) keeps the specifier's extension and folder form, while every package maps `#src/*` to `./src/*.ts`: its fix turns `./x.ts` into `#src/x.ts`, which resolves to `./src/x.ts.ts`, and a folder import into `#src/dir`, which misses the folder's index; Certifipago #814 found and fixed both | small |
| F18 | packages/core | `scrubPII` now returns a graph that shares each scrubbed copy where the input shared the object, so a serializer with no depth limit writes a shared copy once per path that reaches it (found by the scrub-and-query-key review, advisory) | small |
| F19 | packages/supabase | under Supabase's default privileges `anon` keeps EXECUTE on `public.has_capability`, against SUPABASE-17 (Q6 of the spec) | security; small |
| F20 | packages/supabase | Supabase's default privileges give `anon` and `authenticated` TRUNCATE on every table, which bypasses row-level security and the audit log's row trigger | security |
| F21 | packages/supabase | `profile_update_self` limits rows, not columns: a user can set their own `status` and `credit_balance` | owner decides which columns a user edits |
| F22 | packages/supabase | `_setup.test.sql` holds no TAP plan, which pg_prove likely fails; no offline check guards the migration order; `gen:types` empties `src/types.ts` when the command fails | small |
| F23 | packages/core, apps | `sanitizeQueryKey` keeps a typed value equal to a registered word, such as `QueryKeys.items.list('list')`; keeping only the prefix `QueryKeys` builds would close it, in both repositories | design |
| F24 | conventions | enum member casing has no rule: the template's code uses PascalCase (`ErrorStateCodeEnum.Forbidden`), `docs/code-standards.md` shows `QueryLimitsEnum.DEFAULT_PAGE_SIZE`, and Certifipago uses upper snake case | owner decides; then a `naming-convention` `enumMember` selector in both |
| F25 | apps/web, apps/mobile | left open by the error-surfacing change: whether a failed query shows the screen's `ErrorState` instead of a toast (web Q3, mobile Q1), whether a crash a boundary catches is reported to observability, and that every component watching one failing query queues its own toast | owner decides |
| F26 | apps/web, apps/mobile | Certifipago's styling LAW (only `ui/` blocks own their look; everything else only positions) is false here: screen-local `*.style.ts` files hold colour and type classes, and both apps hold arbitrary values and raw hex in style files | owner decides: move the look into `ui/` and add the rule, or keep the template's convention |
| F27 | harness | no gate checks that every Router row of `AGENTS.md` names a shipped skill and every skill has a row, so a project that drops `sdd` or `archify` at `/init` keeps their rows | step 3.2 (`verify:router-coverage`) |
| F28 | packages/supabase | Supabase's default privileges give `anon` and `authenticated` TRIGGER, REFERENCES and MAINTAIN on every table; with TRIGGER, a signed-in user attaches `auth_helpers.tg_audit_immutable()` to a table and blocks its writes | in F.2 |
| F29 | packages/supabase | the verifier of the signed image URL signs the path and query only, so one secret serving several hosts accepts a URL on any of them | design, recorded |
| F30 | apps/web | `tailwind-merge`, which `tailwind-variants` runs by default, takes the token font sizes (`text-button`, `text-title`) for colours and drops them next to a text colour, so the web `Button` renders without `text-button`; `ui/Text`, `ui/Divider` and `ui/Avatar` already set `twMerge: false` | done: this change |
| F31 | apps/web | `next/font/google` fetches the fonts at build time, so a network blip fails `validate` and CI (three times on 2026-11-14 and 15); self-hosting them with `next/font/local` removes the dependency | done: this change |
| F32 | apps/web | the self-hosted fonts are full-charset TTFs, about 1.6 MB, and `next/font/local` preloads all seven, where Google served small latin woff2 subsets; Montserrat 500 looks unused | done: this change, with Certifipago's Latin variable woff2 files from its commit 70f653001 |
| F33 | harness | a scheduled CI job that runs `pnpm mcp:docs` and opens a pull request when an MCP server releases (Q1 of `2026-11-15-mcp-docs-updater`) | waits on the owner: CI is high-risk item 5 |
| F34 | apps/web, packages/tokens | tailwind-merge knew only the token font sizes, so two classes of one utility with token names were both kept (`p-sm p-lg`, `px-pill-x px-lg`, `top-knob-inset top-sm`) and a token shadow was dropped next to a shadow colour (`shadow-card shadow-accent`): 12 of 25 probe pairs wrong; found by Certifipago Web #849 | done: this change |
| F35 | apps/web | the web View all, settings and Google buttons have no action, which F12 fixes on mobile only; WEB-01 and WEB-11 state them | small; the F12 rule for web |
| F36 | apps/web, security | the origin-guard matcher exempts any path that only starts with an exempt name: `/imagesadmin`, `/fonts-private/x`, `/favicon.icox` and `/_next/staticfoo` skip the guard; anchor the pattern (`images/`, `fonts/`, `favicon.ico$`); found by the F.5 verifier, there before it | done: this change |
| F37 | both apps | when the items query fails, the caption shows "0 results" beside the `ErrorState` | done: this change |
| F38 | both apps | `useItems` keys its query by `search` only, but its `queryFn` also reads `limit`, so two limits share one cache entry | done: this change |
| F39 | apps/web, packages/tokens | a custom property resolves its `var()` where it is declared, and the generated theme declares on `:root`: a token that must follow an element-scoped or `@property`-animated variable has to be read with `--theme(<token> inline)`, and a nested `[data-theme]` scope would not re-resolve the `@theme` colours; tailwind-merge reads the hand-written `bg-accent-gradient` as a colour, so a later `bg-<colour>` drops it. Neither bites today (no `@property`, the theme on `html` only, no block combines the gradient with a colour); found by Certifipago #853 | note; a guard test when the first `@property` arrives |
| F40 | apps/web | the active locale lives in the `NEXT_LOCALE` cookie, so since F.6 every route renders its content per request (`/`, `/login` are partial prerenders: a static shell, per-request content); a `/[locale]` URL segment would restore full prerendering and give each language its own URL, at the cost of new routes and a matcher change | decided (decision 60): keep the cookie |
| F41 | harness | the ticket flow keeps every merge on the owner's word (its rule 4), while decision 38's `low-risk` merge policy lets an agent merge a green, current pull request whose Risk line is `none`; which wins for a project that picks `low-risk` | done: this change (the owner: `/init` decides, `manual` by default, `low-risk` as the option) |
| F42 | harness | `.claude/skill-registry.md` lacks `archify`, `general-plan`, `propagate-from-template` and `sdd` (it was stale before the ticket flow added its seven) | done: this change |
| F43 | both apps | when the items query fails, the stats card still shows a total of 0 beside the `ErrorState` (F37 fixed only the list caption) | done: `2026-11-19-app-follow-ups` (the stats card shows only its header beside a failed load) |
| F44 | harness | `runtime-verify` and `validate-all` declare no `USE WHEN:` in their frontmatter, so the regenerated registry flags them | done: `be6da1b` (both frontmatters declare `USE WHEN:` and `DO NOT USE:`) |
| F45 | apps/mobile | Expo published `expo` 58.0.26 and `expo-router` 58.0.32 on 2026-11-17 at 12:01 UTC, and CI's `expo-health` fails every branch on the patch mismatch; pnpm 11's `minimumReleaseAge` (24 hours) refuses them until 2026-11-18 at 12:01 UTC, and the owner chose to wait rather than add exceptions | done: this change, on 2026-11-18 after 12:04 UTC, with no exclude entry |
| F46 | both apps, privacy | PostHog keeps a distinct id in a cookie or local storage and records the client IP unless the project discards it, which some jurisdictions treat as needing consent; and its URL scrub drops the query and fragment but not a secret inside a path segment (`/reset/<token>`), found by the native review | done: this change (the consent mode); the path-segment scrub stays open in F54 |
| F47 | apps/web | without Sentry, an error thrown only on the web server is not captured; PostHog captures it server-side only through `posthog-node`, a new dependency | owner decision: add `posthog-node` |
| F48 | apps/web | `posthog-js` ships in the client bundle even without a key, one chunk of about 374 KB before compression; load it only when a key is set | done: this change (the SDK loads by dynamic import only when it may run) |
| F49 | harness | a Sentry prune leaves the Sentry keys in both `.env.example`, the mobile vitest alias, `@sentry/cli` in `allowBuilds`, mentions in `README.md`, `docs/infrastructure.md` and ADR 0001, and specs that cite the removed Sentry tests; the `sentry` capability should claim or rewrite each | done: `2026-11-19-capability-prune-claims` (capability-owned regions in both `.env.example`, the mobile vitest alias, `allowBuilds` and the global map; `README.md`, `docs/infrastructure.md` and ADRs 0001 and 0002 rewritten; the Sentry requirements moved into `openspec/specs/apps/web/sentry/spec.md` and `openspec/specs/apps/mobile/sentry/spec.md`, the owner's interim exception to § 2.1 of `openspec/README.md`, F63; `prune-boundary` reports a kept spec citing a deleted file, a relative path to one, and an orphaned env key; a Sentry prune leaves 0 leaks, from 16) |
| F50 | both apps | test ergonomics the native review and the writer found: `posthog-react-native` cannot load under the mobile vitest setup (a shared alias would replace two per-test mocks), the Sentry adapter test leaks an env var, and `identify` takes an id it does not guard | done: `2026-11-19-app-follow-ups` (one shared `posthog-react-native` stand-in, the DSN restored with `vi.stubEnv`, a blank id identifies nobody) |
| F51 | harness | a shipped skill named a downstream project, which that project's core-purity gate refuses on sync; the examples are neutral now (#37), but no template gate stops a skill from naming one again | small; a check in `verify:skills` or a core-purity gate |
| F52 | harness | when `/init` drops a capability (Sentry, mobile, Supabase), its entries in `.agents/contracts/dependencies.json` and their seam globs go stale, and `verify:dependency-seams` fails in that project; the manifest should claim each capability's registry entries so the prune removes them | done: `2026-11-19-capability-prune-claims` (every registry entry names its owning capability in an `owner` field, which `verify:manifest:coverage` holds to the manifest; a prune drops the entries it owns, and a `remove-dep` that removes a package from its last `package.json` drops its entries too; the `supabase` capability removes `@app/supabase` and `@supabase/*` from the apps; `verify:dependency-seams` passes after the `sentry`, `mobile-expo` and `supabase` prunes) |
| F53 | harness | the native review of F.8 unit 1: `verify:dependency-seams` skips an unreadable `package.json` silently and miscounts with a malformed registry; the rule caches the registry for an editor session, untested detection branches remain, and the seam rule covers `apps/*` and `packages/*` only (root scripts import no vendor today) | done: `2026-11-19-harness-follow-ups` (an unreadable or non-object `package.json` fails closed, a refused registry prints no count, every detection branch has a case; the editor-session cache stays) |
| F54 | both apps, privacy | under `opt-in` both PostHog SDKs still request remote config and `/flags` at start, before consent (the client could start only after a grant); what `granted` stored is not cleared when a project switches to `opt-in`; the URL scrub drops the query and fragment but not a secret inside a path segment; and the native review's warnings on the mobile consent storage (its write paths, a launch opt-in that is not handled, an open failure state, an untested re-grant) | the deferred client is done (this change, the owner's option 2); open: a web revoke's `reset()` makes one `/flags` request with the new anonymous id, what `granted` stored is not cleared on a switch to `opt-in`, the path-segment scrub, and the mobile consent-storage warnings | small |
| F55 | harness | after F.8 unit 1b, `verify:allowlist-freshness`, `verify:maps` and `verify:tests` still walk the web and mobile app folders by name, a React package under `packages/` would get the shared rules but not the React set, and `packages/tokens` keeps browser globals and React rules it does not need | done: `2026-11-19-harness-follow-ups` (the React set reaches every workspace that declares `react`, `packages/tokens` runs with the Node globals, and the three gates read the workspace list of `scripts/eslint-config.detect.mjs`; identical findings before and after) |
| F56 | both apps, privacy | the native review of the deferred PostHog client (F54), two advisory findings left open: on mobile, a revoke drops the client without shutting it down, so its flush timer lives on beside the client a later grant builds, while `reset` keeps the event queue, so a `shutdown` would send it after the revoke; on web, one held call that throws when the SDK loads loses the calls after it and rejects the start | small; decide what a revoke does with the queued events, then shut the dropped client down, and run each held call on its own |
| F57 | packages/supabase | `test:db` (`supabase test db --linked`) runs pgTAP against the linked project's applied schema, so the tests of a branch's new migration fail until `db push`; Certifipago #878 applies the pending migrations inside the rolled-back transaction instead | a change of its own |
| F58 | harness | no ticket-flow message tells the architect about the PO's closed ticket catalog pull request, so nothing routes it to the merge queue (found by `2026-11-18-board-is-the-source`, its Q1; Certifipago has the same gap) | done: this change |
| F59 | harness | with F.8 closed and the allowlist empty, `verify:dependency-seams` still accepts a new allowlist entry whose reason names an F.8 unit from 2 to 8 while its import breaks the rule, so only review keeps the allowlist empty (found by F.8 unit 9); the owner decided on 2026-11-19 (translated from Spanish): "Only open migrations": an entry must name a migration the project declares open in `.agents/contracts/dependencies.json`, and the template declares none, so it refuses every entry | done: `2026-11-19-seam-open-migrations` (#61: the registry declares `openMigrations`, empty in the template; an allowlist entry names one, and a declared migration no entry names is stale) |
| F60 | harness | the ticket flow has no outcome for a ticket dropped or superseded instead of delivered: the closed ticket catalog records every Closed ticket as delivered work (found by Certifipago, whose PO closed TASK-i18n-seam as superseded) ; the owner decided on 2026-11-19 (translated from Spanish): "A state of its own": a Dropped state apart from Closed | done: `2026-11-19-ticket-flow-owner-decisions` (a Dropped state on the PO's word, reachable from Backlog to Ready to merge, announced by `<id> dropped`, recorded in a catalog table of its own) |
| F61 | harness | nothing says who brings the PO's closed ticket catalog pull request current when it conflicts with its base (the open question of `2026-11-18-catalog-merge-message`); the owner decided on 2026-11-19 (translated from Spanish): "Better that the architect creates the PR and takes care of closing it; the PO should not do any code, or at least avoid it": the architect writes the catalog rows, opens the catalog pull request, keeps it current and merges it, and the PO does no repository work | done: `2026-11-19-ticket-flow-owner-decisions` (the architect writes, opens, keeps current and merges the catalog pull request under the merge policy, which the owner confirmed on 2026-11-19, translated from Spanish: "Follow the policy"; the PO does no repository work) |
| F62 | harness | `po-ticket` does not say what the PO does when the architect returns a catalog pull request whose rows do not match the board (`2026-11-19-catalog-board-check`, its assumption A1: the architect comments the mismatch and asks the PO `<id> question`), and its Step 4 answers `<id> question` only about scope; superseded by F61's decision, since the PO no longer opens a catalog pull request | done: superseded by F61 (`2026-11-19-ticket-flow-owner-decisions`): the architect corrects a mismatched row from the board itself |
| F63 | harness | the per-app Sentry specs of F49 are an exception to § 2.1 of `openspec/README.md`, one spec per architectural unit, which the owner approved as interim on 2026-11-19 (translated from Spanish): "I approve option 1, continue with the plan, but we also have to find a way to centralize it anyway. Because rather than opening exceptions, we have to see how we can adapt it"; adapt the rule so one spec per unit holds the part an optional capability adds and its prune still takes it (for example, the `Governs` list moves from the § 2.1 table into each spec, where a region can drop a capability's lines), then fold `apps/web/sentry` and `apps/mobile/sentry` back and remove the exception | done: `2026-11-19-spec-capability-regions` (a spec header may hold several `Governs` lines, read as their union; the Sentry part of each app spec sits in a `sentry` region, WEBSENTRY-01..04 and MOBILESENTRY-01..03 retired as WEB-81..84 and MOBILE-80..82; the § 2.1 table no longer repeats the governed paths and the exception is gone; the owner approved the design on 2026-11-19, translated from Spanish: "approved") |
| F64 | harness | Stage 6 step 6.2, the prune executor, inherits two findings of `2026-11-19-capability-prune-claims`: a file a kept capability claims and another capability's `remove` deletes leaves a stale claim (7 after a `web-next` prune, 1 after a `mobile-expo` prune), so the executor drops every claim on a file it removes; and a prune of an installed checkout makes `pnpm install` fail with `ERR_PNPM_IGNORED_BUILDS` for a build whose `allowBuilds` entry the prune took, so the executor removes `node_modules` first; after F63 a `mobile-expo` prune leaves no stale claim (1 before) and a `web-next` prune leaves the six `sentry` claims on web root files (7 before) | with Stage 6 |
| F65 | harness | the prunes `2026-11-19-capability-prune-claims` did not cover: the `supabase` prune leaves imports, 16 spec citations, 4 `.env.example` keys, 16 global-map rows and a frozen exception in `scripts/verify-tests.mjs`; the `mobile-expo` prune leaves lint-rule cases that read mobile files, 99 global-map rows, a knip hint and spec citations of mobile config files; the `i18n`, `cloudflare` and `design-tokens` prunes keep dependencies their registry entries name; Sentry is still named in `docs/observability.md`, `docs/architecture/web.md`, `docs/architecture/mobile.md`, the env table of `AGENTS.md` and a comment in `pnpm-workspace.yaml` (the known-gaps table of `docs/manifest.md`), and, found by the independent verifier, in `docs/maps/global-map.md:99`, `openspec/specs/packages/core/spec.md:666-670` and the count of `pnpm-workspace.yaml:14`; a `web-next` prune leaves `@app/cloudflare` stale in the registry and 5 kept spec citations of web tests | before Stage 6 |
| F66 | harness | the LAW "A rule is not edited to fit the work" is enforced by review only, and `--no-verify` skips commitlint with no check in CI: a pre-edit hook, written once in `.agents/` and generated per runtime, asks the human before an agent edits a rule file (lint configs and local rules, allowlists, `.agents/contracts/**`, `scripts/verify-*.mjs`, `.claude/skills/**`, `AGENTS.md`, `template.manifest.json`), and CI runs commitlint over the pull request's commits; the owner asked on 2026-11-19 (translated from Spanish): "Adapt what you recommend into the plan and continue", after a review of https://github.com/affaan-m/ecc (MIT), whose mechanisms are rebuilt here, never copied | commitlint in CI done: `9d84080` (a blocking `commitlint` job lints every commit of a pull request); the hook: design first, then medium. A test on 2026-11-19 with `claude -p` found that a PreToolUse hook returning `ask` refused the write both in the default mode and under `--dangerously-skip-permissions`, so bypass does not auto-approve it; the interactive prompt under bypass is still to be seen |
| F67 | harness | only the seven ticket skills have their frontmatter checked, and the descriptions of `refine-ticket` (1,539 characters) and `general-plan` (1,044) exceed the 1,024 a skill description may hold, so `refine-ticket` reaches the model truncated: a gate checks every `SKILL.md` (name, an inline description within 1,024 characters, `USE WHEN:` and `DO NOT USE:`), and the two descriptions are shortened; the owner asked on 2026-11-19 (translated from Spanish): "Adapt what you recommend into the plan and continue", after a review of https://github.com/affaan-m/ecc (MIT), whose mechanisms are rebuilt here, never copied | small |
| F68 | harness | no gate refuses invisible Unicode (zero-width, direction overrides, the tag block U+E0000 to U+E007F) that can hide instructions in a vendored skill or a pulled change: a gate fails on them in every tracked text file, the emoji joiner of `packages/i18n/src/locales/**` excepted; the owner asked on 2026-11-19 (translated from Spanish): "Adapt what you recommend into the plan and continue", after a review of https://github.com/affaan-m/ecc (MIT), whose mechanisms are rebuilt here, never copied | done: `7bd85c9` (`verify:unicode-safety` refuses zero-width, direction-override, tag-block and invisible filler characters in every tracked text file, the emoji joiner of the locales excepted; the repository was already clean) |
| F69 | harness | `.github/workflows/*.yml` pins `actions/checkout`, `actions/setup-node` and `actions/upload-artifact` by tag, and downstream projects inherit the file: every `uses:` is pinned to a full commit SHA with its tag as a comment, and a gate fails a `uses:` that is not; the owner asked on 2026-11-19 (translated from Spanish): "Adapt what you recommend into the plan and continue", after a review of https://github.com/affaan-m/ecc (MIT), whose mechanisms are rebuilt here, never copied | done: `72b29e0` (every `uses:` pinned to its commit SHA with the resolved tag as a comment, no version changed; `verify:workflow-pins` fails a `uses:` that is not a full SHA) |

---

## Decisions

Locked decisions 1–11 in GENERALIZATION_PLAN.md still hold (zero allowlists,
superset + prune, manifest verbs, LLM produces data only, skills and templates,
provenance + update command, prunable docs, read-only donor, branch strategy at
init, markdown first, diagrams from specs). This plan adds:

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 12  | `AGENTS.md` is the single router and shared instruction file for every runtime. There is no `CLAUDE.md`: owner decision 2026-11-12 (translated from Spanish: "CLAUDE.md should no longer exist"), which supersedes the earlier `@AGENTS.md` import. Any Claude-only content lives under `.claude/`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 13  | `.agents/project.config.json` is the only file that names the project (identity, vocabulary, stack, paths). Every other machinery file is product-free, enforced by a core-purity gate.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 14  | Skills hold procedure, never values. Values live in `.agents/contracts/*.json`; a skill names the contract keys it reads.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 15  | Generated outputs are never hand-edited. Each output has exactly one writer and a drift gate (projections, registry, tokens mirrors, diagrams).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 16  | `/init` has three modes: **new** (prune the superset), **adopt** (an existing codebase: add harness and knowledge, prune nothing) and **reconfigure** (re-run one section). Every mode goes through the same answers file and executor.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 17  | `validate` becomes a gate registry. Capabilities add or remove gates by data, never by editing a command chain.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 18  | **Decided 2026-11-04: option A, vendored and versioned.** The template is the upstream of the harness core. Each derived project, Certifipago included, carries the core as files plus `harness-lock.json`, and moves between versions with `harness:update`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 19  | Nothing is harvested, and nothing stays in the core, without a keep or fix verdict from the PA audit, backed by usage, health and correctness evidence.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 20  | The default skill set is not chosen by past usage counts. It is grown one skill at a time and kept only while it fits the listing budget and each skill triggers on its own requests (PS, tiers a–c). Packs are derived from the `/init` answers — product intent (marketing, product work), apps (web, mobile, both), backend — and shown for confirmation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 21  | Every contract has a JSON schema, and `/init` writes contracts only through it. Counts and dated numbers appear only in gate or generator output, never in prose, contracts or skill text.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 22  | Vendored skills are never edited in place. Project adaptations live in an overlay or a contract. When a fix must change vendored code, it is kept as a recorded patch over upstream (listed in the lock, applied on update, offered upstream), never as a silent edit.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 23  | The delivery gate runs on the merge result (an up-to-date branch or a merge queue), not only on each branch. `/init` section 7 sets where it runs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 24  | `/init` detects conflicts between the user-level `~/.claude/CLAUDE.md` and the project (worktree location, skill registry, commit timing, task tracking, memory) and writes one precedence line.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 25  | Every audit finding lives in the remediation backlog (`docs/audits/2026-11-04-remediation.md`), hand-maintained from its first, generated version. A phase closes only when each of its items is checked or carries a written reason. `pnpm harness:audit` (P3) re-runs findings and keeps status in a separate hand-owned file.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 26  | Agents follow the same rule as skills: procedure in the definition, values in contracts. Conventions (language, roots, suffixes, test style, e2e tool, security and design rules, model per runtime) come from `contracts/conventions.json`, which `/init` writes and adopt mode detects. Read-only is enforced by a mechanism (a hook on every write path; in Codex a session-level read-only sandbox, because agent files cannot set one), never by prose.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 27  | Flows are first-class. Each canonical flow is a spec (`flows/<name>.flow.json`: ordered milestones, the gate at each step, approval points, handoff artifacts). The router in `AGENTS.md` is generated from the flow specs; every approval point is enforced by a hook or gate, never by prose; and every flow has an end-to-end test on a fixture repo built from `answers.json`. Skills and agents are judged by the flows that use them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 28  | The harness must load where sessions start. In adopt mode it is installed at (or registered for) the directory sessions open in, and a session-start self-check compares the skills and agents actually loaded with the registry and fails loudly on a gap. A harness that never loads is worse than none: it looks present.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 29  | Every skill that ships is complete: a `SKILL.md`, a description of at most 500 characters that leads with the user's words and names a DO NOT USE sibling, an `evals/evals.json` with at least three cases (prompt, expected output, assertions), and a template (a `templates/` file or an Output section) that its evals assert. A skill missing a part is completed, never removed. `verify:skill-completeness` holds it in `validate`. Skills ship in modules; `/init` asks which modules a project installs, and a module installs all of its skills (owner, PD1 L8, L10).                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 30  | Knowledge skills are routed, not left to their descriptions. Measured on Certifipago's real setup (PS round 3): build-knowledge skills loaded on their own task prompts 10 times out of 32 within three turns, although every one was listed; the agent explored the code instead. Each PF flow names the knowledge skill at the step that needs it, and the front door of a concern points at its knowledge skills.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 31  | Project skill names never collide with user-level or plugin skills. `/init` and adopt check the project's names against the user's skills and plugins and rename the project's copy (PS round 3: a request for `registry` loaded the user-level `skill-registry`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 32  | Folders are a contract. `.agents/contracts/architecture.json` names each app's and package's layers, the folders each holds, the suffix policy of each folder, and the apps the shared layer table covers; `verify:architecture` holds the tree and the architecture docs to it, and pre-commit runs it over the staged index. It is the one layer list: the structure gate's vocabulary is read from it, not kept beside it. `/init` section 3 writes it (owner, PD1 L13).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 33  | Harness tests are safe inside git hooks. Every test that spawns git or a child process does it with the GIT\_\* variables removed (`gitFreeEnv`), and each suite proves it by running its end-to-end flow under a decoy `GIT_DIR` (`withHookGitDir`). A harness change is integration-tested in a separate clone with its own git config, never in a worktree that shares the developer's (PD1 L15, L16: a hook-exported `GIT_DIR` wrote `core.worktree` and a test identity into the shared config).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 34  | A guard refuses what it cannot read. A command parser in a hook never chases every shell form: a construct it cannot read is refused for the agents it polices (PD1 L21). Guards are tested live where checkouts really live, temp-dir clones included, with the attempt framed as an authorized test so a compliant agent makes it (PD1 L22: a repository under a temp dir was writable by read-only agents until the repository was judged before the scratch roots).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 35  | The always-loaded context is a cost. Every session carries the instruction files and the skill listing before the user's first word (about 100K tokens on Certifipago's real setup, rewritten to the cache on every session whose prompt differs). The instruction-file budget (P1) and the default skill set (PS) are measured per session, and probe batches are forecast in plan quota and API-price dollars before they run (PD1 L18, L19).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 36  | The peer-review record is one file per finding from the first commit (PD1 T4). A finding on a commit that created its file is keyed on the whole file and replays on every later push, so a fix in a later commit never closes it: it is recorded as `ticketed`, naming the fixing commit. The reviewer keys on the cited lines only (backlog item).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 37  | A new mechanism enters the harness only after five questions have clear answers: what measured problem does it solve; what capability does it add; can it be explained without its name; is it needed now; would it still be worth having if its name did not exist. "Graph engineering", context-provider MCPs and a production "performance factory" were weighed this way on 2026-11-05 and left out for now: flows already are state machines (decision 27), and the rest adds tokens and work a single-owner, pre-launch product does not need (owner, PD1 L31).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 38  | The merge policy is a setting, not a sentence. `manual` (the default): an agent merges a pull request only when the owner asks for it. `low-risk`: a green, up-to-date pull request whose Risk line is `none`, or that changes only passive files, may be merged by the agent; any other waits for the owner. `/init` section 7 asks which; Certifipago stays `manual` (owner, PD1 L31).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 39  | Codex loads at most `project_doc_max_bytes` of project `AGENTS.md` files (32 KiB by default) and drops the rest silently; the user-level file has its own budget. The generated Codex config sets the budget, and a test fails when `AGENTS.md`, counted with CRLF endings, outgrows it (PD1 T11: the LAWs pushed it to 38 KB).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 40  | The workflow is a choice of `/init` (section 8): **SDD**, the default, or **ODD**. SDD is Certifipago's model since 2026-11-10: OpenSpec in the repository, chosen by size (a change that adds, modifies or removes a living-spec requirement, or creates a unit with no spec, runs the full lifecycle; a small change needs no spec), `verify:specs` on shape and `report:spec-drift` on specs whose code moved past them. ODD is the feature-document workflow; a project that chooses it commits its feature document, never leaves it untracked: Certifipago's PD1 document, untracked in a worktree, was lost when that worktree was removed before 2026-11-11, the reason Certifipago's `adopt-sdd` proposal gives for leaving ODD. Certifipago itself has no such choice (`AGENTS.md:66` at `cda657025`), so offering one is new design, not a harvest (owner, 2026-11-11).                                                                                                                                                                            |
| 41 | The template ships its living specs: one per app and package of the scaffold, written from the code after P0 and verified against a commit, so a derived project starts with specs; `/init` keeps the specs of the capabilities it selects, and drops the `openspec/README.md` § 2.1 row of each spec it removes, a Markdown edit no manifest verb makes today. Certifipago's 26 specs describe its product and are not harvested; its six templates, the generic sections of its README and its spec gates are. |
| 42  | The plan runs through SDD: from T1a on, every template step is an OpenSpec change of this repository. The first change adopts SDD itself, as Certifipago's `2026-11-10-adopt-sdd` did, so the flow `/init` offers by default is exercised on the template's own work before a project relies on it (owner, 2026-11-11).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 43  | Certifipago's harness changes of 2026-11-06 to 2026-11-11 are harvested by theme: SDD (decision 42); vendored-skill overlays, re-applied on upstream updates; the security skills (`differential-review`, `fp-check`, `sharp-edges`, `security-hardening`) with `security-sweep` triaging through `fp-check`; eval fixtures outside the portable skills and blind eval worktrees; agents that name the skill grading them (`gradedBy`); the workflow-hardening gate, the `no-dynamic-inner-html` lint rule and the `.env.<name>` ignore. Product-only changes are not harvested.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 44  | `/init` installs the toolchain the chosen harness needs and the template does not vendor: the latest release of gentle-ai (which brings engram and gga and configures the chosen runtimes through `gentle-ai install`, `upgrade` and `sync`), the CodeGraph CLI, and every MCP server, connector or plugin the selected capabilities call for (from Certifipago's `.mcp.json`: next-devtools for web-next, shadcn for the web UI kit, expo, metro and react-native-docs for mobile-expo). It lists each one with its source and the version it would install, installs only on the owner's yes, pins the version it resolved as latest (in the harness lock, and as `package@version` in `.mcp.json`, where Certifipago runs unpinned `npx -y`), and ends with `gentle-ai doctor` and a handshake with each MCP server. Verified 2026-11-11 on the owner's machine: gentle-ai 4.3.1 from `go install`, CodeGraph 1.4.1 from npm; the install command for a machine without Go is checked against gentle-ai's release documentation in P7 (owner, 2026-11-11). |
| 45  | A package imports its own files through a private `#src` alias declared in its `package.json` `imports`, never by relative path, so a file moves without rewriting its neighbours and the alias rule holds in packages as it does in apps. Verified 2026-11-12 (Certifipago #792): Turbopack (Next 16), Metro 0.87, TypeScript with `moduleResolution: bundler` and Vitest resolve `#src`; Node refuses a relative target that leaves the package but accepts a package name as target. The `#` keys carry no project name, so `/init` never rewrites them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 46  | Scripts that every workspace imports live in a workspace package, `@app/tooling`, declared as a `workspace:*` devDependency and imported by name, so the dependency is explicit and turbo can track it; a root `scripts/` file is for repository gates, not for code other workspaces import. `scripts/init-project.mjs` already renames `@app/` in `.mjs` and `.json`, so derived projects receive it without changing `/init`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 47  | The template is the reference standard (owner, 2026-11-13). A project starts from it; an improvement proven in a derived project is adopted here adapted to the template's standards (English-only, its code standards, an OpenSpec change); then the derived project is asked to conform, Certifipago through its Arquitecto session, others through `propagate-from-template`. It extends decision 18, which made the template the upstream of the harness core: the template now also owns the conventions. Where the two repositories differ on a convention, the owner decides once (Roadmap, Stage 1) and both follow.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 48  | `/init` asks the artifact language — specs, docs, code comments, commit and pull request text — with English as the default, separately from the conversation language (owner, 2026-11-13). The template itself stays English-only. `/init` writes the choice where the SDD artifacts and the skills read it (`openspec/config.yaml` and the `AGENTS.md` rule), so a project that chooses another language quotes and writes in it. When the owner picks another artifact language, `/init` drops the `english-artifacts` capability, so `verify:english` does not hold the project to English.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 49 | `/init` asks what runs before a push, from the cheapest up (owner, 2026-11-13): **husky only** (the default: `pre-commit` runs lint-staged, `commit-msg` runs commitlint, and CI runs `validate`); **pre-push gate** (refuse a push to the protected branch, check the commit author when the host deploys by author, run the database tests when SQL changed, `validate`, mutation on changed lines); **peer review** (each pushed commit reviewed by Codex, or by a read-only `claude -p` session when Codex is absent, with one adjudication record per finding); **review skills owed** (the skills the review routing says the changed paths owe, each in a clean session; Certifipago #803). Each extra adds minutes to every push; Certifipago runs all four. |
| 50 | **The styling pillar** (owner, 2026-11-14). In every app, a screen or section file only positions: its `*.style.ts` holds layout classes and nothing else. Every visual style lives in the components that own the look, in their `*.style.ts`, with values from the tokens. A lint rule and an allowlist that only shrinks enforce it. |
| 51 | **Every library outside the core stack sits behind one adapter of the template** (owner, 2026-11-15). The core stack is the language and the framework runtime the template is built on, and the workspace's own `@app/*` packages. A UI kit is wrapped in `components/ui`, a vendor SDK sits behind a port and a `*.adapter.ts`, and an infrastructure library behind a `src/lib` wrapper. The rest of the code imports only the template's module, so replacing a library rewrites its adapter. A registry of allowed import sites drives one rule, which fails closed on a package nobody registered. |
| 52 | **One rule set for every app** (owner, 2026-11-15). Lint rules, gates, conventions and docs apply to `apps/*` and `packages/*` by pattern; an app declares only what its framework forces (Next.js and Expo Router files), so a new app, plain React for example, inherits every rule. |
| 53 | **Observability defaults to PostHog** (owner, 2026-11-15). PostHog is the default adapter behind the observability port; Sentry becomes an optional capability with an install guide; `/init` asks which the project uses. Certifipago removes Sentry. |
| 54 | **`/init` asks the backend** (owner, 2026-11-15): front-end only, a new backend, an existing structure, or the default, Supabase. |
| 55 | **MCP servers stay unpinned** (owner, 2026-11-15), and an updater refreshes the documentation when they release. This replaces the pinning in decision 44. |
| 56 | **One linker for both repositories** (owner, 2026-11-15): pnpm's default isolated linker with the shared `publicHoistPattern`, because the hoisted linker duplicates nested packages in the mobile bundle whatever the project. |
| 57 | **Tests in `__tests__/` inside each block** (owner, 2026-11-15), reversing D-S2: a unit's test lives in the `__tests__/` of the unit's own folder, with the unit's stem; shared infrastructure stays in `src/test/`; a strict gate checks it in both repositories, Certifipago now. |
| 58 | **The follow-ups decided as recommended** (owner, 2026-11-14): F21 by column privileges, F23 with a trailing params object, F24 in UPPER_SNAKE_CASE, F25 by the error-channel table of `docs/code-standards.md`, F8 verified where a signed URL is served. |
| 59 | **Token outputs are generated, never copied** (owner, 2026-11-15, relayed by the Certifipago - Arquitecto session, translated from Spanish: "we don't want to be tied to anything, everything must be adaptable, and that's why I like your third option"). One source, `packages/tokens/src/tokens.constant.ts`, and one generator write every token-derived output; each output has one writer and a drift gate (decision 15). The web reads its theme as CSS, with no JS-config bridge, so a new consumer gets a generator target and nothing else changes. Shadows and easings are literal values in the source; a composite look such as `glass-card` belongs to a `ui/` block (decision 50). |
| 60 | **The web keeps its active locale in the `NEXT_LOCALE` cookie** (owner, 2026-11-16, choosing between two options). Every route renders its content per request, behind a static shell, which suits an app behind a sign-in; the HTML is not cached at the edge anyway. A `/[locale]` URL segment, full prerendering and one URL per language, stays an `/init` option for a project with a public, indexed site. |

---

## Evidence

### Verified platform facts (Claude Code documentation, 2026-11-04)

| Fact                                                                                                                                                                                                            | Consequence here                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| From v2.1.277 Claude Code reads `AGENTS.md` natively, but **only when no `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` exists in the working directory or above**. Otherwise it reads `CLAUDE.md` only. | A tracked `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` silently disables the native read. Decision 12 keeps none of them, and a check must fail when one is tracked. |
| A `CLAUDE.md` that imports `@AGENTS.md` never makes Claude read it twice, under any setting.                                                                                                                    | Not needed under decision 12; it matters only for a project that keeps a `CLAUDE.md`.                                                                                         |
| Nothing under a `.agents/` directory is read as instructions.                                                                                                                                                   | `.agents/` can hold machine data and sources without polluting context.                                                                                                       |
| `InstructionsLoaded` hooks fire for a `CLAUDE.md` import, not for an `AGENTS.md` read through the setting.                                                                                                      | Not needed under decision 12.                                                                                                                                                 |
| A project skill named like a built-in command **replaces it in a local terminal session** (aliases still run the built-in). Personal skills win over project skills.                                            | `/init` can be ours. Not verified for the desktop app yet; a personal `~/.claude/skills/init` would shadow ours.                                                              |
| Plugins ship skills, agents, hooks, MCP servers and workflows; support `userConfig`; resolve `${CLAUDE_PROJECT_DIR}` inside skill content; pin by `version`; namespace components as `plugin:name`.             | A plugin is a real distribution option for Claude Code only (D-A).                                                                                                            |

### What the donor built since the last harvest

The donor already centralized its harness. What is generic and worth taking:

| Piece                                                                                                                          | What it does                                                                                                                        | Class                         |
| ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `AGENTS.md` lifecycle router (8 phases + harness + growth, one table per phase, precedence rules, model tiers)                 | One router every runtime reads, with no `CLAUDE.md`                                                                                 | `own` (de-brand)              |
| `.agents/harness.config.json`                                                                                                  | The one file that names the product: identity, forbidden vocabulary, stack, skill trees, value sources                              | `own` → decision 13           |
| `.agents/core/contracts/*` (comprehension, handoff, review-severity, validation-gate)                                          | Portable process contracts, kept product-free by `verify:core-purity`                                                               | `own`                         |
| `.agents/agents/*.agent.md` + `scripts/agent-harness/*`                                                                        | Neutral agent source projected to `.claude/`, `.opencode/`, `.codex/`, `.github/agents`; `projection-check` is step 1 of `validate` | `own`                         |
| `.agents/skill-phases.json`, `agent-context.json`, `generated-outputs.json`                                                    | Skill → phase/ring/router row; agent → binding docs; output → single writer                                                         | `own` (schemas)               |
| `.agents/*-contract.json`, `concerns.json`, `board.config.json`                                                                | Project facts that generic skills read (design authority, copy registers, concern owners, board ids)                                | schema `own`, payload `brand` |
| Ratchet files (`duplication-ceilings`, `flow-grade-floor`, `mutation-accepted`, …)                                             | Shrink-only, every entry with a reason, stale entries fail                                                                          | pattern `own`                 |
| `skills-lock.json` (77 vendored entries) + `skills:drift` / `skills:pin`                                                       | Provenance and update command for vendored skills                                                                                   | `own`                         |
| `scripts/gate/*` registry, `defineGate`, ratchet, blinded companion tests (`verify:gate-shape`)                                | 60 registered gates; a companion test that still passes against a blinded gate fails                                                | `own`                         |
| `scripts/apps.detect.mjs`                                                                                                      | Gates declare the app kinds they judge instead of listing apps                                                                      | `own`                         |
| `pnpm scaffold` (plop + 45 templates, plan-then-apply with a rollback journal)                                                 | Deterministic generators for component, hook, screen, service, store                                                                | `own`                         |
| Lint rules `style-positions-only`, `touch-target-from-token`, `motion-from-token`, `no-hit-slop`, `ui-wrapper` boundary        | Token and UI-reuse enforcement; the style allowlist went 47 → 0 in six days                                                         | `own`                         |
| `@core` leveled observability port, `describeAppError`, `scrubExceptionEvent`                                                  | Provider behind a port (donor moved Sentry → PostHog)                                                                               | `own`                         |
| `vitest-package-base.mjs`, one test base per kind, scripts tests on `node:test`                                                | Shared test configuration                                                                                                           | `own`                         |
| Bundle budget per route, `size-limit` for the Hermes bundle                                                                    | Budgets as parameters                                                                                                               | `optional`                    |
| Hooks: pre-push validate + diff-mutation, post-merge merged-worktrees, `copy-worktree-env` on `prepare`, `shellEmulator: true` | Local gate as the real gate when CI budget is limited                                                                               | `optional`                    |
| Web UI 66 → 95 blocks, mobile 51 → 55                                                                                          | Component delta (`Text`, `Surface`, `SkipLink`, `Stepper`, …)                                                                       | per block                     |

Smells to fix in the donor through its own worktree (decision 8), not here:
`gen-skill-registry.mjs:119` hardcodes the product name; `AGENTS.md` carries
product rows (`:226`, `:296-306`, `:349-355`); the `.agents/skills` mirror is
hand-maintained with partial parity; `.claude/launch.json` holds absolute paths.

The donor has **no real init** either: its `scripts/init-project.mjs` is this
template's identity renamer, and its contracts are filled by hand.

### What the Qik workspace adds

Qik is an **adopt-mode** case: an existing codebase that runs on another machine,
with a harness that lives beside it.

| Pattern                                                                                                                             | Reusable as                                   |
| ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Skill anatomy: USE WHEN / DO NOT USE → "Map first" (docs pointer) → YAML contract (files written, `validated_by`)                   | The template's skill format                   |
| Generated living docs: static extractor over a `git archive` snapshot, every fact with file:line, never hand-edited                 | `living-docs` capability (adopt mode)         |
| Evals: evidence (cited lines exist), freshness (same bytes on regeneration), golden questions answered from docs only, harness-refs | Gates; `harness-refs` is useful in every mode |
| Deterministic antipattern checks on added lines only, plus a dated baseline that may not grow (tsc error count)                     | `ratchet` pattern for adopted codebases       |
| Reader / verifier / reviewer agent trio with model tiers and bounded outputs                                                        | Default agent set                             |
| ODD task docs, dated lessons-learned log, per-story docs                                                                            | Harness docs capability                       |
| Remote-code mode: code reached through one command template, edits download → edit → upload, network git stays with the human       | Adopt-mode option                             |

### Where this repo stands

- No executor, no `/init`, no answers file. `pnpm init` only renames identity.
- `copy` and `render` verbs point at `templates/`, which does not exist.
- `scripts.validate` is one `&&` chain (B2). No brand gate (B3). No region
  markers (B4).
- Sentry, Vercel and branch strategy are hardwired with no capability.
- `AGENTS.md` (91 lines) was a stale pointer to `CLAUDE.md`, the reverse of
  decision 12 (resolved: `CLAUDE.md` is retired).
- Only archify has provenance; `.claude/skill-registry.md` is stale (23 of 26).
- 351 staged paths (+58.8k lines) wait for review: archify, suffix-contract
  codemod, lint rules, manifest gates, docs.

---

## Target architecture

```text
AGENTS.md                    # single router + shared rules (hand-written, product-free sections generated)
CLAUDE.md                    # retired: absent by decision 12
.agents/
  project.config.json        # THE only file that names the project
  init/
    answers.schema.json      # closed schema (additionalProperties: false)
    answers.json             # written by /init — data only, committed
  contracts/                 # project facts read by generic skills
    design.json  copy.json  concerns.json  workflow.json
    board.json   review.json  budgets.json  data.json
  core/contracts/*.md        # portable process contracts
  agents/*.agent.md          # neutral agent source
  skill-phases.json          # skill → phase, ring, router row
  ratchets/*.json            # shrink-only ceilings
  skill-registry.md          # generated
.claude/ .codex/ .opencode/ .github/agents/   # generated projections
.claude/skills/              # canonical skills (procedure only)
template.manifest.json       # capabilities, presets, closed verbs
templates/                   # sources for copy/render
scripts/
  agent-harness/             # project, check, sync, receipts
  gate/                      # registry; validate = registry run
  init/                      # executor: plan → apply → journal → verify
```

| Artifact                  | Source of truth                   | Writer                   | Drift gate                       |
| ------------------------- | --------------------------------- | ------------------------ | -------------------------------- |
| Runtime agent files       | `.agents/agents/*.agent.md`       | `agent-harness:generate` | `agent-harness:projection-check` |
| Skill registry            | `skill-phases.json` + frontmatter | `gen:skill-registry`     | `verify:governance`              |
| Project identity in files | `project.config.json`             | init executor (`render`) | `verify:generic` (brand gate)    |
| Tokens code + CSS mirrors | tokens data file                  | tokens generator         | `verify:theme-sync`              |
| Diagrams                  | `docs/diagrams/*.json`            | `docs:diagrams`          | `docs:diagrams:check`            |
| Pruned tree               | `answers.json` + manifest         | init executor            | `verify:manifest:coverage`       |
| `validate` steps          | gate registry + capabilities      | registry                 | `verify:gate-shape`              |

### Which runtime reads what (verified 2026-11-04)

Checked against each runtime's own documentation; the full matrix with sources is
in the session scratchpad and summarized in the audit report.

| Piece        | One shared source                                                                                                                                                        | Generated per runtime                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Instructions | `AGENTS.md`, read natively by Codex, OpenCode, Copilot, VS Code, Cursor, Devin and Amp; Claude Code natively, since there is no `CLAUDE.md`; Gemini CLI with one setting | nothing                                                                                                             |
| Skills       | `.claude/skills` (Claude Code, OpenCode, Copilot, VS Code, Cursor)                                                                                                       | `.agents/skills` only when Codex, Gemini, Devin or Amp is selected; Claude Code never reads `.agents/`              |
| Agents       | neutral source `.agents/agents/*.agent.md` (as in the donor)                                                                                                             | `.claude/agents`, `.codex/agents/*.toml`, `.github/agents/*.agent.md`, `.opencode/agents` for the selected runtimes |
| Hooks        | one set of hook scripts                                                                                                                                                  | registration per runtime (`.claude/settings.json`, `.codex/hooks.json`, `.github/hooks`, OpenCode plugin)           |
| MCP          | `.mcp.json` (read by Claude Code, Copilot CLI, VS Code)                                                                                                                  | `.codex/config.toml`, `opencode.json`, `.cursor/mcp.json` when selected                                             |

- Every projection is a generated copy with a drift gate. Symlinks break on
  Windows clones.
- Runtimes that read both `.claude/skills` and `.agents/skills` (OpenCode,
  Copilot, VS Code, Cursor) may list a mirrored skill twice; P2 tests how each
  handles it before a mirror is generated for them.
- Codex agent files cannot set `sandbox_mode`; a read-only Codex agent runs in a
  session started with `--sandbox read-only`, and Codex hooks are guardrails,
  not a security boundary.

### How a central skill reads project files

A skill names what it reads; the values stay in contracts:

```markdown
## Project facts

| Reads                                 | Key                             |
| ------------------------------------- | ------------------------------- |
| `.agents/contracts/design.json`       | `authority`, `tokenSource`      |
| `.agents/project.config.json`         | `identity.product`, `paths.ui`  |
| `.agents/contracts/architecture.json` | `layers`, `folders`, `suffixes` |
```

- `verify:skill-contracts` (new) checks every declared key exists in its contract.
- `verify:architecture` (new) refuses a staged file in a folder the architecture
  contract does not name, and checks the architecture docs against the contract.
- `verify:core-purity` (harvest) fails a skill that names the product, a
  vocabulary term or a token value.
- A plugin channel, if one is ever added on top of option A, reaches the same
  files through `${CLAUDE_PROJECT_DIR}`.

### D-A — how derived projects receive the central harness (decided: A)

**How option A works:**

- The template tags harness core releases (`harness-vX.Y.Z`) with a changelog.
- A derived project holds `harness-lock.json`: the core version, the source
  commit, and per file the three-hash entry already used by `skills-lock.json`
  (`upstreamHash`, `localHash`, `adapted`).
- `harness:update --to vX.Y.Z` performs a three-way update. Untouched files are
  replaced. Adapted files are merged or reported, never overwritten. Facts
  (`project.config.json`, contracts) are never touched.
- `verify:harness-lock` fails when a core file drifts from its lock entry
  without being marked adapted.
- The `propagate-from-template` skill becomes the procedure behind the command.

The options that were weighed:

| Option                                                                                                                                                                               | For                                                                                                  | Against                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **A. Vendored and versioned** (chosen). The harness core is copied into each project with a version and hashes; `harness:update` pulls a new version, three-way, adapted files kept. | Works for every runtime; fresh clone is complete and deterministic (locked decisions 3, 6); offline. | Updates are a command per project, not automatic.                                                                          |
| **B. Claude Code plugin** in a marketplace repo, pinned by version.                                                                                                                  | One source; updates without copying; `userConfig` prompts per project.                               | Claude Code only (Codex, OpenCode, Copilot still need files in the repo); network at install; skills become `plugin:name`. |
| **C. Hybrid**: A as the source of truth, plus a plugin generated from the same core for Claude-only teams.                                                                           | Both delivery paths from one core.                                                                   | Two channels to test; more machinery.                                                                                      |

---

## PA — intensive audit before any harvest

Copying a skill, gate or doc carries its cost into every project that inherits
it. So before anything is committed (P0 included) or copied, every artifact in
**both** repos gets a verdict backed by evidence: **keep**, **fix**, **merge**,
**drop** or **defer**. Only keep and fix travel. The same verdicts become
Certifipago's cleanup list in PD.

The 351 staged paths are under this rule too: they hold harvested material
(72 vendored archify files, the `justifying-comment` and `suffix-contract`
rules, the manifest gates) that was copied before any audit existed. They stay
staged, untouched, until PA judges them.

### Inputs that must be complete before any verdict

| Input                                              | How it is obtained                                                                                                                                                                                | Status                                |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Certifipago architect's view                       | Cross-session consultation (harness source of truth, what worked, what to redo, what to configure at init)                                                                                        | answered                              |
| Qik frontend's view                                | Cross-session consultation (what paid off, what is used day to day, what adopt mode needs)                                                                                                        | answered                              |
| Deep analysis of Certifipago against the objective | Per area (skills, agents, gates, scripts, packages, UI, docs, contracts): does it serve a generic template with `/init`, which parameter it needs, which `/init` section owns it                  | done                                  |
| Deep analysis of Qik against the objective         | The code lives on another machine, so the analysis reads Qik's generated catalogs, its knowledge census and its harness, and asks the Qik session for what only the code can answer               | done (static, through generated docs) |
| Deep analysis of this repo against the objective   | Same questions over the template, the staged work included                                                                                                                                        | done                                  |
| `/doctor` reports                                  | `/doctor`, `/doctor prompt-audit`, `/skill-doctor` in both repos, run headless with `claude -p`, read-only                                                                                        | done for both repos                   |

The donor is audited at `origin/master` in a fresh worktree (decision 8). The
audit tools land in the template as `pnpm harness:audit` (built in P3), so any derived project
can run it again later.

### Four questions per artifact

| Question                         | Means                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Is it used?**                  | Invocations over a dated window, by whom (main session, subagent, hook, CI), last use                                                                 |
| **Is it healthy?**               | Parses, references exist, no contradiction or duplicate, cost within budget, tests and proof exist                                                    |
| **Is it used correctly?**        | Triggers on the right requests and not on the wrong ones; when it runs, its procedure is followed                                                     |
| **Does it serve the objective?** | Generic as is, generic with a parameter (named, with the `/init` section that sets it), product-specific, or a gap the objective needs and nobody has |

### What is audited and how

| Artifact class                             | Evidence                                                                                                                                                                                                                                                                       | Tools                                                                                                                                                                                                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skills (123 donor, 26 here)                | Invocation count and last use; never-invoked list; always-on description cost; whether the skill listing overflows its budget and drops descriptions; broken file references; frontmatter that does not parse; overlapping triggers; router and phase coverage; vendored drift | `/skill-doctor`; transcript census (Skill tool calls and `/name` uses per skill in the local session logs); `claude plugin validate .claude/skills`; `/doctor prompt-audit .claude/skills`; donor gates `verify:skill-descriptions`, `verify:governance`, `verify:router-coverage` |
| Skill correctness (skills that pass usage) | Should-trigger and should-not-trigger prompts with hit rate; sampled real invocations graded for "matched intent" and "procedure followed"                                                                                                                                     | skill-creator evals and description tuning; a grader over transcript excerpts                                                                                                                                                                                                      |
| Agents (4 donor, 1 here)                   | Delegation count per agent type; outcome of sampled runs; tool scope per runtime                                                                                                                                                                                               | transcript census (Agent tool calls by type); `/doctor` duplicate-name check                                                                                                                                                                                                       |
| Instruction files                          | Size against the 200-line guidance (donor: `AGENTS.md` 359, `CLAUDE.md` 422 lines); stale references; contradictions; content Claude can derive from the code                                                                                                                  | `/doctor`; `/doctor prompt-audit`                                                                                                                                                                                                                                                  |
| Gates and lint rules (60 + 22 donor)       | What each catches; planted-violation proof; runtime per gate and total `validate` time; overlapping checks; how often each has blocked real work (commits that fix its findings)                                                                                               | gate registry run with timings; `verify:gate-shape`; git history search by gate name                                                                                                                                                                                               |
| Scripts (376 donor)                        | Reachable from `package.json`, hooks, skills or CI; tests present; dead code                                                                                                                                                                                                   | knip; reference scan                                                                                                                                                                                                                                                               |
| Docs                                       | Broken links; orphan docs nobody routes to; stale counts; owner per doc                                                                                                                                                                                                        | `verify:doc-links`; reference scan from `AGENTS.md` and skills                                                                                                                                                                                                                     |
| `.agents/` contracts and ratchets          | Every file has a reader; stale entries; ratchets still shrinking                                                                                                                                                                                                               | `verify:concerns`, `verify:review-contracts`, `verify:allowlist-freshness`                                                                                                                                                                                                         |
| Packages, UI blocks, tokens                | Import count per block (95 web, 55 mobile in the donor); unused exports; unused tokens                                                                                                                                                                                         | import census; knip                                                                                                                                                                                                                                                                |
| Dependencies                               | Unused, outdated, advisories; overrides still needed                                                                                                                                                                                                                           | knip; `pnpm outdated`; `pnpm audit`                                                                                                                                                                                                                                                |
| Settings, MCP servers, hooks, CI           | Unused MCP servers and extensions; invalid settings; what runs where and how long                                                                                                                                                                                              | `/doctor`; `claude doctor`; hook and CI inventory                                                                                                                                                                                                                                  |

### Who runs what

- **Agents run** the deterministic parts: transcript census, validators, knip,
  reference scans, gate timings, import census, evals.
- **`/skill-doctor` and `/doctor prompt-audit` run headless**: `claude -p
"/skill-doctor"` and `claude -p "/doctor prompt-audit"` (Git Bash needs
  `MSYS_NO_PATHCONV=1`), read-only with `--permission-mode plan` and edits
  disallowed. `claude doctor` is the read-only installation check. Only the
  full in-session `/doctor`, which offers to apply fixes, needs the owner.
- Usage data is per machine. The census covers this machine's session logs; a
  second machine (the remote Mac used for Qik) is noted as a gap.

### Output

- `docs/audits/<date>-harness-audit.md` (readable) and `.json` (one row per
  artifact: repo, class, name, evidence, verdict, reason).
- The keep and fix rows fill the harvest ledger in GENERALIZATION_PLAN.md.
- The drop and fix rows for the donor become PD's work list.

### What each open input blocks

PA closes for a phase once the inputs that phase depends on are in. An open
input only blocks the phases listed against it.

| Open input                                          | Blocks                           |
| --------------------------------------------------- | -------------------------------- |
| Qik frontend's answer                               | done — closed for P10 and P12    |
| Subagent run evaluation                             | done — closed for P2 and PS      |
| End-to-end flow analysis                            | done — closed for PF, P1 and P11 |
| D-B runtimes by default                             | decided                          |
| D-C backend by default                              | decided                          |
| D-D branch strategy by default                      | decided                          |
| Approval of the default set and packs (decision 20) | PS                               |
| Owner authorization for P0                          | P0                               |

---

## Agents — evaluated on real runs

A read-only evaluation measured 1,205 real subagent runs from the session logs
(fork copies removed) against what each definition promises. Report and data:
session scratchpad `pa/out/agents/`; the conventions schema draft is kept at
`docs/audits/2026-11-04-conventions.schema.draft.json`.

| Agent                              | Verdict           | Why                                                                                                                                                                                        |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Certifipago validator              | fix               | Always reaches a verdict, but wrote into the repo through Bash in 3 runs; its format conflicts with skill report templates; the Codex copy failed every spawn on an unsupported model name |
| e2e-author                         | fix               | Edited the test runner its definition forbids; strict output format met in a minority of runs                                                                                              |
| codegraph-explorer                 | merge             | Correct when used, but used twice; fold into one explorer                                                                                                                                  |
| skill-author                       | keep              | One run, every required section present                                                                                                                                                    |
| template validator                 | fix               | Restates checklists inline (Supabase RLS, Turnstile, dark-glass, test style); cites a missing doc; stale group names in other files                                                        |
| Qik explorer / verifier / reviewer | fix / fix / keep  | Remote host data written inline; read-only by prompt only                                                                                                                                  |
| user-level review-_ and jd-judge-_ | outside this repo | Generated by gentle-ai; contradictory tool and output rules; listed for the owner in the backlog                                                                                           |

What the evidence requires:

1. **Read-only by mechanism.** A tool list without Edit and Write does not stop
   writes: validators and even the built-in Explore wrote through Bash. A
   PreToolUse hook rejects writes outside an agent's declared write surface;
   read-only Codex agents run in a session started with `--sandbox read-only` (an agent file cannot set it).
2. **One report-precedence rule.** When a skill ships a report template and the
   agent has its own, `contracts/conventions.json` → `review.reportPrecedence`
   decides, and the agent definition says so.
3. **Models per runtime and tier from config.** A model alias that one runtime
   lacks broke every Codex validator spawn; projections read
   `harness.models[runtime][tier]` and fail closed on an unmapped alias.
4. **Conventions from the contract.** Every hardcoded rule listed in the
   evaluation moves to `contracts/conventions.json`; definitions keep procedure.
5. **Validation groups as data.** `validation.groups` maps each group to its
   skills and its deterministic owners, so a caller never invents a group and
   no doc names one that does not exist.
6. **Each agent has a run eval.** A fixture task per agent checks tool discipline
   and output shape before a definition change ships.

The `/init` questions that set `conventions.json` are spread over sections 1, 3,
4, 5, 6, 7, 8 and 9 (languages; roots, suffixes, test runner and style; where
authorization lives; design intent and tokens; e2e tool and flow ids; git
ownership; runtimes, model per tier, read-only enforcement, blocked shell
commands, write surfaces, report precedence; gate command, binding docs,
validation groups, baselines). In adopt mode they are detected first and shown
for confirmation.

---

## PS — skills regrouped and fixed so they are used correctly

The audit shows skills that exist but do not work as skills: 37 of the donor's
123 were ever invoked; agents reach most of them by reading a path; the listing
overflows its budget and drops descriptions; overlapping skills compete for the
same requests; template skills teach code the repo's own lint rejects. PS fixes
the shape, then proves the result with evals and, later, with real usage.

### Root cause of the low use

In the donor, `/skill-doctor` shows 105 of 123 project skills listed by name only
(under 20 tokens each) and 18 with their full description (about 200–350 tokens).
The 18 are the most-invoked ones: when the listing overflows, Claude Code drops
the descriptions of the least-invoked skills first. A skill with no description
cannot be matched, so it is never invoked, so it keeps losing its description.
The programming skills were still used, but by path: subagents read their
`SKILL.md` files thousands of times because the router passes the path. Low
invocation therefore says nothing against them, and no usage at all says nothing
against skills of domains not exercised yet (marketing, product work).

Verdict rule, corrected: reads are split into use (subagent reads, reads cited by
a delegation prompt) and authoring (reads in a transcript that also edits that
skill); only use restores a skill's static verdict. A skill with no signal is
deferred into its pack as "unexercised", never dropped; drops rest only on static
defects (broken references, duplicates, out of stack).

### Validated one by one (tiers a–c)

A scratch clone of the template, never this working tree, holds the candidate
skills; the model and its context window are recorded for every run, and the
user-level, plugin and synced skills that share the listing are hidden or counted.

1. **Budget fit.** Install the candidates in increments and read `/skill-doctor`
   after each one: the point where descriptions start dropping is the ceiling for
   the default set. The same runs check whether `disable-model-invocation` and
   `user-invocable: false` take a skill out of the listing.
2. **Trigger probes.** For each skill, several requests that should invoke it and
   several that should not, run headless; a skill must hit its own requests and
   stay silent on the others. Failing skills get their descriptions rewritten or
   are merged.
3. **One complete flow.** After the base copy of each shared skill is chosen, one
   feature flow run checks that the right skills load at the right step, in order
   — not only that they load.

The set grows a few skills at a time, repeating 1–2 at each step, until the budget
or the trigger rates stop it.

### First results — tiers a and b (2026-11-04)

Scratch clone, 20 candidate skills, data in the session scratchpad (`exp/`).

- **Isolation works per session.** A `--settings` file with `skillOverrides`
  "off", `syncClaudeAiSkills: false`, `syncClaudeAiPlugins: false`,
  `enabledPlugins` false and `disableBundledSkills: true` hides every user,
  synced, plugin and bundled skill. Without it, about 60 other entries share
  the listing.
- **Budget observed:** the listing fills at about 10k tokens on a 1M-context
  model and about 2k on a 200k one. On the 1M model all 20 candidates keep
  their descriptions in isolation and 15 in the owner's real setup. On a 200k
  model 10 fit in isolation and **none** in the real setup, because bundled and
  personal skills take the whole budget. The donor's "105 of 123 name only"
  reproduced exactly.
- **Hiding mechanism verified:** `disable-model-invocation: true` takes a skill
  out of the listing and its cost, and `/name` still works; `user-invocable:
false` saves nothing. The front-door specialists use the first.
- **Triggering:** 51 of 60 should-trigger probes invoked the right skill, 0 of
  40 should-not probes did, and no sibling was confused with another. Misses
  come from wording: `arch` points at docs paths, `improve-skill` and `new-skill`
  open with process words, and `screen`, `store`, `modify` and `pre-commit` lack
  the everyday words a request uses ("page", "global state", "change",
  "staged changes"). Losing the description lowered hits in the name-only test.
- **Upper bound, not final:** one sample per probe, isolation on, and the
  user-level instruction file pushes skill use. The next round repeats each
  probe three times, adds the real setup and a 200k model, after the
  descriptions are rewritten.
- **Side effects of measuring:** completed probe runs moved this machine's
  skill usage counters, which decide which descriptions are dropped first, and
  billed usage. Later rounds run with that cost stated up front.

What it changes:

1. The default-set size depends on the runtime: `/init` measures the listing
   after install (`claude -p "/skill-doctor"`), reports any skill listed by name
   only, and offers the fixes: fewer defaults, a higher
   `skillListingBudgetFraction`, name-only for skills whose name is enough, or
   turning off unused personal and synced skills. Where each of those settings
   may live (project or user level) is verified before `/init` writes one.
2. The session-start self-check (decision 28) also flags skills listed by name
   only.
3. Descriptions lead with the user's words, stay near 500 characters, and drop
   DO NOT USE pointers to skills that are not installed.

### Round 2 — rewritten descriptions, real setup, three repeats (2026-11-04)

Same 20 candidates on the fixture clone; data in the session scratchpad
(`exp/round2/`). 526 model sessions, reported cost $44.68 (a floor: runs
stopped at their first event report nothing).

- **Rewrites:** 14 descriptions rewritten to lead with the user's words and
  stay near 500 characters; the 20 together went from 15,029 to 10,344
  characters. Isolated, the same 60 prompts went from 51 to 56 hits.
- **Budget, Opus 1M, real setup:** all 20 keep their descriptions (round 1:
  15), but the listing sits at its 10k cap. Twenty skills near 500 characters
  is the ceiling there.
- **Budget, Sonnet 200k, real setup:** none of the 20 keeps a description at
  the default. Built-in skills take about 1.8k of the 2k listing (observed).
  `skillListingBudgetFraction: 0.05` gives 20 of 20 for about 6.7k more tokens
  per turn; 0.02 with unused personal skills off gives 16 of 20; name-only
  overrides alone change nothing.
- **Where the settings live (verified in the settings reference):**
  `skillListingBudgetFraction`, `skillOverrides` and `enabledPlugins` are valid
  in project `.claude/settings.json`; `syncClaudeAiSkills` is user, local or
  managed only ("A repository can't turn it off for you"); overrides do not
  apply to plugin skills.
- **Triggering, Opus real setup, 3 repeats:** the right skill was the first
  event in 169 of 180 runs counting reads of its `SKILL.md`, 148 counting Skill
  calls only; 0 of 120 should-not prompts called a skill; no skill outside the
  20 won a prompt. 21 of the 32 strict misses were reads of the correct
  `SKILL.md`, because the owner's user-level instructions say to read it.
- **Sonnet with fraction 0.05:** 26 of 60 strict, 29 lenient (a floor: a stop
  rule fired early in 22 runs); 56 of 100 runs started an Explore agent first.
- **Wording still misses:** a screen request without "page" or "route" goes to
  feature; a test request without the word "test" gets no skill; "what I've
  git-added" reaches pre-commit once in three.
- **Hypothesis to verify:** if a `SKILL.md` read does not count as an
  invocation, the user-level "read the matching SKILL.md" rule keeps project
  skills at the bottom of the usage ranking, which is the order in which
  descriptions are dropped.

What it changes:

1. `/init` measures the listing after install. On a model whose listing is
   full it writes `skillListingBudgetFraction` (0.05, or 0.02 with name-only
   overrides) to project `.claude/settings.json`, states the token cost, and
   tells the owner which user-level settings only they can change.
2. The default set is at most 20 skills near 500 characters.
3. Probes score Skill calls and `SKILL.md` reads separately.
4. Experiments run with the Engram session hook off: round 2 left 520 empty
   sessions under this project.

### Round 3 — the real tree, all 124 skills (2026-11-05)

Run after PD1 integrated every slice in a separate clone of Certifipago: the
first eval prompt of each of its 124 skills, as a real Claude Code session
(Opus 5.5, the owner's user setup with Engram off, 181 skills listed), killed
at the first skill load, else ended at three turns.

| Measure                                | Result                                                                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Target skill loaded within three turns | 75 of 124 (60%); the coding core 14 of 20                                                                                    |
| By phase                               | review 18/20, growth 21/29, define 9/14, scaffold 5/7, understand 4/6, harness 4/7, test 2/4, operate 1/3, build 10/32       |
| Target listed in the session           | 123 of 124: at 181 skills the listing is not what keeps a skill from loading                                                 |
| Misses that explored instead           | 41: the agent read the code for three turns and loaded no skill, mostly build-knowledge skills given task-shaped prompts     |
| Misses that loaded another skill       | 8: three design skills went to the `project-design` front door (intended); `registry` loaded the user-level `skill-registry` |
| Quota per session                      | about 100K tokens, 75K of them rewritten to the cache each time (instructions and listing travel with the prompt)            |

What it changes: decisions 30, 31 and 35. Limits: one prompt per skill, a
three-turn horizon (a skill loaded after exploring counts as a miss), no
repeats.

### Grouping

- **Packs.** The default install is the **core** and **define** packs (about 20
  skills, decision 20). Every other skill belongs to one opt-in pack offered by
  `/init` section 8: review, design, docs and diagrams, harness maintainer,
  marketing, e2e, operate, backend-supabase, mobile-expo. The pack list and its
  members are in the audit report.
- **One front door per concern.** Where several skills cover one concern (UI
  review 7, copy 7, security 5, motion 4, diagrams 3, analytics 2), one entry
  skill appears in the listing and loads the specialists it needs. Specialists
  are hidden from automatic matching, so they cannot misfire and do not spend
  listing budget. Step 1 verifies which mechanism does that
  (`disable-model-invocation`, `skillOverrides` name-only) before relying on it.
- **Merges.** registry → skill-onboard; ticket-template → plan-to-board;
  ponytail-debt → ponytail; quality → pre-commit and fractal-verify; archify,
  diagram-design and stack-diagram behind one diagrams front door, split by
  subject: archify for topology, flows, sequences and lifecycles; diagram-design
  for ER, timeline and tree; stack-diagram for the tech-stack picture with logos.

### Quality bar for every skill that ships

| Area        | Rule                                                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Frontmatter | Description of 1,024 characters or fewer, key use case first; USE WHEN and DO NOT USE                                         |
| Body        | "Map first" pointer to the docs or gate it relies on; a "Project facts" table of contract keys; the procedure; `validated_by` |
| Values      | No counts, dates, product names or absolute paths (decision 21); every reference resolves; 500 lines or fewer                 |
| Examples    | Every code example passes the repo's own lint and type rules                                                                  |
| Evals       | Should-trigger and should-not-trigger prompts per skill; an output eval for the core pack; product-neutral content            |
| Routing     | Pack, phase, ring, and a router row or an unrouted reason in `skill-phases.json`                                              |
| Vendored    | Upstream text untouched; adaptations in an overlay or a contract (decision 22)                                                |

### Gates that hold the bar

`verify:skill-contracts` (declared keys exist), `verify:core-purity` (now over
evals too), `verify:skill-descriptions` (limits and sections),
`verify:skill-listing-budget` (the enabled packs fit the listing budget of the
smallest supported context), `verify:skill-snippets` (examples lint and
typecheck), `verify:harness-refs` (every cited path exists),
`verify:router-coverage` and `verify:governance`. Each is proven with a planted
violation before it is trusted.

### How "used correctly" is proven

- **Before release:** trigger evals per skill — it fires on its should-trigger
  prompts and stays silent on the should-not ones — with descriptions tuned
  until both hold.
- **After release:** the usage census and `/skill-doctor` run again 30 days
  later. A default skill never invoked or read moves to a pack; a pack skill
  invoked often becomes a default candidate.

### Steps

1. Verify the listing mechanics in the Claude Code docs (what hides a skill
   from automatic matching, and whether it still costs listing budget).
2. Add `pack` to `skill-phases.json` and one manifest capability per pack.
3. Merge overlapping skills and build the front doors.
   Where a skill exists in both repos, pick the base copy first: the newer one
   whose examples pass this repo's lint; the other contributes only content it
   alone has.
4. Fix every skill against the quality bar, working through the PS items of
   the remediation backlog.
5. Add the gates, each proven by a planted violation.
6. Write the evals and tune the descriptions.
7. Release, and schedule the 30-day usage review.

---

## PF — complete flows, not isolated pieces

A read-only analysis cut 4.57 GB of Certifipago transcripts into 764 change
units (each ends at a merge) and compared what really happened with the
declared lifecycle. Report and data: session scratchpad `pa/out/flows/`.

- **Delivery is followed, the middle is not.** Branch, commit, push, PR and
  merge happen in most units; only 7 of 764 ran the full declared order
  build → validate → review → commit → push → PR → merge.
- **No review before most PRs.** 408 of 426 PR units had no agent or skill
  review; the pre-push Codex review was the only reviewer.
- **No human approval point.** The agent merged its own PRs 582 times for 604
  PRs created.
- **Broken handoffs:** code committed without validation (59 units); new hooks
  or blocks without a test (24); new UI without review (45); e2e flows written
  and never run (21); plans with no code afterwards (21).
- **What worked was enforcement.** Hooks denied 1,106 banned shell commands and
  40 merges; `--no-verify` disappeared after its rule was enforced.
- **Qik**, with a per-commit owner OK, shows the opposite profile: about 18
  prompts per commit, and its own agent trio was never invoked.

Canonical flows the template ships:

| Flow                      | Milestones                                                                                                                                                                                   | Approval point                          | `/init` sections |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ---------------- |
| Feature                   | reuse check → scaffold → failing test → build → validate → review routed by change (`review-routing` table; UI paths owe `component-review`) → commit → push → PR                            | review verdict before the PR            | 3, 6, 7, 9       |
| Bug fix                   | failing test → fix → validate → focused review → commit → push → PR                                                                                                                          | the failing test turns green            | 7, 9             |
| Design → tokens → screens | design source → tokens data → generated tokens → screens and components → component and copy review → runtime check                                                                          | owner signs off the tokens              | 5, 6             |
| Review → merge            | review verdict file → PR → CI → merge under the policy                                                                                                                                       | merge policy: agent or human, explicit  | 7, 9             |
| Release                   | regression and smokes → version → build → submit                                                                                                                                             | owner                                   | 3, 7             |
| Adopt                     | detect stack and conventions → living docs → harness install                                                                                                                                 | optional per-step and per-commit OK     | 0                |
| Harness change            | skill, agent or gate change → governance checks → harness review                                                                                                                             | review verdict                          | 8                |
| Docs                      | change merged → generated docs regenerated, hand-kept docs it touches flagged → diagrams re-rendered → evidence, link and freshness checks → committed with the change                       | the freshness check fails a stale doc   | 10               |
| Architecture change       | new folder, layer or package → contract and its doc updated together → `verify:architecture` in pre-commit → architecture review (`fractal-verify`, `architecture-audit`) → verdict → commit | the gate refuses an undocumented folder | 3, 9             |

How a flow is proven: a fixture repo is generated from an `answers.json`, the
flow is driven headless, and a verifier checks the milestone order, that each
gate fired, that each handoff artifact exists, and that the hooks refuse the
forbidden moves (commit with `--no-verify`, push from `main`, merge on red
checks, PR without a review verdict). The hook and gate checks run without a
model.

---

## PD — Certifipago: its own harness fixed now, then converged on the core

Certifipago is the first derived project, and its harness is fixed in two stages
so it does not wait for the template core. All work happens in a donor worktree
under its own conventions (decision 8): a `<type>/<name>` branch, merge from
`origin/master`, the donor's pre-push gate, one PR per slice, and the owner's OK
before each PR merges.

### PD1 — fixes that do not need the template core

The slices start right after P0, except the two docs slices: they touch only
the donor tree, so they start now (owner, 2026-11-04).

Each slice is proven on Certifipago's own tree before and after: same gate
results, and the specific finding gone.

| Slice                   | What changes in Certifipago                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Evidence                                                                                                                                                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skill listing           | A default set that fits the listing budget; the rest moved behind front doors or packs with `disable-model-invocation: true`; descriptions rewritten to lead with the user's words and kept near 500 characters; dead DO NOT USE pointers removed. No skill is deleted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 105 of 123 listed by name only; trigger probes                                                                                                                                                                                                                                                        |
| Instruction files       | The five LAWs move from `CLAUDE.md` into `AGENTS.md`, so Codex and OpenCode receive them; product rows leave the generic router; both files shrink toward the 200-line guidance; the two retired-mechanism sentences go                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | donor audit, prompt audit                                                                                                                                                                                                                                                                             |
| Agents                  | Read-only enforced by a hook on the Bash channel; one report-precedence rule between the validator and skill templates; models mapped per runtime (the `fable` alias failed every Codex validator spawn); `e2e-author` held to its write surface                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | agent run evaluation                                                                                                                                                                                                                                                                                  |
| Codex                   | Read-only Codex agents run in a session started with `--sandbox read-only`; agent files cannot set it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | runtime matrix                                                                                                                                                                                                                                                                                        |
| Flows                   | A review verdict file required before a PR; the merge policy made explicit (the agent merged 582 of 604 PRs); a test required with every new hook or block; written e2e flows run once before commit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | flow analysis                                                                                                                                                                                                                                                                                         |
| Delivery gate           | The gate runs on the merge result (up-to-date branch or merge queue): two green PRs had merged into a red master                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | architect                                                                                                                                                                                                                                                                                             |
| Peer review             | Findings stored one file per finding instead of the append-only `.codex-review/adjudications.json`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | architect                                                                                                                                                                                                                                                                                             |
| Prompt-audit findings   | The project findings (H1–H13, M1–M42) fixed; the user-level ones left to the owner                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `/doctor prompt-audit`                                                                                                                                                                                                                                                                                |
| archify                 | `doctor` restored (`scripts/render-examples.mjs`), `upstreamHash` filled, upstream commit `b86b607` recorded, the sigil fix applied as a recorded patch                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | GENERALIZATION_PLAN defects                                                                                                                                                                                                                                                                           |
| Product names           | Scripts and hooks read the identity from config: `gen-skill-registry.mjs:119`, `.husky/pre-push:114,133`, `verify-diff-mutation.mjs:145`, `verify-bridge-secrets.mjs:201`, `user-flows/priority.mjs:43`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | architect                                                                                                                                                                                                                                                                                             |
| Small hygiene           | `.claude/launch.json` absolute paths; dead pnpm overrides; session ownership declared in config                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | donor audit, architect                                                                                                                                                                                                                                                                                |
| Docs refresh            | Every doc under `docs/` classified as generated or hand-kept, with an owner. Generated docs are regenerated from code; hand-kept docs are checked against code and corrected. From Qik, only the shape that paid off: generated catalogs and per-area screen pages where every claim cites `file:line`; evidence, coverage, link and freshness checks; the lessons log; per-story docs. Qik's explorer map and most of its evals are left out. Built on Certifipago's own `docs/maps`, `verify:maps` and `verify:doc-links`; no Qik code or content. The archify rule that generated docs ship a diagram is applied to every generated doc: five diagrams are committed today, rendered by `scripts/archify-render.mjs` and checked by `verify:archify-provenance`; a `docs:diagrams` command is built on that renderer, not ported from the template, so the donor keeps one renderer. A freshness check joins the gate | doc dates vs code (`flows.md` 07-27, `memory.md` 08-02, `web-screens.md`, `app-screens.md` and `roadmap.md` 08-03); Qik retrospective                                                                                                                                                                 |
| stack-diagram           | Installed through `skill-onboard` with the adaptations its gates require (see the audit report, "Candidates after the audit"); the stack picture becomes the diagram that ships with `docs/architecture.md`, regenerated by the docs flow                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | G1–G3 pre-verdict                                                                                                                                                                                                                                                                                     |
| Architecture gate       | Every folder a layer holds is the one `docs/architecture` describes. One machine-readable contract per app and package names its layers, the folders each holds and the file suffixes each folder accepts; the architecture docs' folder tables are checked against it (or generated from it). A pre-commit gate refuses a staged file in a folder the contract does not name, or with a suffix its folder does not accept. A change that adds a folder, a layer or a package routes to `fractal-verify` and `architecture-audit` before the commit, and the review verdict records it. `verify-structure` and `verify-pairing` keep checking block internals, reading the same contract instead of their own lists                                                                                                                                                                                                      | owner, 2026-11-05; comparison of `apps/*/src` and `packages/` with `docs/architecture` on master: in agreement after #738, but nothing checks it; `verify-structure` and `verify-pairing` hard-code their rules; `verify:maps` and `verify:docs-freshness` check only that docs name paths that exist |
| Design review by change | A new or changed screen, component or section cannot reach a PR without its design audit. Two moments: at creation, the scaffold generator writes a block that already passes the deterministic design gates (tokens, glass, theme, i18n, ui reuse), and each building skill's evals assert it; before the PR, a routing table maps changed paths to the review skills they owe (`screens/**`, `components/**` → `component-review`, which runs the design audits under the house design contract; copy catalogs → `copy-review`; interactive UI → `a11y`), and the PR hook refuses a review verdict that lacks a skill the changed paths require, or says `none` when one applies                                                                                                                                                                                                                                       | owner, 2026-11-05; today the design gates run in `validate` and `verify:scaffold-templates` checks generator output, but `component-review` is invoked by nobody (`AGENTS.md` review step) and the T8 verdict records which skills ran without requiring any                                          |

### PD1 status (2026-11-05)

Every slice without an open owner decision is merged on Certifipago
(2026-11-05, on the owner's word, each PR up to date with master and green). The work log is the donor feature
document `odd/tasks/harness-pd1.md`.

| Slice                   | State                                                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Skill listing           | Skill completeness merged #748 (124 skills, `verify:skill-completeness`); the visible set moves to `/init` modules (decision 29) |
| Instruction files       | Merged #756 (T11): the LAWs moved word for word, product and workflow lines moved to docs, the Codex project-doc budget raised   |
| Agents                  | merged #753: read-only write guard (live-proven), report precedence, models per runtime, `e2e-author` surface                    |
| Codex                   | merged #741: `pnpm codex:readonly` (live-proven: the sandbox denies writes)                                                      |
| Flows                   | merged #752: merge policy, review verdict before a PR, a test per hook, flow receipts before commit                              |
| Delivery gate           | merged #739: a merge is refused while the PR is behind its base                                                                  |
| Peer review             | merged #745: one file per finding                                                                                                |
| Prompt-audit findings   | merged #742                                                                                                                      |
| archify                 | Done earlier; no change needed                                                                                                   |
| Product names           | merged #743                                                                                                                      |
| Small hygiene           | merged #735 (dead overrides); `launch.json` and session ownership wait on the owner                                              |
| Docs refresh            | Merged (#738)                                                                                                                    |
| stack-diagram           | Merged (#736)                                                                                                                    |
| Architecture gate       | merged #749: `.agents/contracts/architecture.json` and `verify:architecture` in pre-commit                                       |
| Design review by change | Unblocked: #752 has merged (Next steps C4)                                                                                       |

Integrated in one clone (all ten slices merged with master), the slices hold
together: `pnpm validate` exits 0 (33 of 33 turbo tasks and every gate), and
the live checks pass.

What PD1 changed in this plan: decisions 29–36, PS round 3, four risks, and
the backlog items in `docs/audits/2026-11-04-remediation.md` under "PD1
findings".

### PD2 — converge on the versioned core (after P2–P4, PS and PF)

1. **Split the harness into core and facts.** Generic machinery moves upstream
   into the template core. Certifipago keeps its facts: `harness.config.json`
   becomes `project.config.json` plus contracts (conventions, design, copy,
   concerns, workflow, review, board).
2. **Install the lock.** `harness-lock.json` points at the template core
   version; the donor's copies of core files are replaced by the vendored ones;
   real local adaptations are recorded as adapted.
3. **Generated, not hand-kept.** The `.agents/skills` mirror (what Codex reads)
   and every runtime projection come from the generator, with drift gates.
4. **Adopt the flows.** Certifipago's router comes from the PF flow specs, and
   its flow tests run on its tree.
5. **Retire leftovers.** `scripts/init-project.mjs` gives way to `/init`
   reconfigure; `harness.config.json` stops mixing schema, payload and recipe.
6. **Prove it.** A `harness:update` between two core versions keeps every
   adaptation; the donor's `pnpm validate` stays green; projections and gate
   results are identical before and after.

---

## `/init`

### Flow

1. **Detect mode.** Fresh template clone → `new`. Existing repo without the
   harness → `adopt`. `answers.json` present → `reconfigure`.
2. **Interview by section.** Each section has defaults, can be skipped, and
   writes only its own block of `answers.json`. Sections that need research
   (product, design system) call their skill, which also returns data only.
3. **Show the plan.** A dry run lists every file the executor will remove,
   copy, render or patch, and every dependency and workspace removed.
4. **Confirm, then execute.** Deterministic, journaled, rolled back on failure.
   Idempotent: the same answers produce the same tree.
5. **Validate.** The capability-aware registry runs; the report lists what was
   configured, what was pruned and what is left for the owner (credentials,
   accounts).
6. **Reconfigure later.** `/init <section>` re-runs one section.

The skill name is `init` (it replaces the built-in in terminal sessions). P7
verifies the desktop app; if the built-in still wins there, the skill ships as
`project-init` with `init` as an alias. Running the built-in `/init` would write
a `CLAUDE.md` from scratch, so `verify:instruction-entry` fails any tracked
`CLAUDE.md` or `CLAUDE.local.md`.

### Sections

| #   | Section           | Asks                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Produces                                                                                                                     |
| --- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 0   | Mode              | new / adopt / reconfigure. Adopt: where the code lives (local or remote: host alias, user, key, repo path, lookup order when the address drifts), which ref is the truth, who fetches and pushes; owner rules (comments, allowed git operations, OK per commit, artifact language); verification commands and baselines when the code starts red; code zones (legacy fix-only vs new code); existing building blocks (design-system package, templates, i18n, flag provider, analytics); ticket system, key prefix and fields, design file per ticket, which browser the agent uses; secrets policy | `answers.mode`, `contracts/conventions.json`, `project.config.json` remote profile (untracked)                               |
| 1   | Identity          | product name, slug, package scope, bundle id, owner, license                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `project.config.json` identity; renders package names, `app.json`, i18n `app.name`                                           |
| 2   | Product           | what the project does, users, value; business model canvas → PRD → product digest                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `docs/product/*`, `PRODUCT.md` (via `product-discovery`)                                                                     |
| 3   | Stack fit         | do the template technologies fit? web, mobile, both, React SPA, none; alternatives when not                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | capability set or preset; `contracts/architecture.json` and the `docs/architecture` folder tables                            |
| 4   | Backend and data  | backend: front-end only, a new backend, an existing structure, or the default Supabase (decision 54); tables and entities to start with; auth providers | `contracts/data.json`, `docs/data-model.md`, first migration stub                                                            |
| 5   | Design system     | does one exist? source: Figma, URL, package, tokens file, none; **destination folder** for the copy                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | copied source, `docs/design-system.md`, tokens data → generated tokens, `contracts/design.json`                              |
| 6   | Flows and screens | main user flows; screen list per app                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `docs/user-flows.md`, screen map, scaffolded screens and routes                                                              |
| 7   | Team workflow     | branch strategy, PR policy, merge vs rebase, protected branch, commit convention, board (Notion / Jira / Linear / GitHub Issues / none), through `process-intake` (the team's process document, or a link to read; it writes `docs/process/ticket-flow.md`: the board adapter and its per-operation mapping, the state names, the roles and the sessions that fill them, the approvals, the merge policy, the deploy targets and the branching); owners and reviewers per area (default: the repository owner), written as `CODEOWNERS` only where GitHub honours it (a public repository, or Pro or Team for a private one), otherwise kept in the project config for review routing                                                                                                                                                                                                                                       | `contracts/workflow.json`, `contracts/board.json`, hooks, commitlint; the merge policy, `manual` or `low-risk` (decision 38) |
| 8   | Harness           | runtimes (Claude Code, Codex, OpenCode, Copilot); skill packs (proposed from sections 2–4: marketing or product work, web, mobile, backend; the owner confirms); shared memory (repo URL or none); the artifact language for specs, docs, comments, commits and pull requests, English by default, and the conversation language (decision 48); the workflow: SDD (default) or ODD (decision 40); the toolchain: the latest gentle-ai and each MCP server, connector or plugin not vendored, listed with source and version, installed on the owner's yes and pinned (decision 44)                  | `project.config.json` harness block; projections; pruned skill packs                                                         |
| 9 | Quality profile | gate profile (strict / standard), coverage floor, budgets, mutation on push, review policy; what runs before a push: husky only (default), the pre-push gate, peer review, review skills owed (decision 49) | `contracts/budgets.json`, `contracts/review.json`, registry entries |
| 10  | Docs and diagrams | which doc families to keep; which are generated from code and which hand-kept; diagrams on or off; stack picture on or off                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | pruned `docs/`, `docs/diagrams/`                                                                                             |
| 11  | Providers and libraries | observability: PostHog (the default), Sentry, another or none (decision 53), and with PostHog its consent mode: `granted` (the default), `opt-in` or `memory` (F46); the UI kit behind `components/ui`; every non-core library behind its adapter (decision 51) |

### Everything that is or should be configurable

`Today` says whether the template can configure it now: **yes**, **hardcoded**
(present, not removable by answers) or **missing**.

| Area          | Setting                                                   | Options                                                                                                                     | Default                     | Lands in                                                     | Today                           |
| ------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------ | ------------------------------- |
| Identity      | name, slug, scope, bundle id                              | free text, validated                                                                                                        | —                           | package.json files, `tsconfig.base.json`, `app.json`, i18n   | hardcoded (renamer only)        |
| Identity      | license, owner                                            | SPDX id                                                                                                                     | MIT                         | `LICENSE`, `README.md`                                       | hardcoded                       |
| Stack         | apps                                                      | web-next, mobile-expo, both, react-spa, none                                                                                | both                        | manifest capabilities                                        | partial (no react-spa)          |
| Stack         | Node, package manager versions                            | supported list                                                                                                              | Node 24, pnpm 11            | `.nvmrc`, `package.json`                                     | hardcoded                       |
| Stack         | i18n locales and default                                  | list                                                                                                                        | en, es / en                 | `packages/i18n`                                              | hardcoded                       |
| Backend       | provider                                                  | Supabase Cloud, other, none                                                                                                 | Supabase                    | `packages/supabase`, adapters, env docs                      | partial (every preset keeps it) |
| Backend       | auth providers                                            | email, Google, …                                                                                                            | email                       | Supabase config, auth adapters                               | hardcoded                       |
| Data          | starting tables / entities                                | list with fields                                                                                                            | none                        | `contracts/data.json`, migrations, types                     | missing                         |
| Edge          | CDN / WAF / bot protection                                | Cloudflare, none                                                                                                            | Cloudflare                  | `packages/cloudflare`, web lib                               | yes                             |
| Hosting       | web host                                                  | Vercel, other, none                                                                                                         | Vercel                      | docs, config                                                 | hardcoded                       |
| Observability | error tracking                                            | Sentry, PostHog, none                                                                                                       | none                        | `@core` port + adapter                                       | hardcoded (Sentry)              |
| Analytics     | product analytics                                         | PostHog, none                                                                                                               | none                        | adapter                                                      | missing                         |
| Design        | design system source                                      | Figma, URL, package, tokens file, none                                                                                      | none                        | `contracts/design.json`                                      | missing                         |
| Design        | destination folder for the copied source                  | path                                                                                                                        | `docs/design/source/`       | executor `copy`                                              | missing                         |
| Design        | themes                                                    | light, dark, both; default theme                                                                                            | both / dark                 | tokens                                                       | hardcoded                       |
| Design        | brand palette, fonts, radii, motion                       | from the design system or entered                                                                                           | template defaults           | tokens data → generated files                                | hardcoded                       |
| UI            | UI kit                                                    | template blocks, shadcn, none                                                                                               | template blocks             | `components/ui`                                              | hardcoded                       |
| Testing       | e2e web / e2e mobile                                      | Playwright / Maestro / none                                                                                                 | Playwright / none           | manifest                                                     | partial                         |
| Testing       | coverage floor, mutation on push                          | numbers / on, off                                                                                                           | profile value               | `contracts/budgets.json`, hooks                              | missing                         |
| Budgets       | route bundle limit, mobile bundle limit                   | kB                                                                                                                          | unset                       | `contracts/budgets.json`                                     | missing                         |
| Workflow      | branch strategy                                           | trunk, feature branches, stacked to main, feature-branch chain                                                              | feature branches            | `contracts/workflow.json`, hooks, `AGENTS.md` rows           | missing                         |
| Workflow      | merge policy, protected branch                            | merge, squash, rebase / name                                                                                                | merge / main                | hooks                                                        | missing                         |
| Workflow      | commit convention, attribution                            | conventional on/off; AI attribution on/off                                                                                  | conventional / off          | commitlint, `AGENTS.md`                                      | hardcoded                       |
| Workflow      | CI provider and jobs                                      | GitHub Actions, none; job list                                                                                              | GitHub Actions              | `.github/workflows`                                          | hardcoded                       |
| Workflow      | board                                                     | Notion, Jira, Linear, none                                                                                                  | none                        | `contracts/board.json`                                       | missing                         |
| Review        | review policy                                             | native review on/off, adversarial review on push                                                                            | off                         | `contracts/review.json`, hooks                               | missing                         |
| Harness       | runtimes                                                  | Claude Code, Codex, OpenCode, Copilot, Cursor, Gemini/Antigravity, Devin, Amp                                               | Claude Code + detected CLIs | projections per the runtime matrix                           | missing                         |
| Harness       | skill packs                                               | core, design, marketing, e2e, data, docs                                                                                    | core                        | skill tree, `skill-phases.json`                              | missing                         |
| Harness       | workflow                                                  | SDD (OpenSpec in the repository, by size), ODD (a committed feature document)                                               | SDD                         | `harness.config.json` `workflow.mode`; `openspec/` or `odd/` | missing                         |
| Harness       | toolchain                                                 | gentle-ai (with engram, gga), CodeGraph CLI; each installed or upgraded to its latest release                               | all, on the owner's yes     | harness lock (resolved versions); `gentle-ai doctor`         | missing                         |
| Harness       | MCP servers, connectors, plugins                          | next-devtools, shadcn, expo, metro, react-native-docs, and those later capabilities add                                     | per selected capability     | `.mcp.json` (pinned `package@version`); runtime projections  | missing                         |
| Harness       | shared memory                                             | repo URL, none                                                                                                              | none                        | `project.config.json`, `docs/memory.md`                      | hardcoded (owner URL)           |
| Harness       | languages                                                 | artifact language (specs, docs, comments, commits, pull requests); conversation language                                    | English / the user's        | `openspec/config.yaml`; the `AGENTS.md` rule                 | missing                         |
| Harness       | model tiers per agent                                     | per agent                                                                                                                   | template defaults           | `.agents/agents/*`                                           | missing                         |
| Docs          | doc families kept                                         | architecture, product, design, QA, ADRs, living docs                                                                        | all                         | manifest `docs` capability                                   | missing                         |
| Docs          | diagrams                                                  | on, off                                                                                                                     | on                          | archify skill, `docs/diagrams`                               | yes (always on)                 |
| Docs          | generated or hand-kept, per doc                           | generated from code, hand-kept                                                                                              | per family                  | manifest `docs` capability, freshness check                  | missing                         |
| Docs          | stack picture                                             | on, off                                                                                                                     | on                          | stack-diagram skill, `docs/diagrams`                         | missing                         |
| Adopt mode    | code location                                             | local, remote machine (command template)                                                                                    | local                       | `project.config.json`                                        | missing                         |
| Adopt mode    | living docs from the codebase                             | on, off                                                                                                                     | on for adopt                | `living-docs` capability                                     | missing                         |
| Adopt mode    | conventions                                               | detected: language, test style, suffixes, line limit                                                                        | detected                    | `contracts/conventions.json`                                 | missing                         |
| Data          | feature-flag provider and policy                          | Unleash, other, none; read once, no flag conditionals in UI                                                                 | none                        | `contracts/data.json`, `contracts/review.json`               | missing                         |
| Workflow      | commit authority                                          | agent commits, owner approves each commit                                                                                   | agent commits               | `contracts/workflow.json`                                    | missing                         |
| Workflow      | worktrees                                                 | allowed (with location), forbidden                                                                                          | allowed                     | `contracts/workflow.json`, precedence line                   | missing                         |
| Workflow      | where the gate runs                                       | pre-push, CI, merge queue                                                                                                   | pre-push + CI               | hooks, `.github/workflows`                                   | missing                         |
| Workflow      | scope document and owner; session ownership               | path and owner; area per session                                                                                            | `docs/GENERAL_PLAN.md`      | `contracts/workflow.json`                                    | missing                         |
| Review        | PR peer reviewer, when, depth, hosted reviewers, blocking | other provider if installed, same provider in a fresh session, none; pre-push, PR CI, on demand; advisory or block on P0/P1 | per D-E                     | `contracts/review.json`, hooks, CI, `.reviews/`              | missing                         |
| Harness       | browser-only sources                                      | Jira, Figma, other, through one browser                                                                                     | none                        | `project.config.json`                                        | missing                         |
| Harness       | precedence with user-level instructions                   | project wins, user wins, per topic                                                                                          | project wins                | `AGENTS.md` precedence line                                  | missing                         |
| Quality       | error baseline at init; QA email base                     | captured number; address pattern                                                                                            | captured / none             | `contracts/budgets.json`, test config                        | missing                         |

### The LLM's boundary (locked decision 4)

- The interview writes `answers.json` only. The executor validates it against
  `answers.schema.json` and refuses unknown keys.
- Research-heavy sections return **data files**, also schema-checked: the
  product skill returns the canvas and PRD content; the design-system skill
  returns a tokens data file. Generators render code from those files.
- The executor never calls a model.

---

## Phases

Each phase closes with its docs updated (D1–D4 contract in
GENERALIZATION_PLAN.md) and a green `ATL_TEMPLATE_SELF=1 pnpm validate`.

| #   | Phase                        | Delivers                                                                                                                                                                                                                                                                                                                                                                                                                        | Closes / depends                                  | Exit check                                                                                                 | Status                                                                                               |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| PA  | Inputs + intensive audit     | agent answers; deep analysis of both codebases and this repo against the objective; usage, health, correctness and fit verdict for every artifact; report in `docs/audits/2026-11-04-harness-audit.md` and the remediation backlog; owner runs `/doctor`, `/doctor prompt-audit`, `/skill-doctor`                                                                                                                               | decision 19                                       | every input complete; every artifact has a verdict with evidence                                           | ◐                                                                                                    |
| P0  | Land staged work per verdict | the 351 staged paths as 8 units, in the forced order and with the fixes listed in the audit; drop unstaged and reverted                                                                                                                                                                                                                                                                                                         | PA, owner OK                                      | clean tree, validate green                                                                                 | ☐                                                                                                    |
| P1  | Single router                | `AGENTS.md` becomes the router and shared rules (its lifecycle tables later generated from the PF flow specs); no `CLAUDE.md`; `verify:instruction-entry`                                                                                                                                                                                                                                                                       | decision 12                                       | gate proven by a planted violation                                                                         | ☐                                                                                                    |
| P2  | Harness core                 | `.agents/` structure; projector for 4 runtimes + `projection-check`; `core/contracts`; `skill-phases.json`; registry generator (product name read from config); `verify:core-purity`; `agent-context`; agents rebuilt per the run evaluation (read-only hook and sandbox, report precedence, models per runtime, conventions contract, validation groups as data, a run eval per agent)                                         | decisions 13–15                                   | projections regenerate byte-identical                                                                      | ☐; `verify:skill-completeness`; hook-safe test helpers (`gitFreeEnv`, `withHookGitDir`, decision 33) |
| P3  | Gate registry                | `scripts/gate/*` with capability, stage, profile and cost fields; ratchet registry; `pnpm harness:audit` with a hand-owned status file; blinded companions; `apps.detect` with react-spa and none; `validate` runs the registry                                                                                                                                                                                                 | B2, decision 17                                   | a capability removes a gate by data                                                                        | ☐                                                                                                    |
| P4  | Project facts                | `project.config.json` + contract schemas; `verify:skill-contracts`; `verify:generic` brand gate; region markers in docs and skills                                                                                                                                                                                                                                                                                              | B3, B4                                            | brand gate 0 hits; a pruned region leaves no stale text                                                    | ☐; `contracts/architecture.json` + `verify:architecture` in pre-commit (decision 32)                 |
| PS  | Skills regrouped and fixed   | packs and front doors; merges; every skill against the quality bar; skill gates; trigger evals; 30-day usage review                                                                                                                                                                                                                                                                                                             | P2, P4, decisions 20–22                           | every PS item in the backlog checked or reasoned; enabled packs fit the listing budget; trigger evals pass | ☐                                                                                                    |
| PF  | Complete flows               | seven flow specs; router generated from them; hooks and gates on every approval point; flow verifier; one end-to-end test per flow                                                                                                                                                                                                                                                                                              | PS, P3, decision 27                               | every flow test green on a fixture repo, forbidden moves refused                                           | ☐                                                                                                    |
| PD1 | Certifipago fixes now        | skill listing, instruction files, agents, Codex sandbox, flow gates, merge-result gate, per-finding reviews, prompt-audit findings, archify, product names, hygiene, docs refresh, stack-diagram — in a donor worktree, one PR per slice                                                                                                                                                                                        | PA, P0 (the docs slices only PA), owner OK per PR | each slice: same gate results before and after, its finding gone                                           | ☐. Delivered as PRs 2026-11-05 (see "PD1 status")                                                    |
| PD2 | Certifipago on the core      | core and facts split; `harness-lock.json`; generated mirror and projections; flows adopted; leftovers retired                                                                                                                                                                                                                                                                                                                   | decision 18, P2–P4, PS, PF                        | an update between two core versions keeps its adaptations and its validate green                           | ☐                                                                                                    |
| P5  | Manifest v2                  | capabilities: sentry, posthog, vercel, workflow, docs, skill packs, runtimes, react-spa, living-docs; `templates/`; identity rename folded into `render`                                                                                                                                                                                                                                                                        | decision 16                                       | coverage gate green; every capability has `onAbsent`                                                       | ☐                                                                                                    |
| P6  | Executor                     | `scripts/init/`: plan (dry run) → apply → journal → rollback; idempotent; harvests the scaffold's plan/journal pattern                                                                                                                                                                                                                                                                                                          | P5                                                | same answers → same tree hash; failed run restores the tree                                                | ☐                                                                                                    |
| P7  | `/init` skill                | interview, sections 0–10, `answers.schema.json`, reconfigure; desktop-app name check                                                                                                                                                                                                                                                                                                                                            | P6                                                | each preset initialized from answers fixtures                                                              | ☐                                                                                                    |
| P8  | Design-system intake         | sources → copy to the chosen folder → `docs/design-system.md` → tokens data → generated tokens and mirrors → `verify:theme-sync`; donor token additions and lint rules                                                                                                                                                                                                                                                          | P7                                                | a sample design system round-trips to green                                                                | ☐                                                                                                    |
| P9  | Remaining harvest            | scaffold generator, observability port, vitest base, budgets, hooks, UI block delta, the rest of GENERALIZATION_PLAN phases 3, 5–7                                                                                                                                                                                                                                                                                              | P3                                                | per-item ledger rows                                                                                       | ☐                                                                                                    |
| P10 | Adopt mode and living docs   | adopt flow generating first `AGENTS.md`, the remote read-only command template, `docs/stories/`, `docs/lessons-learned.md` and the session-start self-check; the code map only on demand, after two or three tickets show which questions it must answer (generated catalogs and per-area pages, extractor that follows re-exports, entry-count checks on snapshots, no invented taxonomy); `verify:harness-refs` in every mode | P7                                                | adopt a sample repo without pruning it                                                                     | ☐                                                                                                    |
| P11 | Round trip                   | every preset initialized in a scratch clone, and every flow test run on it; CI matrix per preset                                                                                                                                                                                                                                                                                                                                | P7                                                | all presets green, brand gate 0                                                                            | ☐                                                                                                    |
| P12 | Other derived projects       | `harness:update` to every other derived project; the Qik workspace adopted through adopt mode                                                                                                                                                                                                                                                                                                                                   | PD2, P10                                          | each project updates without losing its adaptations                                                        | ☐                                                                                                    |

---

## Risks

| Risk                                                                                                                                  | Mitigation                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| The built-in `/init` writes a fresh `CLAUDE.md` and breaks the single-router setup                                                    | Our skill replaces it in terminal; `verify:instruction-entry` fails a tracked `CLAUDE.md`                   |
| A personal `~/.claude/skills/init` shadows the project skill                                                                          | The skill prints its own version line; the README names the conflict                                        |
| A private `CLAUDE.local.md` disables native `AGENTS.md` reading                                                                       | Decision 12 keeps no `CLAUDE.md`, and the check fails a tracked `CLAUDE.local.md`                           |
| Codex has no per-agent tool allowlist                                                                                                 | Read-only agents stay read-only by prompt; git hooks are the enforcement every runtime gets                 |
| Windows clones break symlinks                                                                                                         | Generated copies plus parity gates, never symlinks                                                          |
| 351 staged paths could be lost or drift while PA runs                                                                                 | Left staged and untouched; PA reads them, nothing writes them until P0                                      |
| Harvesting 60 gates at once hides regressions                                                                                         | One gate per work unit, each proven by a planted violation                                                  |
| A nested `claude -p` audit run could edit the repo                                                                                    | Run with `--permission-mode plan` and edits disallowed; compare a `git status` fingerprint before and after |
| Skills and agents silently never load when sessions start in another directory (Qik: zero skill invocations, about 280 reads by path) | Decision 28: install or register the harness where sessions start, plus a session-start self-check          |
| Usage is recorded per machine, so a skill used only elsewhere looks unused                                                            | The audit names the machines it covered; "unused" alone never means drop without a second signal            |
| Refactoring Certifipago's harness breaks its daily work                                                                               | Worktree, one slice per PR, differential check: same projections and gate results before and after          |
| Tests that spawn git inside a git hook write to the hook's repository (`core.worktree`, a test identity)                              | Decision 33: `gitFreeEnv` in every suite, a decoy-`GIT_DIR` test per suite, integration in a separate clone |
| A hook's shell parser never covers every bash form (four review rounds on one guard)                                                  | Decision 34: refuse what cannot be read; live tests in temp-dir clones                                      |
| Probe and audit runs exhaust the plan quota shared with daily work (about 100K tokens a session)                                      | Decision 35: forecast in quota and API dollars first; one prompt per skill unless the owner asks for more   |
| Concurrent `pnpm validate` runs on Windows fail on file locks                                                                         | Pushes go one at a time through a queue; the flaky launcher test is a backlog fix                           |

---

## Open decisions

| #    | Decision                                                | Recommendation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-A  | Distribution of the central harness                     | **Decided: A, vendored and versioned** (decision 18)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| D-B  | Runtimes                                                | **Decided 2026-11-04:** one `AGENTS.md` (Claude Code imports it), `.claude/skills` canonical, `.mcp.json` canonical, one set of hook scripts; per-runtime files generated only for the runtimes `/init` selects. `/init` asks, defaulting to Claude Code plus every CLI it detects (`codex`, `copilot`, `opencode`, `gemini`/`agy`, `devin`, `amp`) and marker folders.                                                                                                                                                                                                                                                                                     |
| D-C  | Backend default                                         | **Decided 2026-11-04:** Supabase stays the default and becomes removable (`backend: none` or another provider)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| D-D  | Default branch strategy                                 | **Decided 2026-11-04:** feature branches into a protected `main`, merged by PR with merge commits                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| D-E  | PR peer reviewer                                        | **Decided 2026-11-04:** `/init` asks. Default: a different provider from the one that writes the code when its CLI is installed (`codex review --base <base>`, or `codex exec -s read-only --output-schema` for structured findings); otherwise the same provider in a fresh session (`claude -p "/code-review high <base>...HEAD"`). Runs at pre-push by default; PR-time CI and hosted reviewers (Codex cloud, Claude Code Review, Copilot review) are opt-in and plan-gated; ultrareview is opt-in because it bills. One file per finding under `.reviews/<branch>/<reviewer>/` with a verdict field; advisory by default, optionally blocking on P0/P1. |
| D-S1 | Style-constant suffix | **Decided 2026-11-13, as recommended.** **`.style.ts`**: every other binding suffix is singular (`.type.ts`, `.constant.ts`, `.hook.ts`, `.service.ts`, `.adapter.ts`); Certifipago already uses it in 156 files, the template in far fewer, so the template renames. |
| D-S2 | Test location | **Reversed 2026-11-15 (decision 57).** Each block keeps its tests in its own `__tests__/` folder, and a strict gate checks that the folder is the unit's own. The earlier choice, beside the unit, was decided 2026-11-13 as recommended. |
| D-S3 | Markdown formatted by Prettier | **Decided 2026-11-13, as recommended.** **No**, Certifipago's rule (`.prettierignore`: Markdown is prose). Evidence: Prettier broke template docs twice (code-standards §14a and a `global-map.md` glob, both in the 2026-11-04 audit), and it realigns a whole table when one cell changes, so a five-row plan edit shows as +170/−45. Links and shape stay held by `verify:maps` and `verify:specs`. The template drops Markdown from Prettier; Certifipago keeps its rule. Changed from "yes" on 2026-11-13, when the owner asked whether formatting Markdown was right. |
| D-S4 | Folder of decision records | **Decided 2026-11-13, as recommended.** **`docs/decisions/`**, Certifipago's: several of its ten records are product or security decisions (checkout mock payment, manual billing, accepted hardening risks), not architecture, so the general folder fits; the template moves its single record (`0001-pluggable-providers.md`) and the references to it. Changed from `docs/architecture/decisions/` on 2026-11-13. |
| D-S5 | Language of owner quotes in Certifipago's SDD artifacts | **Decided 2026-11-13, as recommended.** **Its artifact language** (decision 48): Certifipago writes its artifacts in English, so its quotes are translated and marked, as here. |
| D-S6 | pnpm version | **Decided 2026-11-13, as recommended.** **11.9.0**, Certifipago's: newer, and proven there on this stack; the template upgrades (Stage 2, 2.3). |

---

## Log

- **L1 (2026-11-04, owner, translated from Spanish):** "To sum up, put together a
  plan to make the project generic but with an init that lets it be configured
  from head to toe. Centralize the harness and let everything be configurable.
  To do that, put together strategies such as having the skills centralized and
  then having them call the project-specific files, among others you can
  identify, and communicate with the other agents to get much more context"
- **L2 (2026-11-04):** four read-only maps (donor harness, donor delta, Qik
  workspace, this repo) and two documentation checks (AGENTS.md loading, skill
  name precedence, plugins). Architect consultation expired undelivered; Qik
  consultation queued while that session is offline.
- **L3 (2026-11-04):** the owner aligned the permission modes; the architect
  consultation was sent again and reached that session's inbox.
- **L4 (2026-11-04, owner, translated from Spanish):** "let's go with option A,
  vendored and versioned / Also, I want you to include in the plan a refactor of
  Certifipago and its harness so it can be updated, and to see whether there are
  also things we need to update. Also, before copying the skills and everything
  they use, we should see how much they are used, and whether they are used
  properly, with /doctor"
- **L5 (2026-11-04, owner, translated from Spanish):** "and also not only /doctor
  but with an intensive analysis of everything in the repo"
- **L6 (2026-11-04):** D-A decided (decision 18). Added decision 19, phase PA
  (intensive audit) and phase PD (distribution and Certifipago convergence);
  P12 now covers the other derived projects. Verified in the Claude Code docs:
  `/doctor` reports unused extensions, invalid settings, duplicate subagent
  names, derivable `CLAUDE.md` content and the skill-listing cost;
  `/doctor prompt-audit` finds outdated or conflicting instructions and missing
  references; `/skill-doctor` reports per-skill cost and never-invoked skills;
  `claude doctor` is the read-only terminal check; `claude plugin validate
.claude/skills` finds frontmatter that does not parse.
- **L7 (2026-11-04):** two sessions named "Qik - Frontend" were listed; the
  consultation had gone to the offline one. It was sent again to the active
  local session.
- **L8 (2026-11-04, owner, translated from Spanish):** "How are you going to
  start P0 if you don't have all the info on certifipago and qik, and an analysis
  of both codebases made with the objective in mind?"
- **L9 (2026-11-04):** correct, and the plan contradicted itself: decision 19
  forbids harvesting without a PA verdict, P0 came before PA, and the staged
  work holds harvested material (72 archify files, harvested lint rules,
  manifest gates). PA now runs first, with its inputs as an entry condition;
  P0 lands the staged work per verdict; a fourth audit question, "does it serve
  the objective?", was added.

- **L10 (2026-11-04):** PA inputs complete except the Qik session's answer.
  The usage census, four static analyses, `/skill-doctor` and
  `/doctor prompt-audit` on both repos, and the Certifipago architect's five
  answers produced 1,469 verdict rows: `docs/audits/2026-11-04-harness-audit.md`.
- **L11 (2026-11-04):** corrections from evidence. The doctor commands run
  headless with `claude -p` (the architect proved it; this repo's run was
  read-only and left the tree unchanged). The donor's skills mirror is
  byte-identical, not partially synced. The manifest claim on this untracked
  plan turned `verify:manifest:coverage` red; the claim was removed, and the
  file gets its owner when it is committed.
- **L12 (2026-11-04):** decisions 20–24 added (default skill set with opt-in
  packs, schema-only contracts and no counts in prose, no in-place vendored
  edits, gate on the merge result, precedence line with user-level
  instructions); ten new `/init` parameters; eight new Certifipago items for PD.

- **L13 (2026-11-04, owner, translated from Spanish):** "Once we have everything
  clear, we have to see how to group and fix the skills in a way that they can be
  used correctly, and fix everything the audits ask for"
- **L14 (2026-11-04):** added phase PS (packs, front doors, merges, quality bar,
  skill gates, trigger evals, 30-day usage review) and decision 25. Generated
  the remediation backlog: 517 actionable items from the audit rows and both
  prompt audits, each assigned to its phase.

- **L15 (2026-11-04, owner, translated from Spanish):** "Can you review the plan
  and see whether everything is correct with the advisor?"
- **L16 (2026-11-04):** advisor review applied. Decision 25 could not work
  (a generated file with checkboxes, generators only in the session): the
  backlog is now hand-maintained and `pnpm harness:audit` moves to P3 with a
  status file. `docs/audits/**` joins the maintainer capability (P0 unit 8) and
  the `.prettierignore` line joins P0 unit 1. Decision 22 now allows a recorded
  patch over upstream, which is how P0 unit 5b (the archify sigil fix) lands.
  Skills with a high-confidence prompt-audit finding cannot stay keep or defer.
  Same-name skills get a base-copy rule. Counts left the exit checks. A table
  now says which phase each open input blocks.
- **L17 (2026-11-04, owner, translated from Spanish):** "Also look at the
  subagents too, validate them and see whether they work as they should, and put
  them in the plan. And also that the subagents' rules be adaptable to the style.
  And that too should be part of the init."
- **L18 (2026-11-04, owner, translated from Spanish):** "Also think about the
  complete flows and not only about skills or one-off things. Verify that and
  take it into account in the plan"
- **L19 (2026-11-04):** two read-only evaluations launched: real subagent runs
  (tool discipline, output contract, hardcoded rules) and real end-to-end flows
  from session transcripts against the declared lifecycle. Their results feed
  the agents and flows sections.

- **L20 (2026-11-04):** subagent evaluation done (1,205 runs). Read-only is not
  enforced for Bash, a model alias broke every Codex validator spawn, and the
  validator's format conflicts with skill report templates. Added decision 26
  and the agents section; P2 now carries the fixes.

- **L21 (2026-11-04, owner, translated from Spanish):** "for DB, no, not everyone
  uses agents.md, and can something centralized be done? If that is not the
  case, ask, or by default. Also, something I forgot and you just reminded me of
  is the peer reviewer of the PRs: ask whether they have codex or whether they
  want an independent session to review it using the same provider. DC, DD as
  recommended"
- **L22 (2026-11-04):** D-C and D-D decided as recommended. D-B direction
  recorded; a support matrix (AGENTS.md, skills folders, agent formats,
  sandbox, hooks, MCP per runtime) and the peer-review mechanisms are being
  verified against primary sources. D-E added.

- **L23 (2026-11-04):** flow analysis done (764 change units). Delivery steps
  are followed; review and validation in the middle mostly are not; the agent
  merges its own PRs. Added decision 27, the PF section and phase, and flow
  tests to P11.

- **L24 (2026-11-04):** runtime and peer-review matrices verified against
  primary docs. D-B and D-E decided. Correction: Codex agent files cannot set
  `sandbox_mode`; read-only Codex agents need a session-level sandbox.
  `.agents/skills` is read by every surveyed runtime except Claude Code, which
  answers the architect's open question: the donor's mirror is what Codex reads.

- **L25 (2026-11-04):** the Qik frontend session answered. Its skills never
  loaded as skills because sessions started in another repository; its three
  agents were never used (the work ran inline); the payoff came from the remote
  read-only template, per-story docs, the lessons log, owner rules and small
  deterministic checks; the code map paid off once at high cost. Added decision
  28; P10 now generates the cheap pieces first and the code map on demand;
  `/init` section 0 carries the adopt-mode questions.

- **L26 (2026-11-04, owner, translated from Spanish):** "We would have to see why
  they are not used, because in reality they should be used given the
  programming context, and almost all of them are about that; the others are
  marketing and PO ones, and they are not used because we are not applying them
  yet. First let's analyse the default ones, and if it is necessary, add them,
  because that decision also rests on what one wants, whether they want
  marketing, web only, app only, etc., and that should also be asked in the
  /init. Also, if the problem is the token maximum, go validating them one by one
  and test a flow that should use all of them, and so little by little"
- **L27 (2026-11-04):** root cause confirmed from `/skill-doctor` (105 of 123
  donor skills listed by name only). Decision 20 rewritten (grown one by one,
  packs derived from `/init` answers); verdict rule corrected (reads split into
  use and authoring; no signal means deferred, not dropped); PS gains tiers a–c.
  Two runs launched: the use/authoring split of reads, and tiers a and b on a
  scratch clone.
- **L28 (2026-11-04, owner, translated from Spanish):** "But if the 11 to remove
  are because of defects, wouldn't it be better to fix them?"
- **L29 (2026-11-04):** verified: only four of the eleven had fixable defects
  (missing upstream files, an oversized description, files `/init` can create);
  two were duplicates; five were out of the donor's scope but useful to other
  projects. All re-classified (fix, merge, or defer into a pack); no skill is
  dropped. Vendored fixes go through re-vendoring the complete upstream skill or
  an overlay, never an in-place edit (decision 22).

- **L30 (2026-11-04):** PS tiers a and b, first round (20 candidates, 100
  probes). Isolation, budget ceilings per context size, the hiding mechanism
  and the trigger misses recorded under PS. Side effects reported to the owner:
  usage counters moved and the completed runs billed usage.

- **L31 (2026-11-04, owner, translated from Spanish):** "Remember that the plan
  must include updating certifipago's harness too"
- **L32 (2026-11-04):** PD was stale (it still said "drop unused skills" and
  lacked the agent, flow, budget and runtime findings) and waited for the whole
  core. Split into PD1, Certifipago fixes that start right after P0, and PD2,
  the convergence on the versioned core.

- **L33 (2026-11-04, owner, translated from Spanish):** "while you are installing
  that, we also have to update all of certifipago's documentation, as was done in
  qik; that will also help the template, to leave everything clean / I also
  found this skill https://github.com/caru-ini/stack-diagram; validate it with
  certifipago's harness, install it and put it in some flow so that it also
  updates the documentation with it; vendor it, or otherwise it can also be
  integrated into some skill"
- **L34 (2026-11-04):** Two PD1 docs slices added (docs refresh, stack-diagram);
  they start now because they touch only the donor tree. Caveat recorded: Qik's
  own retrospective rated its generated knowledge base high cost, low payoff so
  far, so only the parts that paid off are taken. stack-diagram pre-verdict: G2
  pass; G1 and G3 fail as is, both fixable; vendored with adaptations rather
  than merged into archify, whose bundled marks lack about half of the donor
  stack. New docs flow in PF; `/init` section 10 asks which docs are generated.
- **L35 (2026-11-04):** Correction from the donor session: Certifipago already
  commits five archify diagrams, rendered by `scripts/archify-render.mjs` and
  checked by `verify:archify-provenance`; the earlier search looked only in
  `docs/diagrams/`. The docs slice extends that renderer instead of porting the
  template's. stack-diagram upstream has 19 files, not 20.

- **L36 (2026-11-04):** PS round 2 recorded: rewritten descriptions, budget per
  model in the real setup, where the budget settings may live, three-repeat
  probes, cost and side effects.

- **L37 (2026-11-05, owner, translated from Spanish):** "something I think we also
  need is an architecture reviewer, one that validates that the folders follow what
  the architecture documentation says before a commit. can we validate that and add
  it to the plan?" Validated on Certifipago master: folders and `docs/architecture` agree
  after #738, but no gate holds it; the structure gates hard-code their rules and
  the doc gates check only docs → repo. Added: a PD1 "Architecture gate" slice, an
  architecture contract in the project facts, an "Architecture change" flow, and
  `/init` section 3 producing the contract and the docs' folder tables.

- **L38 (2026-11-05, owner, translated from Spanish):** "and how can I make it so that when a
  component / screen / section is created it passes the design audits". Added a PD1 "Design review by change"
  slice: compliant scaffolds at creation, and a path → review-skill routing table the PR
  hook enforces on the review verdict; the Feature flow and `/init` section 5 name it.
- **L39 (2026-11-05):** T13 — plan rebuilt from PD1 and its tests (owner, PD1,
  translated from Spanish: "and with that you rebuild the plan for the template"). Added decisions 29–36, PS
  round 3, "PD1 status", four risks, the P2, P4 and PD1 phase cells, and the
  "PD1 findings" backlog section; Quick path step 7 updated. Evidence: the
  donor feature document `odd/tasks/harness-pd1.md`, L13–L22.
- **L40 (2026-11-05):** `pnpm validate` over the integrated PD1 tree (master
  plus all ten PD1 branches, in a separate clone) exits 0: 33 of 33 turbo tasks
  and every gate.
- **L41 (2026-11-05):** All ten PD1 PRs merged on the owner's word (translated
  from Spanish: "merge all the rest"); master at `48c3c9e3f`. T11 (instruction files) is next.
- **L42 (2026-11-05, owner, translated from Spanish):** "Yes, close it as you propose,
  but validated first". T1b closed. `.claude/launch.json` is per machine (ignored, with an
  example). Session ownership is not configured: hook input carries `session_id`,
  `cwd`, `permission_mode` and, inside subagents, `agent_type`, but no session
  name (code.claude.com/docs/en/hooks), so nothing could enforce it, and each
  session already works in its own worktree. Owners are people, asked in `/init`
  section 7; `CODEOWNERS` is written only where GitHub honours it: code owners
  in private repositories need GitHub Pro or Team (docs.github.com, GitHub's
  plans), so Certifipago, private on the free plan, keeps none.
- **L43 (2026-11-05, owner, translated from Spanish):** "the routing, yes; the
  threshold we can ask in the init; for certifipago, for now, let it stay manual but
  be changeable / for the rest, let's follow your recommendation", then "put together
  a plan for the template and the current project, and update the current plan". Added "Next steps"
  (Certifipago C1–C5, template T1–T7) and decisions 37 (five questions), 38 (merge
  policy as a setting) and 39 (Codex project-doc budget); `/init` section 7 asks the
  merge policy; PD1 status updated (T11 PR open, design review unblocked).
- **L44 (2026-11-05):** Correction to L43: the watch-video notes template is not
  missing. `templates/video-notes.md` is on master in both skill trees; the video
  agents read the owner's main checkout, 97 commits behind master, because the
  brief pointed there. The step was removed from "Next steps".
- **L45 (2026-11-05, owner, translated from Spanish):** "Remember that if something
  changes in certifipago, it should also be implemented in the template and vice
  versa". Added the
  parity ledger under "Next steps"; the template has none of the PD1 pieces yet,
  so they travel with the harvest steps T2–T5.
- **L46 (2026-11-05):** P0 landed locally on `feat/p0-land-staged`: the 351 staged
  paths as 10 commits (`08752d9`…`0e3f49b`), backups `refs/backup/p0-staged-index`
  and `refs/backup/p0-worktree` first; `ATL_TEMPLATE_SELF=1 pnpm validate` green on
  every commit but the first, whose typecheck failure was already on `main` and is
  fixed by the second. `.atl/` is ignored; `docs/SDD_SYNC_PROMPT.md` is dropped per
  the audit. Native review assessment: only `08752d9` (hooks, root scripts) is due;
  the rest are medium and under budget. An independent verifier runs first.
- **L47 (2026-11-05):** Certifipago C2 measured (32 build probes, one run each):
  14 of 32 build skills load on their own prompt, against 10 before; the 24 newly
  routed 10 of 24 (5 before). Still under half, so decision 30's router hook is
  next, after the five questions. C2 is PR #758; C3 and C4 are being pushed; C4's
  independent verifier found no blocker and two advisories, both fixed.
- **L48 (2026-11-05):** P0 closed locally: four more commits (`ee09208` the seven
  audit docs, `91bcd11` core import rules, `3d31c02` `.gitattributes` copied from
  Certifipago, `4a9ec5f` the 19 P0 items checked off); `ATL_TEMPLATE_SELF=1 pnpm
validate` exits 0. Independent verifier: no blocker. Native review: the hooks
  commit was reviewed alone (granted, two lenses, no finding, acknowledged); the
  whole range against `main` stopped with `lens_context_budget_exceeded` (382 files,
  64,788 lines, no authority created), and the range after the hooks commit assesses
  medium and under budget, so no further review is due. Parity rows for P0 added.
- **L49 (2026-11-11, owner, translated from Spanish):** "Pick up what is missing, but now
  also, in the init, ask whether ODD or SDD is wanted, as in the certifipago repo, where it
  has just been implemented, and by default leave sdd and leave the specs done. The
  architect's session just added that. Add it and adapt the plan, and we can even update the
  plan at some points before anything else, and continue. Also, there are new changes, so we
  have to see whether everything is correct, adopt it and fix everything. Also, as we are
  doing now with sdd, the best would be for the whole plan to go through this new sdd process
  to validate the flow".
  Checked at Certifipago `origin/master` `cda657025` and its open pull requests: SDD
  replaced ODD on 2026-11-10 (`AGENTS.md:66`), chosen by size, with no ODD/SDD setting, so
  the `/init` choice is new design. Added decisions 40–43, steps T1a–T1b, the workflow in
  `/init` section 8 and the configurable list, and parity rows both ways.
- **L50 (2026-11-11):** The PD1 feature document (`odd/tasks/harness-pd1.md`, untracked in
  the Certifipago worktree `harness-pd1`) is gone: the worktree was removed between
  2026-11-05 and 2026-11-11. Its pending list survives in Engram (`odd/harness-pd1/tasks`);
  its verbatim specs S1–S23 are lost, and the pull requests and this plan carry what each
  asked. Decision 40 records the lesson.
- **L51 (2026-11-11, owner, translated from Spanish):** "something I forgot, and it was that
  the init must install the latest version of gentle ai and any other connector or mcp or
  plugin that is needed and is not vendored". Decision 44, `/init` section 8, two configurable rows, step T6 and a
  parity row (pinning Certifipago's MCP servers, the owner's call). Checked first: gentle-ai
  4.3.1 (`go install`), its `install`/`upgrade`/`sync`/`doctor` commands, CodeGraph 1.4.1 (npm),
  and the five MCP servers of Certifipago's `.mcp.json`.
- **L52 (2026-11-12):** Step T1a landed as the template's first OpenSpec change,
  `2026-11-11-adopt-sdd`, on `feat/adopt-sdd` (`c4ab3d9`–`72301ed`, then its verify report
  and archive): `openspec/` with the README, `config.yaml` and the six templates harvested from
  Certifipago `cda657025` without product text; `verify:specs` and `report:spec-drift` inside
  `validate`, with `scripts/gate/` and `scripts/git-free-env.mjs` claimed by `core`; the `sdd`
  skill and nine evals; the `sdd` capability in every preset. `openspec/specs/**` is claimed
  with the first living spec (T1b); `sdd-steward` moved to its own parity row (T2). Owner rule,
  2026-11-12 (translated from Spanish): "everything in the template must be in English, no
  exceptions, no Spanish parts at all; the only Spanish allowed is the translations", the i18n
  catalogs; the change's proposal quotes the owner in English and the templates ask for it.
- **L53 (2026-11-12, owner, relayed by the Certifipago - Web session, translated from Spanish):**
  "merge everything pending, make a plan for the rest of what is missing, and include this with
  priority". Added T1c (`#src` package aliases, decision 45) and T1d (`@app/tooling`, decision 46) ahead of T1b, with their parity rows. Checked on `main` `9d7787f`: five packages
  (`cloudflare` included, which the stack table of `CLAUDE.md` omits), 37 files with relative
  imports under `packages/*/src`, none of the three tooling scripts present, and `turbo.json`
  with no `globalDependencies` and no `test` inputs. Certifipago #792 merged later that day (`4784c939b`).
- **L54 (2026-11-13, owner, translated from Spanish):** "As part of init, it should ask in which
  language the specs and everything in general should be, with English as the default. Also,
  we are now at a maturity level where any project can start from here. So now you are the
  reference, and what we bring from other projects will be adapted to you, and you will ask
  the others to adapt to the new standards. The template stays without Claude, everything is
  merged, and with that analyse everything new on Certifipago's master, update the plan and
  everything in this project, and put together something detailed to follow next. Or maybe
  what I tell you is not true, so evaluate everything." Checked: `CLAUDE.md` is gone from
  `main` (#5) and Certifipago merged its own retirement (#791); not everything is merged —
  template #4 and #6 and Certifipago #785 are open. Analysed Certifipago master
  `75762a7ed..8258fdd77` (15 pull requests). Added the Roadmap, decisions 47 and 48, open
  decisions D-S1 to D-S6, the conformance track K1–K9 (sent to the Arquitecto session), and
  ledger rows.
- **L55 (2026-11-14, owner, translated from Spanish):** answering "Shall I merge the template
  PRs #9, #10 and #11, in that order, and continue with step 2.2 (T1d `@app/tooling`)?": "Yes,
  merge the three". Earlier the same day, answering a review consent: "I authorize you to do
  the review without asking whenever one is required". Merged #9 (`71082c2d9`), #10
  (`45af225d7`) and #11 (`6af1c1f1b`); Certifipago #785 merged as `7c6028182`. T1d ran as the
  change `2026-11-14-tooling-package`. Mapping found `test` uncached in Turborepo, so the plan's
  "a tooling change invalidates the test cache" had no cache to invalidate; the measured gap was
  the root lint, TypeScript and Prettier configs, which no task hashed. Added K10 and the ledger
  rows for #810, `package-src-alias` and the `/init` rename.
- **L56 (2026-11-14, owner, translated from Spanish):** answering "Shall I merge template PR #12
  (T1d, `@app/tooling`) once its CI is green, and continue with K9 to the Arquitecto and step 2.4
  (T1b, living specs)?": "Yes, once it is green". Merged #12 (`9afce2dd7`) and sent K9. T1b ran
  as `2026-11-14-living-specs`: four writers wrote the eight specs from the code in parallel,
  174 requirements, and their open questions name sixteen defects, follow-ups F1 to F16, three of
  them (F1, F2, F6) likely to break a fresh database or an observability payload.
- **L57 (2026-11-14, owner, translated from Spanish):** "Do this task here: “Fix scrubPII and
  sanitizeQueryKey (F6, F7)”", then "Do this task here: “Fix Supabase migration order and grants
  (F1–F5)”", "Do this task here: “Show error toasts and add an error boundary (F9)”" and "yes,
  merge #13 when it is green"; answering "F3: who may read a user's profile in the template's
  database?", the owner chose "Only its owner". Merged #13 (`e3e92fcaf`). F6 and F7 ran as
  `2026-11-14-scrub-and-query-key`. Its independent verifier found that Certifipago's fix of
  F6, taking each object out of the visited set once walked, walks a shared object once per
  path, which ran a React DOM node in a console breadcrumb out of memory; the template keeps
  each scrubbed copy instead, and K11 carries both helpers to Certifipago. F1 to F5 and F9 run
  as their own changes, each built by a writer in its own worktree.
- **L58 (2026-11-14, the Certifipago - Arquitecto session):** K2 closed with Certifipago #785,
  K9 with #813 (`e365b35cf`, `@certifipago/tooling` keeps `fsModuleCache: false` on Vitest 4)
  and K10 with #814 (`b6203bd23`), whose hardening found the two holes the template still has
  as F17. It reported that F6 does not reproduce in Certifipago and that F7 does; the reply
  sent the exponential-walk measurement behind K11 and the template's `structuralSegments`
  design, so both copies take the same fix. The native review of scrub-and-query-key approved
  the change with advisory notes only; F18 records the one about serialization.
- **L59 (2026-11-14, owner, translated from Spanish):** "yes, merge the three in that order when
  they are green, and continue". Merged #14 (`997a63c`), #15 (`53bcd3c`, rebased onto #14 with
  both app specs verified at its tip) and #16 (`32bcc38`). The error-surfacing change first put a
  test in `apps/mobile/src/app`, which Expo Router bundles as a route, so `expo export` failed in
  CI; the Arquitecto measured that Metro's default `blockList` hides `__tests__` folders, and the
  test sits in one now. The supabase-migrations verifier found the filtered-update test guarded
  nothing and that `test:db` runs pg_prove in Docker; both were fixed, and its pre-existing
  findings are F19 to F22. The Arquitecto adopted K11 in its shape and raised F23 and F24.
- **L60 (2026-11-14):** Step 3.1 ran as `2026-11-14-agents-router`, built by a writer in its own
  worktree. `AGENTS.md` routes each shipped skill once, in one table per phase. The knowledge rows
  wait for step 5.1, which brings their skills, and the lifecycle block for steps 3.3 and 5. Four
  LAWs were ported without product examples. The styling LAW stays out, because the template
  keeps colour and type classes in screen-local style files (F26). `.codex/config.toml` sets
  `project_doc_max_bytes = 65536`, and a test holds `AGENTS.md`, counted with CRLF, under it.
  `verify:instruction-entry` refuses any `CLAUDE.md` or `CLAUDE.local.md`, tracked or not ignored.
- **L61 (2026-11-14 and 2026-11-15, owner, translated from Spanish):** "move everything to ui, that
  rule is a pillar..." (quoted whole in Stage F); "__tests__ inside each block, and tell the
  Arquitecto"; "yes, I confirm, but have it adopt it now"; "tell the Arquitecto everything that has
  to be updated. nodeLinker, wouldn't it be better to have it the same for both, because if it uses
  the libraries the same problem would happen, and while at it, ask in init whether it has some
  logger or uses the default, which is PostHog. And Sentry should be removed from Certifipago.
  Although in the template there should be some documentation on how to install it if needed, and
  offer it as an option in init. Don't pin the versions; rather we need a kind of updater for our
  documentation, and update it if the MCPs update. K3: do the same as web. And something
  important: web and app and any other project must be standardized, that is, they must always
  follow the same rules, and centralize it if possible, because if later plain React is added, for
  example, it should follow the same rules"; "The backend should also be asked in the init, in
  case the project is front-end only, whether a backend is wanted, whether it has some structure,
  or whether they use the default we have today, which is Supabase"; "And always think, when
  building something, that everything should be adaptable: if for example tomorrow shadcn is not
  used and Material UI or another is wanted, the change should be relatively decoupled and 'easy'
  to make"; "the same for everything that is not core, always decoupled and adapted"; "Not only the
  UI libraries, but all the libraries themselves"; "every package that is not core must be
  decoupled and have an adapter..." (quoted whole in Stage F); "Let's rebuild the plan and update
  it at the same time; detail what needs to be done and with that start executing it". Recorded as
  decisions 50 to 58 and Stage F. The Arquitecto was told every Certifipago item the same day.
- **L62 (2026-11-15, owner, relayed by the Certifipago - Arquitecto session, translated from
  Spanish):** "it is time to shut the computer down ... have them pause what they are doing, make a
  plan and note what they already did and what is done, and continue it tomorrow when we ask them
  to. Include the template agent in this". Paused with nothing running: #18 to #21 merged, #22
  in CI, F.4 next. The session continues only when the owner asks.
- **L63 (2026-11-15, owner, translated from Spanish):** the resume, relayed by the Certifipago -
  Arquitecto session: "Tell the sessions to continue what they were doing and finish the plan";
  then "merge and continue with the plan". #24 and #25 merged; F.12 and F.9 ran in parallel
  writers. F.9 found that `@shadcn/mcp-server` is not on npm, so the catalog runs
  `npx -y shadcn mcp`, the command shadcn documents.
- **L64 (2026-11-15, relayed by the Certifipago - Arquitecto session):** Certifipago adopted F.9
  (#847) and registered `verify:mcp-docs` in its gate registry and `docs/mcp.md` in its docs
  manifest; the template has neither gate yet, so those registrations land with `verify:gate-shape`
  and step 4.3 (`verify:docs-freshness`). Its #846 fix to the worktree pruner joins step 3.3. F32
  took Certifipago's woff2 fonts.
- **L65 (2026-11-16, relayed by the Certifipago - Arquitecto session):** the owner paused the
  sessions at 23:57 on 2026-11-15 and resumed them the next morning ("resume your plan from memory
  and Engram, and continue where you stopped"). F34 and F.5 resumed from their branch tips.
- **L66 (2026-11-16, owner, relayed by the Certifipago - Arquitecto session, translated from
  Spanish):** the ticket flow (12:23): "all of this ... needs its own skill or subagent, and it can be
  decoupled, and send it to the template so it also evaluates and executes it"; the release stage
  (12:38, "I approve it"); the target version (12:52). Built as `2026-11-16-ticket-flow` with the
  template's 50 changes to the source spec, which the Arquitecto adopts.
- **L67 (2026-11-17, owner, translated from Spanish):** on F41, "Let the init decide it; by default
  there is a human in the loop, but the option you mention, of merging directly, should exist". The
  ticket flow follows decision 38's merge policy: `manual` by default, `low-risk` as the option, and
  every deploy and merge to `production` stays the owner's word.
- **L68 (2026-11-17, owner, choosing between options):** download the latest `posthog-js` and
  `posthog-react-native` for F.7; wait until the Expo patches pass pnpm's 24-hour `minimumReleaseAge`
  rather than add exceptions (F45).
- **L69 (2026-11-18, owner, translated from Spanish):** on F46, "Yes, add it if it is requested, if you
  want PostHog, and continue with the plan". The consent mode is an option `/init` asks for when a
  project picks PostHog; `granted` keeps today's behaviour.
- **L70 (2026-11-18, owner):** on F54, "Option 2" (translated from Spanish): under `opt-in`
  the PostHog client starts only after the user grants consent.
