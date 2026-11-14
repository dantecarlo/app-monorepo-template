---
name: sdd
description: >-
  USE WHEN: "new feature", "I want the app to…", "run this as SDD", "write the spec of X",
  "update the living spec", "archive the change", "drop this change". Sizes a request, then
  runs a large one through proposal, spec deltas, tasks, a test-first build, a verify report
  and an archive into the living specs, or writes and validates one living spec from the code.
  DO NOT USE: scaffolding the files of a slice (use `feature`), or the project status (use
  `general-plan`).
---

# SDD — a large change from the owner's words to the living specs

The rules live in [openspec/README.md](../../../openspec/README.md): the size rule (§ 1), the
spec format (§ 2.2), the lifecycle (§ 3), who owns what (§ 4) and what checks it (§ 5). This
skill is the procedure that applies them, one mode at a time. Without it a large change leaves
no record a reviewer can read, and a living spec drifts from the code with nothing to notice.

Every phase runs in this one context, the main session. Never spawn one agent per phase.

## Step 0 — Size the request

Read the living specs of every unit the request touches (`openspec/specs/`, the table in the
README § 2.1) and the code behind them.

- The request adds, modifies or removes a requirement, or creates a unit with no spec → **large**:
  run `propose`.
- It changes no requirement (a fix that restores stated behaviour, copy, a refactor, tooling) →
  **small**: say so in one line, build it test first (the failing test, then the fix), and leave
  no change folder.
- The fix shows a requirement states behaviour the code never had → **small** too: correct that
  requirement in a commit of its own, with its evidence (`openspec/README.md` § 1).

## Mode `propose`

1. Pick the folder `openspec/changes/<YYYY-MM-DD>-<kebab-name>/`, dated today.
2. Copy `openspec/templates/proposal.md` to `proposal.md`. Quote the owner's request verbatim
   and dated under `## Why`, in English: a request written in another language is translated
   faithfully and completely, and its date is marked `(translated from <language>)`. List each
   affected living spec and the IDs it gains, changes or loses under `## Affected specs`. Keep
   `> **Status:** open`.
3. For each affected spec, copy `openspec/templates/spec-delta.md` to
   `specs/<spec path>/spec.md` (the same path the living spec has under `openspec/specs/`). Write
   only the sections the change needs. An added ID takes the next free number of that spec; a
   modified requirement is written whole, under its existing ID. Every scenario names the test
   that will prove it, by the path and title it will have.
4. Only when the change makes an architecture decision, copy `openspec/templates/design.md`; a
   decision that outlives the change is an ADR in `docs/decisions/` instead.
5. Copy `openspec/templates/tasks.md` to `tasks.md`: one line per task, each naming the
   requirement IDs it satisfies.
6. Run `pnpm verify:specs`; it exits 0. Open every backticked path the folder cites and confirm
   it exists: no gate reads the prose.
7. Commit the folder as ONE commit, `docs(openspec): propose <change>`. It is the first commit of
   the pull request. **Stop** and hand it to the owner: nothing is built before the owner
   approves it.

## Mode `apply`

1. Re-read the approved change folder and the living specs it touches.
2. Per task, in order: write the scenario's test and run it red; write the code until it is
   green; run the package's suite; commit; write the commit's short sha into the task line and
   tick it. The code is built through the skill that owns its shape: a new block through
   `component`, `screen`, `service`, `store` or `feature`, a change to an existing one through
   `modify`. This skill decides what is built; those decide how.
3. Copy `openspec/templates/verify-report.md` to `verify-report.md`: one row per scenario of the
   deltas, with its test and the result you observed. Run `pnpm validate`
   (`ATL_TEMPLATE_SELF=1 pnpm validate` in the template itself); record its exit code.
4. **Archive**, as the last commit of the pull request: apply each delta to its living spec
   (append ADDED, replace MODIFIED, delete REMOVED; never reuse a removed ID), fill the evidence
   lines with the code's `path:line`, set the spec's `Verified against the code` line to today
   and the sha, mark the proposal `> **Status:** archived — <date>`, and move the folder with
   `git mv openspec/changes/<date>-<name> openspec/changes/archive/<date>-<name>`, creating
   `openspec/changes/archive/` first when it is absent: `git mv` into a folder that does not
   exist renames the change folder to `archive` and loses its name. Confirm the moved folder
   exists under its own name.
5. Run `pnpm verify:specs`; it exits 0.

## Mode `sync <spec>`

Run it on a spec `pnpm report:spec-drift` lists (its governed code changed after its verified
commit), on every listed spec before a release, and whenever asked (`openspec/README.md` § 4.1).

1. Read `openspec/templates/spec.md`, and a living spec of the same layer when one exists. For a
   listed spec, start from the files the report names: they are what changed.
2. Read the code the spec governs. Write each requirement from what the code does, citing the
   `path:line` that enforces it; a document that disagrees is an open question, never a
   requirement.
3. Every scenario names its test with the title copied byte for byte (`rg -F -- '<title>' <file>`
   finds it), or says `Not covered —` and why.
4. Re-open the evidence of every requirement and confirm it; count what you checked and fix what
   was wrong.
5. Name a neighbour spec in plain text (packages/core), never in backticks: backticks mean a
   repository path, which must exist.
6. Set the spec's `> **Verified against the code:**` line to today and the short sha of `HEAD`;
   `pnpm report:spec-drift` then stops listing it.
7. Run `pnpm verify:specs` and `pnpm report:spec-drift`; commit the spec as one commit.

## Mode `discard <change>`

Only on the owner's word. Write `> **Status:** discarded — <date>, <reason>` in the proposal,
merge no delta, and move the folder the way `apply` step 4 does (to
`openspec/changes/archive/<date>-<name>`, the archive folder created first). Run
`pnpm verify:specs`; it exits 0. Commit with the reason in the message.

## DO and DON'T

Each row is a mistake that writing living specs from the code has produced.

| DO                                                                           | DON'T                                                                                         |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Copy a test title byte for byte and find it with `rg -F`                     | Paraphrase a title, or invent one for a scenario nothing tests: write `Not covered —` and why |
| Name a neighbour spec in plain text (packages/core)                          | Put a spec name in backticks: it reads as a repository path that does not exist               |
| Write the requirement from the line of code that enforces it                 | Write it from a document, a comment or a slice the code contradicts: that is an open question |
| Judge a database object by the last migration that defines it                | Cite an earlier body a later `create or replace` superseded                                   |
| Give an added requirement the next free ID of its spec                       | Reuse the ID of a removed requirement                                                         |
| Open the cited test and check it asserts the THEN                            | Cite a test only because its title matches; a mocked module proves nothing about native code  |
| Quote the owner in English, translated faithfully and marked when translated | Paraphrase the request, or quote it in another language                                       |

## CONTRACT

```yaml
# skill: sdd — the files each mode leaves. No generator: every artifact is a copy of
# openspec/templates/, filled in.
emits:
  propose:
    - openspec/changes/{date}-{name}/proposal.md
    - openspec/changes/{date}-{name}/specs/{spec path}/spec.md # one per affected living spec
    - openspec/changes/{date}-{name}/design.md # only for an architecture decision
    - openspec/changes/{date}-{name}/tasks.md
  apply:
    - openspec/changes/{date}-{name}/verify-report.md
    - openspec/specs/{spec path}/spec.md # the deltas, merged at archive
    - openspec/changes/archive/{date}-{name}/ # the folder, moved at archive
  sync:
    - openspec/specs/{spec path}/spec.md
  discard:
    - openspec/changes/archive/{date}-{name}/ # moved, Status: discarded
edits:
  apply:
    - the code and tests each task names
    - openspec/changes/{date}-{name}/tasks.md # the sha of each done task
validated_by: verify:specs
done_when: pnpm validate green, and for propose the owner's yes on the first commit
```

## Output

Every mode replies with the same six lines, then stops:

```text
Mode: <propose | apply | sync | discard> — <change folder or spec path>
Commits: <short sha> <subject>, one per line
Requirements: <IDs added, modified or removed, or written in sync>
Not covered: <scenarios with no test, and why> · Open questions: <Q-numbers, one line each>
Gates: <command>: exit <code>, one per gate run (verify:specs, and pnpm validate in apply)
Next: <the owner reviews the propose commit | push the branch | answer Qn>
```

The artifacts themselves follow `openspec/templates/`: `proposal.md`, `spec.md`,
`spec-delta.md`, `design.md`, `tasks.md` and `verify-report.md`.
