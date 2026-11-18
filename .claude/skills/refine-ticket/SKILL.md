---
name: refine-ticket
description: >
  The architect role of the ticket flow: refines a ticket into its specs and a technical plan
  (areas, subtasks, reserved files, dependencies), sequences tickets that reserve the same file,
  moves a ticket to Ready for dev only when it carries a target version and every dependency is
  Done, confirms its target version or proposes one through the PO, dispatches every ready state
  to the next session,
  sets the merge order, keeps the merge queue and merges one pull request at a time, on the
  owner's word or under the `low-risk` merge policy, closes tickets, files technical tickets,
  and groups the Done tickets of one version into a release ticket for the CI/CD session, or a
  hotfix at Ready to merge into the production branch the layer names into a release ticket of
  its own.
  USE WHEN: "<id> new", "<id> ready for QA, branch <b>", "<id> changes requested",
  "<id> ready to merge, PR #<n>", "<id> merged", "<id> ready to merge, hotfix", "<id> question"
  about the plan, "<id> version set", "merge <id>", "what waits to merge",
  "<release-id> staging checked",
  "<release-id> released", "<release-id> <target> failed", "group a release", "file a technical
  ticket", an architect session of the ticket flow starts work.
  DO NOT USE: writing a ticket from a client's request (use `po-ticket`), building it (use
  `dev-ticket`), or running a deploy (use `release-ticket`).
---

# Refine ticket — the architect: specs, plan, reservations, the merge queue and every dispatch

Read `ticket-flow` first (`.claude/skills/ticket-flow/SKILL.md`), its pre-flight included: this
procedure uses its board operations, states, messages and rules and never restates them.

---

## Step 1 — Take the ticket

On `<id> new`: `read` it and `move` it to Refinement. A requirement that is unclear or not quoted
verbatim → `comment` the question, message the PO `<id> question`, and wait for the answer on the
ticket.

**The target version.** `read version` and confirm it against the plan.

- **None** (under the GitHub Issues adapter, an issue with no milestone) → a stop: every ticket
  carries one, so it stays in Refinement. Propose a version on the ticket (`comment`), message
  the PO `<id> version change`, and wait for `<id> version set`.
- **One the plan cannot meet** → a move of a commitment: propose the new version on the ticket
  (`comment`), message the PO `<id> version change`, and wait for `<id> version set`.

Never run `set version` yourself: the PO does, for every ticket.

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
Does it carry a target version (`read version`)?
├── NO  → it stays in Refinement: Step 1, the target version
└── YES → does a ticket in flight (Ready for dev to Ready to merge) reserve a file this one
          reserves?
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
  (dependencies first) and `comment` it on each one: "merge order: 2, after #120". The merge
  queue follows it.
- `<id> ready to merge, PR #<n>` from QA → § Merge queue.
- Once it is merged (§ Merge queue), or on `<id> merged` from the CI/CD session for a hotfix →
  message the ticket's QA and dev sessions `<id> merged`; with no deploy target in the project
  layer, `move` it to Closed and message the PO `<id> closed`; otherwise it waits for its
  release (§ Group a release).
- `<id> ready to merge, hotfix` from QA → the hotfix stays out of the merge queue and waits,
  unmerged, for a release ticket of its own (§ Group a release).

---

## Step 7 — Technical tickets

Work asked of this session directly, or found in passing, gets a ticket first: `create` one of
type `tech` (or `fix` or `chore`) whose Requirement quotes the asker, or states the finding with
its evidence. It gets a target version like any other ticket: propose one on it (`comment`) and
message the PO `<id> version change`. Then take it from Step 1, where it waits for
`<id> version set`.

---

## Merge queue

The architect keeps one merge queue for the default branch and merges from it, one pull request
at a time, under the merge policy the project layer records (`ticket-flow` rule 4): `manual`,
the default, or `low-risk`. The owner approves each merge here, in this session, so one place
shows what waits to merge; QA asks the owner nothing and merges nothing. A hotfix never enters
it (§ Group a release).

1. **Queue it.** On `<id> ready to merge, PR #<n>`: `read` the ticket and confirm it is at
   Ready to merge into the default branch, with the link to its evidence. The queue is every such
   ticket, in the merge order (Step 6), and the architect shows it whenever it asks the owner:

   ```text
   Merge queue
   1. <id> — PR #<n> — <evidence link> — <Risk line> — current with <base>, CI green
   2. <id> — PR #<n> — <evidence link> — <Risk line> — to be brought current
   ```

2. **The head only.** Only the pull request at the head of the queue is asked for or merged, and
   only while every condition of `ticket-flow` § Ready to merge holds (CI green, no conflict, its
   branch holding the default branch's current tip) and the project layer's merge gate, when it
   names one, passes. One fails → message its QA `<id> bring current`, and wait for
   `<id> ready to merge, PR #<n>` again, or for `<id> changes requested` (Step 6).
3. **Ask, or merge under `low-risk`.**

   ```
   Which merge policy does the project layer record?
   ├── `manual`, the default, or none → ask the owner.
   └── `low-risk` → does the pull request meet every condition?
         1. it is at the head of the queue and step 2 holds; a pull request into the
            production branch never is;
         2. its body's Risk line is `Risk: none`, or its diff changes only passive files
            (`ticket-flow` rule 4);
         3. its merge sets off no irreversible step: no deploy, no production migration, no
            store submission, nothing that cannot be undone.
       ├── YES, all three → merge it without asking (step 4).
       └── NO to one, no Risk line, or unsure → ask the owner, as under `manual`.
   ```

   To ask, show the queue and say in this session: "`<id>` is ready to merge: PR #<n>, evidence
   `<link>`, CI green, current with `<base>`. Merge it?" Wait for the owner's word here; a relay
   from another session does not count. When another merge lands before the answer, go back to
   step 2.
4. **Merge.**
   - **Yes, or every `low-risk` condition met** → merge it with the project layer's merge
     method. After a `low-risk` merge, `comment` the ticket: "Merged under the `low-risk` merge
     policy. Risk line: `<the pull request's Risk line>`; it qualified by <`Risk: none` | only
     passive files>." `move` the ticket to Done, and message its QA and dev sessions
     `<id> merged` (Step 6).
   - **No** → `comment` the owner's answer; the ticket stays in the queue.
5. **The next one.** A merge moves the default branch's tip, so the next pull request in the
   queue is behind it: message its QA `<id> bring current`, and take it from step 2 once QA
   answers.

---

## Group a release

When the Done tickets that should ship together are ready, or on `<id> ready to merge, hotfix`,
and the project layer declares deploy targets, group them as below. A hotfix gets a release
ticket of its own and stays at Ready to merge in it, out of the merge queue: the CI/CD session
merges it into the production branch the layer names as that release's deploy step
(`release-ticket` § Hotfix).

1. `create` a release ticket from `.claude/skills/ticket-flow/release.template.md`, type
   `release`, in Refinement, for one version V: `read version` lists every ticket whose target
   version is V, and the release ticket lists them all, with the version per target, the
   migrations, each backward compatible (`release-ticket` § Migrations), the changelog and the
   rollback per target.
2. Message the QA session of each area the batch touches `<release-id> check on staging`, and
   wait for every `<release-id> staging checked` and its evidence on the release ticket. A failed
   check becomes a fix ticket the release then lists, or its feature is switched off by its flag.
3. Move it to Ready for prod only when every ticket whose target version is V is Done, except a
   hotfix, which is at Ready to merge into the production branch the layer names with every
   Ready to merge condition met against that branch's current tip (`ticket-flow` § Ready to
   merge); the default branch's CI is green; and every touched area's staging evidence is on the release ticket: `move`, then
   message the CI/CD session `<release-id> ready for prod`. A hotfix behind that tip, because
   another release merged since → message its QA `<id> bring current`, and wait for
   `<id> ready to merge, hotfix` again.
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
merge_policies: [manual, low-risk] # manual, the default, when the layer records none
moves:
  - Backlog → Refinement
  - Refinement → Ready for dev
  - Ready to merge → Done # from the merge queue, on the owner's word or under low-risk
  - Done → Closed
  - Refinement → Ready for prod # a release ticket
  - Released → Closed
messages: ['<id> ready for dev', '<id> ready for QA, branch <b>', '<id> changes requested',
  '<id> bring current', '<id> merged', '<id> closed', '<id> question', '<id> version change',
  '<release-id> check on staging', '<release-id> ready for prod', '<release-id> released']
emits:
  - openspec/changes/{date}-{name}/ # through sdd, when the ticket changes a living spec
  - a ticket comment for each low-risk merge, with the Risk line it relied on
validated_by: verify:specs
done_when: >-
  the ticket is in Ready for dev with its plan, or merged from the merge queue and Done, or a
  release is in Ready for prod
```

---

## Output

The reply block of `ticket-flow` § Output, once per ticket moved or dispatched.
