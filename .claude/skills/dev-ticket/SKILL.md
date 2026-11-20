---
name: dev-ticket
description: >
  The dev role of the ticket flow: picks up a ticket in Ready for dev, builds it in a worktree of
  its own on the ticket's branch (`<type>/<id>-<slug>` unless the project layer's ticket identity
  says otherwise), test first under the project's workflow (SDD when a living spec changes), runs
  the validation gate, opens the pull request that links the ticket
  and moves it to Ready for QA; on Changes requested, fixes it in the same worktree; on a drop,
  stops and removes the worktree. Never moves a ticket past Ready for QA.
  USE WHEN: "<id> ready for dev", "<id> changes requested", "<id> merged", "<id> dropped",
  "pick up ticket <id>", "build the hotfix <id>", a dev session of the ticket flow starts work.
  DO NOT USE: a change with no ticket (the scope guard of `ticket-flow` files one first),
  checking a build (use `qa-ticket`), or a deploy (use `release-ticket`).
---

# Dev ticket — build a ticket test first, up to Ready for QA

Read `ticket-flow` first (`.claude/skills/ticket-flow/SKILL.md`), its pre-flight included: this
procedure uses its board operations, states, messages and rules and never restates them.

---

## Step 1 — Read the ticket

`read` it and confirm: its state is Ready for dev, its area is this session's, and every ticket
it depends on is Done. Anything missing or unclear → `comment` the question, message its owner
`<id> question` (the PO for scope, the architect for the plan), and stop until the answer is on
the ticket.

---

## Step 2 — Pick it up

`move` it to In dev.

---

## Step 3 — A worktree and a branch of its own

```bash
git fetch origin
git worktree add <repo-parent>/<repo>-worktrees/<id> \
  -b <branch> origin/<default branch>
```

- `<branch>` is the ticket's branch, `ticket-flow` § Ticket identity: `<type>/<id>-<slug>` by
  default, its prefix one of the layer's `branchTypes`, its slug as the layer's `slug` says.

- A hotfix (a `fix` ticket the architect marked as one) starts instead from the production
  branch the layer names, `origin/<production branch>` (`origin/production` by default;
  `release-ticket` § Hotfix).
- Never build in another ticket's worktree or in the main checkout.
- `link` the branch to the ticket.

---

## Step 4 — Build it, test first

- Follow the project's workflow: when the ticket's Spec is a change of a living spec, apply it
  with `sdd`; otherwise the small path, the failing test and then the fix.
- Build each block through the skill that owns its shape (the `AGENTS.md` router).
- Touch only the files the subtask reserves. Another file is needed → `comment` it, message the
  architect `<id> question`, and wait.
- Write the unit tests and the end-to-end flows the test plan names.

---

## Step 5 — Prove it

- Run the project's validation gate with `validate-all` (`pnpm validate`) and read its exit code.
- Close the change with its Risk line, as `AGENTS.md` says: `Risk: item N (reason)` or
  `Risk: none`.

---

## Step 6 — The pull request

Push the branch and open the pull request; the project layer's approvals say whether that needs
the owner's word first. The body names the ticket (`Refs #<id>`, or the id itself), the test plan and
the Risk line. `link` it to the ticket.

---

## Step 7 — Ready for QA

`move` the ticket to Ready for QA and message the architect `<id> ready for QA, branch <b>`.
Stop there: the session that built a ticket never moves it further.

---

## Changes requested

On `<id> changes requested`, from QA or from the architect: `read` the comment and `move` the
ticket to In dev. Before any later change in this worktree, pull the branch
(`git pull origin <branch>`): QA or the architect may have pushed to it when they brought the
branch current (`qa-ticket` Step 5, `refine-ticket` § Merge queue). A conflict with its base,
which the architect met and left to this session → merge the base, the branch this one was cut
from, into it here (`git fetch origin && git merge origin/<base>`, never a rebase, since others
push to it unforced) and resolve it. Then fix it in the same worktree test first, run Step 5
again, push, then Step 7.

On `<id> merged`, which the architect sends once the ticket is Done: remove the worktree
(`git worktree remove <path>`).

On `<id> dropped`, which the architect sends once the ticket is in Dropped (`ticket-flow`
§ Dropped) and its pull request is closed unmerged: stop the build, push nothing more, and
remove the worktree (`git worktree remove <path>`); the pushed branch stays as a record.

---

## CONTRACT

```yaml
# skill: dev-ticket — the dev role; the board operations come from ticket-flow.
reads:
  - .claude/skills/ticket-flow/SKILL.md
board_operations: [read, move, comment, link]
moves:
  - Ready for dev → In dev
  - Changes requested → In dev
  - In dev → Ready for QA
messages: ['<id> ready for QA, branch <b>', '<id> question']
emits:
  - the ticket's branch (ticket-flow § Ticket identity) and its pull request
validated_by: validate · verify:ticket-branch
done_when: pnpm validate exits 0, the pull request links the ticket, and it is in Ready for QA
```

---

## Output

The reply block of `ticket-flow` § Output, with the branch, the pull request and the Risk line.
