---
name: qa-ticket
description: >
  The QA role of the ticket flow, one session per area: checks out a ticket's branch in a
  detached worktree, runs the area's end-to-end checks with the project's own harness, posts the
  evidence as a pull request comment, then returns the ticket as Changes requested or brings the
  branch current and makes it Ready to merge, and merges one ticket at a time under the
  project's merge policy: on the owner's word under `manual`, the default, or without asking
  under `low-risk` when the pull request meets every condition; never merges a hotfix into
  `production`, which waits at Ready to merge for its release; checks a release batch on staging.
  USE WHEN: "<id> ready for QA, branch <b>", "check ticket <id>", "<release-id> check on
  staging", "merge <id>", a QA session of the ticket flow starts work.
  DO NOT USE: a ticket this session built (rule 5 of `ticket-flow`), building a fix (use
  `dev-ticket`), or a deploy to production (use `release-ticket`).
---

# QA ticket — check a ticket with evidence, then return it or merge it under the merge policy

Read `ticket-flow` first (`.claude/skills/ticket-flow/SKILL.md`), its pre-flight included: this
procedure uses its board operations, states, messages and rules and never restates them.

---

## Step 1 — Pick it up

`read` the ticket and confirm: its state is Ready for QA, its area is this session's, and this
session did not build it. `move` it to In QA.

---

## Step 2 — Check out the branch

The branch is the one the ticket names, in the shape the project layer's ticket identity sets
(`<type>/<id>-<slug>` by default; see `ticket-flow` § Ticket identity).

```bash
git fetch origin
git worktree add --detach <repo-parent>/<repo>-worktrees/qa-<id> origin/<branch>
```

The worktree is detached at the remote branch because the dev session's worktree still holds
`<branch>` until the ticket is Done, and git refuses to check out one branch in two worktrees.
Never check a ticket in the dev session's worktree.

---

## Step 3 — Run the area's checks

Run the end-to-end flows the test plan names with the project's own harness: `docs/e2e.md`
(`pnpm test:e2e`) for the flows, `runtime-verify` for the running app. A backend area runs its
queries and its tests.

---

## Step 4 — Post the evidence

- A comment on the pull request holds it: screenshots attached for a UI area, query or test
  output as text for a backend area.
- Large artefacts, such as Playwright traces, stay CI artefacts, linked from that comment.
- `comment` the ticket with the link to that pull request comment.
- Nothing goes into the repository.

---

## Step 5 — Decide

```
Did every check pass?
├── NO  → comment what failed, with the evidence link; move to Changes requested; message the
│         architect `<id> changes requested`. Stop.
└── YES → bring it to Ready to merge (`ticket-flow` § Ready to merge):
          1. the pull request's CI is green;
          2. bring the detached HEAD current with the ticket branch and with its base, by
             merges, never by a rebase (a rebased branch cannot be pushed unforced):
             git fetch origin && git merge origin/<branch> && git merge origin/<base>
             (the dev session may have pushed since the checkout; a conflict → comment it,
             move to Changes requested, message the architect `<id> changes requested`. Stop.)
             then push it to the ticket branch, never forced: git push origin HEAD:<branch>
             (refused because the remote moved → repeat this step from the fetch);
          3. re-run the checks on the current branch, the dev session's new commits included;
          4. no conflict and every check green → move to Ready to merge.
```

---

## Step 6 — One merge at a time, under the merge policy

**A hotfix is never QA's to merge.** A pull request into `production` waits at Ready to merge for
its release under every policy, `manual` included: merging it deploys, so the CI/CD session
merges it as that release's deploy step (`release-ticket` § Hotfix). Ask the owner nothing and
merge nothing: message the architect `<id> ready to merge, hotfix`, remove the QA worktree, and
stop.

Every other ticket: only the one at the head of the merge order the architect recorded. Read the
merge policy in the project layer (`ticket-flow` rule 4):

```
Which merge policy does the project layer record?
├── `manual`, the default, or none → ask the owner.
└── `low-risk` → does the pull request meet every condition?
      1. it is Ready to merge into the default branch: CI green, no conflict, current with the
         default branch's tip (Step 5); a pull request into `production` never is;
      2. its body's Risk line is `Risk: none`, or its diff changes only passive files
         (`ticket-flow` rule 4);
      3. its merge sets off no irreversible step: no deploy, no production migration, no store
         submission, nothing that cannot be undone.
    ├── YES, all three → merge it without asking (Step 7).
    └── NO to one, no Risk line, or unsure → ask the owner, as under `manual`.
```

To ask, say in this session: "`<id>` is ready to merge: `<url>`, CI green, current with `<base>`.
Merge it?" Wait for the owner's word here; a relay from another session does not count. When
another merge lands before the answer, or before a `low-risk` merge, go back to Step 5 and bring
the branch current again.

---

## Step 7 — Merge

- **Yes, or every `low-risk` condition met** → merge it with the project layer's merge method.
  After a `low-risk` merge, `comment` the ticket: "Merged under the `low-risk` merge policy. Risk
  line: `<the pull request's Risk line>`; it qualified by <`Risk: none` | only passive files>."
  `move` the ticket to Done, and message the architect `<id> merged`. Remove the QA worktree.
- **No** → `comment` the owner's answer; the ticket stays where it is.
- A red CI or a conflict while it waits, a hotfix's included → `comment` it, `move` it to Changes
  requested, and message the architect `<id> changes requested`.

---

## Staging check of a release

On `<release-id> check on staging`: `read` the release ticket, run this area's checks over the
batch on staging or preview, `comment` the evidence on the release ticket (passed or failed, with
its links), and message the architect `<release-id> staging checked`.

---

## CONTRACT

```yaml
# skill: qa-ticket — the QA role; the board operations come from ticket-flow.
reads:
  - .claude/skills/ticket-flow/SKILL.md
  - docs/process/ticket-flow.md # the merge policy and the merge method
  - docs/e2e.md
board_operations: [read, move, comment, link]
merge_policies: [manual, low-risk] # manual, the default, when the layer records none
moves:
  - Ready for QA → In QA
  - In QA → Changes requested
  - In QA → Ready to merge
  - Ready to merge → Changes requested
  - Ready to merge → Done # the owner's word, or low-risk; never a pull request into production
messages: ['<id> changes requested', '<id> merged', '<id> ready to merge, hotfix',
  '<release-id> staging checked']
emits:
  - a pull request comment with the evidence
  - a ticket comment for each low-risk merge, with the Risk line it relied on
validated_by: test:e2e
done_when: >-
  the ticket is in Changes requested with its evidence, or Done on the owner's word, or Done
  under the low-risk merge policy with that merge recorded on the ticket, or, for a hotfix, at
  Ready to merge with the architect told `<id> ready to merge, hotfix`
```

---

## Output

The reply block of `ticket-flow` § Output, with the link to the evidence comment.
