---
name: po-ticket
description: >
  The PO role of the ticket flow: guards scope, turns a client requirement into a ticket in
  Backlog with the client's words verbatim and the version it is aimed at, never without that
  version, and tells the architect; answers scope questions; confirms every move of a target
  version, and the first version of a technical ticket; decides every drop, superseded or
  withdrawn, and records why on the ticket; keeps the scope and the board, and does no
  repository work: the architect records each closed or dropped ticket in the general plan.
  USE WHEN: "the client asked for", "new requirement", "create a ticket for", "the client
  withdrew <id>", "<id> is superseded", "<id> question" about scope or a drop,
  "<id> version change", "<id> closed", "<release-id> released", a PO session of the ticket flow
  starts work.
  DO NOT USE: refining a ticket into specs and a plan (use `refine-ticket`), building it (use
  `dev-ticket`), or a change with no client behind it, which the architect files as a technical
  ticket (`refine-ticket`).
---

# PO ticket — a client requirement becomes a ticket; the scope and the board stay the PO's

Read `ticket-flow` first (`.claude/skills/ticket-flow/SKILL.md`), its pre-flight included: this
procedure uses its board operations, states, messages and rules and never restates them.

The PO keeps the scope and the board and does no repository work: no file, branch, commit or pull
request. Every step below runs board operations only; the architect records each closed or
dropped ticket in the general plan (`refine-ticket` § Record the closed tickets).

---

## Step 1 — Guard the scope

`read` the tickets in flight, then decide:

```
Does the request withdraw a ticket, or replace one with a new requirement?
├── YES → the new requirement, if any, through Steps 2 and 3; then Step 6 for the one it
│         withdraws or replaces. Stop.
└── NO  → does it change what a ticket in flight must do?
    ├── YES → comment on that ticket, quoting the client verbatim and dated, and message the
    │         architect `<id> scope changed`. Stop.
    └── NO  → is it a new requirement?
        ├── YES → Step 2
        └── NO  → answer it; a question needs no ticket
```

---

## Step 2 — Write the ticket

Copy `.claude/skills/ticket-flow/ticket.template.md` to a scratch file outside the repository, the
body `create` reads, and fill only the PO's part:

- the title and the type (`feature`, `fix` or `chore`);
- **Requirement**: the client's words verbatim and dated; translated faithfully and marked
  `(translated from <language>)` when the client wrote in another language;
- **Acceptance criteria**: one observable outcome per line, each one a thing QA can check;
- **Target version**: the version the ticket is aimed at, the one the client expects it in. It
  is required: when nobody said, ask the client, and create nothing until the answer is in.

Leave the architect's sections (Spec, Areas and subtasks, Test plan) and the later ones as the
template has them.

---

## Step 3 — Create it

`create` the ticket in Backlog and `set version` to its target version. Then `read version`:
it must show that version (under the GitHub Issues adapter, the issue's milestone) before you
message the architect `<id> new`. No ticket leaves this step without one.

---

## Step 4 — Answer scope questions

On `<id> question` about scope: `read` the question and answer it with a `comment`. When the
answer is the client's to give, ask the client and quote the reply verbatim; never guess it. A
drop another session proposes, for a ticket it found superseded, is such a question: decide it,
and drop the ticket through Step 6 or `comment` why it stays.

---

## Step 5 — Confirm a move of the target version

On `<id> version change`: `read` the architect's proposal on the ticket: a move, or the first
version of a technical ticket the architect filed. A move changes what the client was promised,
so ask the client when the date was theirs. Once it is confirmed, run
`set version`, `comment` the confirmation, and message the architect `<id> version set`. The
board carries the move: the general plan names no open ticket, so it does not change. Not
confirmed → `comment` why; the version stays.

---

## Step 6 — Drop a ticket

A ticket the client withdrew, or that another ticket superseded, closes without delivery in
Dropped (`ticket-flow` § Dropped). Scope is the PO's, so the PO decides the drop; the architect
makes the move.

1. `read` the ticket. At Done or later it is delivered: it is not dropped, and undoing it is a
   new ticket (Step 2). A hotfix at Ready to merge, or a release ticket, is not dropped either.
2. When another ticket supersedes it, that ticket exists first (Steps 2 and 3); when the client
   withdrew it, quote the client's words verbatim and dated.
3. `comment` the drop record of `ticket-flow` § Dropped on the ticket: the reason, and the ticket
   that superseded it, or `none`.
4. Message the architect `<id> dropped`. Move nothing: the architect makes the move and records
   the drop in the general plan.

---

## Step 7 — A close or a release

On `<id> closed` or `<release-id> released`: `read` the ticket, or every ticket the release lists,
on the board, where it is closed: the client's requirement is delivered. Record nothing in the
repository: the architect records each closed ticket in the general plan's closed ticket catalog
(`refine-ticket` § Record the closed tickets). Answer the client's questions about the delivery
from the board.

---

## CONTRACT

```yaml
# skill: po-ticket — the PO role; the board operations come from ticket-flow.
reads:
  - .claude/skills/ticket-flow/SKILL.md
  - .claude/skills/ticket-flow/ticket.template.md
board_operations: [create, read, comment, read version, set version]
moves: [none → Backlog]
messages: ['<id> new', '<id> scope changed', '<id> version set', '<id> dropped']
# no file of the repository: the PO does no repository work
validated_by: review
done_when: >-
  the ticket is in Backlog with the client's words verbatim and its target version set, and the
  architect was told; or a ticket to drop carries its drop record and the architect was told
  `<id> dropped`; the PO wrote nothing in the repository
```

---

## Output

The reply block of `ticket-flow` § Output, once per ticket created or answered.
