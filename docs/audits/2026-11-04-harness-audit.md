# Harness audit — 2026-11-04 (phase PA)

Every artifact in three codebases now has a verdict backed by evidence: **1,469
rows**, one per skill, agent, gate, lint rule, script, contract, doc, UI block,
dependency and staged unit. The headline: the donor's harness machinery is worth
taking almost whole, its skill set is not (only 37 of 123 skills were ever
invoked), and the template's staged work can land after small, listed fixes, in
a forced order.

Plan: [INIT_AND_HARNESS_PLAN.md](../INIT_AND_HARNESS_PLAN.md) · Ledger:
[GENERALIZATION_PLAN.md](../GENERALIZATION_PLAN.md) · Row data:
[2026-11-04-harness-audit.json](2026-11-04-harness-audit.json)

---

## What was audited

| Codebase                    | Read at                                             | Rows  |
| --------------------------- | --------------------------------------------------- | ----- |
| Certifipago (donor)         | `origin/master` `6bf0e1791`, a `git archive` export | 1,236 |
| This template               | `a6b9d50` + 351 staged paths                        | 178   |
| Qik workspace (adopt model) | working folder (not a git repo)                     | 55    |

| Input                                                                  | Status                                                                       |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Usage census from session logs                                         | done: 1,443 Claude transcripts, 4,425 Codex rollouts                         |
| `claude doctor`, `/skill-doctor`, `/doctor prompt-audit` — Certifipago | done (run by the Certifipago architect session)                              |
| Same three — this template                                             | done, read-only (`--permission-mode plan`, edits disallowed; repo unchanged) |
| Certifipago architect consultation                                     | answered, all five questions                                                 |
| Qik frontend consultation                                              | **pending** — sent to the active session, no answer yet                      |
| Qik usage data                                                         | **gap** — no Qik session logs on this machine                                |

---

## Headline findings

1. **Skills are mostly unused as skills.** 37 of the donor's 123 skills were ever
   invoked (148 invocations; `component-review` alone is 27). `/skill-doctor`
   agrees: 103 project skills loaded and never invoked. Agents reach skills by
   reading `SKILL.md` paths instead (3,767 reads, 2,900 by subagents).
2. **The skill listing overflows its budget.** 123 descriptions total about
   81,000 characters; Claude Code budgets the listing at 1% of context (about
   8,000 characters at 200k) and silently drops the least-used descriptions. The
   53 routed skills alone already overflow.
3. **The donor's machinery is sound and generic.** 60 gates all use one shape
   (`defineGate`, claims / not covered, companion test run against a blinded
   copy). Agents are projected to four runtimes from one source with a hash
   manifest. First-party `SKILL.md` text names no product.
4. **Product names still sit inside machinery** — not in skill text, but in
   scripts, hooks, lint rules and evals: the registry title, `--filter
@certifipago/supabase` in pre-push, the mutation gate's scope, a seed email, a
   `'yape'` keyword, 11 `@certifipago/` references in `package.json`, product
   scenarios in skill evals (`security` 48 terms).
5. **Rules don't reach every runtime.** The donor's five LAWs live only in
   `CLAUDE.md`; Codex and OpenCode read `AGENTS.md` and never see them.
   Decision 12 fixes exactly this.
6. **The template's skills teach code its own lint rejects.** `component`,
   `feature`, `lib`, `screen` and `service` put interfaces in hook and component
   files, use relative imports and hardcode UI strings (prompt audit P1, P8, P13).
7. **Pruning a capability breaks code today.** Removing Supabase or i18n leaves
   dangling imports in `apps/web/src/app/layout.tsx` and
   `apps/mobile/src/app/_layout.tsx`; deleting files is not enough.
8. **One template gate never runs.** `format:check` in `validate` executes
   nothing (no workspace defines it); 37 files fail Prettier unnoticed.
9. **Counts written in prose go stale.** Most of the 38 stale facts the donor's
   prompt audit found are numbers in docs and contracts.
10. **A local-only gate let master go red.** Two PRs that were each green merged
    into a red `master`; the gate never ran on the merge result.

---

## Skills

Verdict rules, applied in order:

1. Usage only demotes, and only real use counts. Transcript reads are split into
   **use** (a delegation prompt or a subagent loading the skill for work) and
   **authoring** (reads in a transcript that edits that skill); reads by audit
   sweeps do not count. A pending keep or fix that was invoked or used for work
   keeps its static verdict; one read only by sweeps or while being edited
   becomes **defer** (an opt-in pack) unless it is in the core ring; one with no
   signal at all becomes **defer** as unexercised, because a domain nobody has
   worked on yet (marketing, product work) says nothing against its skills. A
   static drop or merge never changes; drops rest only on static defects.
2. A skill with a high-confidence prompt-audit finding cannot stay keep or
   defer: it becomes **fix** (fixed before it joins any pack). That moved six
   skills: new-skill (H6), skill-onboard (H7), remotion (H1), ui-ux-pro-max
   (H11), and ponytail-audit and ponytail-review (H9, H10), which tell agents to
   delete the service + adapter pairs that `code-standards.md` §6 requires.
3. Where a skill exists in both repos and the two audits disagree (feature,
   fix-test, improve-skill, new-skill, pre-commit, quality, and the other shared
   scaffold skills), the base copy is the newer one whose examples pass the
   template's lint; the other contributes only content it alone has. PS decides
   each pair.

Why invocation was low: `/skill-doctor` lists 105 of the donor's 123 project
skills by name only — the listing overflows, and Claude Code drops the
descriptions of the least-invoked skills first, so they cannot be matched. Work
use came through paths instead: 491 work reads across the skills, mostly by
subagents that the router told which `SKILL.md` to load.

| Donor skills | keep | fix | merge | defer | drop |
| ------------ | ---- | --- | ----- | ----- | ---- |
| 123          | 41   | 31  | 5     | 46    | 0    |

**No skill is dropped.** The eleven former drops were judged against the donor's
scope; for a generic template each is one of three things (owner review,
2026-11-04):

- **Fixable defects → fix:** banner-design and design (re-vendor the complete
  upstream skill; the donor trimmed the files they reference),
  design-taste-frontend (used for real work; English description and a split
  under 500 lines through an overlay), brand (`/init` section 5 writes the files
  it expects).
- **Duplicates → merge:** ponytail-gain and ponytail-help into ponytail.
- **Useful to other projects → defer into a pack:** higgsfield-marketplace-cards
  and higgsfield-product-photoshoot (marketing imagery, needs a Higgsfield
  account), slides (docs or marketing), sleek-design-mobile-apps (design, external
  SaaS), nodejs-backend-patterns (backend-node, when `/init` picks a Node backend).

**Unexercised, deferred into their packs:** marketing-ideas, mom-test,
onboarding, paywalls, tailwind-css-patterns, and working-with-legacy-code —
the last one belongs in the adopt pack, which is legacy work by definition.

**Merge (3):** registry → skill-onboard · ticket-template → plan-to-board ·
ponytail-debt → ponytail.

### Proposed default set and opt-in packs

The Certifipago architect recommends 15–20 skills by default and opt-in for the
rest. Packs are what `/init` section 8 offers.

| Pack                     | Skills                                                                                                                                                   | Default             |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| **core**                 | arch, component, screen, service, store, feature, modify, lib, mock, test, fix-test, pre-commit, fractal-verify, skill-onboard, improve-skill, new-skill | yes                 |
| define (used by `/init`) | product-discovery, general-plan, user-flow-map, plan-to-board                                                                                            | yes                 |
| review                   | component-review, copy-review, a11y, security, security-sweep, security-scan, perf, architecture-audit, e2e-review                                       | opt-in              |
| design                   | project-design, impeccable, animation-taste, microinteractions, web-interface-guidelines                                                                 | opt-in              |
| docs and diagrams        | archify                                                                                                                                                  | opt-in              |
| harness maintainer       | new-agent, run-evals, harness-review, propagate-from-template                                                                                            | opt-in              |
| marketing                | copywriting, copy-editing, seo, product-marketing and the deferred marketing skills                                                                      | opt-in              |
| e2e                      | e2e-coverage, playwright-best-practices                                                                                                                  | opt-in              |
| operate                  | posthog, runtime-verify                                                                                                                                  | opt-in              |
| backend-supabase         | supabase, supabase-postgres-best-practices                                                                                                               | with the capability |
| mobile-expo              | expo-\*, upgrading-expo, vercel-react-native-skills, native-data-fetching                                                                                | with the capability |

Manual overrides of the mechanical rule: `user-flow-map` (rule: defer) is the
only skill that serves `/init` section 6, so it is in the define pack.
`quality` overlaps `pre-commit` and `fractal-verify` and is merged into them.

### Skill defects to fix while harvesting

- Ten first-party descriptions exceed 1,024 characters (`security` 1,441,
  `threat-model` 1,407, …); 14 lack USE WHEN, 64 lack DO NOT USE.
- Broken references in 7 vendored skills (`banner-design`, `design`,
  `design-system`, `seo`, `clean-code`, `diagram-design`, `brag-slim`).
- 17 marketing skills read `.agents/product-marketing.md`, which does not exist;
  the design pack expects `docs/brand-guidelines.md` and `assets/design-tokens.json`.
  These are `/init` section 2 and 5 outputs.
- Skills that state repo counts, paths or file names go stale; they must point at
  the gate or generator that prints the live value.
- Vendored skills edited in place drift from upstream; adaptations go in an
  overlay or a contract.

---

## Staged work — the P0 commit units

Order is forced: `verify:maps` needs committed targets; the coverage gate needs
claimed files tracked (manifest last); rules set to `error` need clean code first.

| #   | Unit                         | Size                     | Verdict | Fix before landing                                                                                                                                                                              |
| --- | ---------------------------- | ------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | husky / prettierignore       | 3 files                  | keep    | `.husky/commit-msg` → `pnpm exec commitlint --edit "$1"`; include the `.prettierignore` line for `docs/audits/*.json`                                                                           |
| 2   | `hostConsole` helper in core | 4 files + `shared.md`    | keep    | include the unstaged test hunk                                                                                                                                                                  |
| 3   | suffix-contract codemod      | 250 files, +1,038 / −855 | fix     | merge new files into existing homes; one `GENERIC_ERROR_KEY` per app; finish the casing fix (3 files)                                                                                           |
| 4   | lint rules                   | ~+320                    | fix     | remove the NUL byte at `eslint-local-rules/index.mjs:71`; add rule tests; `core-import-boundary` allows only relative imports in core                                                           |
| 5a  | archify vendoring            | 72 files                 | fix     | lock hashes per file (decision 18); not claimed by `core`                                                                                                                                       |
| 5b  | archify sigil patch          | 10 files                 | fix     | kept as a recorded patch over upstream (the overlay that decision 22 allows), listed in the lock, its own commit, and reported upstream                                                         |
| 6   | diagram pipeline             | 3 files + generated HTML | fix     | add `docs:diagrams:check` to `validate`; read tokens without regex                                                                                                                              |
| 7   | docs                         | 10 + 2 untracked         | fix     | repair Prettier breaks (`code-standards.md:405-408`, `global-map.md:76`); correct §21                                                                                                           |
| 8   | manifest engine + gates      | 5 files + `manifest.md`  | fix     | planning docs and `docs/audits/**` out of `core` into a maintainer capability (no preset selects it; exempt from the brand gate); stop claiming all of `.claude/**`, `scripts/**`, `.github/**` |

**Does not land:** `.atl/` (machine paths; gitignore it). `SDD_SYNC_PROMPT.md`
(drop). The ledger's "phase 0 and 2 done" marks (nothing is committed) and its
archify pin `920543b` (the lock says `b86b607`) are corrected with unit 7.

---

## Donor machinery — harvest order

Harvest first:

1. Gate framework (`scripts/gate/*`, `verify:gate-shape`, registry), extended
   with capability, stage, profile and cost fields.
2. `apps.detect.mjs` kind scoping, with `react-spa` and `none`.
3. `scripts/agent-harness/*` (four runtime projections) + `verify:sole-writer`.
4. Harness gates: governance (with registry-portable), router-coverage,
   skill-descriptions, agent-context, concerns, and `skill-phases.json`.
5. `verify:core-purity`, repointed at `project.config.json` and extended to
   `scripts/` and skill evals.
6. `pnpm scaffold` (45 templates) + `verify:scaffold-templates`.
7. Generic lint rules with a RuleTester suite: suffix-contract, logic-in-view,
   single-object-params, tailwind/constant rules, core-import-boundary,
   no-justifying-comment, style-positions-only, no-route-literal;
   view-import-boundary and no-io-in-adapter once their parameters come from config.
8. Tests family: tests, test-naming, test-location (frozen list into a contract),
   test-shuffle, vitest-sequence.
9. `verify:constant-divergence`; `verify:diff-mutation` parameterized (it caught
   two product defects) — opt-in by quality profile.
10. A ratchet registry: `allowlist-freshness` generalized; ratchets start empty,
    never copied.
11. Budgets (bundle, duplication, size-limit) into `contracts/budgets.json`.
12. Vendored-skill lifecycle: `skills:pin`, `skills:drift`, the lock.
13. `.agents/core/contracts/` (comprehension, validation-gate, review-severity).
14. PreToolUse hooks `enforce-merge-gate.mjs`; `enforce-shell-tooling.mjs` only
    with its tool list as a parameter.

Risky — opt-in or left behind: Codex peer review at pre-push (external CLI,
cost, 5–8 min per push); pgTAP against a shared cloud database; the Maestro e2e
runner (device- and Windows-specific); Notion board sync; heavy vendored engines;
`* text=auto` CRLF handling; dated census docs (`rule-enforcement.md` has 163
dated lines).

Machinery gaps found: no capability/stage fields in the gate registry; no ratchet
registry; knip blinded by its entry globs (it cannot see 14 unused UI blocks or
dead scripts); no backend-none path (5 gates, 1 lint rule, the hooks and CI assume
Supabase); no token generator (4 hand-synced copies); no per-gate runtime
telemetry; hooks not rendered from config.

---

## New `/init` parameters found

| Section        | Parameter                                                                                                                                               | Source                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 1 identity     | locales and default locale (no section owned them)                                                                                                      | template audit               |
| 4 backend/data | `backend: external`, data client, codegen; feature-flag provider                                                                                        | Qik                          |
| 7 workflow     | commit authority (who approves commits); worktrees allowed or forbidden; where the gate runs (pre-push, CI, merge queue); merge on an up-to-date branch | Qik, architect               |
| 7 workflow     | peer review on or off, which CLI, adjudication policy                                                                                                   | architect                    |
| 7 workflow     | the scope document and its owner; session ownership (which session owns which area)                                                                     | architect                    |
| 8 harness      | skill packs; sources read through a browser only (Jira, Figma); precedence line between `~/.claude/CLAUDE.md` and the project                           | Qik, architect, prompt audit |
| 9 quality      | flag policy; error baseline captured at init that may not grow; QA email base                                                                           | Qik, architect               |
| 0 mode (adopt) | conventions **detected**, not imposed (language, test style, suffixes, line limit)                                                                      | Qik                          |

---

## Adopt mode (Qik)

- Qik's living-docs extractor runs unchanged under TypeScript 6 (23/23 tests);
  its coupling to Qik sits in probes (navigation, data, flags, i18n), not in the
  core. Template-stack probes come first, so the template can document itself.
- It needs a size and retention budget: 3,431 files / 474 MB today, 80
  byte-identical diagram pages.
- Gaps neither Qik nor Certifipago covers: stack and conventions detector;
  remote-exec abstraction with hook-enforced read-only agents; harness identity
  (version, lock, memory project); one rule registry; an infrastructure-identifier
  gate (hosts, IPs, accounts — the brand gate misses them); usage across machines.
- Never travels: remote hosts and addresses, accounts, repository and tracker
  sites, story and lessons content, everything generated from the code, the
  private design-system API.

---

## Corrections to the plan

| Plan said                                                                 | Evidence says                                                                                                                                                                                                            |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/doctor`, `/doctor prompt-audit`, `/skill-doctor` only run interactively | `claude -p "/skill-doctor"` and `claude -p "/doctor prompt-audit"` run headless (Git Bash needs `MSYS_NO_PATHCONV=1`)                                                                                                    |
| The donor's `.agents/skills` mirror has partial parity                    | It is byte-identical today; what is missing is a generator, and a gate for 35 non-core files                                                                                                                             |
| Who reads `.agents/skills` was unknown                                    | Answered from primary docs: Codex, OpenCode, Copilot, VS Code, Cursor, Gemini, Devin and Amp read `.agents/skills`; Claude Code reads only `.claude/skills` and never `.agents/`. The donor's mirror is what Codex reads |
| P0 lands the staged work                                                  | P0 lands it per verdict, in the forced order above, after the listed fixes                                                                                                                                               |
| Manifest `core` holds the planning docs                                   | They ship donor names to every project; they move to a maintainer capability                                                                                                                                             |

---

## Evidence and method

All intermediate data lives outside the repository, in the session scratchpad
(`pa/out/`): `usage/` (census script and `usage.json`), `donor-skills/`,
`donor-code/`, `template/`, `qik/` (each with `rows.json` and its generator),
`doctor-certifipago/`, `doctor-template/`, `architect-answers.md`, and
`merge.mjs`, which builds the row data in this folder.

Caveats:

- Usage is per machine. Qik and any second machine are not covered; "unused"
  never means drop without a second signal.
- Codex volume (4,402 sessions) is hook-driven automation; it counts as a read
  signal, never as use.
- `SKILL.md` reads mix real use with skill editing; treat them as a ceiling.
- Donor evidence is static plus git history; its `validate` was not run.

## Candidates after the audit

### stack-diagram (owner, 2026-11-04)

Checked against Certifipago's `skill-onboard` gates, read-only: the upstream
files were read, never run.

- **Resolve:** `caru-ini/stack-diagram`, `skills/stack-diagram/`, commit
  `1ed53e3e9525364ae5d82e0430f2bb3f7ef4c838` (2026-11-03), MIT, fonts under SIL
  OFL 1.1, 19 files, 198 KB. The lock hash is written by `pnpm skills:pin` at
  install.
- **G1 security — fails as is, fixable.** No hidden instructions, remote scripts
  or encoded payloads in any file. Three findings:
  1. `scripts/share.py` posts the rendered images, a title and the stack list to
     a public gallery, and writes `~/.config/stack-diagram/gallery.json` outside
     the repository.
  2. `scripts/fetch_icons.py` reaches svgl, GitHub raw, jsDelivr and the AWS,
     Google Cloud and Azure icon packages on every fetch.
  3. `scripts/render_png.py` runs `fc-list` and sets `LD_LIBRARY_PATH` (Linux
     only).

  Fix: remove `share.py` and its step. Fetching becomes an explicit authoring
  step that writes a committed icon folder (svgl, devicon, gilbarbara and Lucide
  only; the AWS, Google Cloud and Azure packages are never committed, as the
  skill itself requires). Build and render then run offline. This is the model
  the donor already accepts for archify's pinned `brands capture`.

- **G2 quality — passes.** It names what it produces, gives each constraint its
  reason (official marks only, never recolor, how arrows anchor to text) and
  checks its result by rendering and looking. Missing: evals.
- **G3 fit — fails as is, fixable.** Its description claims architecture,
  system, infra and topology diagrams, which collides with archify's triggers.
  Fix: narrow it to the tech-stack picture with real logos, with DO NOT USE
  pointers to archify (topology, flows) and diagram-design (ER, timeline, tree).
  `name` equals the directory. Ring: advisory. Python is accepted, as for
  diagram-design. PNG output needs Python Playwright, which this machine does
  not have: install it or render through the repository's Node Playwright,
  decided at install.
- **Vendor, not merge into archify.** archify bundles 107 marks offline and
  captures only raster site icons. Its marks lack Expo, React Native, Tailwind,
  Turborepo, Vitest, TanStack Query, Zustand and PostHog, all in Certifipago's
  `package.json` files. Porting stack-diagram's logo sources into archify would
  be a large patch on a vendored skill, carried at every refresh.
- **Verdict:** fix (adapt, then install). Certifipago first (PD1), with a ledger
  row in `docs/agent-harness/vendored-skills.md`; the template takes it after
  that install passes the donor's gates (decision 19).
