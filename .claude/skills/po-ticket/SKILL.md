---
name: po-ticket
description: >
  The PO role of the ticket flow: guards scope, turns a client requirement into a ticket written
  from the ticket template with the client's words verbatim and the version it is aimed at,
  creates it in Backlog and tells the architect; answers scope questions; confirms every move of
  a target version; and refreshes the general plan when a ticket closes or a release ships.
  USE WHEN: "the client asked for", "new requirement", "create a ticket for", "<id> question"
  about scope, "<id> version change", "<id> closed", "<release-id> released", a PO session of the
  ticket flow starts work.
  DO NOT USE: refining a ticket into specs and a plan (use `refine-ticket`), building it (use
  `dev-ticket`), or a change with no client behind it, which the architect files as a technical
  ticket (`refine-ticket`).
---

# PO ticket — a client requirement becomes a ticket; the plan follows every close

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
- **Target version**: the version the ticket is aimed at, the one the client expects it in; ask
  the client when nobody said.

Leave the architect's sections (Spec, Areas and subtasks, Test plan) and the later ones as the
template has them.

---

## Step 3 — Create it

`create` the ticket in Backlog, `set version` to its target version, then message the architect
`<id> new`.

---

## Step 4 — Answer scope questions

On `<id> question` about scope: `read` the question and answer it with a `comment`. When the
answer is the client's to give, ask the client and quote the reply verbatim; never guess it.

---

## Step 5 — Confirm a move of the target version

On `<id> version change`: `read` the architect's proposal on the ticket. A move changes what the
client was promised, so ask the client when the date was theirs. Once it is confirmed, run
`set version`, `comment` the confirmation, refresh the general plan, and message the architect
`<id> version set`. Not confirmed → `comment` why; the version stays.

---

## Step 6 — Refresh the plan on every close

On `<id> closed` or `<release-id> released`: `read` the ticket, or every ticket the release
lists, and refresh the general plan with `general-plan`, so the plan's done and pending lists
match the board.

---

## CONTRACT

```yaml
# skill: po-ticket — the PO role; the board operations come from ticket-flow.
reads:
  - .claude/skills/ticket-flow/SKILL.md
  - .claude/skills/ticket-flow/ticket.template.md
board_operations: [create, read, comment, read version, set version]
moves: [none → Backlog]
messages: ['<id> new', '<id> scope changed', '<id> version set']
edits:
  - docs/GENERAL_PLAN.md # through general-plan, on a close
validated_by: review
done_when: the ticket is in Backlog with the client's words verbatim, and the architect was told
```

---

## Output

The reply block of `ticket-flow` § Output, once per ticket created or answered.
