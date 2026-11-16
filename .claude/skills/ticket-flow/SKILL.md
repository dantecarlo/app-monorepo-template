---
name: ticket-flow
description: >
  The contract of the ticket flow, read first by every role: the board operations and the
  adapter that performs them, the thirteen states and who moves each one, the architect as
  dispatcher, the one-line messages between sessions, the roles, the rules every role follows,
  a ticket's identity, target version and contents, the Ready to merge conditions and the
  release stage. The ticket is the only carrier of context between sessions.
  USE WHEN: a session plays a role of the ticket flow (PO, architect, dev, QA, CI/CD); "a ticket
  moved", "<id> new", "<id> ready for dev", "<id> ready for QA", "<id> changes requested",
  "<id> merged", "<release-id> ready for prod"; "which state does this ticket go to", "how do the
  sessions hand work over"; and before loading `po-ticket`, `refine-ticket`, `dev-ticket`,
  `qa-ticket` or `release-ticket`.
  DO NOT USE: a change one session makes with no ticket behind it (use `sdd` or the scaffolding
  skills of the router), or setting up a project's process (use `process-intake`).
---

# Ticket flow — the contract every role reads first

Several long-lived sessions work one product: a PO, an architect, dev and QA sessions per area,
and a CI/CD session. The **ticket is the only carrier of context**: a message between sessions
says which ticket moved and to which state, and every requirement, decision, file list, question
and answer lives on the ticket. Each role's procedure is a skill of its own (§ Roles) that reads
this one first and never restates it. The requirements behind it are the living spec
harness/ticket-flow, in `openspec/specs/harness/ticket-flow/spec.md`.

---

## Pre-flight

Every role runs this before it touches a ticket:

1. Read the project layer, docs/process/ticket-flow.md: the board adapter, the state names, the
   roles and the sessions that fill them, the approvals, the merge policy, the ticket identity,
   the deploy targets and the branching model.
2. No such file, or one that names no board adapter → **stop** and say: "This project has no
   ticket flow yet: run `process-intake`." Never invent a board, a label or a state.
3. Find the role this session plays in that file. A session plays one role.
4. Load the skill of that role (§ Roles) and follow it.

---

## Board operations

The skills speak only in these seven operations. The project layer names the adapter that
performs them: its kind, and for each operation the command or tool call.

| Operation | What it does | GitHub Issues, through `gh` |
| --- | --- | --- |
| create | Creates a ticket from `ticket.template.md` or `release.template.md`, in its first state, with its type | `gh issue create --title "<title>" --body-file <file> --label ticket:backlog --label type:<type>` |
| read | Reads a ticket: its body and every comment | `gh issue view <id> --comments` |
| move | Moves a ticket from one state to the next | `gh issue edit <id> --remove-label ticket:<from> --add-label ticket:<to>` |
| comment | Adds a question, an answer, a plan or a link to evidence | `gh issue comment <id> --body-file <file>` |
| link | Links a branch or a pull request to the ticket | the pull request body names `Refs #<id>`, then `gh issue comment <id> --body "Branch <b>, PR <url>"` |
| read version | Reads a ticket's target version, or every ticket that targets a version | `gh issue view <id> --json milestone --jq .milestone.title`; for a version, `gh issue list --milestone "<version>" --state all` |
| set version | Sets or moves a ticket's target version (§ Target version) | `gh issue edit <id> --milestone "<version>"`, the milestone created once with `gh api repos/{owner}/{repo}/milestones -f title="<version>"` |

The three kinds of adapter:

- **(a) `gh`, GitHub Issues** — the template's default, mapped above. A ticket is an issue, a
  state is a `ticket:<state>` label (§ States and transitions), the type is a `type:<type>` label,
  a comment is an issue comment, and the target version is the issue's milestone: a release
  version is a milestone, and its release ticket lists the milestone's issues. The pull request
  links the issue with `Refs #<id>`, never `Closes`, so the merge does not close it: the
  architect does, at Closed, with `gh issue close <id>`.
- **(b) an MCP connector** — Notion, Jira or Linear. The project layer names the tool call each
  operation maps to.
- **(c) the project's own scripts** — the project layer names the command each operation runs.
  Certifipago, for example, drives a Notion database through its scripts/board/ client with a
  `verify:board-config` gate, its state in the field `Estado` and the target version in a select
  named Versi&oacute;n; the template ships no script adapter.

A `move` makes only a transition of the table below, and only one the session's role may make.

---

## States and transitions

The project layer maps its own state names onto these.

| State | Entered by | Then the notifier tells | GitHub label |
| --- | --- | --- | --- |
| Backlog | PO creates the ticket | Architect: `<id> new` | `ticket:backlog` |
| Refinement | Architect takes it; a release ticket is created here | none (the owner approves the specs in the architect's session when the spec mechanism requires it) | `ticket:refinement` |
| Ready for dev | Architect: plan done, every ticket it depends on Done, no reserved file held by a ticket in flight | the assigned dev session: `<id> ready for dev` | `ticket:ready-for-dev` |
| In dev | Dev picks it up, or picks it up again after Changes requested | none | `ticket:in-dev` |
| Ready for QA | Dev: build and tests done | Architect, then the architect tells the area's QA: `<id> ready for QA, branch <b>` | `ticket:ready-for-qa` |
| In QA | QA picks it up | none | `ticket:in-qa` |
| Changes requested | QA, with a comment; or a red CI or a conflict after Ready to merge | Architect, then the architect tells the dev session: `<id> changes requested` | `ticket:changes-requested` |
| Ready to merge | QA: checks passed and § Ready to merge met | the owner: QA asks whether to merge | `ticket:ready-to-merge` |
| Done | QA merges on the owner's word | Architect: `<id> merged` | `ticket:done` |
| Closed | Architect: after Done when the project declares no deploy target, or once the release that lists the ticket is Released | PO: `<id> closed`, and the PO updates the general plan | `ticket:closed` |
| Ready for prod | Architect: a release ticket that lists Done tickets, § Release stage met | the CI/CD session: `<release-id> ready for prod` | `ticket:ready-for-prod` |
| In release | CI/CD, on the owner's word | none (it runs each deploy target the release touches, in order) | `ticket:in-release` |
| Released | CI/CD, after checking production | Architect: `<release-id> released`; the architect closes the tickets it lists and tells the PO `<release-id> released`, and the PO updates the plan | `ticket:released` |

A failed deploy target sends the release ticket back to Refinement, with a comment. No other
transition exists.

---

## The architect dispatches

Every "ready" state reaches the next session through the architect: dev tells the architect, the
architect tells QA; QA tells the architect, the architect tells dev or the CI/CD session. The
architect also sets the merge order, groups Done tickets into releases and closes tickets. The one
exception is the merge itself: QA asks the owner directly, in its own session (rule 6).

---

## Messages

A message between sessions is one line: the ticket id, the event and, when the next session
needs it, the branch. It carries no requirement, decision or file list: those live on the ticket.

| Line | From, to |
| --- | --- |
| `<id> new` | PO to architect |
| `<id> ready for dev` | architect to the dev session |
| `<id> ready for QA, branch <b>` | dev to architect, then architect to the area's QA |
| `<id> changes requested` | QA to architect, then architect to the dev session |
| `<id> merged` | QA to architect |
| `<id> closed` | architect to PO |
| `<id> question` | any session to the owner of the answer: the PO for scope, the architect for the plan, the dev session for its build |
| `<id> scope changed` | PO to architect |
| `<id> version change` | architect to PO: a move of the target version, proposed on the ticket |
| `<id> version set` | PO to architect: the move confirmed and set |
| `<release-id> check on staging` | architect to the QA of each area the release touches |
| `<release-id> staging checked` | QA to architect |
| `<release-id> ready for prod` | architect to the CI/CD session |
| `<release-id> <target> failed` | CI/CD to architect |
| `<release-id> released` | CI/CD to architect, then architect to PO |

A question is asked on the ticket first (`comment`), then announced with its one line; the answer
goes back into the ticket. A message reaches a session through whatever the runtime offers.

---

## Roles

A project declares in its layer which roles exist and which session fills each. More than one
session may fill a dev role; exactly one QA session fills each dev area's QA role.

| Role | Responsibility | Skill |
| --- | --- | --- |
| PO | Turns a client requirement into a ticket, quoting the client verbatim; owns scope, and every change of scope goes through it; updates the general plan when a ticket closes | `po-ticket` |
| Architect | Refines a ticket into specs and a technical plan (areas, subtasks, reserved files, dependencies); dispatches every transition; sets the merge order; groups releases; closes tickets; creates technical tickets | `refine-ticket` |
| Dev | One or more sessions per area (App, Web, Backend): builds a ticket in its own worktree and branch, test first | `dev-ticket` |
| QA | One per area, Backend included: checks out the branch, runs the area's end-to-end checks with evidence, returns the ticket or makes it ready to merge, merges on the owner's word; checks a release on staging | `qa-ticket` |
| CI/CD | One session runs every deploy target and never decides whether to release: the owner's word does, per release and per irreversible step | `release-ticket` |
| Independent area | Such as Marketing: works its own tickets without a PO unless the client asks, reviews its own work, gets the owner's sign-off, and joins the full flow only when it touches the product | none |

---

## Rules every role follows

1. **Scope guard.** A request made directly to any session is checked against the tickets in
   flight. If it changes a ticket's scope, the session answers that it must go through the PO and
   does not do it. A request with no ticket behind it gets a ticket first; the architect may
   create a technical ticket itself.
2. **One worktree per ticket.** Dev builds in its own worktree, on the branch
   `<type>/<id>-<slug>` (§ Ticket identity), cut from the default branch, or from `production`
   for a hotfix. The pull request links the ticket.
3. **Subagent hygiene.** A session may split its task into subagents or subsessions. Each one is
   deleted as soon as it finishes, and none is left idle. No session duplicates another session
   that already exists for a job.
4. **Merges stay the owner's.** QA asks the owner before merging. Every deploy and every merge to
   `production` is the owner's word. Anything irreversible (a production migration, a store
   submission, a release) needs the owner's word, whatever the state. The project layer records
   the merge policy; `manual`, the default, is this rule as written.
5. **Independent QA.** The session that built a ticket never moves it past Ready for QA.
6. **Approval in place.** An approval counts only in the session that asked for it. A relay from
   another session does not stand in for it.
7. **Credentials stay out of tickets.** A deploy secret, token or password never goes into a
   ticket, a comment or a message: it lives in the host or CI secret store a deploy target names.

---

## Ticket identity

- **Id** — as the board writes it: a number (a GitHub issue, `123`, written `#123`) or a key
  (`PROJ-42`).
- **Type** — `feature`, `fix`, `tech` or `chore`; `release` for a release ticket, which has no
  branch of its own.
- **Branch** — `<type>/<id>-<slug>`, the slug lower-case kebab: `feature/123-add-sign-in`,
  `fix/PROJ-42-null-total`. `scripts/verify-ticket-branch.mjs` checks the branch and that the
  pull request body names the id; a project may run it in its CI
  (`pnpm verify:ticket-branch --branch "$HEAD_REF" --body "$PR_BODY"`), a decision its layer
  records.
- **Pull request body** — names the id (`Refs #123`, or the key), the test plan and the Risk line.
- **Commit type** — the Conventional Commit type of the ticket's commits:

| Ticket type | Commit type |
| --- | --- |
| `feature` | `feat` |
| `fix` | `fix` |
| `tech` | the one that describes the change: `refactor`, `perf`, `test`, `build`, `ci` or `docs` |
| `chore` | `chore` |

A plan that spans several areas is split by the architect into one ticket per area, linked by
their dependencies, so each ticket has one dev session, one branch and one QA session.

---

## Target version

- A ticket carries the version it is aimed at, so the CI/CD session knows which tickets a
  release ships. The PO proposes it when it creates the ticket (`set version`); the architect
  confirms it during refinement, or proposes a correction.
- Moving a target version changes a commitment, so it goes through the PO: the architect proposes
  the move on the ticket (`comment`) and messages the PO `<id> version change`; the PO confirms
  it, sets it (`set version`), updates the general plan and messages the architect
  `<id> version set`.
- A release is one version: its release ticket lists every ticket whose target version is that
  version (`read version`).

---

## What a ticket carries

Written from `ticket.template.md`, in this folder; a release ticket from `release.template.md`.

- the client's requirement, verbatim;
- acceptance criteria;
- its target version;
- the link to its spec, never a copy of the spec;
- the areas and subtasks, with the files each one reserves and the tickets it depends on;
- the test plan: unit tests and the end-to-end flows by id;
- the branch and the pull request;
- the QA evidence: a link to the pull request comment that holds it;
- the risk line;
- every question and answer, as comments.

---

## Ready to merge

QA moves a ticket to Ready to merge only when all three hold:

1. the pull request's CI is green;
2. it has no conflict with its base branch: the default branch, or `production` for a hotfix;
3. its branch contains the base branch's current tip. QA brings it current (merge or rebase, as
   the project layer says), pushes, re-runs the checks, and only then asks the owner. A pull
   request that was conflict-free and green but behind its base turned Certifipago's master red
   (its #841).

**Merges are serialized**, one at a time, in the order the architect records on the tickets. QA
asks the owner only for the ticket at the head of that order; after each merge, the next ticket
is brought current again and re-checked before it is asked.

A red CI or a conflict after Ready to merge sends the ticket back to Changes requested, with a
comment.

---

## Release stage

A project whose layer declares deploy targets ships its Done tickets in releases. The architect
groups them (`refine-ticket` § Group a release) and the CI/CD session deploys them
(`release-ticket`). A project with no deploy target closes a ticket after Done.

- A **release ticket** has the type `release`, ships one version V, is created in Refinement,
  and lists every ticket whose target version is V.
- It enters **Ready for prod** only when every ticket it lists is Done, the default branch's CI
  is green, and the QA of each area the batch touches has checked it on staging or preview, with
  evidence on the release ticket.
- A release ships everything merged since the last one, so before **In release** the CI/CD
  session flags every merged ticket aimed at a later version: each one sits behind a feature
  flag, or its target version moves (§ Target version).
- It enters **In release** on the owner's word, and each irreversible step needs its own word,
  recorded on the release ticket.
- It enters **Released** once every deploy target it touches passed its check in production.
- The default branching (a long-lived `production` branch), its tags-only alternative, the deploy
  target kinds, the migration rules and the hotfix live in `release-ticket`.

---

## CONTRACT

```yaml
# skill: ticket-flow — the contract; it emits nothing itself.
reads:
  - docs/process/ticket-flow.md # the project layer, written by process-intake
ships:
  - .claude/skills/ticket-flow/ticket.template.md
  - .claude/skills/ticket-flow/release.template.md
read_first_by: [po-ticket, refine-ticket, dev-ticket, qa-ticket, release-ticket, process-intake]
board_operations: [create, read, move, comment, link]
validated_by: verify:ticket-branch:test # scripts/verify-skills.mjs judges the structure only
done_when: the session knows its role, its adapter and the next state of its ticket
```

---

## Output

Every role, after acting on a ticket, replies with these lines, once per ticket it moved:

```text
Ticket: <id> — <from state> → <to state>
Board: <each operation run, with its command or tool call>
Message: <the one line sent, and the session it went to> | none
Pending: <the question on the ticket, or the owner's word awaited> | none
```
