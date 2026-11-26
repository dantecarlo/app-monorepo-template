---
name: refine-ticket
description: >
  The architect role of the ticket flow: refines a ticket into specs and a plan, dispatches it
  to dev once it has a target version and nothing blocks it, dispatches each later state, keeps
  the merge queue and its branches current, closes, drops and files tickets, records each closed
  or dropped ticket in the plan's catalog in its own pull request, and groups Done tickets or a
  hotfix into a release.
  USE WHEN: "<id> new", "<id> ready for QA, branch <b>", "<id> changes requested",
  "<id> ready to merge, PR #<n>", "<id> ready to merge, hotfix", "<id> merged",
  "<id> dropped", "<id> question" about the plan, "<id> version set", "merge <id>", "what waits
  to merge", "<release-id> staging checked", "<release-id> released",
  "<release-id> <target> failed", "group a release", "record the closed tickets", "file a
  technical ticket", an architect session of the ticket flow starts work.
  DO NOT USE: writing a ticket from a client's request (use `po-ticket`), building it (use
  `dev-ticket`), or a deploy (use `release-ticket`).
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
        └── NO  → it stays in Refinement; comment the dependency, and recheck on `<dep> merged`,
                  or once `<dep>` is dropped (§ Drop a ticket)
```

---

## Step 5 — Dispatch to dev

`move` the ticket to Ready for dev, and message the area's dev session `<id> ready for dev`.

---

## Step 6 — Dispatch every later state

- `<id> ready for QA, branch <b>` from dev → the same line to the area's QA session.
- `<id> changes requested` from QA → the same line to the dev session. A conflict or a red check
  met while bringing a pull request current (§ Merge queue, step 6) goes to the dev session
  straight from here.
- **Merge order**: once two tickets may reach Ready to merge together, set their order
  (dependencies first) and `comment` it on each one: "merge order: 2, after #120". The merge
  queue follows it.
- `<id> ready to merge, PR #<n>` from QA → § Merge queue.
- Once it is merged (§ Merge queue), or on `<id> merged` from the CI/CD session for a hotfix →
  message the ticket's QA and dev sessions `<id> merged`; with no deploy target in the project
  layer, `move` it to Closed, message the PO `<id> closed`, and record it (§ Record the closed
  tickets); otherwise it waits for its release (§ Group a release).
- `<id> ready to merge, hotfix` from QA → the hotfix stays out of the merge queue and waits,
  unmerged, for a release ticket of its own (§ Group a release).
- `<id> dropped` from the PO → § Drop a ticket.

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
at a time, under the merge policy of `.agents/harness.config.json` (`ticket-flow` rule 4): `manual`,
the default, or `low-risk`. The owner approves each merge here, in this session, so one place
shows what waits to merge; QA asks the owner nothing and merges nothing. QA brings a ticket's pull
request current once, before Ready to merge; every later bring-current is the architect's
(step 6), so QA and the dev session stay free. A hotfix never enters the queue
(§ Group a release); the architect's own closed ticket catalog pull request does (step 1).

1. **Queue it.** On `<id> ready to merge, PR #<n>`: `read` the ticket and confirm it is at
   Ready to merge into the default branch, with the link to its evidence. The queue is every such
   ticket, in the merge order (Step 6), and the architect shows it whenever it asks the owner:

   ```text
   Merge queue
   1. <id> — PR #<n> — <evidence link> — <Risk line> — current with <base>, CI green
   2. <id> — PR #<n> — <evidence link> — <Risk line> — to be brought current
   3. <release-id> catalog — PR #<n> — <board check link> — every row matches the board — current with <base>, CI green
   ```

   **The closed ticket catalog pull request.** The pull request § Record the closed tickets opens
   joins the queue at once, in the merge order, under the same merge policy as a ticket's; no
   message announces it, since this session both opens and merges it. It carries no ticket of its
   own and no QA holds it, so the architect brings it current itself: it merges the default
   branch into the catalog branch, never a rebase, keeps every row of both sides when the table
   conflicts, pushes unforced, lets its CI run again and checks it against the board again
   (step 3). Its merge moves no ticket.

2. **The head only.** Only the pull request at the head of the queue is asked for or merged, and
   only while the project layer's merge gate, when it names one, passes and every condition of
   `ticket-flow` § Ready to merge holds (CI green, no conflict, its branch holding the default
   branch's current tip). A ticket's pull request that fails one → bring it current yourself
   (step 6), and take it from this step again once its gate passes. The closed ticket catalog
   pull request that fails one → bring it current yourself (step 1), then take it from this step
   again; one that fails the merge gate → tell the owner here; it waits in the queue.
3. **Ask, or merge under `low-risk`.** The closed ticket catalog pull request is asked for, or
   merged under `low-risk`, only once its board check passes. No QA session checks it: the
   architect checks it here, through the project layer's adapter (`ticket-flow` § Board
   operations):

   - **Read each ticket.** `read` and `read version`, on the board, every ticket the pull
     request's branch adds a row of § Closed Ticket Catalog for.
   - **Check each row.** A row the pull request adds passes only when it
     matches its board page in id, title, target version and closing pull request, the
     closing pull request being the one the ticket links. A row of the dropped tickets passes
     only when it matches its board page in id, title and target version, and its drop record
     in reason and superseding ticket.
   - **Comment the result** on the pull request, one line per row:

     ```text
     Board check of PR #<n>
     - <id> — <title> — <target version> — PR #<m> — match
     - <id> — <title> — <target version> — PR #<m> — mismatch: <field>, the board says <value>
     - <id> — <title> — <target version> — dropped, superseded by <id> | none — match
     ```

   - **Every row matches** → go on below, naming that comment when you ask the owner. **A
     mismatch** → rewrite that row from its board page on the catalog branch, push it unforced,
     and check it again from the first row; nothing goes to the PO, and the owner is asked
     nothing until every row matches.

   Read `delivery.mergePolicy` of `.agents/harness.config.json` before every merge, from
   the default branch's copy, never from the pull request's own branch, which could otherwise
   change its own policy. It fails closed: a missing setting, any
   value other than `low-risk`, a missing file, or a file that does not parse means `manual`.

   For a ticket's pull request, and for the closed ticket catalog pull request once its board
   check passes:

   ```
   Which merge policy does `.agents/harness.config.json` record, in `delivery.mergePolicy`?
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
   `<link>`, CI green, current with `<base>`. Merge it?"; for the closed ticket catalog pull
   request, "The closed ticket catalog of `<release-id>` (or `<id>`) is ready to merge: PR #<n>,
   every row matches the board, check `<link>`, CI green, current with `<base>`. Merge it?"
   Wait for the owner's word here; a relay from any other session does not count. When another
   merge lands before the answer, go back to step 2.
4. **Merge.**
   - **Yes, or every `low-risk` condition met, for the closed ticket catalog pull request** →
     merge it with the project layer's merge method. After a `low-risk` merge, `comment` the
     ticket or release ticket it records: "Catalog PR #<n> merged under the `low-risk` merge
     policy; it qualified by only passive files." It moves no ticket and sends no `<id> merged`.
     When the host refuses the merge, tell the owner here; it waits in the queue.
   - **Yes, or every `low-risk` condition met** → merge it with the project layer's merge
     method. After a `low-risk` merge, `comment` the ticket: "Merged under the `low-risk` merge
     policy. Risk line: `<the pull request's Risk line>`; it qualified by <`Risk: none` | only
     passive files>." `move` the ticket to Done, and message its QA and dev sessions
     `<id> merged` (Step 6).
   - **No** → `comment` the owner's answer on the ticket, or, for the closed ticket catalog pull
     request, on the ticket or release ticket that links it; it stays in the queue.
5. **The next one.** A merge moves the default branch's tip, so the next pull request in the
   queue is behind it: bring it current yourself (step 6), or as step 1 says when it is the
   closed ticket catalog pull request, and take it from step 2 once its gate passes.
6. **Bring it current.** Every bring-current of a ticket's pull request after QA's is the
   architect's, from a spare worktree of its own, never QA's or the dev's: theirs hold their own
   work, and QA removed its own when it handed the ticket over. Add it once, detached, since the
   dev session's worktree holds the ticket's branch and git refuses to check out one branch in two
   worktrees; it builds and checks nothing.

   ```bash
   git fetch origin
   git worktree add --detach <repo-parent>/<repo>-worktrees/architect-spare origin/<branch>
   # the spare worktree exists already → in it: git checkout --detach origin/<branch>
   git merge origin/<base>          # in the spare worktree; never a rebase
   git push origin HEAD:<branch>    # never forced
   ```

   - **The merge conflicts** → `git merge --abort` and push nothing, since
     a code conflict goes back to the dev session, never resolved here: `comment` the conflict on
     the ticket (the files and the base commit), `move` the ticket to Changes requested, take it
     out of the queue and message its dev session `<id> changes requested`.
   - **No conflict** → push it unforced in the background, so this session goes on dispatching
     while the pull request's CI runs; a push refused because the remote moved → repeat from the
     fetch. Once its gate passes, take it from step 2. A check that turns red → as for a
     conflict, the failing check named in the comment.
   - **Nothing behind, and its CI must only run again** → re-run it through the host; no merge is
     needed.

   `<base>` is the default branch, or the production branch the layer names for a hotfix
   (§ Group a release).

---

## Drop a ticket

A ticket closed without delivery ends in Dropped, on the PO's word (`ticket-flow` § Dropped). A
ticket this session finds superseded, a duplicate or one another ticket's plan covers, is
proposed for a drop on the ticket (`comment`) with `<id> question` to the PO; nothing moves
before the PO's line.

On `<id> dropped` from the PO:

1. `read` the ticket and its drop record, the comment that gives `Dropped:` and `Superseded by:`.
   No record, a ticket at Done or later, a hotfix at Ready to merge or a release ticket →
   `comment` why, message the PO `<id> question`, and move nothing.
2. Its pull request, when one is open → close it unmerged through the host (under GitHub,
   `gh pr close <n>`), leave its branch, and take it out of the merge queue (§ Merge queue).
3. `move` the ticket to Dropped; under the GitHub Issues adapter, also close the issue with
   `gh issue close <id> --reason "not planned"`.
4. Message the ticket's dev and QA sessions `<id> dropped`, when it reached them.
5. Re-plan every ticket that depends on it: `comment` on each that the dependency moves to the
   ticket that superseded it, or is gone, and take it again from Step 4.
6. Record it (§ Record the closed tickets).

---

## Record the closed tickets

The board is the source of every open ticket (`ticket-flow` § Board operations): the general plan
records a ticket only once it is closed or dropped, and the architect writes that record, so the
PO does no repository work.

On a close outside a release (Step 6, with no deploy target), on `<release-id> released`
(§ Group a release) or on a drop (§ Drop a ticket):

1. `read` and `read version`, on the board, the ticket, or every ticket the release lists.
2. On a branch of its own, cut from the default branch, add one row per ticket to
   docs/GENERAL_PLAN.md § Closed Ticket Catalog, through `general-plan`, each copied from the
   ticket's board page: its id, title, type, target version, the day it closed and its pull
   request. A dropped ticket goes in the catalog's `### Dropped tickets` table instead, never
   among the delivered ones: its id, title, type and target version, the day it was dropped, and
   the reason and the ticket that superseded it, from its drop record. Copy no open ticket into
   the plan, and never refresh its pending work from the board: the plan points at the board.
3. Commit the rows and open one pull request per close or release, a drop counting as a close,
   its body naming each ticket it records; `comment` its link on the ticket, or on the release
   ticket.
4. Queue it in the merge queue at once (§ Merge queue): this session keeps it current, checks it
   against the board and merges it there.

---

## Group a release

When the Done tickets that should ship together are ready, or on `<id> ready to merge, hotfix`,
and the project layer declares deploy targets, group them as below. A hotfix gets a release
ticket of its own and stays at Ready to merge in it, out of the merge queue: the CI/CD session
merges it into the production branch the layer names as that release's deploy step
(`release-ticket` § Hotfix).

1. `create` a release ticket from `.claude/skills/ticket-flow/release.template.md`, type
   `release`, in Refinement, for one version V: `read version` lists every ticket whose target
   version is V, and the release ticket lists them all, a dropped one aside, with the version per
   target, the migrations, each backward compatible (`release-ticket` § Migrations), the
   changelog and the rollback per target.
2. Message the QA session of each area the batch touches `<release-id> check on staging`, and
   wait for every `<release-id> staging checked` and its evidence on the release ticket. A failed
   check becomes a fix ticket the release then lists, or its feature is switched off by its flag.
3. Move it to Ready for prod only when every ticket whose target version is V, a dropped one
   aside, is Done, except a hotfix, which is at Ready to merge into the production branch the
   layer names with every Ready to merge condition met against that branch's current tip
   (`ticket-flow` § Ready to merge); the default branch's CI is green; and every touched area's
   staging evidence is on the release ticket: `move`, then message the CI/CD session
   `<release-id> ready for prod`. A hotfix behind that tip, because
   another release merged since → bring it current yourself against the production branch
   (§ Merge queue, step 6), and move the release only once the hotfix's gate passes; a conflict
   or a red check sends it to the dev session from there.
4. When the CI/CD session flags a merged ticket aimed at a later version: name, on the release
   ticket, the feature flag it sits behind, or propose its move to V through the PO (Step 1,
   the target version).
5. On `<release-id> <target> failed`: `read` the comment, plan the fix as a ticket, and the
   release waits in Refinement until step 3 holds again.
6. On `<release-id> released`: `move` every ticket it lists, and the release ticket, to Closed,
   message the PO `<release-id> released`, and record the tickets it lists (§ Record the closed
   tickets).

---

## CONTRACT

```yaml
# skill: refine-ticket — the architect role; the board operations come from ticket-flow.
reads:
  - .claude/skills/ticket-flow/SKILL.md
  - .claude/skills/ticket-flow/release.template.md
  - .agents/harness.config.json # delivery.mergePolicy
board_operations: [create, read, move, comment, link, read version]
merge_policies: [manual, low-risk] # manual, the default, when .agents/harness.config.json records none
moves:
  - Backlog → Refinement
  - Refinement → Ready for dev
  - Ready to merge → Done # from the merge queue, on the owner's word or under low-risk
  - Ready to merge → Changes requested # a conflict or a red check, when it brings it current
  - Done → Closed
  - Refinement → Ready for prod # a release ticket
  - Released → Closed
  - Backlog to Ready to merge → Dropped # on the PO's word, its pull request unmerged
messages: ['<id> ready for dev', '<id> ready for QA, branch <b>', '<id> changes requested',
  '<id> merged', '<id> closed', '<id> dropped', '<id> question', '<id> version change',
  '<release-id> check on staging', '<release-id> ready for prod', '<release-id> released']
emits:
  - openspec/changes/{date}-{name}/ # through sdd, when the ticket changes a living spec
  - a ticket comment for each low-risk merge, with the Risk line it relied on
  - the closed ticket catalog pull request of each close or release
  - a pull request comment with the board check of each closed ticket catalog pull request
edits:
  - docs/GENERAL_PLAN.md # § Closed Ticket Catalog only, through general-plan, one pull request per close or release
validated_by: verify:specs
done_when: >-
  the ticket is in Ready for dev with its plan, or merged from the merge queue and Done, or the
  closed ticket catalog pull request opened, kept current, checked against the board and merged
  under the merge policy, or a release is in Ready for prod
```

---

## Output

The reply block of `ticket-flow` § Output, once per ticket moved or dispatched.
