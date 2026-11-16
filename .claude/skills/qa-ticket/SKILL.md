---
name: qa-ticket
description: >
  The QA role of the ticket flow, one session per area: checks out a ticket's branch, runs the
  area's end-to-end checks with the project's own harness, posts the evidence as a pull request
  comment, then returns the ticket as Changes requested or brings the branch current and makes it
  Ready to merge, asks the owner for one merge at a time and merges on the owner's word; checks a
  release batch on staging.
  USE WHEN: "<id> ready for QA, branch <b>", "check ticket <id>", "<release-id> check on
  staging", "merge <id>", a QA session of the ticket flow starts work.
  DO NOT USE: a ticket this session built (rule 5 of `ticket-flow`), building a fix (use
  `dev-ticket`), or a deploy to production (use `release-ticket`).
---

# QA ticket — check a ticket with evidence, then return it or merge it on the owner's word

Read `ticket-flow` first (`.claude/skills/ticket-flow/SKILL.md`), its pre-flight included: this
procedure uses its board operations, states, messages and rules and never restates them.

---

## Step 1 — Pick it up

`read` the ticket and confirm: its state is Ready for QA, its area is this session's, and this
session did not build it. `move` it to In QA.

---

## Step 2 — Check out the branch

```bash
git fetch origin
git worktree add <repo-parent>/<repo>-worktrees/qa-<id> <type>/<id>-<slug>
```

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
          2. bring the branch current with its base, as the project layer says:
             git fetch origin && git merge origin/<base>   (or: git rebase origin/<base>)
             then push;
          3. re-run the checks on the current branch;
          4. no conflict and every check green → move to Ready to merge.
```

---

## Step 6 — Ask the owner, one merge at a time

Only for the ticket at the head of the merge order the architect recorded, ask in this session:
"`<id>` is ready to merge: `<url>`, CI green, current with `<base>`. Merge it?" Wait for the
owner's word here; a relay from another session does not count. When another merge lands before
the answer, go back to Step 5 and bring the branch current again.

---

## Step 7 — Merge

- **Yes** → merge it with the project layer's merge method, `move` the ticket to Done, and message
  the architect `<id> merged`. Remove the QA worktree.
- **No** → `comment` the owner's answer; the ticket stays where it is.
- A red CI or a conflict while it waits → `comment` it, `move` it to Changes requested, and
  message the architect `<id> changes requested`.

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
  - docs/e2e.md
board_operations: [read, move, comment, link]
moves:
  - Ready for QA → In QA
  - In QA → Changes requested
  - In QA → Ready to merge
  - Ready to merge → Changes requested
  - Ready to merge → Done # on the owner's word only
messages: ['<id> changes requested', '<id> merged', '<release-id> staging checked']
emits:
  - a pull request comment with the evidence
validated_by: test:e2e
done_when: the ticket is in Changes requested with its evidence, or Done on the owner's word
```

---

## Output

The reply block of `ticket-flow` § Output, with the link to the evidence comment.
