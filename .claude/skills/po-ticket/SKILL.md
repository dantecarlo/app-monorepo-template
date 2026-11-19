---
name: po-ticket
description: >
  The PO role of the ticket flow: guards scope, turns a client requirement into a ticket written
  from the ticket template with the client's words verbatim and the version it is aimed at,
  creates it in Backlog, never without that version, and tells the architect; answers scope
  questions; confirms every move of a target version, and the first version of a technical
  ticket; and, when a ticket closes or a release ships, records each closed ticket in the
  general plan's closed ticket catalog, in a pull request it sends to the architect's merge
  queue, the board staying the source of every open one.
  USE WHEN: "the client asked for", "new requirement", "create a ticket for", "<id> question"
  about scope, "<id> version change", "<id> closed", "<release-id> released", a PO session of the
  ticket flow starts work.
  DO NOT USE: refining a ticket into specs and a plan (use `refine-ticket`), building it (use
  `dev-ticket`), or a change with no client behind it, which the architect files as a technical
  ticket (`refine-ticket`).
---

# PO ticket — a client requirement becomes a ticket; the plan records every close

Read `ticket-flow` first (`.claude/skills/ticket-flow/SKILL.md`), its pre-flight included: this
procedure uses its board operations, states, messages and rules and never restates them.

---

## Step 1 — Guard the scope

`read` the tickets in flight, then decide:

```
Does the request change what a ticket in flight must do?
├── YES → comment on that ticket, quoting the client verbatim and dated, and message the
│         architect `<id> scope changed`. Stop.
└── NO  → is it a new requirement?
    ├── YES → Step 2
    └── NO  → answer it; a question needs no ticket
```

---

## Step 2 — Write the ticket

Copy `.claude/skills/ticket-flow/ticket.template.md` and fill only the PO's part:

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
answer is the client's to give, ask the client and quote the reply verbatim; never guess it.

---

## Step 5 — Confirm a move of the target version

On `<id> version change`: `read` the architect's proposal on the ticket: a move, or the first
version of a technical ticket the architect filed. A move changes what the client was promised,
so ask the client when the date was theirs. Once it is confirmed, run
`set version`, `comment` the confirmation, and message the architect `<id> version set`. The
board carries the move: the general plan names no open ticket, so it does not change. Not
confirmed → `comment` why; the version stays.

---

## Step 6 — Record the closed tickets

The board is the source of every open ticket (`ticket-flow` § Board operations): the plan
records a ticket only once it is closed.

On `<id> closed` or `<release-id> released`: `read` the ticket, or every ticket the release
lists, and record each one as a row of docs/GENERAL_PLAN.md § Closed Ticket Catalog, through
`general-plan`, copied from the board: its id, title, type, target version, the day it closed and
its pull request. Commit the rows on a branch of their own, in
one pull request per close or release, and `comment` its link on the ticket, or on the release
ticket. Once the pull request is open, message the architect its line of `ticket-flow`
§ Messages:

- for the close of a release, `<release-id> catalog ready to merge, PR #<n>`;
- for a single close outside a release, `<id> catalog ready to merge, PR #<n>`.

The pull request then joins the architect's merge queue like any other, merged on the owner's
word (`refine-ticket` § Merge queue). Copy no open ticket into the plan, and never refresh its
pending work from the board: the plan points at the board.

---

## CONTRACT

```yaml
# skill: po-ticket — the PO role; the board operations come from ticket-flow.
reads:
  - .claude/skills/ticket-flow/SKILL.md
  - .claude/skills/ticket-flow/ticket.template.md
board_operations: [create, read, comment, read version, set version]
moves: [none → Backlog]
messages: ['<id> new', '<id> scope changed', '<id> version set',
  '<id> catalog ready to merge, PR #<n>', '<release-id> catalog ready to merge, PR #<n>']
edits:
  - docs/GENERAL_PLAN.md # § Closed Ticket Catalog only, through general-plan, one pull request per close or release
validated_by: review
done_when: >-
  the ticket is in Backlog with the client's words verbatim and its target version set, and the
  architect was told; or, on a close or a release, each closed ticket is a row of the plan's
  Closed Ticket Catalog in its one pull request, and the architect was told it is ready to merge
```

---

## Output

The reply block of `ticket-flow` § Output, once per ticket created or answered.
