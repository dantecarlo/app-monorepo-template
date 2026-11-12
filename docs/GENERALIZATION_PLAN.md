# Generalization plan — from certifipago to a general React template

Living document. **Update it at the end of every working step**, before the
session closes. If a step is not written here, it did not happen.

- **Source repo:** `C:\Users\usuario\verifipagos` (certifipago) — read-only
- **Target repo:** this one
- **Started:** 2026-09-04
- **Strategy and phase order since 2026-11-04:** [INIT_AND_HARNESS_PLAN.md](INIT_AND_HARNESS_PLAN.md).
  This file remains the per-item ledger.

---

## Status legend

| Mark | Meaning                                  |
| ---- | ---------------------------------------- |
| ☐    | Not started                              |
| ◐    | In progress                              |
| ☑    | Done and verified by a green gate        |
| ✗    | Evaluated and rejected — reason recorded |
| ⚠    | Blocked — blocker named                  |

Classification for every harvested item:

| Class      | Meaning                                                          |
| ---------- | ---------------------------------------------------------------- |
| `own`      | Written for certifipago, generalizable — port and de-brand       |
| `merge`    | Exists in both repos — three-way merge, never a copy             |
| `vendored` | Third party — decide whether it enters at all, check attribution |
| `optional` | Enters the manifest as a prunable capability, asked at init      |
| `brand`    | Certifipago-specific — delete                                    |
| `debt`     | Technical debt — does not travel                                 |

---

## Locked decisions

These are settled. Do not re-open them without a written reason here.

1. **Zero allowlists.** Certifipago's `eslint-*-allowlist.json` files are frozen
   debt from adding rules to existing code. A new project never inherits debt.
   Every harvested rule must run **clean against the template with no exemption
   file**. If it fails, there are exactly two exits: fix the template's code, or
   the rule does not enter. "Empty allowlist for now" is debt through the window.
2. **The template is a superset; init prunes.** The repo ships everything; the
   init command asks what is needed and deletes the rest.
3. **Determinism.** Every init answer executes declared actions from the
   manifest. No model interprets anything at init time.
4. **The LLM produces data, never actions.** The business model canvas and the
   design system are conversations, but their output is an answers file. Actions
   still come from the manifest.
5. **Everything as skills and templates**, so we know exactly what to touch.
6. **Every skill carries its provenance**, plus a command to update and re-adapt.
7. **Docs are a prunable capability**, same machinery as code.
8. **The donor repo is read-only from here.** Certifipago is live: it has open
   PRs and a CI that other people depend on. If a harvest ever requires changing
   it, the change goes through a **git worktree** and follows **its** conventions
   — its commit style, its gates, its PR flow — never a direct edit to the
   working checkout we read from. Nothing in this plan writes to
   `C:\Users\usuario\verifipagos` without that.
9. **Branch strategy is a project decision, so it is an init question.** How a
   team branches, names, protects and merges is not a template default — it is
   configuration. It joins the manifest as a capability with declared actions
   (hooks, CI workflow, PR template), so the answer executes instead of being
   written down and forgotten. See phase 9.
10. **Markdown first, HTML derived.** Every document is authored as `.md` —
    that is the source of truth, the thing git diffs and review reads. Any HTML
    view is **generated from that markdown**, never authored alongside it, and
    it renders with the project tokens (`@app/tokens`) so a diagram and the app
    cannot drift apart. Two hand-maintained copies of one document is how the
    pair starts lying.
11. **Diagrams are generated, not drawn.** They come from a checked-in spec via
    the `archify` skill, so a diagram is reproducible and reviewable as data.
    A picture nobody can regenerate is a screenshot with extra steps.

---

## Documentation contract — applies to every phase

**A step is not done until it is documented.** Code that works and is
undocumented is a step half-taken: the next session, and every project derived
from this template, inherits behavior nobody can explain.

Every phase carries the same four documentation obligations. They are repeated
as checkboxes inside each phase so they cannot be skipped by momentum.

| #   | Obligation                                                        | Where it lands                                           |
| --- | ----------------------------------------------------------------- | -------------------------------------------------------- |
| D1  | **The artifact itself** — what it is, what it does, how to use it | Its own doc, or a section in the doc that owns the topic |
| D2  | **The rule or contract it enforces**                              | `docs/code-standards.md`, including its §21 coverage row |
| D3  | **The map entry** — so it is findable                             | `docs/maps/global-map.md`                                |
| D4  | **The decision trail** — what was rejected and why                | This plan's phase section                                |

Beyond the per-artifact four, the following are **whole-system documents** that
must end the work accurate, not stale:

- ☐ `README.md` — the front door. Currently describes a Next+Expo template
- ☐ `CLAUDE.md` — agent instructions, stack table, validation gate
- ☐ `AGENTS.md`
- ☐ `docs/code-standards.md` — the rule authority (§21 must have no lie in it)
- ☐ `docs/manifest.md` — the init contract
- ☐ `docs/architecture/*.md` — shared, web, mobile
- ☐ `docs/maps/global-map.md` — every shared artifact indexed
- ☑ A **harness** document — `docs/harness.md`
- ☐ A **skills** document — the skill catalog, its provenance, and the update
  command
- ☐ A **components** document — the UI inventory, the block anatomy, tokens

> **The check that matters:** could a person who has never seen this repo read
> the docs and rebuild the same decision? If not, the documentation is a
> description, not a record.

---

## Success criteria

The work is done when all five hold:

1. `ATL_TEMPLATE_SELF=1 pnpm validate` is green.
2. No occurrence of `certifipago` / `verifipagos` survives, proven by a gate.
3. Every supported preset: clean clone → init → `pnpm validate` green, in CI.
4. **Round trip:** certifipago can be re-derived from the new template. This is
   the only honest proof that the generalization actually generalized.
5. **Documentation:** every whole-system document in the contract above is
   accurate, and no §21 row claims an enforcement that does not exist.

---

## System inventory

Counted, not estimated. Re-run the counts before trusting a stale number.

| Artifact                | Certifipago | Here | To evaluate | Ledger   |
| ----------------------- | ----------- | ---- | ----------- | -------- |
| Skills                  | 115         | 25   | 24 + 91     | phase 5  |
| `verify-*.mjs` gates    | 55          | 8    | 49          | phase 3  |
| `*.detect.mjs` modules  | 25          | 0    | 25          | phase 3  |
| `local/*` ESLint rules  | 18          | 9    | 13          | phase 2  |
| Agents                  | 4           | 1    | 3           | phase 6  |
| `components/ui/` blocks | —           | 28   | 28          | phase 7  |
| Numbered rule ledger    | 56 (R-XX)   | 0    | 56          | phase 3  |
| Tracked files           | —           | 722  | —           | manifest |

The phase ledgers below carry **243 numbered items and 1000 checkboxes** — one
row per skill, per rule, per gate, per detect module, per agent, per UI block.
That is the point: nothing gets waved through as "the skills" or "the rules" in
bulk.

**How to work a ledger row.** Tick a box only when it is true, and only in this
order:

1. **Read** the item in certifipago. Confirm it does what its name claims —
   several do not.
2. **Decide** its class and write the verdict. A `✗` row needs its reason in the
   same line.
3. **Port** it, adapting rather than copying.
4. **Prove** it — the relevant gate green, with no exemption file.

A row with a ticked "done" and no green gate is a lie the next session will
inherit.

---

## Upstream movement — certifipago master, 2026-09-07

Certifipago is a live repo. Two pull requests landed the morning of 2026-09-07
and they change phase 2 and 3 materially.

**#463 `chore/retire-the-allowlists`** and **#462
`fix/pay-down-the-frozen-debt`.**

### What actually happened

The branch names promise more than the diff delivers, so here is the measured
state:

| Allowlist                               | Entries now |
| --------------------------------------- | ----------- |
| `eslint-io-adapter-allowlist.json`      | **0**       |
| `eslint-suffix-contract-allowlist.json` | **0**       |
| `eslint-ui-purity-allowlist.json`       | **0**       |
| `tests-exempt-allowlist.json`           | **0**       |
| `eslint-mock-seam-allowlist.json`       | 139         |
| `eslint-spacing-scale-allowlist.json`   | deleted     |

Four of the five surviving files are empty husks — **the debt was genuinely paid
down**, not relabelled. Only the mock-seam backlog remains.

**This makes phase 2 much cheaper.** A rule whose upstream allowlist is empty has
already been proven to pass clean on a real codebase, so porting it here is a
question about _our_ code, not about the rule.

### The new mechanism: ceilings, not lists

They replaced the spacing allowlist with a **ceiling** — `.jscpd.json` plus
`.agents/duplication-ceilings.json`:

```json
"source": { "ceiling": 4, "measured": 3.88, "measuredOn": "2026-09-06" }
```

And gated the two obvious cheats, in their own commit messages: _"a duplication
ceiling cannot be raised to meet the code"_ and _"a duplication scope cannot be
deleted to escape its ceiling"_.

**This refines decision 1, it does not break it.** The two mechanisms are not the
same shape:

| Mechanism | Shape                               | Verdict    |
| --------- | ----------------------------------- | ---------- |
| Allowlist | A list of blessed **paths**         | ✗ rejected |
| Ceiling   | One **number** per scope, only down | ✓ allowed  |

A path list rots silently: files get renamed, deleted, or forgotten, and nobody
reads it again. A ceiling is one visible number with a measurement date, and the
gate refuses to let it rise. Same goal, opposite failure mode.

### New items this adds to the ledgers

- ☐ `verify:duplication` + `.jscpd.json` + `.agents/duplication-ceilings.json` — phase 3
- ☐ `.agents/constant-divergences.json` — phase 3
- ☐ `.agents/turbo-cache-inputs.json` — phase 3
- ☐ `.codex-review/adjudications.json` — evaluate; likely `brand`
- ☐ Re-read certifipago's `CLAUDE.md` (changed in both PRs) — phase 8

> **Standing risk.** The source repo keeps moving. Re-check its `git log` at the
> start of every harvest phase, and record the SHA a phase was harvested against.
> Harvested against `5d7b7781`, re-checked at `cc3a99ed` (2026-09-07 midday).
> Seven further commits landed: PR #464 pins a foreground-sync contract, PR #465
> centralises the UI-primitive test mocks into shared factories. **The 17
> `local/*` rules are unchanged** — a diff of the rule ids confirms it, so phase 2
> needed no rework. The shared mock factories are phase 5 and 7 material.

---

## Upstream movement — certifipago master, 2026-09-11

**177 commits** landed between `cc3a99ed` and `bcf7310b` (136 non-merge). The
local checkout had not pulled them; they were read with `git fetch` plus
`git show origin/master:<path>`, which leaves the donor's working tree
untouched (decision 8). Surveyed by one read-only mapping pass.

> **Harvest SHA is now `bcf7310b`.** Everything below is measured against it.

### The donor converged on decision 1

The strongest signal in the range: certifipago deleted four allowlists **together
with their generators**, and removed the allowlist-loading code from
`suffix-contract` and `no-io-in-adapter`, which now run with no exemption path.
Its R-47 update states the principle this plan already locked:

> Once a list is empty, delete it together with its generator — never the JSON
> on its own.

| Allowlist                          | 2026-09-07 | Now                        |
| ---------------------------------- | ---------- | -------------------------- |
| `eslint-io-adapter-allowlist`      | 0          | **deleted** with generator |
| `eslint-suffix-contract-allowlist` | 0          | **deleted** with generator |
| `eslint-ui-purity-allowlist`       | 0          | **deleted** with generator |
| `tests-exempt-allowlist`           | 0          | **deleted** with generator |
| `eslint-mock-seam-allowlist`       | see below  | **11**                     |

**Correction on mock-seam.** The plan said 139. That was true at `5d7b7781`. At
`cc3a99ed` it was already **112** — PR #465 centralised the UI-primitive mocks —
and it is **11** now. The trajectory 139 → 112 → 11 is the ratchet working, and
it makes `no-inline-seam-mock` a realistic phase-2 candidate for the first time.

### New items for the ledgers

| Item                                                                                                                   | Area      | Verdict to confirm on read                  |
| ---------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------- |
| `local/no-hand-written-text-size` (bans `text-[14px]`, web only)                                                       | phase 2   | generic if the type scale is rem-based      |
| `verify-worktree-sparse` — refuses a commit from a sparse-checkout worktree, where `git add` silently stages nothing   | phase 3   | **generic, carry it**                       |
| `verify-csp-hosts` — each third-party host sits in the right CSP directive, declared in `.agents/csp-third-party.json` | phase 3   | generic pattern, product hosts              |
| `verify-phone-captures` — landing screenshots via `sharp`                                                              | phase 3   | product — ✗                                 |
| `verify-ui-purity`                                                                                                     | phase 3   | **deleted upstream** — drop from the ledger |
| Alert, Checkbox, RadioGroup, Stepper, Text, Tooltip                                                                    | phase 7   | generic                                     |
| BrandLoader, OnboardingSteps, StoreLink                                                                                | phase 7   | product — ✗                                 |
| Shared test mocks for `useAppQuery`, `useAppMutation`, react-native, react-query, UI primitives                        | phase 5/7 | generic pattern                             |
| `delete_branch_on_merge` on, and `git cherry` over three-dot diff to find leftover branches                            | phase 9   | **feeds decision 9**                        |
| Mobile component, provider and hook files now need tests, same as web                                                  | phase 3   | generic                                     |
| R-57 (text size), R-58 (CSP hosts); `rule-enforcement.md` 95 → 99 rows                                                 | phase 3   | read with the ledger                        |

**Counts now:** `local/*` rules 17 → **18**; `verify-*.mjs` 53 → **55**;
web `components/ui` 59 → **66**; skills unchanged at 115, lock at 72.

### archify, replicated from the donor

The donor vendored `archify` on an unmerged branch, `feat/vendor-archify`, in the
worktree `verifipagos-worktrees/archify`. The template's copy was reconciled
against it on 2026-09-11 rather than kept independent.

Taken from the donor, because it was right:

- The `## Update awareness` step removed — it reaches a remote manifest over the
  network, and a vendored skill must be complete from a fresh clone. **The
  template's first copy had deleted the checker script but left the instruction
  in `SKILL.md` pointing at it** — a dangling step the donor's version fixed.
- `assets/JetBrainsMono-OFL.txt` — the licence for the font embedded in
  `template.html`. **The template's first copy did not ship it**: a licence gap.
- The `## In this repository` section, adapted to point at `pnpm docs:diagrams`.
- The donor's snapshot, identified as upstream **`b86b607`** (2026-09-08) by
  hashing `bin/archify.mjs` against upstream history. The donor did not record a
  commit; the template's lock does.

Kept against the donor, because the donor's copy is broken:

- `scripts/render-examples.mjs`. Without it `node bin/archify.mjs doctor`
  reports the skill as **not ready** — on the donor's own branch as well. Its
  gate does not run `doctor`, so the break did not surface there.

### Defects found in the donor's archify branch

Recorded here, not fixed: the donor is read-only (decision 8), and a fix there
goes through its own worktree and PR.

1. `doctor` fails — `scripts/render-examples.mjs` was dropped.
2. `"upstreamHash": ""` in its lock entry. Its `skills:drift` backfills the hash
   only when the field is `=== undefined`, so an empty string blocks the backfill
   permanently: drift can never tell an upstream move from a local one for
   archify.
3. No upstream commit recorded — the snapshot had to be reverse-identified.
4. Node labels draw over their semantic sigil (upstream defect, present in the
   donor's copy too). The sigil sits at a fixed 6px inset, 11px wide; the label
   is centred and fitted against 8px of padding only, and validation lets a label
   be as wide as its node. Measured with real bounding boxes on 25 delivered
   diagrams: 76 of 220 sigils overlapped their label.

### archify renderer adaptation — sigil clearance (2026-09-14)

Fixed in the template's vendored copy, recorded in the lock's `adaptations`:

- `renderers/shared/text-fit.mjs` reserves a symmetric label rail of
  2 × (inset 6 + sigil 11 + gap 4) = 42px, or 48px when a brand mark is present —
  the stricter of the two, never both.
- Both halves use it: render-time shrink-to-fit in all five renderers, and
  validation plus the workflow width solver, which now reject a label that cannot
  clear the sigil at its legible minimum and name the width it needs.
- Two bundled examples adjusted to the stricter rule, geometry only:
  `release-delivery` widths, `incident-response` migrated to workflow schema 2.
- `docs/diagrams/harness.workflow.json` widths adjusted; `docs:diagrams:check`
  exits 0.
- Proof: 0 of 220 sigils overlap after re-delivery; `doctor` reports ready.
- The lock records this adaptation in `adaptations` and as a patch over
  `b86b607` in `patches`, and `fileHashes` holds a sha256 per vendored file, the
  patched values included; `computedHash` and `localHash` still cover `SKILL.md`
  only. Upstream report and the donor fix are pending (donor via its own
  worktree).

---

## Phases

Order matters. Skills sit on top of gates and docs — harvesting them first
leaves dangling pointers.

| #   | Phase                                    | Status | Notes                                     |
| --- | ---------------------------------------- | ------ | ----------------------------------------- |
| 0   | Manifest + gates                         | ☑      | Done 2026-09-04                           |
| 1   | `docs/code-standards.md` — the authority | ☑      | Done 2026-09-07 — 368 → 670 lines         |
| 2   | ESLint rules — 12 to evaluate            | ◐      | 3 landed clean; 9 with a measured verdict |
| 3   | Verify scripts / gates — 47 to evaluate  | ☐      | 47 + 25 detect + the R-01..R-56 ledger    |
| 4   | Restructure `validate`                   | ☐      | Blocks the init executor — see Blockers   |
| 5   | Skills — 24 merge + 91 evaluate          | ☐      | 116 rows, one per skill                   |
| 6   | Agents — 3 to evaluate                   | ☐      | Plus skill provenance + update command    |
| 7   | UI components — 28 blocks                | ☐      | Web + mobile parity, 6 checks each        |
| 8   | Docs sweep                               | ☐      | Every doc rewritten general               |
| 9   | Init executor + product/design flow      | ☐      | Phases 2 and 3 of the original ask        |
| 10  | Preset CI matrix                         | ☐      | Turns determinism into proof              |
| 11  | Round trip against certifipago           | ☐      | Final acceptance                          |

---

## Phase 0 — Manifest + gates ☑

Done 2026-09-04.

- ☑ `template.manifest.json` — 7 capabilities, 3 presets
- ☑ `scripts/manifest.mjs` — pure engine
- ☑ `scripts/manifest.test.mjs` — 24 tests, green
- ☑ `scripts/verify-manifest.mjs` — shape gate
- ☑ `scripts/verify-manifest-coverage.mjs` — truth gate
- ☑ `docs/manifest.md` + `docs/maps/global-map.md` + `CLAUDE.md`
- ☑ Wired first in `validate` (fail-fast)

**Verified:** 719 tracked files, exactly one owner each, zero unclaimed, zero
conflicts, zero stale claims. 24/24 tests. ESLint and Prettier clean.

Capabilities declared: `design-tokens`, `i18n`, `web-next`, `mobile-expo`,
`supabase`, `cloudflare`, `e2e-playwright`.
Presets: `full`, `web-only`, `mobile-only`.

### Documentation for this phase

- ☐ **D1** artifact documented — what it is, what it does, how to use it
- ☐ **D2** rule or contract recorded in `docs/code-standards.md`, with its §21 row
- ☐ **D3** indexed in `docs/maps/global-map.md`
- ☐ **D4** decision trail written above — including what was rejected and why

---

## Phase 1 — `docs/code-standards.md` ☑

Done 2026-09-07. 368 → 670 lines.

- ☑ Read both versions end to end (template 368, certifipago 877)
- ☑ Diff the rule sets
- ☑ Classify each addition
- ☑ Write the merged standard
- ☑ Re-check every existing skill still cites real rule numbers

### Numbering constraint (discovered, binding)

Skills cite rule numbers verbatim — `arch` cites Rule 3 and Rule 4, `component`
cites Rule 4 and Rule 11, the skill registry cites Rule 9. **Renumbering breaks
every one of those pointers.** So §1–§18 keep their numbers exactly; everything
new attaches as a sub-section or appends at §19+.

### Ported (`own`)

| Section                          | Note                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| Source-of-truth map              | Rewritten for this repo's owners; added an OWNERSHIP row for the manifest            |
| §0 Reuse Before Scaffolding      | Decoupled from CodeGraph — the index is optional, the reuse check is not             |
| §1.1 ES6+ over ES5               | Same substance; examples re-pointed at template files                                |
| §1.2 Comments Say What Code Does | Ported whole; the grep tell is the enforceable half                                  |
| §3.1 Type Placement              | Ported **without** the grandfathering paragraph (decision 1)                         |
| §15.1 i18n Catalog Conventions   | Marked honestly: parity is enforced here, casing is not                              |
| §19 Error Surfacing              | De-branded to `@app/core`; mechanical check marked absent                            |
| §20 Lint Severity Ratchet        | Ported **with** an explicit no-allowlist clause that reverses certifipago's practice |
| §21 Rule → Validation Coverage   | **Rebuilt from this repo's real mechanisms**, never copied                           |

### Rejected

| Item                                     | Class   | Why                                          |
| ---------------------------------------- | ------- | -------------------------------------------- |
| §3.1 allowlist grandfathering            | `debt`  | Decision 1                                   |
| §20 "WARNING-ZERO ACHIEVED" status table | `brand` | A claim about certifipago's repo, false here |
| §21 rows citing certifipago-only gates   | `brand` | Rebuilt against real mechanisms              |

### What §21 exposed

**Six rules have no enforcement in this template**: §1.1, §1.2, §3.1, §19, §20,
and i18n key casing. They are now named gaps with a named mechanism, not prose.
Phases 2 and 3 close them.

Measured backlog for §1.2 the day its rule lands: **4 pre-existing violations**,
in `check-identity.mjs`, `scrubPII.helper.ts`, `verify-maps.mjs` and
`verify-security-static.mjs`. Under decision 1 those get fixed, or the rule does
not land.

### Scope discovery — affects phase 3

Certifipago's authority layer is bigger than one doc: `code-standards.md` (877) +
`code-standards-native.md` (249) + `rule-enforcement.md` (130) +
`rigor-program.md` (236) + a numbered rule ledger `R-01`…`R-56`. The ledger is
phase 3 scope, not phase 1.

`rule-enforcement.md` carries the idea worth taking wholesale: **an instruction
is not a gate.** Its dated census — over 742 Bash calls the "never use cat/grep"
rule broke 61 times with nothing to notice, while "no AI attribution" held across
30 commits, both written in the same voice in the same file — is the argument
behind §21.

### Documentation for this phase

- ☐ **D1** artifact documented — what it is, what it does, how to use it
- ☐ **D2** rule or contract recorded in `docs/code-standards.md`, with its §21 row
- ☐ **D3** indexed in `docs/maps/global-map.md`
- ☐ **D4** decision trail written above — including what was rejected and why

---

## Phase 2 — ESLint rules ◐

Harvested against certifipago `5d7b7781`. **3 of 12 landed, 9 with a measured
verdict.**

> **Count corrected 2026-09-07.** An earlier pass said "21 rules, 16 to
> evaluate". That grep counted every rule id in `eslint.rules.mjs`, not just the
> `local/*` ones. The real numbers are 17 upstream and 12 to evaluate.

Shared by both repos already: `logic-in-view`, `no-inline-tailwind-classname`,
`no-non-ascii-identifier`, `single-object-params`, `single-use-state`.

### Verdicts

`Clean?` is the decision gate: the rule must pass against this repo with **no
exemption file**. If it does not, the code gets fixed or the rule does not land.

| #   | Rule                                 | Read | Verdict                    | Measured here         | Status |
| --- | ------------------------------------ | ---- | -------------------------- | --------------------- | ------ |
| 1   | `local/no-justifying-comment`        | ☑    | `own` — landed `error`     | **0 violations**      | ☑      |
| 2   | `local/core-import-boundary`         | ☑    | `own` — landed `error`     | **0 violations**      | ☑      |
| 3   | `local/suffix-contract`              | ☑    | `own` — landed `error`     | **133 moved, then 0** | ☑      |
| 4   | `local/pure-domain-adapter`          | ☑    | `own` — rewritten, landed  | **0 violations**      | ☑      |
| 5   | `local/view-import-boundary`         | ☑    | `own` — needs rewrite      | not yet measured      | ☐      |
| 6   | `local/no-tailwind-in-constant`      | ☑    | `own` — code fix first     | 10 files to move      | ☐      |
| 7   | `local/no-route-literal`             | ☑    | blocked on a dependency    | n/a                   | ⚠      |
| 8   | `local/no-inline-seam-mock`          | ☑    | `own` — deferred           | upstream backlog 139  | ☐      |
| 9   | `local/spacing-multiple-of-four`     | ☑    | `own` — code fix first     | 4 (Chip `px-[11px]`)  | ☐      |
| 10  | `local/no-radius-in-style-classname` | ☑    | `optional` — mobile only   | —                     | ✗      |
| 11  | `local/blur-intensity-from-token`    | ☑    | `optional` — design system | —                     | ✗      |
| 12  | `local/blur-weight-from-token`       | ☑    | `optional` — design system | —                     | ✗      |

### Landed

**`no-justifying-comment`** — backs §1.2, which §21 listed as unenforced.
Ported with `eslint-local-rules/justifying-comment.detect.mjs`, wired at `error`
in `BASE_RULES`.

> **Correction to §1.2.** The rule enforces a **narrow** phrase set, not the
> broad grep tell. Upstream measured the broad phrasings across 2421 files and
> dropped them: hundreds of legitimate behavior descriptions carry "rather
> than" and "instead of". So §1.2 has two halves — the broad tell is a review
> aid, and only 7 phrases fail the build.
>
> This also corrects the phase-1 note that claimed **4 pre-existing violations**.
> That number came from the broad grep. Against the enforceable set the template
> measures **0**, which is why the rule could land at `error` immediately.

**`core-import-boundary`** — backs the constraint `CLAUDE.md` calls the single
most important one, which had no gate at all. Scoped to `packages/core/src/**`,
excluding tests.

> The first run reported one error on `packages/core/vitest.config.ts`. That was
> a **scoping bug in my wiring**, not a violation: build config is not domain
> code. Narrowing the glob to `src` fixed it without an exemption. The linter
> also flagged a stale `eslint-disable` I had left in the observability test —
> removed.

### The 133 that were moved, then the rule landed

`suffix-contract` (§3.1) started at **133 violations across 96 files** — 103
top-level type declarations and 30 SCREAMING_SNAKE consts living in
`*.component.tsx`, `*.screen.tsx` and `*.hook.ts`.

Decision 1 left two exits and no third. **We took the first: fix the code, then
land the rule.** The standard already mandated this — the `component` skill and
§3.1 both say types live in the block's `*.type.ts` — so the code was what
disagreed with the standard, not the rule.

The move was done by a TypeScript-parser codemod, never by regex: a declaration
carries its dependencies, and only the parser knows which identifiers are
references and which are just property names.

| Step                              | Result                                                       |
| --------------------------------- | ------------------------------------------------------------ |
| Declarations moved                | 103 types + 30 consts = **133**                              |
| Files rewritten                   | 96                                                           |
| Files repointed to the new module | 64                                                           |
| Handled by hand                   | 2 (the `Icon` barrels, which mix a moved and a staying name) |
| Tests after                       | **535 pass**, 0 fail                                         |
| `suffix-contract` after           | **0 violations**, landed at `error`                          |

**Four codemod bugs the pilot and the typechecker caught**, each fixed before the
full run:

1. The barrel repointer rewrote a whole file's specifiers, dragging
   `export { Avatar }` along with the type that left. Fixed by repointing per
   **statement**, and only when every name in it moved to the same place.
2. Appending a second file's declarations to an existing `.type.ts` **dropped
   the imports** they needed. Fixed by merging import lines into the existing
   file.
3. `typeof f<Arg>` lost `Arg`: the walker stopped at the type query and never
   entered its type arguments.
4. Both apps share the same `@/` alias shape, so `@/components/ui/Avatar/…`
   names two different files. Grouping by the raw string let mobile overwrite
   web. Fixed by grouping on the **resolved path**.

**One architecture violation found in passing and fixed**, per the standing
instruction: `apps/mobile/src/components/ui/Logo/logo.constant.ts` was lowercase
while every sibling in the block is `Logo.*`. Renamed to `Logo.constant.ts` and
its importer updated.

> The rule was then **proved to fire**, not just to report zero: a planted
> interface and a planted SCREAMING_SNAKE const both produced errors, and the
> real repo produced none. A rule that reports nothing might simply be unwired —
> the first attempt here was exactly that.

### Still to evaluate

- `no-io-in-adapter` — the principle (an adapter is a pure DTO→VM mapper, no
  I/O) is general and valuable. The implementation is Supabase-coupled
  (`SUPABASE_CLIENT_SEAM`, transport member set) and must be rewritten
  provider-agnostic before it can land here.
- `view-import-boundary` — general in principle; its allow-lists of platform
  sources are stack-specific and need rebuilding for whichever stacks a preset
  selects.
- `no-tailwind-in-constant` — 12 `.constant.ts` files carry class-like strings,
  measured with a crude grep. Needs the real detector before a verdict.
- `no-inline-seam-mock` — the only rule whose upstream allowlist still holds a
  backlog (139 entries), so it has not been proven clean anywhere yet.
- The four design rules (`spacing-multiple-of-four`,
  `no-radius-in-style-classname`, both `blur-*`) look tied to a specific design
  system and to NativeWind. Likely `optional` — they belong to a design
  capability, not to the core. Confirm on read.

### Also found

`eslint-local-rules/index.mjs` documents two rules as intentionally `warn`
because "the project contract forbids ever leaving the validation gate red".
That is the exact anti-pattern §20 names: a rule parked at `warn` forever. It
belongs in the ratchet backlog alongside `--max-warnings 0`.

### Documentation for this phase

- ☑ **D1** artifact documented — what it is, what it does, how to use it
- ☑ **D2** rule or contract recorded in `docs/code-standards.md`, with its §21 row
- ☑ **D3** indexed in `docs/maps/global-map.md`
- ☑ **D4** decision trail written above — including what was rejected and why

---

## Phase 3 — Verify scripts ☐

53 unique `verify-*.mjs` in certifipago, each with a sibling test, plus 25
`*.detect.mjs` modules. This template has 8.

Per gate, before accepting it: does it do what its name claims, does it pass
clean here, and does it depend on an exemption file?

Certifipago's gate tests import a shared harness at `scripts/gate/cases.mjs`.
Decide deliberately whether to harvest it or stay on plain `node --test`.

### Gate-by-gate ledger (53 in certifipago, 8 here)

| #   | Gate                          | Here?   | Read | Does what it claims? | Ported | Green |
| --- | ----------------------------- | ------- | ---- | -------------------- | ------ | ----- |
| 1   | `verify:agent-context`        | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 2   | `verify:allowlist-freshness`  | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 3   | `verify:authority-graph`      | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 4   | `verify:board-config`         | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 5   | `verify:bridge-secrets`       | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 6   | `verify:cold-import-exempt`   | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 7   | `verify:constant-divergence`  | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 8   | `verify:core-purity`          | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 9   | `verify:coverage`             | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 10  | `verify:coverage-scope`       | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 11  | `verify:data-flow`            | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 12  | `verify:dead-variant`         | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 13  | `verify:diff-mutation`        | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 14  | `verify:doc-links`            | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 15  | `verify:duplication`          | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 16  | `verify:e2e-boot-budget`      | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 17  | `verify:e2e-flow-standards`   | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 18  | `verify:e2e-no-coordinates`   | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 19  | `verify:error-contract`       | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 20  | `verify:flow-grade`           | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 21  | `verify:flow-traceability`    | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 22  | `verify:gate-shape`           | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 23  | `verify:glass`                | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 24  | `verify:governance`           | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 25  | `verify:i18n-keys`            | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 26  | `verify:ledger-index`         | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 27  | `verify:local-state`          | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 28  | `verify:maps`                 | ☑ merge | ☐    | ☐                    | ☐      | ☐     |
| 29  | `verify:pairing`              | ☑ merge | ☐    | ☐                    | ☐      | ☐     |
| 30  | `verify:plan-scope`           | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 31  | `verify:prepush-sql`          | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 32  | `verify:registry-portable`    | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 33  | `verify:route-wiring`         | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 34  | `verify:router-coverage`      | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 35  | `verify:routes`               | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 36  | `verify:rule-groups`          | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 37  | `verify:rule-ids`             | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 38  | `verify:scope-coverage`       | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 39  | `verify:screen-flow-coverage` | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 40  | `verify:security-static`      | ☑ merge | ☐    | ☐                    | ☐      | ☐     |
| 41  | `verify:sibling-naming`       | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 42  | `verify:sole-writer`          | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 43  | `verify:sort-key-parity`      | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 44  | `verify:structure`            | ☑ merge | ☐    | ☐                    | ☐      | ☐     |
| 45  | `verify:suffix-effects`       | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 46  | `verify:test-location`        | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 47  | `verify:test-naming`          | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 48  | `verify:test-shuffle`         | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 49  | `verify:tests`                | ☑ merge | ☐    | ☐                    | ☐      | ☐     |
| 50  | `verify:theme-sync`           | ☑ merge | ☐    | ☐                    | ☐      | ☐     |
| 51  | `verify:turbo-cache-inputs`   | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 52  | `verify:ui-purity`            | ☐ new   | ☐    | ☐                    | ☐      | ☐     |
| 53  | `verify:ui-reuse`             | ☐ new   | ☐    | ☐                    | ☐      | ☐     |

**Only here (2):** `verify:manifest`, `verify:manifest-coverage`

### Phase 3 also covers the rule ledger

Certifipago carries `R-01`…`R-56` plus `rigor-program.md` and
`rule-enforcement.md`. That numbered ledger is phase 3 scope — one row per rule,
each naming the gate that backs it. Feeds §21 of `docs/code-standards.md`.

### Documentation for this phase

- ☐ **D1** artifact documented — what it is, what it does, how to use it
- ☐ **D2** rule or contract recorded in `docs/code-standards.md`, with its §21 row
- ☐ **D3** indexed in `docs/maps/global-map.md`
- ☐ **D4** decision trail written above — including what was rejected and why

---

## Phase 4 — Restructure `validate` ⚠

**Blocker for phase 9.** See Blockers below.

### Documentation for this phase

- ☐ **D1** artifact documented — what it is, what it does, how to use it
- ☐ **D2** rule or contract recorded in `docs/code-standards.md`, with its §21 row
- ☐ **D3** indexed in `docs/maps/global-map.md`
- ☐ **D4** decision trail written above — including what was rejected and why

---

## Phase 5 — Skills ☐

115 in certifipago, 25 here.

### 5a. Present in both — three-way merge (24)

Never a copy: the template version vs certifipago's vs what the general
version should be.

| #   | Skill                     | Read both | Merged | Gate green |
| --- | ------------------------- | --------- | ------ | ---------- |
| 1   | `a11y`                    | ☐         | ☐      | ☐          |
| 2   | `arch`                    | ☐         | ☐      | ☐          |
| 3   | `component`               | ☐         | ☐      | ☐          |
| 4   | `feature`                 | ☐         | ☐      | ☐          |
| 5   | `fix-test`                | ☐         | ☐      | ☐          |
| 6   | `fractal-verify`          | ☐         | ☐      | ☐          |
| 7   | `general-plan`            | ☐         | ☐      | ☐          |
| 8   | `improve-skill`           | ☐         | ☐      | ☐          |
| 9   | `lib`                     | ☐         | ☐      | ☐          |
| 10  | `mock`                    | ☐         | ☐      | ☐          |
| 11  | `modify`                  | ☐         | ☐      | ☐          |
| 12  | `new-skill`               | ☐         | ☐      | ☐          |
| 13  | `perf`                    | ☐         | ☐      | ☐          |
| 14  | `pre-commit`              | ☐         | ☐      | ☐          |
| 15  | `product-discovery`       | ☐         | ☐      | ☐          |
| 16  | `propagate-from-template` | ☐         | ☐      | ☐          |
| 17  | `quality`                 | ☐         | ☐      | ☐          |
| 18  | `registry`                | ☐         | ☐      | ☐          |
| 19  | `runtime-verify`          | ☐         | ☐      | ☐          |
| 20  | `screen`                  | ☐         | ☐      | ☐          |
| 21  | `security`                | ☐         | ☐      | ☐          |
| 22  | `service`                 | ☐         | ☐      | ☐          |
| 23  | `store`                   | ☐         | ☐      | ☐          |
| 24  | `test`                    | ☐         | ☐      | ☐          |

### 5b. Only in the template (1)

| #   | Skill          | Keep as-is | Note |
| --- | -------------- | ---------- | ---- |
| 1   | `validate-all` | ☐          | —    |

### 5c. Only in certifipago (91)

Class is a **hypothesis from the name**. Confirm it when the skill is read;
correct the row if the read disagrees.

| #   | Skill                              | Proposed class | Action                        | Read | Decided | Done |
| --- | ---------------------------------- | -------------- | ----------------------------- | ---- | ------- | ---- |
| 1   | `ad-creative`                      | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 2   | `analytics`                        | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 3   | `animation-taste`                  | `optional`     | ask at init — design group    | ☐    | ☐       | ☐    |
| 4   | `architecture-audit`               | `own`          | evaluate for port             | ☐    | ☐       | ☐    |
| 5   | `aso`                              | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 6   | `banner-design`                    | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 7   | `bash-defensive-patterns`          | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 8   | `brand`                            | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 9   | `churn-prevention`                 | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 10  | `clean-architecture`               | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 11  | `clean-code`                       | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 12  | `component-review`                 | `own`          | evaluate for port             | ☐    | ☐       | ☐    |
| 13  | `composition-patterns`             | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 14  | `copy-editing`                     | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 15  | `copy-review`                      | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 16  | `copywriting`                      | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 17  | `customer-research`                | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 18  | `design`                           | `optional`     | ask at init — design group    | ☐    | ☐       | ☐    |
| 19  | `design-system`                    | `optional`     | ask at init — design group    | ☐    | ☐       | ☐    |
| 20  | `design-taste-frontend`            | `optional`     | ask at init — design group    | ☐    | ☐       | ☐    |
| 21  | `domain-driven-design`             | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 22  | `e2e-coverage`                     | `own`          | evaluate for port             | ☐    | ☐       | ☐    |
| 23  | `expo-api-routes`                  | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 24  | `expo-cicd-workflows`              | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 25  | `expo-deployment`                  | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 26  | `expo-dev-client`                  | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 27  | `frontend-design`                  | `optional`     | ask at init — design group    | ☐    | ☐       | ☐    |
| 28  | `higgsfield-brandkit`              | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 29  | `higgsfield-generate`              | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 30  | `higgsfield-marketplace-cards`     | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 31  | `higgsfield-product-photoshoot`    | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 32  | `hooked-ux`                        | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 33  | `humanize-text`                    | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 34  | `impeccable`                       | `own`          | evaluate for port             | ☐    | ☐       | ☐    |
| 35  | `jobs-to-be-done`                  | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 36  | `launch`                           | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 37  | `marketing-ideas`                  | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 38  | `marketing-psychology`             | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 39  | `microinteractions`                | `optional`     | ask at init — design group    | ☐    | ☐       | ☐    |
| 40  | `mom-test`                         | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 41  | `motion-design`                    | `optional`     | ask at init — design group    | ☐    | ☐       | ☐    |
| 42  | `native-data-fetching`             | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 43  | `new-agent`                        | `own`          | evaluate for port             | ☐    | ☐       | ☐    |
| 44  | `next-best-practices`              | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 45  | `next-upgrade`                     | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 46  | `nodejs-backend-patterns`          | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 47  | `onboarding`                       | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 48  | `paywalls`                         | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 49  | `plan-to-board`                    | `own`          | evaluate for port             | ☐    | ☐       | ☐    |
| 50  | `playwright-best-practices`        | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 51  | `ponytail`                         | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 52  | `ponytail-audit`                   | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 53  | `ponytail-debt`                    | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 54  | `ponytail-gain`                    | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 55  | `ponytail-help`                    | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 56  | `ponytail-review`                  | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 57  | `posthog`                          | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 58  | `pricing`                          | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 59  | `product-marketing`                | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 60  | `react-best-practices`             | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 61  | `refactoring-patterns`             | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 62  | `refactoring-ui`                   | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 63  | `referrals`                        | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 64  | `remotion`                         | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 65  | `run-evals`                        | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 66  | `security-scan`                    | `own`          | evaluate for port             | ☐    | ☐       | ☐    |
| 67  | `seo`                              | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 68  | `shadcn`                           | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 69  | `signup`                           | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 70  | `skill-onboard`                    | `own`          | evaluate for port             | ☐    | ☐       | ☐    |
| 71  | `sleek-design-mobile-apps`         | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 72  | `slides`                           | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 73  | `social`                           | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 74  | `storybrand-messaging`             | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 75  | `supabase`                         | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 76  | `supabase-postgres-best-practices` | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 77  | `tailwind-css-patterns`            | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 78  | `threat-model`                     | `own`          | evaluate for port             | ☐    | ☐       | ☐    |
| 79  | `ticket-template`                  | `own`          | evaluate for port             | ☐    | ☐       | ☐    |
| 80  | `turborepo`                        | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 81  | `typescript-advanced-types`        | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 82  | `upgrading-expo`                   | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 83  | `use-dom`                          | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 84  | `ux-heuristics`                    | `optional`     | ask at init — marketing group | ☐    | ☐       | ☐    |
| 85  | `vercel-react-native-skills`       | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 86  | `verifipagos-design`               | `brand`        | delete                        | ☐    | ☐       | ☐    |
| 87  | `verifipagos-imagery`              | `brand`        | delete                        | ☐    | ☐       | ☐    |
| 88  | `web-interface-guidelines`         | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 89  | `web-typography`                   | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 90  | `working-with-legacy-code`         | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |
| 91  | `zod`                              | `vendored`     | decide entry + attribution    | ☐    | ☐       | ☐    |

### Documentation for this phase

- ☐ **D1** artifact documented — what it is, what it does, how to use it
- ☐ **D2** rule or contract recorded in `docs/code-standards.md`, with its §21 row
- ☐ **D3** indexed in `docs/maps/global-map.md`
- ☐ **D4** decision trail written above — including what was rejected and why

---

## Phase 6 — Agents ☐

### Agent ledger (4 in certifipago, 1 here)

| #   | Agent                | Here?   | Read | Decided | Done |
| --- | -------------------- | ------- | ---- | ------- | ---- |
| 1   | `builder`            | ☐ new   | ☐    | ☐       | ☐    |
| 2   | `codegraph-explorer` | ☐ new   | ☐    | ☐       | ☐    |
| 3   | `e2e-author`         | ☐ new   | ☐    | ☐       | ☐    |
| 4   | `validator`          | ☑ merge | ☐    | ☐       | ☐    |

### 5c-adjacent: provenance and updates

- ☐ Harvest `skills-lock.json` + `scripts/skills-drift.mjs`
- ☐ Add per skill: `source` (repo / URL / commit), `origin`
  (`vendored | own | adapted`), `version`
- ☐ Build the update command — pulls upstream, shows the diff against our
  adaptation, never silently overwrites it
- ☐ Tag each skill with its manifest group so skill pruning uses the same
  machinery as stack pruning

### Documentation for this phase

- ☐ **D1** artifact documented — what it is, what it does, how to use it
- ☐ **D2** rule or contract recorded in `docs/code-standards.md`, with its §21 row
- ☐ **D3** indexed in `docs/maps/global-map.md`
- ☐ **D4** decision trail written above — including what was rejected and why

---

## Phase 7 — UI components ☐

De-brand and finish. Both apps carry a `components/ui/` set; the ledger below
is the union of the two.

### UI component ledger (28 distinct blocks here)

| #   | Block              | Web | Mobile | De-branded | Tokens only | a11y | Tested |
| --- | ------------------ | --- | ------ | ---------- | ----------- | ---- | ------ |
| 1   | `AsyncBoundary`    | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 2   | `AuthField`        | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 3   | `AuthShell`        | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 4   | `Avatar`           | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 5   | `Button`           | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 6   | `Chip`             | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 7   | `ConfirmDialog`    | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 8   | `EmptyState`       | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 9   | `ErrorState`       | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 10  | `GlassCard`        | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 11  | `Icon`             | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 12  | `IconButton`       | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 13  | `LanguageSwitcher` | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 14  | `ListRow`          | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 15  | `LoadingSkeleton`  | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 16  | `Logo`             | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 17  | `Modal`            | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 18  | `NavBar`           | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 19  | `OfflineBanner`    | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 20  | `ScreenHeader`     | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 21  | `SearchBar`        | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 22  | `SegmentedControl` | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 23  | `SettingRow`       | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 24  | `SocialAuthButton` | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 25  | `StatusBadge`      | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 26  | `ThemeToggle`      | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 27  | `Toast`            | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |
| 28  | `Toggle`           | ☐   | ☐      | ☐          | ☐           | ☐    | ☐      |

### The component delta, measured 2026-09-07

|                     | Count  |
| ------------------- | ------ |
| Upstream components | **86** |
| Here                | **29** |
| Not here            | **57** |

Those 57 split by nature, and the split is the work:

- **Domain / brand** — `PaymentRow`, `PlanCard`, `PaywallOverlay`,
  `MembershipGuard`, `PlanGateWall`, `SuspendedWall`, `QRDisplay`,
  `WeekdayPicker`, `RulerGauge`, `TurnstileWidget`, `PermissionsChecklist`…
  These carry a business model. They do not travel.
- **Generic and missing here** — `DataTable`, `Pagination`, `Table`, `Tabs`,
  `Select`, `Sheet`, `Drawer`, `Menu`, `Switch`, `TextArea`, `Badge`,
  `Sparkline`, `Chart`, `StatCard`, `Topbar`, `Sidebar`, `Toaster`,
  `PageHeader`, `FilterBar`, `Pagination`, `Screen`, `AppShell`. These are the
  real harvest candidates.
- **Infrastructure-shaped** — `CrashBoundary`, `RouteErrorBoundary`,
  `RouteGuard`, `RouteLoader`, `PwaRegister`, `PwaInstallPrompt`. Evaluate
  against the capability they belong to.

⚠ A component is not general because its name is. Each one gets read before it
is classified — the same discipline the rules got.

- ☐ Compare against certifipago's set, harvest what is general
- ☐ Parity sweep: a block present in one app and missing in the other is a
  decision, not an oversight

### Documentation for this phase

- ☐ **D1** artifact documented — what it is, what it does, how to use it
- ☐ **D2** rule or contract recorded in `docs/code-standards.md`, with its §21 row
- ☐ **D3** indexed in `docs/maps/global-map.md`
- ☐ **D4** decision trail written above — including what was rejected and why

---

## Phase 8 — Docs sweep ☐

Every doc rewritten general, with no dead links after pruning.

- ☐ `README.md` — currently describes a Next+Expo template
- ☐ `AGENTS.md`
- ☐ `CLAUDE.md` — stack table assumes Next+Expo
- ✗ `docs/SDD_SYNC_PROMPT.md` — dropped in P0 (`bf843af`): it named other
  products and absolute paths (audit `docs/audits/2026-11-04-remediation.md`)
- ☐ `docs/architecture/*` — shared / web / mobile
- ☐ `docs/code-standards.md` (phase 1)
- ☐ `docs/e2e.md`, `docs/images.md`, `docs/infrastructure.md`,
  `docs/memory.md`, `docs/observability.md`, `docs/propagation.md`,
  `docs/responsive.md`
- ☐ `docs/maps/global-map.md` — must survive pruning
- ☐ Harvest `verify-doc-links` (phase 3) so pruning cannot leave dead links

### Documentation for this phase

- ☐ **D1** artifact documented — what it is, what it does, how to use it
- ☐ **D2** rule or contract recorded in `docs/code-standards.md`, with its §21 row
- ☐ **D3** indexed in `docs/maps/global-map.md`
- ☐ **D4** decision trail written above — including what was rejected and why

---

## Phase 9 — Init executor + product and design flow ☐

### Branch strategy — a capability, not a default

How a team branches is configuration. It becomes a manifest capability whose
answer **executes**, so the choice lands in the files that enforce it instead of
a paragraph nobody reads.

| Question                                                        | What the answer must execute                       |
| --------------------------------------------------------------- | -------------------------------------------------- |
| Model — trunk-based / GitHub Flow / git-flow / release branches | branch-name validation, the default base branch    |
| Branch naming — `feat/`, `type/scope`, ticket-prefixed          | a hook that rejects a non-conforming name          |
| Protected branches, required reviews                            | the CI workflow and repository settings doc        |
| Merge style — merge / squash / rebase                           | the PR template and the contributing doc           |
| Release + versioning — tags, changesets, none                   | the release job                                    |
| Commit convention                                               | already fixed: conventional commits via commitlint |

Open questions to settle before building it:

- ☐ Which models ship as presets, and which is the default
- ☐ Whether branch-name validation is a hook, a CI job, or both
- ☐ What the answer file records so the choice is re-runnable
- ☐ Whether repository settings (protection rules) are documented only, or
  emitted as a script — we cannot set them from inside the repo

Blocked by phase 4.

- ☐ Executor for the six verbs, with tests per verb
- ☐ Interactive question flow driven by the manifest
- ☐ `.project-setup.json` — the answers file
- ☐ Business model canvas → product docs
- ☐ Design system question → `design.md` → tokens → schemas
- ☐ Package selection: defaults, specific, replacements
- ☐ **Branch strategy** — the team-workflow question (decision 9)
- ☐ Idempotent and re-runnable — people change their mind in week 3
- ☐ Pure React starter (`react-solo` preset) — does not exist yet, must be built

### Documentation for this phase

- ☐ **D1** artifact documented — what it is, what it does, how to use it
- ☐ **D2** rule or contract recorded in `docs/code-standards.md`, with its §21 row
- ☐ **D3** indexed in `docs/maps/global-map.md`
- ☐ **D4** decision trail written above — including what was rejected and why

---

## Phase 10 — Preset CI matrix ☐

- ☐ Per preset: clean clone → init → `pnpm validate` green
- ☐ Wire into `.github/workflows/ci.yml`
- ☐ Decide the supported preset set — the combinatorics do not all fit in CI

### Documentation for this phase

- ☐ **D1** artifact documented — what it is, what it does, how to use it
- ☐ **D2** rule or contract recorded in `docs/code-standards.md`, with its §21 row
- ☐ **D3** indexed in `docs/maps/global-map.md`
- ☐ **D4** decision trail written above — including what was rejected and why

---

## Phase 11 — Round trip ☐

- ☐ Re-derive certifipago from the new template
- ☐ Record what did not fit, and why

### Documentation for this phase

- ☐ **D1** artifact documented — what it is, what it does, how to use it
- ☐ **D2** rule or contract recorded in `docs/code-standards.md`, with its §21 row
- ☐ **D3** indexed in `docs/maps/global-map.md`
- ☐ **D4** decision trail written above — including what was rejected and why

---

## Blockers

| #   | Blocker                                                                                                                                                                                                                                        | Blocks              | Status |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------ |
| B1  | ~~`@app/core#typecheck` fails — `console` untyped in the agnostic package (pre-existing, commit `be7abe9`)~~ Fixed with a module-scoped host seam                                                                                              | success criterion 1 | ☑      |
| B2  | `scripts.validate` is one long `&&` chain, so `patch-json` cannot remove a single step declaratively                                                                                                                                           | phase 9             | ☐      |
| B3  | No brand gate yet — "no certifipago references" is unverifiable until `verify:generic` exists                                                                                                                                                  | success criterion 2 | ☐      |
| B4  | Cross-cutting content pruning: deleting a capability leaves stale _sections_ inside surviving docs and skills. File deletion cannot fix that; needs region markers                                                                             | phase 8, 9          | ☐      |
| B5  | ~~`knip` fails — `pnpm lint-staged` in `.husky/pre-commit` does not resolve to the devDependency (pre-existing, was masked behind B1)~~ Fixed with `pnpm exec`                                                                                 | success criterion 1 | ☑      |
| B6  | The root `format:check` script flags 40 files (mostly `.claude/skills/**/*.md`) that `turbo run format:check` never reaches, so the gate does not cover what its name claims. Deliberately NOT fixed now — phase 5 rewrites those files anyway | phase 5             | ☐      |

---

## Change log

| Date       | Step                                              | Result                                                                                                                      |
| ---------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-04 | Inventory of both repos                           | 713 files here; 115 skills / 52 gates / 21 rules there                                                                      |
| 2026-09-04 | Phase 0 — manifest + gates                        | ☑ Green: 719 files owned exactly once, 24/24 tests                                                                          |
| 2026-09-04 | This plan written                                 | ☑                                                                                                                           |
| 2026-09-04 | B1 — host API typing in `packages/core`           | ☑ Module-scoped `hostConsole` seam; @types/node and DOM lib both rejected, rationale in `docs/architecture/shared.md`       |
| 2026-09-04 | B5 — knip vs lint-staged (found while closing B1) | ☑ `pnpm exec lint-staged` in the husky hook; no ignore entry added                                                          |
| 2026-09-04 | Full gate                                         | ☑ `ATL_TEMPLATE_SELF=1 pnpm validate` exit 0 end to end                                                                     |
| 2026-09-07 | Phase 1 — code-standards merge                    | ☑ 368 → 670 lines; §21 coverage ledger built from real mechanisms; 6 unenforced rules named                                 |
| 2026-09-07 | Applied new §1.2 to my own code                   | ☑ 2 violations found and fixed in `hostConsole.helper.ts` and its test; 4 pre-existing left as phase-2 backlog              |
| 2026-09-07 | Plan expanded to per-item ledgers                 | ☑ 243 numbered rows, 1000 checkboxes: every skill, rule, gate, detect module, agent and UI block                            |
| 2026-09-07 | Re-counted the ESLint rules                       | ☑ Correction: 17 local rules upstream, not 21; 12 to evaluate, not 16                                                       |
| 2026-09-07 | Reviewed certifipago master (PR #462, #463)       | ☑ 4 of 5 allowlists now empty; ceilings mechanism evaluated and accepted as distinct from allowlists                        |
| 2026-09-07 | Phase 2 — first pass over the 12 rules            | ◐ `no-justifying-comment` and `core-import-boundary` landed at `error`, 0 violations each; `suffix-contract` blocked on 129 |
| 2026-09-07 | Corrected the §1.2 violation count                | ☑ 4 → 0. The 4 came from the broad grep tell; the enforceable phrase set measures 0                                         |
| 2026-09-07 | Moved the 133 suffix-contract violations          | ☑ Parser-driven codemod: 96 files rewritten, 64 repointed, 2 by hand; 535 tests green                                       |
| 2026-09-07 | Landed `local/suffix-contract`                    | ☑ At `error`, 0 violations, no exemption file; proved it fires with a planted violation                                     |
| 2026-09-07 | Fixed `logo.constant.ts` casing                   | ☑ Architecture violation found in passing — renamed to `Logo.constant.ts`                                                   |
| 2026-09-07 | Documentation contract added to the plan          | ☑ D1–D4 per phase, 11 whole-system docs listed, added as success criterion 5                                                |
| 2026-09-07 | Re-validated upstream at `cc3a99ed`               | ☑ 7 new commits, the 17 rules unchanged; new shared UI-mock factories noted for phases 5 and 7                              |
| 2026-09-07 | Landed `local/pure-domain-adapter`                | ☑ Rewrote the Supabase-coupled original as provider-agnostic purity; 0 violations, proved it fires                          |
| 2026-09-07 | Measured the last 8 rules                         | ☑ 3 rejected as `optional` design/NativeWind; 2 need a code fix first; 1 blocked; 2 pending                                 |
| 2026-09-07 | Component delta measured                          | ☑ 86 upstream vs 29 here; 57 missing, split domain / generic / infrastructure                                               |
| 2026-09-07 | Decisions 8 and 9 locked                          | ☑ Donor repo is read-only (worktree + its conventions); branch strategy becomes an init capability                          |
| 2026-09-07 | Vendored the `archify` skill                      | ☑ MIT; 7.5 MB trimmed to 74 files; first recorded at `920543b`, the lock pins `b86b607` since 2026-09-11                    |
| 2026-09-07 | Wrote `docs/harness.md`                           | ☑ First of the whole-system docs: four layers, every gate, how to add one                                                   |
| 2026-09-07 | Built the diagram pipeline                        | ☑ `pnpm docs:diagrams` renders each checked-in spec and repaints it with `@app/tokens`                                      |
| 2026-09-07 | Decisions 10 and 11 locked                        | ☑ Markdown first / HTML derived; diagrams generated from a spec, never drawn                                                |
| 2026-09-11 | Surveyed 177 donor commits to `bcf7310b`          | ☑ Donor deleted 4 allowlists with their generators; rules 17→18, gates 53→55, web ui 59→66                                  |
| 2026-09-11 | Corrected the mock-seam count                     | ☑ 139 held at `5d7b7781`; 112 at `cc3a99ed`; 11 now                                                                         |
| 2026-09-11 | Reconciled archify with the donor branch          | ☑ Took its network-free SKILL.md and font licence; kept render-examples so `doctor` stays green                             |
| 2026-09-11 | Lock entry uses the donor format                  | ☑ Real sha256 of SKILL.md upstream and local; commit `b86b607` reverse-identified                                           |
| 2026-09-11 | Made `docs:diagrams:check` read-only              | ☑ Proven: exit 0 leaves the file intact, exit 1 does not repair a planted staleness                                         |
| 2026-09-14 | Fixed archify sigil/label overlap in the renderer | ☑ 76/220 → 0/220 measured; label rail 42px (48 branded); 2 examples + harness diagram re-fitted; `doctor` ready             |
| 2026-11-04 | Wrote the init and central-harness plan           | ☑ Donor re-read at 6bf0e179 (2309 commits), Qik workspace and this repo mapped; AGENTS.md loading verified                  |
