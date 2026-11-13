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
- **Other inputs:** the Qik workspace (`D:/Documents/Dev/Baufest/qik`), this
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

## Next steps (2026-11-05, updated 2026-11-11)

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

| #   | Step                                                                                                                                                                                                                                                                                                                                | Waits on                     | Done when                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| T1  | **P0**: land the 351 staged paths per verdict — landed locally on `feat/p0-land-staged` (16 commits, validate green); push, pull request and the owner's merge remain                                                                                                                                                               | the owner's OK               | the staged set is committed as reviewable units or reverted per verdict; `ATL_TEMPLATE_SELF=1 pnpm validate` is green |
| T1a | **SDD-0**: adopt SDD in this repository as its first OpenSpec change (decision 42): `openspec/` with the generic sections of Certifipago's README, its six templates and `config.yaml` without the product context; the `sdd` skill; `verify:specs`; `report:spec-drift`; the `sdd-steward` agent once T2 projects agents           | T1                           | `verify:specs` green; the change archived                                                                             |
| T1b | **Living specs** (decision 41): one spec per app and package of the scaffold, written from the code after P0 and verified against a commit                                                                                                                                                                                          | T1a                          | every spec passes `verify:specs`; `report:spec-drift` empty                                                           |
| T2  | **P1–P2**: one router and the harness core, carrying what PD1 proved: the LAWs in `AGENTS.md` (decision 12), the Codex project-doc budget gate (decision 39), hook-safe test helpers (decision 33), the read-only agent guard (decision 34)                                                                                         | T1                           | projections and their drift gate green; the budget test and the decoy-`GIT_DIR` tests pass                            |
| T3  | **P3–P4**: gate registry and project facts, with the architecture contract (decision 32) and the skill-completeness gate (decision 29); the workflow-hardening gate, the `no-dynamic-inner-html` lint rule and the `.env.<name>` ignore (decision 43)                                                                               | T2                           | `verify:architecture` and `verify:skill-completeness` run from the registry                                           |
| T4  | **PS**: skills in modules, each complete; knowledge skills routed (decision 30); no name collisions (decision 31); the probe harness kept as a repeatable measure; vendored skills adapted through overlays, the security skills with their evals, eval fixtures outside the portable skills and blind eval worktrees (decision 43) | T3, and C2's measured result | the probes meet the bar PS sets, measured on the real setup                                                           |
| T5  | **PF**: flow specs that name the knowledge skill at each step, and the review routing of design review by change                                                                                                                                                                                                                    | T4                           | one end-to-end test per flow                                                                                          |
| T6  | **P5–P7**: manifest v2, executor, `/init`; section 7 asks owners and the merge policy (decision 38), section 8 the skill modules; section 8 asks the workflow, SDD by default (decision 40); section 8 installs the toolchain and MCP servers it needs, pinned (decision 44)                                                        | T5                           | a scratch clone initialized per preset passes `pnpm validate`                                                         |
| T7  | **PD2 and P8–P12**: Certifipago onto the versioned core, then the remaining phases                                                                                                                                                                                                                                                  | T6                           | as the Phases table states                                                                                            |

Every new mechanism in either list first answers the five questions
(decision 37).

From T1a on, every template step runs as an OpenSpec change of this repository:
proposal, spec deltas, a design when an architecture decision needs one, tasks,
apply test first, verify, archive. The flow `/init` offers by default is proven
on the template's own work first (decision 42).

### Parity ledger

Owner, 2026-11-05: "Recuerda que si hay algo que cambia en certifipago, tambei
debería implementarlo en el template y viceversa". Every harness change in one
repository gets its counterpart in the other, done in the same work or recorded
here with the step that carries it. A product-only change says why it does not
apply. A row closes when its counterpart has merged. Template to Certifipago goes
through the `propagate-from-template` skill.

The template holds none of the PD1 harness yet (no write guard, review verdict,
hook-safe test helpers, architecture contract or launch example), so the PD1
fixes reach it through the harvest steps below, which harvest from Certifipago
master after these merges.

**Certifipago → template**

| Certifipago change                                                                                                   | Merged in                                      | Template counterpart                                                    | Carried by     | Status |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- | -------------- | ------ |
| Dead overrides, unused web deps, stale knip ignores (T1a)                                                            | #735                                           | none: Certifipago's own dependencies                                    | not applicable | closed |
| `.claude/launch.json` untracked, `launch.example.json` added (T1b)                                                   | #755                                           | the same ignore entry and example file                                  | T2             | open   |
| Product names read from config (T2)                                                                                  | #743                                           | the registry generator reads the product name from config               | T2 (P2)        | open   |
| Per-finding review records (T4, decision 36)                                                                         | #745                                           | the review record format and its gates                                  | T3 (P3)        | open   |
| Codex read-only sessions do not relaunch themselves (T5)                                                             | #741                                           | the projector's Codex read-only launcher                                | T2 (P2)        | open   |
| Prompt-audit findings in skill files (T6)                                                                            | #742                                           | the same fixes in the harvested skills                                  | T4 (PS)        | open   |
| Agent write guard: Bash writes, continuations, scopes (T7, decision 34)                                              | #753                                           | the guard and its suite                                                 | T2 (P2)        | open   |
| Flow gates and hook-safe test helpers (T8, decision 33)                                                              | #752                                           | `gitFreeEnv`, `withHookGitDir`; the flow gates                          | T2, T5 (PF)    | open   |
| Merge-result gate, client-side (T9)                                                                                  | #739                                           | the merge gate in the gate registry                                     | T3 (P3)        | open   |
| Skill completeness gate (T10, decision 29)                                                                           | #748                                           | the gate and the per-skill bar                                          | T3, T4         | open   |
| LAWs in `AGENTS.md`, Codex project-doc budget (T11, decisions 12 and 39)                                             | #756                                           | the router carries the LAWs; the budget setting and its test            | T2 (P1–P2)     | open   |
| Architecture contract and gate (T14, decision 32)                                                                    | #749                                           | the contract per app and package; `verify:architecture`                 | T3 (P3–P4)     | open   |
| Knowledge skills routed from the build step (T16, decision 30)                                                       | PR #758                                        | the routed table in the generated router                                | T4 (PS), T5    | open   |
| Merge policy as a setting (T17, decision 38)                                                                         | PR pending                                     | `delivery.mergePolicy` in the harness config; `/init` section 7 asks it | T3 (P4), T6    | open   |
| Design review owed by changed paths (T15)                                                                            | PR pending                                     | the path-to-review-skill contract and the PR hook                       | T5 (PF)        | open   |
| SDD by size: `openspec/`, the `sdd` skill, `sdd-steward`, `verify:specs`, `report:spec-drift`                        | master `cda657025`                             | the same machinery without the product specs                            | T1a            | open   |
| Vendored-skill overlays (`.agents/skill-overlays/`)                                                                  | #770                                           | overlays for the template's vendored skills                             | T4 (PS)        | open   |
| Security skills and their evals; `security-sweep` triages through `fp-check`                                         | #767, #774                                     | the same skills without product rows                                    | T4 (PS)        | open   |
| Eval fixtures outside the portable skills, blind eval worktrees, agents name the skill that grades them (`gradedBy`) | master `cda657025`                             | the same in the eval harness and the agent context                      | T2, T4         | open   |
| Workflow-hardening gate, `no-dynamic-inner-html` lint rule, `.env.<name>` ignore                                     | master `cda657025`                             | the same gate, rule and ignore line                                     | T3             | open   |
| Knowledge-routing hook (PD1 T19)                                                                                     | branch `feat/route-knowledge-hook`, PR pending | the hook and its contract                                               | T4, T5         | open   |

**Template → Certifipago**

| Template change                                                                      | Landed in             | Certifipago counterpart                                                                                                             | Carried by            | Status |
| ------------------------------------------------------------------------------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------ |
| Hooks run `commitlint` and `lint-staged` through `pnpm exec` (P0 `08752d9`)          | `feat/p0-land-staged` | the same two lines in `.husky/commit-msg` and `.husky/pre-commit` (Certifipago still runs `pnpm commitlint` and `pnpm lint-staged`) | C5                    | open   |
| archify lock: a hash per file and the sigil patch recorded (P0 `e040feb`, `417ae5c`) | `feat/p0-land-staged` | Certifipago's `skills-lock.json` holds one hash per skill and no patch record; check whether its archify carries the sigil patch    | PD2 (one lock format) | open   |
| `.gitattributes` (P0 `3d31c02`)                                                      | `feat/p0-land-staged` | none: copied from Certifipago                                                                                                       | not applicable        | closed |
| Core console seam, suffix codemod, docs, capability manifest (P0)                    | `feat/p0-land-staged` | none: template code and template-only files                                                                                         | not applicable        | closed |
| NUL byte escaped in the local lint rules (P0 `1d5ce1c`)                              | `feat/p0-land-staged` | none: Certifipago's rules carry no NUL byte                                                                                         | not applicable        | closed |
| Core import rules no longer contradict (P0 `91bcd11`)                                | `feat/p0-land-staged` | checked when the lint rules are harvested                                                                                           | T3 (P3)               | open   |
| The workflow as a setting (decision 40)                                              | this plan             | `workflow.mode: "sdd"` in `.agents/harness.config.json`, the mode it already runs                                                   | C6                    | open   |
| MCP servers pinned to the version resolved at install (decision 44)                  | this plan             | `.mcp.json` runs five servers through unpinned `npx -y`; pinning them is the owner's call                                           | C7 (owner decides)    | open   |

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
| 41  | The template ships its living specs: one per app and package of the scaffold, written from the code after P0 and verified against a commit, so a derived project starts with specs; `/init` keeps the specs of the capabilities it selects. Certifipago's 26 specs describe its product and are not harvested; its six templates, the generic sections of its README and its spec gates are.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 42  | The plan runs through SDD: from T1a on, every template step is an OpenSpec change of this repository. The first change adopts SDD itself, as Certifipago's `2026-11-10-adopt-sdd` did, so the flow `/init` offers by default is exercised on the template's own work before a project relies on it (owner, 2026-11-11).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 43  | Certifipago's harness changes of 2026-11-06 to 2026-11-11 are harvested by theme: SDD (decision 42); vendored-skill overlays, re-applied on upstream updates; the security skills (`differential-review`, `fp-check`, `sharp-edges`, `security-hardening`) with `security-sweep` triaging through `fp-check`; eval fixtures outside the portable skills and blind eval worktrees; agents that name the skill grading them (`gradedBy`); the workflow-hardening gate, the `no-dynamic-inner-html` lint rule and the `.env.<name>` ignore. Product-only changes are not harvested.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 44  | `/init` installs the toolchain the chosen harness needs and the template does not vendor: the latest release of gentle-ai (which brings engram and gga and configures the chosen runtimes through `gentle-ai install`, `upgrade` and `sync`), the CodeGraph CLI, and every MCP server, connector or plugin the selected capabilities call for (from Certifipago's `.mcp.json`: next-devtools for web-next, shadcn for the web UI kit, expo, metro and react-native-docs for mobile-expo). It lists each one with its source and the version it would install, installs only on the owner's yes, pins the version it resolved as latest (in the harness lock, and as `package@version` in `.mcp.json`, where Certifipago runs unpinned `npx -y`), and ends with `gentle-ai doctor` and a handshake with each MCP server. Verified 2026-11-11 on the owner's machine: gentle-ai 4.3.1 from `go install`, CodeGraph 1.4.1 from npm; the install command for a machine without Go is checked against gentle-ai's release documentation in P7 (owner, 2026-11-11). |

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
| Deep analysis of Qik against the objective         | The code lives on another machine, so the analysis reads Qik's generated catalogs (`docs/app/`), its knowledge census and its harness, and asks the Qik session for what only the code can answer | done (static, through generated docs) |
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
| 4   | Backend and data  | backend (Supabase / other / none); tables and entities to start with; auth providers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `contracts/data.json`, `docs/data-model.md`, first migration stub                                                            |
| 5   | Design system     | does one exist? source: Figma, URL, package, tokens file, none; **destination folder** for the copy                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | copied source, `docs/design-system.md`, tokens data → generated tokens, `contracts/design.json`                              |
| 6   | Flows and screens | main user flows; screen list per app                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `docs/user-flows.md`, screen map, scaffolded screens and routes                                                              |
| 7   | Team workflow     | branch strategy, PR policy, merge vs rebase, protected branch, commit convention, board (Notion / Jira / Linear / none); owners and reviewers per area (default: the repository owner), written as `CODEOWNERS` only where GitHub honours it (a public repository, or Pro or Team for a private one), otherwise kept in the project config for review routing                                                                                                                                                                                                                                       | `contracts/workflow.json`, `contracts/board.json`, hooks, commitlint; the merge policy, `manual` or `low-risk` (decision 38) |
| 8   | Harness           | runtimes (Claude Code, Codex, OpenCode, Copilot); skill packs (proposed from sections 2–4: marketing or product work, web, mobile, backend; the owner confirms); shared memory (repo URL or none); conversation vs artifact language; the workflow: SDD (default) or ODD (decision 40); the toolchain: the latest gentle-ai and each MCP server, connector or plugin not vendored, listed with source and version, installed on the owner's yes and pinned (decision 44)                                                                                                                            | `project.config.json` harness block; projections; pruned skill packs                                                         |
| 9   | Quality profile   | gate profile (strict / standard), coverage floor, budgets, mutation on push, review policy                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `contracts/budgets.json`, `contracts/review.json`, registry entries                                                          |
| 10  | Docs and diagrams | which doc families to keep; which are generated from code and which hand-kept; diagrams on or off; stack picture on or off                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | pruned `docs/`, `docs/diagrams/`                                                                                             |

### Everything that is or should be configurable

`Today` says whether the template can configure it now: **yes**, **hardcoded**
(present, not removable by answers) or **missing**.

| Area          | Setting                                                   | Options                                                                                                                     | Default                     | Lands in                                                     | Today                           |
| ------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------ | ------------------------------- |
| Identity      | name, slug, scope, bundle id                              | free text, validated                                                                                                        | —                           | package.json files, `tsconfig.base.json`, `app.json`, i18n   | hardcoded (renamer only)        |
| Identity      | license, owner                                            | SPDX id                                                                                                                     | MIT                         | `LICENSE`, `README.md`                                       | hardcoded                       |
| Stack         | apps                                                      | web-next, mobile-expo, both, react-spa, none                                                                                | both                        | manifest capabilities                                        | partial (no react-spa)          |
| Stack         | Node, package manager versions                            | supported list                                                                                                              | Node 24, pnpm 9             | `.nvmrc`, `package.json`                                     | hardcoded                       |
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
| Harness       | languages                                                 | conversation language; artifact language                                                                                    | user's / English            | `AGENTS.md` rule                                             | hardcoded                       |
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

| #   | Decision                            | Recommendation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-A | Distribution of the central harness | **Decided: A, vendored and versioned** (decision 18)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| D-B | Runtimes                            | **Decided 2026-11-04:** one `AGENTS.md` (Claude Code imports it), `.claude/skills` canonical, `.mcp.json` canonical, one set of hook scripts; per-runtime files generated only for the runtimes `/init` selects. `/init` asks, defaulting to Claude Code plus every CLI it detects (`codex`, `copilot`, `opencode`, `gemini`/`agy`, `devin`, `amp`) and marker folders.                                                                                                                                                                                                                                                                                     |
| D-C | Backend default                     | **Decided 2026-11-04:** Supabase stays the default and becomes removable (`backend: none` or another provider)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| D-D | Default branch strategy             | **Decided 2026-11-04:** feature branches into a protected `main`, merged by PR with merge commits                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| D-E | PR peer reviewer                    | **Decided 2026-11-04:** `/init` asks. Default: a different provider from the one that writes the code when its CLI is installed (`codex review --base <base>`, or `codex exec -s read-only --output-schema` for structured findings); otherwise the same provider in a fresh session (`claude -p "/code-review high <base>...HEAD"`). Runs at pre-push by default; PR-time CI and hosted reviewers (Codex cloud, Claude Code Review, Copilot review) are opt-in and plan-gated; ultrareview is opt-in because it bills. One file per finding under `.reviews/<branch>/<reviewer>/` with a verdict field; advisory by default, optionally blocking on P0/P1. |

---

## Log

- **L1 (2026-11-04, owner, verbatim):** "Resumiendo, armar un plan apra volver
  el proyecto genérico per o con un init que permita configurarlo de pies a
  cabeza. Centrilzar el harness y permitir que todo sea configurable. Para ello
  armar estrategias de tener los skills centralizados y luego que llamen a los
  archivos especificos del proyecto, entre otras que puedas identificar y
  comunicarte con los otros agente para tener mucho mas contexto"
- **L2 (2026-11-04):** four read-only maps (donor harness, donor delta, Qik
  workspace, this repo) and two documentation checks (AGENTS.md loading, skill
  name precedence, plugins). Architect consultation expired undelivered; Qik
  consultation queued while that session is offline.
- **L3 (2026-11-04):** the owner aligned the permission modes; the architect
  consultation was sent again and reached that session's inbox.
- **L4 (2026-11-04, owner, verbatim):** "vamos con la opción A, vendorizado y
  versionado / Ademas tambien queiro en el plan incluyas un refacto a
  Certifipago y su harness para poder actualziarlo y ver si tambien hay cosas
  que necesitamos actualizar. Ademas antes de copiar los skill y todo lo que
  usa, deberiamos ver que tanto se usa, si se usa adecuadamente con /doctor"
- **L5 (2026-11-04, owner, verbatim):** "y tambien no solo /doctor sino con un
  analisis intensivo de todo en el repo"
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
- **L8 (2026-11-04, owner, verbatim):** "Como vasa arrancar con el P0 si no
  tiene toda la info de certifipago y qik y un analisis de ambos codigos justo
  con el objetivo?"
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

- **L13 (2026-11-04, owner, verbatim):** "Una vez tengamos todo claro, hay que
  ver como agrupar y arreglar las skill de un modo que se puedan usar
  correctamente y arreglaro todo lo que las auditorias pidan"
- **L14 (2026-11-04):** added phase PS (packs, front doors, merges, quality bar,
  skill gates, trigger evals, 30-day usage review) and decision 25. Generated
  the remediation backlog: 517 actionable items from the audit rows and both
  prompt audits, each assigned to its phase.

- **L15 (2026-11-04, owner, verbatim):** "Puede revisar el plan y ver si todo
  es correcto con el adviosr?"
- **L16 (2026-11-04):** advisor review applied. Decision 25 could not work
  (a generated file with checkboxes, generators only in the session): the
  backlog is now hand-maintained and `pnpm harness:audit` moves to P3 with a
  status file. `docs/audits/**` joins the maintainer capability (P0 unit 8) and
  the `.prettierignore` line joins P0 unit 1. Decision 22 now allows a recorded
  patch over upstream, which is how P0 unit 5b (the archify sigil fix) lands.
  Skills with a high-confidence prompt-audit finding cannot stay keep or defer.
  Same-name skills get a base-copy rule. Counts left the exit checks. A table
  now says which phase each open input blocks.
- **L17 (2026-11-04, owner, verbatim):** "Ademas tambien ver los sub agenrtes,
  validalor y ver si funciona com ose deben y colocarlos en plan. Y tambien que
  los sub agentes sus reglas sean adaptables al estilo. Y eso tambien que se
  parte del init."
- **L18 (2026-11-04, owner, verbatim):** "Ademas pensar en lo flujos completos
  y no solo en skills o cosas puntuales. Verificar eso y tenerlo encuenta en el
  plan"
- **L19 (2026-11-04):** two read-only evaluations launched: real subagent runs
  (tool discipline, output contract, hardcoded rules) and real end-to-end flows
  from session transcripts against the declared lifecycle. Their results feed
  the agents and flows sections.

- **L20 (2026-11-04):** subagent evaluation done (1,205 runs). Read-only is not
  enforced for Bash, a model alias broke every Codex validator spawn, and the
  validator's format conflicts with skill report templates. Added decision 26
  and the agents section; P2 now carries the fixes.

- **L21 (2026-11-04, owner, verbatim):** "para DB, no no todos usan agents.md y
  se puede hacer algo centralizado? Si no es el caso, preguntar o por defecto.
  Ademas algoq ue me olvide y justo me hiciste acordar, es el revisor de pares
  de los PRs, preguntar si tiene codex o si queire que una sesion independiente
  lo revisa usando el mismo proveedor. DC, DD recomendado"
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

- **L26 (2026-11-04, owner, verbatim):** "Habria que ver porque no se usan,
  proque n realidad deberia usarse por el contexto de programacio y casi todas
  son de ello, las otras de markting y po no se usan porque todavia no las
  estamos aplicacando. Primemo analisemos las de por defecto, y si es necesario
  agregarlas, proque tambien se basa esa desccion de que loq ue queire, si
  quierer marketing, solo web, solo app, etc y eso deberia tmbnien preguntarse
  en el /init Ademas si el probelmas es lo del maximo de token, ve validando una
  a una y pruebas un flow quwedeberia usarlas todas y asi poco a poco"
- **L27 (2026-11-04):** root cause confirmed from `/skill-doctor` (105 of 123
  donor skills listed by name only). Decision 20 rewritten (grown one by one,
  packs derived from `/init` answers); verdict rule corrected (reads split into
  use and authoring; no signal means deferred, not dropped); PS gains tiers a–c.
  Two runs launched: the use/authoring split of reads, and tiers a and b on a
  scratch clone.
- **L28 (2026-11-04, owner, verbatim):** "Pero si las 11 a eliminar es por
  defectos, no seria mejor arreglarlos?"
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

- **L31 (2026-11-04, owner, verbatim):** "Recuerda que el plan debe incluir
  actualizar el harness de certifipago tambien"
- **L32 (2026-11-04):** PD was stale (it still said "drop unused skills" and
  lacked the agent, flow, budget and runtime findings) and waited for the whole
  core. Split into PD1, Certifipago fixes that start right after P0, and PD2,
  the convergence on the versioned core.

- **L33 (2026-11-04, owner, verbatim):** "mientras vas instalando eso, tambien
  hay que actualizar toda la docuemntacion de certifipago, como se hizo en qik,
  eo tambien ayudara al templrate para dejar todo limpio / tambien encontre esta
  skill https://github.com/caru-ini/stack-diagram, validada con el harnees de
  certifipago e instalala y colocarla en algun flujo para que tambien actualice
  con ello la docuemntacion, vendoreala o sino tambien se puede integrar en
  alguna skill"
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

- **L37 (2026-11-05, owner, verbatim):** "algo que creo que tambien necesitamos es un
  revisor de arquitectura, uno que valide las capetas siguan lo que dice la
  docuemtnacion de arquitctura antes de un commit. podemos validar eso y agregarlo
  al plan?" Validated on Certifipago master: folders and `docs/architecture` agree
  after #738, but no gate holds it; the structure gates hard-code their rules and
  the doc gates check only docs → repo. Added: a PD1 "Architecture gate" slice, an
  architecture contract in the project facts, an "Architecture change" flow, and
  `/init` section 3 producing the contract and the docs' folder tables.

- **L38 (2026-11-05, owner, verbatim):** "ycomo pudo hacer que cuando se crear un compoente /
  screen / seccion pase las auditorias de diseño". Added a PD1 "Design review by change"
  slice: compliant scaffolds at creation, and a path → review-skill routing table the PR
  hook enforces on the review verdict; the Feature flow and `/init` section 5 name it.
- **L39 (2026-11-05):** T13 — plan rebuilt from PD1 and its tests (owner, PD1:
  "y con ello rearmas el plan para el template"). Added decisions 29–36, PS
  round 3, "PD1 status", four risks, the P2, P4 and PD1 phase cells, and the
  "PD1 findings" backlog section; Quick path step 7 updated. Evidence: the
  donor feature document `odd/tasks/harness-pd1.md`, L13–L22.
- **L40 (2026-11-05):** `pnpm validate` over the integrated PD1 tree (master
  plus all ten PD1 branches, in a separate clone) exits 0: 33 of 33 turbo tasks
  and every gate.
- **L41 (2026-11-05):** All ten PD1 PRs merged on the owner's word ("mergea
  todo lo demas"); master at `48c3c9e3f`. T11 (instruction files) is next.
- **L42 (2026-11-05, owner, verbatim):** "Si ceirral como propones, pero validado
  primero". T1b closed. `.claude/launch.json` is per machine (ignored, with an
  example). Session ownership is not configured: hook input carries `session_id`,
  `cwd`, `permission_mode` and, inside subagents, `agent_type`, but no session
  name (code.claude.com/docs/en/hooks), so nothing could enforce it, and each
  session already works in its own worktree. Owners are people, asked in `/init`
  section 7; `CODEOWNERS` is written only where GitHub honours it: code owners
  in private repositories need GitHub Pro or Team (docs.github.com, GitHub's
  plans), so Certifipago, private on the free plan, keeps none.
- **L43 (2026-11-05, owner, verbatim):** "lo del enrutar si, lo del umbras podemos
  preguntarlo en el init, para certifiapgo por ahora que siga siendo manual pero se
  pueda cambiar / para lo demas sigamos tu recomendacion", then "arma un lpan para
  el tempalde tu el proyecto actual y actualiza el plan actual". Added "Next steps"
  (Certifipago C1–C5, template T1–T7) and decisions 37 (five questions), 38 (merge
  policy as a setting) and 39 (Codex project-doc budget); `/init` section 7 asks the
  merge policy; PD1 status updated (T11 PR open, design review unblocked).
- **L44 (2026-11-05):** Correction to L43: the watch-video notes template is not
  missing. `templates/video-notes.md` is on master in both skill trees; the video
  agents read the owner's main checkout, 97 commits behind master, because the
  brief pointed there. The step was removed from "Next steps".
- **L45 (2026-11-05, owner, verbatim):** "Recuerda que si hay algo que cambia en
  certifipago, tambei debería implementarlo en el template y viceversa". Added the
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
- **L49 (2026-11-11, owner, verbatim):** "Retoma lo que falta, pero ahora tambien en el
  init preguntar si se desea ODD o SDD como en el repo de certifipago que justo se acaba de
  implmentar y por default dejar sdd y dejar los specs echos. Justo la sesion del arquitecto
  agrego ello. Agregalo y adapta el planm y hasta poedmos actualizar en algunos puntos al
  plan antes que nada y continua. Ademas hay nuevos cambios, entonces hay que ver si todo es
  correctoadoptarlo y corregir todo. Ademas como estamos haciendo ahora con sdd, lo mejor
  seria que todo el plan pasara por este nuevo proceso de sdd para validar el flujo".
  Checked at Certifipago `origin/master` `cda657025` and its open pull requests: SDD
  replaced ODD on 2026-11-10 (`AGENTS.md:66`), chosen by size, with no ODD/SDD setting, so
  the `/init` choice is new design. Added decisions 40–43, steps T1a–T1b, the workflow in
  `/init` section 8 and the configurable list, and parity rows both ways.
- **L50 (2026-11-11):** The PD1 feature document (`odd/tasks/harness-pd1.md`, untracked in
  the Certifipago worktree `harness-pd1`) is gone: the worktree was removed between
  2026-11-05 and 2026-11-11. Its pending list survives in Engram (`odd/harness-pd1/tasks`);
  its verbatim specs S1–S23 are lost, and the pull requests and this plan carry what each
  asked. Decision 40 records the lesson.
- **L51 (2026-11-11, owner, verbatim):** "algoq ue me olvidadad y era que el init debe instalar
  la ultima version de getle ai y cualquier otro conecto o mcp o plugin que se encesite y no
  este vendoreado". Decision 44, `/init` section 8, two configurable rows, step T6 and a
  parity row (pinning Certifipago's MCP servers, the owner's call). Checked first: gentle-ai
  4.3.1 (`go install`), its `install`/`upgrade`/`sync`/`doctor` commands, CodeGraph 1.4.1 (npm),
  and the five MCP servers of Certifipago's `.mcp.json`.
