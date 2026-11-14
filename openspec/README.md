# Spec-Driven Development — how a change is specified, built and recorded

**BINDING.** This document is the operating model for every change to this repository: when a
change needs a spec, which artifacts it leaves, who keeps the living specs true and what checks
them. The `sdd` skill ([.claude/skills/sdd/SKILL.md](../.claude/skills/sdd/SKILL.md)) holds the
procedure that applies it.

A large change leaves a record a reviewer can read in git: the request in the owner's words, the
requirements it adds, changes or removes, the tasks that built it and the checks that proved it.
The living specs document the system in parts a team can review one at a time.

| Folder                            | Holds                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------- |
| `openspec/specs/`                 | The **living specs**: what the system does today, one file per architectural unit |
| `openspec/changes/<date>-<name>/` | One **change** in flight: its proposal, spec deltas, tasks and verify report      |
| `openspec/changes/archive/`       | Every change that finished or was discarded, with its reason                      |
| `openspec/templates/`             | The template of each artifact; copy, never invent a shape                         |
| `openspec/config.yaml`            | The testing capabilities and the artifact paths                                   |

## 1. Size decides the path

**A change is large when it adds, modifies or removes a requirement of a living spec**, or creates
a unit that has no spec yet: a new screen, table, function, port, channel or rule. A large change
runs the whole lifecycle of § 3.

**A change is small when it changes no requirement**: a bug fix that restores what a spec already
states, a copy fix, a refactor that keeps behaviour, tooling, a dependency bump. A small change
has no spec and no change folder; its commit and its pull request are the record.

The test is what the change does to the contract, not how many files it touches. A three-line
change to a retention period is large, because a requirement states the period; a forty-file
rename that keeps behaviour is small. When a fix shows that a living spec states behaviour the
code never had, correcting that requirement is a small change of its own, in its own commit.

## 2. The living specs

### 2.1 One spec per architectural unit

The specs follow the architecture, not features: the code is screen-centric with transversal
services ([docs/architecture/shared.md](../docs/architecture/shared.md)), so a feature has no
folder of its own to mirror. **The path of a spec mirrors the code it governs**, and a
requirement lives in the spec of the unit that enforces it. A change's spec deltas therefore land
where its diff lands. A flow that crosses units, such as sign-in to a guarded route, is several
requirements in several specs, each linking to its neighbour by ID.

| Spec | ID prefix | Governs |
| ---- | --------- | ------- |

No living spec exists yet: each one adds its row here when it is written.

Not specified: the agent harness and the validation gates, whose rules
[docs/code-standards.md](../docs/code-standards.md) § 21 maps one by one to the check that backs
each.

### 2.2 What a spec holds

The template is [templates/spec.md](templates/spec.md). Each requirement:

- has a stable ID with the spec's prefix (`CORE-03`), never reused once removed;
- states one observable behaviour with **SHALL**;
- cites its **evidence**: a backticked `path:line`, a migration, a policy or an ADR;
- has one or more **scenarios** in GIVEN / WHEN / THEN, each naming the **test** that proves it,
  or saying `Not covered` and why. A scenario is the acceptance criterion; the test is its proof.

A living spec is written from the code, never from intent. Behaviour the code shows and no
document records is written as observed. A contradiction between a document and the code is an
**open question** at the end of the spec, with both citations, for the owner to decide; the spec
does not resolve it.

## 3. The lifecycle of a large change

The phases run in one context, the main session, never as one subagent per phase.

| #   | Phase       | Artifact                                       | Done when                                                                                                                         |
| --- | ----------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Explore** | none                                           | the living specs of every unit the request touches are read, and the code behind them                                             |
| 2   | **Propose** | `proposal.md`                                  | why (the owner's words, verbatim, dated and in English), what changes, what is out of scope, the specs it affects                 |
| 3   | **Specify** | `specs/<spec path>/spec.md`                    | each added, modified or removed requirement is written as a delta, with its scenarios                                             |
| 4   | **Design**  | `design.md`, only for an architecture decision | the decision, its options and the reason; a decision that outlives the change is an ADR in `docs/decisions/` instead              |
| 5   | **Plan**    | `tasks.md`                                     | every task names the requirements it satisfies                                                                                    |
| —   | **Review**  | the first commit of the pull request           | the owner read the proposal and the deltas and said yes; nothing is built before                                                  |
| 6   | **Apply**   | code and tests                                 | each task is built test first: the scenario's test is seen red, then green; its commit is recorded in `tasks.md`                  |
| 7   | **Verify**  | `verify-report.md`                             | every scenario of the deltas maps to a test that ran green, and `pnpm validate` exits 0                                           |
| 8   | **Archive** | the last commit of the pull request            | the deltas are merged into `openspec/specs/` and the folder moves to `changes/archive/`                                           |

The living specs on `main` always describe the code on `main`: a change archives in its own pull
request, before the merge, so no merged change is left open.

**Nothing stays half done.** A change that will not be finished is discarded: its proposal
records `Status: discarded` with the reason, and the folder moves to the archive with no delta
merged.

**A finished change is archived, never deleted.** The archived proposal, tasks and verify report
are the record of a change that change-management controls ask for, SOC 2 CC8.1 and ISO/IEC
27001:2022 control 8.32, so the folder moves to `openspec/changes/archive/<date>-<name>/` and
stays.

### 3.1 How a delta is written

A delta file sits at the same path the living spec has, under the change's `specs/`, and holds
up to three sections ([templates/spec-delta.md](templates/spec-delta.md)):

- `## ADDED Requirements` — new requirements, with new IDs;
- `## MODIFIED Requirements` — the whole requirement as it will read, under its existing ID;
- `## REMOVED Requirements` — the ID and the reason.

Archiving applies them: added ones are appended, modified ones replace their namesake, removed
ones are deleted and their ID is never reused.

## 4. Who keeps it current

| Who                                    | Owns                                                                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The owner**                          | Asks for the change, approves its proposal and deltas in the first commit, decides every open question, merges the pull request                         |
| **The session that builds the change** | Sizes it, writes the change folder, builds it test first, verifies, archives; a small change that contradicts a spec stops and is resized               |
| **The `sdd` skill's `sync` mode**      | On request: re-checks one living spec, every requirement against its evidence, and reports the drift. The nine `sdd` evals state what each mode must do |
| **`verify:specs`**                     | The shape of every spec and change, and that every cited test exists and holds its quoted title (§ 5)                                                   |
| **`report:spec-drift`**                | Lists, in every `pnpm validate`, each living spec whose governed code changed after the commit on its `Verified against the code` line (§ 4.1)          |
| **The pull request review**            | Reads the spec commit first; judges that the deltas say what the code does, and that every path a spec cites exists                                     |

### 4.1 Keeping the specs from drifting

A spec drifts when its code changes and its words do not. Two checks cover it, one deterministic
and one by an agent:

- **Which specs may have drifted** is deterministic. Each spec names the paths it governs and the
  commit it was last verified at. `pnpm report:spec-drift` lists every spec with a file under those
  paths that differs from that commit, committed or not, and runs inside every `pnpm validate`.
  It never blocks: most pull requests touch governed code without changing what a spec states, so
  a blocking gate would stop work that broke no requirement.
- **Whether a spec is still true** takes an agent. `sync <spec>`, the `sdd` skill's mode, re-reads
  every requirement against its evidence, rewrites what the code no longer does, and moves the
  spec's `Verified against the code` line to the current commit, which takes it off the report.

**The cadence.** A large change re-verifies the specs it touches when it archives, so it never
leaves one stale. Every other stale spec, left by small changes, is re-verified before each
release: run `pnpm report:spec-drift` and `sync` every spec it lists, so no release ships on a
spec its code has moved past. The session that makes a small change may sync the spec it touched
in the same pull request, and does when the change touches a requirement's evidence.

**Still uncovered.** A stale spec may still be true, and a fresh one may have been wrong from the
start; no gate reads whether a sentence says what the code does. That stays with `sync` and with
the pull request review.

## 5. What enforces each rule

| Rule                                                                                                                                                                | Backed by                                                   | Not covered                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------- |
| A spec and a change have the template's shape: governed paths, unique prefixed IDs, SHALL, scenarios with GIVEN / WHEN / THEN, a test or `Not covered` per scenario | `verify:specs`                                              | whether the words are true                                          |
| A scenario's test exists, and its title is in that file                                                                                                             | `verify:specs`                                              | whether the test asserts what the scenario says                     |
| An open change has its proposal and tasks; a modified or removed ID exists in the living spec; a change with every task done has its verify report                  | `verify:specs`                                              | whether the owner approved it                                       |
| Every backticked path a spec cites exists, and every `path:line` names a line the file has                                                                          | the pull request review; no gate reads the prose yet        | a path that moves after the review                                  |
| The templates and the gate agree: each template, filled in, is accepted, and with a structural element removed is refused                                           | `verify:specs:test` (the template cases)                    | the verify report and design templates, whose content no gate reads |
| A spec whose governed code changed after its verified commit is listed                                                                                              | `report:spec-drift`, inside `pnpm validate`, never blocking | whether that spec is wrong, or a fresh one right: `sync`            |
| A change that alters a requirement goes through this lifecycle, and a merged change is archived                                                                     | review, and `sync`                                          | no gate can see whether a diff changed a contract                   |

## 6. Asking for something new

1. Ask in your own words. The session quotes them in the proposal, in English; a request
   written in another language is translated faithfully and marked with the language it came
   from, as in `2026-01-01 (translated from Spanish)`.
2. The session sizes the request against § 1 and says which path it takes.
3. For a large change you receive a pull request whose first commit is the proposal and the spec
   deltas. Read those; say yes, or say what to change.
4. The session builds it, task by task, test first, and adds the verify report.
5. The last commit archives the change and updates the living specs. You merge.

The `sdd` skill runs one mode at a time: `propose`, `apply`, `sync <spec>` or
`discard <change>`.
