---
name: qa-ticket
description: >
  The QA role of the ticket flow, one session per area: checks out a ticket's branch in a
  detached worktree, runs the area's end-to-end checks with the project's own harness, posts the
  evidence as a pull request comment, then returns the ticket as Changes requested or brings the
  branch current, makes it Ready to merge and hands it to the architect, who keeps the merge
  queue and merges; brings it current again when the architect asks; never asks the owner to
  merge and never merges, a hotfix included, which waits at Ready to merge for its release;
  checks a release batch on staging.
  USE WHEN: "<id> ready for QA, branch <b>", "check ticket <id>", "<id> bring current",
  "<id> merged", "<release-id> check on staging", a QA session of the ticket flow starts work.
  DO NOT USE: a ticket this session built (rule 5 of `ticket-flow`), merging a pull request (the
  architect's `refine-ticket` § Merge queue), building a fix (use `dev-ticket`), or a deploy to
  production (use `release-ticket`).
---

# QA ticket — check a ticket with evidence, then return it or bring it to Ready to merge

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
          4. no conflict and every check green → move to Ready to merge, then Step 6.
```

`<base>` is the default branch, or the production branch the layer names for a hotfix.

---

## Step 6 — Hand it to the architect

QA stops at Ready to merge: it asks the owner nothing and merges nothing, under every merge
policy. The architect keeps the merge queue, asks the owner for each merge in its own session or
merges under `low-risk`, and moves the ticket to Done (`refine-ticket` § Merge queue).

- **Into the default branch** → message the architect `<id> ready to merge, PR #<n>`; the ticket
  already carries the link to the evidence (Step 4). Keep the QA worktree: the architect asks
  for the branch to be brought current again after each merge ahead of it (Step 7).
- **A hotfix**, a pull request into the production branch the layer names → it waits at Ready to
  merge for its release under every policy, `manual` included: merging it deploys, so the CI/CD
  session merges it as that release's deploy step (`release-ticket` § Hotfix). Message the
  architect `<id> ready to merge, hotfix`, remove the QA worktree, and stop.

---

## Step 7 — When the architect writes back

- **`<id> bring current`** — a merge ahead of it moved its base, or its CI must run again. In
  the QA worktree (Step 2 adds it again when it was removed), repeat Step 5 from its point 2:
  merge the ticket branch and the base, push unforced, and re-run the checks.
  - No conflict and every check green → it stays at Ready to merge: message the architect
    `<id> ready to merge, PR #<n>` again, or `<id> ready to merge, hotfix` for a hotfix.
  - A conflict or a red check → `comment` it with the evidence, `move` it to Changes requested,
    and message the architect `<id> changes requested`.
- **`<id> merged`** — the architect merged it and moved it to Done, or the CI/CD session did
  for a hotfix. Remove the QA worktree; QA never moves a ticket to Done.

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
  - docs/process/ticket-flow.md # the base branches, the production branch among them
  - docs/e2e.md
board_operations: [read, move, comment, link]
moves:
  - Ready for QA → In QA
  - In QA → Changes requested
  - In QA → Ready to merge
  - Ready to merge → Changes requested # a conflict or a red check, when it brings it current
messages: ['<id> changes requested', '<id> ready to merge, PR #<n>',
  '<id> ready to merge, hotfix', '<release-id> staging checked']
emits:
  - a pull request comment with the evidence
validated_by: test:e2e
done_when: >-
  the ticket is in Changes requested with its evidence, or at Ready to merge with the architect
  told `<id> ready to merge, PR #<n>`, or `<id> ready to merge, hotfix` for a hotfix
```

---

## Output

The reply block of `ticket-flow` § Output, with the link to the evidence comment.
