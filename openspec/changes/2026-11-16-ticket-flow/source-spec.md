# Ticket flow — portable specification (draft for the template)

Status: approved by the owner on 2026-11-16 (Certifipago), sent to the template to evaluate, build
and return its changes. The template owns the core; each project adds a thin layer of its own.
No code here. This states the behaviour the skills must produce.

## 1. Why

Several Claude Code sessions work one product: a requirements owner, an architect, dev
sessions per area and QA sessions per area. Passing context between sessions contaminates
each session's context and drifts. In this flow the **ticket is the only carrier of context**,
and a session's message to another says only which ticket moved and to which state.

## 2. Roles

A project declares which roles exist and which session fills each one, in its project layer
(§ 8). More than one session may fill a dev role. Exactly one QA session fills each dev area's
QA role.

| Role | Responsibility |
|---|---|
| **PO** | Turns a client requirement into a ticket on the board. Quotes the client's words verbatim in the ticket. Updates the general plan when a ticket closes. Owns scope: any change of scope goes through the PO. |
| **Architect** | Refines a ticket: writes its specs (the project's spec mechanism, e.g. SDD change folders) and a technical plan, which names the dev areas, the subtasks per area, the files each subtask reserves and the tickets it depends on. Dispatches every transition (§ 4). Closes tickets. Creates **technical tickets** for work asked of it directly or found in passing; those follow the same flow. |
| **Dev** (one or more sessions per area: e.g. App, Web, Backend) | Builds a ticket in its own worktree and branch, from the default branch, as the specs and plan say, with unit tests and end-to-end tests. |
| **QA** (one per area, Backend included) | Checks out the ticket's branch and runs the area's end-to-end checks, with evidence: screenshots for a UI area, query or test output for a backend area. Then either returns the ticket with a comment or marks it ready to merge. |
| **Independent area** (e.g. Marketing) | Works its own tickets without a PO, unless the request comes from the client. It reviews its own work and gets the owner's sign-off. It joins the full flow only when it touches the product. |

## 3. States

The names are the project's (§ 8). The transitions are the core:

| State | Entered by | Then the notifier tells |
|---|---|---|
| Backlog | PO creates the ticket | Architect: "<id> new" |
| Refinement | Architect takes it | — (the owner approves the specs in the architect's session when the spec mechanism requires it) |
| Ready for dev | Architect, plan done | the assigned dev session: "<id> ready for dev" |
| In dev | Dev picks it up | — |
| Ready for QA | Dev, build and tests done | Architect, then the architect tells the area's QA: "<id> ready for QA, branch <b>" |
| In QA | QA picks it up | — |
| Changes requested | QA, with a comment on the ticket | Architect, then the architect tells the dev session: "<id> changes requested" |
| Ready to merge | QA, checks passed | the owner: QA asks whether to merge (merge policy unchanged: an agent merges only on the owner's word) |
| Done | QA merges on the owner's word | Architect: "<id> merged" |
| Closed | Architect | PO: "<id> closed", and the PO updates the general plan |

The **architect is the dispatcher**: every "ready" state reaches the next session through it.

## 4. Messages

A message between sessions is one line: the ticket id, the event and, when the next session
needs it, the branch name. It carries no requirement, decision or file list. Those live in the
ticket and its comments.

A session that finds something missing or unclear asks **on the ticket** and messages the
session that owns the answer: the PO for scope, the architect for the plan, the dev session for
its build. The answer goes back into the ticket.

## 5. Rules every role follows

1. **Scope guard.** A request made directly to any session is checked against the tickets in
   flight. If it changes a ticket's scope, the session answers that it must go through the PO
   and does not do it. A request with no ticket behind it gets a ticket first. The architect
   may create a technical ticket itself.
2. **One worktree per ticket.** Dev builds on its own local copy, a worktree with the ticket
   id in the branch name (`<type>/<id>-<slug>`). The pull request links the ticket.
3. **Subagent hygiene.** A session may split its task into subagents or subsessions. Each one is
   deleted as soon as it finishes, and none is left idle. No session duplicates another session
   that already exists for a job.
4. **Merges stay the owner's.** QA asks the owner before merging. Anything irreversible
   (a production migration, a release) needs the owner's word, whatever the state.
5. **Independent QA.** The session that built a ticket never moves it past Ready for QA.
6. **Approval in place.** An approval counts only in the session that asked for it. A relay
   from another session does not stand in for it.

## 6. What a ticket carries

- the client's requirement, verbatim;
- acceptance criteria;
- the link to its spec (never a copy of the spec);
- the areas and subtasks, with the files each one reserves and the tickets it depends on;
- the test plan: unit tests and the end-to-end flows by id;
- the branch and the pull request;
- the QA evidence;
- the risk line;
- every question and answer, as comments.

## 7. Core skills (the template owns them; projects never fork them)

| Skill | Role | Does |
|---|---|---|
| `ticket-flow` | all | the state machine, the notifier rule, the message format and the § 5 rules; read first by every role |
| `po-ticket` | PO | a requirement → a ticket in the ticket template; the plan update on close |
| `refine-ticket` | Architect | ticket → specs + plan + reservations + dispatch; technical tickets |
| `dev-ticket` | Dev | pick up → worktree → build test-first → Ready for QA |
| `qa-ticket` | QA | checkout → run the area's checks with evidence → Changes requested or Ready to merge → merge on the owner's word |
| `process-intake` | init | asks the team for its process document (states, who moves them, approvals, merge policy), or a link to Confluence, Notion or Jira to read and write it from, and writes the project layer |

They reuse whatever the template already has for tickets, specs, plan mirroring and e2e review,
instead of restating them.

## 8. Project layer (each repository; Certifipago's in brackets)

- `docs/process/ticket-flow.md`: the board, its state names and their mapping onto § 3
  [Notion "Tickets", field `Estado`]. The roles and the sessions that fill them [PO, Arquitecto,
  App, Web, Backend, Marketing (independent), E2E App, E2E Web, QA Backend]. How approvals work
  [SDD proposals approved by the owner in the architect's session]. The merge policy
  [`manual`].
- The router points at it, and the project's agent instructions name the role each session
  plays.

## 8b. Release stage (owner-approved, 2026-11-16 12:38)

**States after Done:**

| State | Entered by | Then |
|---|---|---|
| Ready for prod | the architect groups Done tickets into a release ticket that lists them | the CI/CD role is told "<release-id> ready for prod" |
| In release | the CI/CD role, on the owner's word | it runs each deploy target the release touches, in dependency order |
| Released | the CI/CD role, after checking production | the architect is told, and the architect tells the PO, who updates the plan |

**CI/CD role.** One session runs every deploy target and never decides whether to release. The
owner's word does, per release and per irreversible step (a production migration, a store
submission).

**Deploy targets are adapters**, declared in the project layer like the board adapter: a
branch a host deploys, a CLI, a store pipeline, a migration push. Each one declares its trigger,
its order, its check and its rollback.

**Default branching (recommended):**
- The default branch is integration, deployed to staging or preview. QA works there.
- A long-lived `production` branch is what is live.
- A web release is a PR from the default branch to `production`, merged on the owner's word,
  never rebased. The host deploys it.
- A mobile release is a tag (`app-vX.Y.Z`) on that `production` commit. The CI/CD role builds it
  and submits it to the store track the owner names.
- Schema migrations in the batch go to production first, on the owner's word, so the web and the
  app find the schema they expect.
- A hotfix branches from `production`, merges back into it, and then `production` merges into
  the default branch.

**What a batch is.** With a production branch, a release ships everything merged since the
last release. Unfinished work stays behind a feature flag or off the default branch.

**Alternative a project may declare:** tags only (`web-vX`, `app-vX`) on the default branch,
each tag running a deploy job.

**Certifipago's targets:**
- Vercel, with its production branch moved to `production` (master deploys production today);
- EAS build and Play submit, run by the session "Certifipago - CI/CD";
- Supabase migrations pushed to the production project.

## 9. Open for the template to decide

- Whether the role skills are one skill with role sections or five skills.
- Whether a gate can check the board (each open PR's branch names a ticket in a matching state).
- How `process-intake` reads a link (scraping vs. an MCP connector), and what it does with none.
- Where a QA session's evidence is stored, so the ticket can link it.
