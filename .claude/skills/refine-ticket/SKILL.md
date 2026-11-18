---
name: refine-ticket
description: >
  The architect role of the ticket flow: refines a ticket into its specs and a technical plan
  (areas, subtasks, reserved files, dependencies), sequences tickets that reserve the same file,
  moves a ticket to Ready for dev only when every dependency is Done, confirms its target
  version or proposes a move through the PO, dispatches every ready state to the next session,
  sets the merge order, closes tickets, files technical tickets, and groups the Done tickets of
  one version into a release ticket for the CI/CD session, or a hotfix at Ready to merge into
  `production` into a release ticket of its own.
  USE WHEN: "<id> new", "<id> ready for QA, branch <b>", "<id> changes requested", "<id> merged",
  "<id> ready to merge, hotfix", "<id> question" about the plan, "<release-id> staging checked",
  "<release-id> released", "<release-id> <target> failed", "group a release", "file a technical
  ticket", an architect session of the ticket flow starts work.
  DO NOT USE: writing a ticket from a client's request (use `po-ticket`), building it (use
  `dev-ticket`), or running a deploy (use `release-ticket`).
---

# Refine ticket — the architect: specs, plan, reservations and every dispatch

Read `ticket-flow` first (`.claude/skills/ticket-flow/SKILL.md`), its pre-flight included: this
procedure uses its board operations, states, messages and rules and never restates them.

---

## Step 1 — Take the ticket

On `<id> new`: `read` it and `move` it to Refinement. A requirement that is unclear or not quoted
verbatim → `comment` the question, message the PO `<id> question`, and wait for the answer on the
ticket.

**The target version.** `read version` and confirm it against the plan. A version the plan
cannot meet is a move of a commitment: propose the new version on the ticket (`comment`),
message the PO `<id> version change`, and wait for `<id> version set`; never run `set version`
yourself.

---

## Step 2 — Specs

Write the specs through the project's spec mechanism: in this template, `sdd` `propose` when the
ticket adds or changes a requirement of a living spec. The owner approves the proposal in this
session when the mechanism requires it. Put the link to the change folder in the ticket's Spec
section (`comment`); never copy the spec into the ticket.

---

## Step 3 — Technical plan

Write the plan into the ticket (`comment`): the areas, the subtasks per area, the files each
subtask reserves, the tickets it depends on, and the test plan (unit tests and the end-to-end
flows by id). A plan that spans several areas becomes one ticket per area (`create`), linked by
their dependencies.

---

## Step 4 — Reservations and dependencies

```
Does a ticket in flight (Ready for dev to Ready to merge) reserve a file this one reserves?
├── YES → this ticket depends on that one, or re-plan one of them; comment it on both
└── NO  → is every ticket this one depends on Done?
    ├── YES → Step 5
    └── NO  → it stays in Refinement; comment the dependency, and recheck on `<dep> merged`
```

---

## Step 5 — Dispatch to dev

`move` the ticket to Ready for dev, and message the area's dev session `<id> ready for dev`.

---

## Step 6 — Dispatch every later state

- `<id> ready for QA, branch <b>` from dev → the same line to the area's QA session.
- `<id> changes requested` from QA → the same line to the dev session.
- **Merge order**: once two tickets may reach Ready to merge together, set their order
  (dependencies first) and `comment` it on each one: "merge order: 2, after #120".
- `<id> merged` → with no deploy target in the project layer, `move` it to Closed and message the
  PO `<id> closed`; otherwise it waits for its release (§ Group a release).
- `<id> ready to merge, hotfix` from QA → the hotfix waits, unmerged, for a release ticket of its
  own (§ Group a release).

---

## Step 7 — Technical tickets

Work asked of this session directly, or found in passing, gets a ticket first: `create` one of
type `tech` (or `fix` or `chore`) whose Requirement quotes the asker, or states the finding with
its evidence, then take it from Step 1.

---

## Group a release

When the Done tickets that should ship together are ready, or on `<id> ready to merge, hotfix`,
and the project layer declares deploy targets, group them as below. A hotfix gets a release
ticket of its own and stays at Ready to merge in it: the CI/CD session merges it into
`production` as that release's deploy step (`release-ticket` § Hotfix).

1. `create` a release ticket from `.claude/skills/ticket-flow/release.template.md`, type
   `release`, in Refinement, for one version V: `read version` lists every ticket whose target
   version is V, and the release ticket lists them all, with the version per target, the
   migrations, each backward compatible (`release-ticket` § Migrations), the changelog and the
   rollback per target.
2. Message the QA session of each area the batch touches `<release-id> check on staging`, and
   wait for every `<release-id> staging checked` and its evidence on the release ticket. A failed
   check becomes a fix ticket the release then lists, or its feature is switched off by its flag.
3. Move it to Ready for prod only when every ticket whose target version is V is Done, except a
   hotfix, which is at Ready to merge into `production` with every Ready to merge condition met
   against `production`'s current tip (`ticket-flow` § Ready to merge); the default branch's CI
   is green; and every touched area's staging evidence is on the release ticket: `move`, then
   message the CI/CD session `<release-id> ready for prod`.
4. When the CI/CD session flags a merged ticket aimed at a later version: name, on the release
   ticket, the feature flag it sits behind, or propose its move to V through the PO (Step 1,
   the target version).
5. On `<release-id> <target> failed`: `read` the comment, plan the fix as a ticket, and the
   release waits in Refinement until step 3 holds again.
6. On `<release-id> released`: `move` every ticket it lists, and the release ticket, to Closed,
   and message the PO `<release-id> released`.

---

## CONTRACT

```yaml
# skill: refine-ticket — the architect role; the board operations come from ticket-flow.
reads:
  - .claude/skills/ticket-flow/SKILL.md
  - .claude/skills/ticket-flow/release.template.md
board_operations: [create, read, move, comment, link, read version]
moves:
  - Backlog → Refinement
  - Refinement → Ready for dev
  - Done → Closed
  - Refinement → Ready for prod # a release ticket
  - Released → Closed
messages: ['<id> ready for dev', '<id> ready for QA, branch <b>', '<id> changes requested',
  '<id> closed', '<id> question', '<id> version change', '<release-id> check on staging',
  '<release-id> ready for prod', '<release-id> released']
emits:
  - openspec/changes/{date}-{name}/ # through sdd, when the ticket changes a living spec
validated_by: verify:specs
done_when: the ticket is in Ready for dev with its plan, or a release is in Ready for prod
```

---

## Output

The reply block of `ticket-flow` § Output, once per ticket moved or dispatched.
