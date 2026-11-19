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
   the deploy targets and the branching model, with the production branch it names.
2. No such file, or one that names no board adapter → **stop** and say: "This project has no
   ticket flow yet: run `process-intake`." Never invent a board, a label or a state.
3. Find the role this session plays in that file. A session plays one role.
4. Load the skill of that role (§ Roles) and follow it.

---

## Board operations

The skills speak only in these seven operations. The project layer names the adapter that
performs them: its kind, and for each operation the command or tool call.

**The board is the source of every open ticket**, its content included: the requirement, the
acceptance criteria, the state, the target version, the plan and every comment. Nothing in the
repository writes or mirrors an open ticket. The general plan records a ticket only once it is
closed, in its § Closed Ticket Catalog (`po-ticket` Step 6); read an open ticket on the board.

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
  version is a milestone, and its release ticket lists the milestone's issues. An issue with no
  milestone has no target version, and that stops it in Refinement (§ Target version). The pull request
  links the issue with `Refs #<id>`, never `Closes`, so the merge does not close it: the
  architect does, at Closed, with `gh issue close <id>`.
- **(b) an MCP connector** — Notion, Jira or Linear. The project layer names the tool call each
  operation maps to.
- **(c) the project's own scripts** — the project layer names the command each operation runs.
  A project may, for example, drive a Notion database through its own board client and a gate
  that checks the board config, with the state and the target version in two of its fields; the
  template ships no script adapter.

A `move` makes only a transition of the table below, and only one the session's role may make.

---

## States and transitions

The project layer maps its own state names onto these.

| State | Entered by | Then the notifier tells | GitHub label |
| --- | --- | --- | --- |
| Backlog | PO creates the ticket | Architect: `<id> new` | `ticket:backlog` |
| Refinement | Architect takes it; a release ticket is created here | none (the owner approves the specs in the architect's session when the spec mechanism requires it) | `ticket:refinement` |
| Ready for dev | Architect: plan done, target version set, every ticket it depends on Done, no reserved file held by a ticket in flight | the assigned dev session: `<id> ready for dev` | `ticket:ready-for-dev` |
| In dev | Dev picks it up, or picks it up again after Changes requested | none | `ticket:in-dev` |
| Ready for QA | Dev: build and tests done | Architect, then the architect tells the area's QA: `<id> ready for QA, branch <b>` | `ticket:ready-for-qa` |
| In QA | QA picks it up | none | `ticket:in-qa` |
| Changes requested | QA, with a comment: from In QA, or from Ready to merge on a red CI or a conflict when it brings the branch current | Architect, then the architect tells the dev session: `<id> changes requested` | `ticket:changes-requested` |
| Ready to merge | QA: checks passed and § Ready to merge met; QA asks no one and merges nothing | Architect: `<id> ready to merge, PR #<n>`, and the architect queues it; for a hotfix into the production branch, `<id> ready to merge, hotfix` | `ticket:ready-to-merge` |
| Done | Architect: merges it from its merge queue, on the owner's word or under the `low-risk` policy (rule 4); for a hotfix, CI/CD merges it into the production branch as its release's deploy step | QA and the dev session: `<id> merged`, sent by the architect; for a hotfix, CI/CD tells the architect, and the architect tells them | `ticket:done` |
| Closed | Architect: after Done when the project declares no deploy target, or once the release that lists the ticket is Released | PO: `<id> closed`, and the PO records it in the general plan's closed ticket catalog | `ticket:closed` |
| Ready for prod | Architect: a release ticket whose tickets are Done, or a hotfix at Ready to merge, § Release stage met | the CI/CD session: `<release-id> ready for prod` | `ticket:ready-for-prod` |
| In release | CI/CD, on the owner's word | none (it runs each deploy target the release touches, in order) | `ticket:in-release` |
| Released | CI/CD, after checking production | Architect: `<release-id> released`; the architect closes the tickets it lists and tells the PO `<release-id> released`, and the PO records the tickets it lists in the general plan's closed ticket catalog | `ticket:released` |

A failed deploy target sends the release ticket back to Refinement, with a comment. No other
transition exists.

---

## The architect dispatches

Every "ready" state reaches the next session through the architect: dev tells the architect, the
architect tells QA; QA tells the architect, the architect tells dev or the CI/CD session. The
architect also sets the merge order and keeps the merge queue: it asks the owner for each merge,
in its own session (rule 6), or merges without asking under the `low-risk` policy (rule 4), one
pull request at a time (`refine-ticket` § Merge queue). It groups Done tickets into releases and
closes tickets. QA asks the owner nothing and merges nothing. The one merge that is not the
architect's is a hotfix's into the production branch: the CI/CD session runs it as the deploy
step of the hotfix's release.

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
| `<id> ready to merge, PR #<n>` | QA to architect: Ready to merge into the default branch, for the merge queue |
| `<id> ready to merge, hotfix` | QA to architect: a hotfix at Ready to merge into the production branch, left there for its release |
| `<id> bring current` | architect to the ticket's QA: a pull request of the merge queue that a merge left behind its base, or whose CI must run again |
| `<id> merged` | architect to the ticket's QA and dev sessions; for a hotfix, CI/CD to architect, then architect to them |
| `<id> closed` | architect to PO |
| `<id> catalog ready to merge, PR #<n>` | PO to architect: the closed ticket catalog pull request of a single close outside a release, for the merge queue |
| `<id> question` | any session to the owner of the answer: the PO for scope, the architect for the plan, the dev session for its build |
| `<id> scope changed` | PO to architect |
| `<id> version change` | architect to PO: a target version proposed on the ticket, a move or the first one of a ticket that has none |
| `<id> version set` | PO to architect: the move confirmed and set |
| `<release-id> check on staging` | architect to the QA of each area the release touches |
| `<release-id> staging checked` | QA to architect |
| `<release-id> ready for prod` | architect to the CI/CD session |
| `<release-id> <target> failed` | CI/CD to architect |
| `<release-id> released` | CI/CD to architect, then architect to PO |
| `<release-id> catalog ready to merge, PR #<n>` | PO to architect: the closed ticket catalog pull request of a release, for the merge queue |

A question is asked on the ticket first (`comment`), then announced with its one line; the answer
goes back into the ticket. A message reaches a session through whatever the runtime offers.

---

## Roles

A project declares in its layer which roles exist and which session fills each. More than one
session may fill a dev role; exactly one QA session fills each dev area's QA role.

| Role | Responsibility | Skill |
| --- | --- | --- |
| PO | Turns a client requirement into a ticket, quoting the client verbatim; owns scope, and every change of scope goes through it; records each closed ticket in the general plan's closed ticket catalog, never an open one | `po-ticket` |
| Architect | Refines a ticket into specs and a technical plan (areas, subtasks, reserved files, dependencies); dispatches every transition; sets the merge order, keeps the merge queue and merges one pull request at a time, on the owner's word or under the `low-risk` policy; groups releases; closes tickets; creates technical tickets | `refine-ticket` |
| Dev | One or more sessions per area (App, Web, Backend): builds a ticket in its own worktree and branch, test first | `dev-ticket` |
| QA | One per area, Backend included: checks out the branch, runs the area's end-to-end checks with evidence, returns the ticket or brings it to Ready to merge and hands it to the architect, brings it current again when the architect asks; merges nothing; checks a release on staging | `qa-ticket` |
| CI/CD | One session runs every deploy target, a hotfix's merge into the production branch included, and never decides whether to release: the owner's word does, per release and per irreversible step | `release-ticket` |
| Independent area | Such as Marketing: works its own tickets without a PO unless the client asks, reviews its own work, gets the owner's sign-off, and joins the full flow only when it touches the product | none |

---

## Rules every role follows

1. **Scope guard.** A request made directly to any session is checked against the tickets in
   flight. If it changes a ticket's scope, the session answers that it must go through the PO and
   does not do it. A request with no ticket behind it gets a ticket first; the architect may
   create a technical ticket itself.
2. **One worktree per ticket.** Dev builds in its own worktree, on the ticket's branch
   (§ Ticket identity; `<type>/<id>-<slug>` by default), cut from the default branch, or from
   the production branch the layer names for a hotfix. The pull request links the ticket.
3. **Subagent hygiene.** A session may split its task into subagents or subsessions. Each one is
   deleted as soon as it finishes, and none is left idle. No session duplicates another session
   that already exists for a job.
4. **Merges follow the merge policy; the irreversible stays the owner's.** The project layer
   records the merge policy; with none recorded, it is `manual`. The architect applies it, in its
   merge queue (`refine-ticket` § Merge queue); QA asks the owner nothing and merges nothing.
   - **`manual`, the default**, keeps a human in the loop: the architect asks the owner before
     every merge.
   - **`low-risk`** lets the architect merge, without asking, a pull request that meets every
     condition: it is Ready to merge into the default branch (CI green, no conflict, its branch
     holding the default branch's current tip) and at the head of the merge queue; its Risk line
     is `Risk: none`, or it changes only passive files; and its merge sets off no irreversible
     step. A passive file is prose documentation or an image: never code, a test, configuration,
     a migration, a workflow, a lockfile, or anything an agent reads as instructions (`AGENTS.md`,
     a skill, an agent). The architect records on the ticket that it merged under `low-risk`,
     with the Risk line it relied on. A pull request that fails one condition, or that the
     architect is unsure of, waits for the owner, as under `manual`.
   - **Under every policy**, every deploy, every merge into the production branch and anything
     irreversible (a production migration, a store submission, a release) needs the owner's
     word, whatever the state. Neither the architect nor QA merges a pull request into the
     production branch: a hotfix waits at Ready to merge, and the CI/CD session merges it as its
     release's deploy step (`release-ticket` § Hotfix).
5. **Independent QA.** The session that built a ticket never moves it past Ready for QA.
6. **Approval in place.** An approval counts only in the session that asked for it. A relay from
   another session does not stand in for it.
7. **Credentials stay out of tickets.** A deploy secret, token or password never goes into a
   ticket, a comment or a message: it lives in the host or CI secret store a deploy target names.

---

## Ticket identity

The shape of an id and of a branch is the project's. Its layer declares them in § Ticket
identity, as one fenced block with the info string `json ticket-identity` that `process-intake`
writes and the branch check reads. The block holds exactly three fields:

| Field | What it holds | Default |
| --- | --- | --- |
| `idPattern` | a regular-expression source for one id, matched whole | a number (`123`) or an upper-case key, a hyphen and a number (`PROJ-42`) |
| `branchTypes` | the prefixes a ticket branch may start with | `feature`, `fix`, `tech`, `chore` |
| `slug` | `required` or `optional` | `required` |

A layer with no block keeps every default; a malformed block is a finding of the branch check,
never a silent default.

- **Id** — as the board writes it, of the shape `idPattern` matches: by default a number (a
  GitHub issue, `123`, written `#123`) or a key (`PROJ-42`).
- **Type** — the ticket type: `feature`, `fix`, `tech` or `chore`; `release` for a release
  ticket, which has no branch of its own.
- **Branch** — `<type>/<id>-<slug>`, or `<type>/<id>` when the slug is optional; the slug
  lower-case kebab: `feature/123-add-sign-in`, `fix/PROJ-42-null-total`. The prefix is one of the
  layer's `branchTypes`: the ticket type by default, or the Conventional Commit type of the table
  below when the layer says so. A layer may, for example, use ids such as `TASK-<slug>` with an
  optional slug, so a branch reads `feat/TASK-min-app-version-app`. When the slug is optional and
  `idPattern` matches everything after the prefix, the branch has no slug: the whole tail is the id,
  and the pull request body must name all of it (`TASK-min-app-version-app`, not `TASK-min-app`).
  `scripts/verify-ticket-branch.mjs` checks the branch under the layer's identity and that the
  pull request body names the id; a project may run it in its CI
  (`pnpm verify:ticket-branch --branch "$HEAD_REF" --body "$PR_BODY"`), a decision its layer
  records.
- **Pull request body** — names the id (`Refs #123`, or the id itself), the test plan and the
  Risk line.
- **Commit type** — always the Conventional Commit type of the ticket's commits, whatever the
  branch prefix:

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

- **Every ticket carries one**, whatever its type (`feature`, `fix`, `tech` or `chore`; a test
  or docs ticket is a `tech` one), so every ticket closes through a release and the CI/CD session
  knows which tickets a release ships. The PO creates no ticket without one (`po-ticket` Steps 2
  and 3). The architect moves none past Refinement without one (`refine-ticket` Steps 1 and 4):
  a ticket with none stops there, and under the GitHub Issues adapter an issue with no milestone
  has none. No gate reads the board, and `scripts/verify-ticket-branch.mjs` judges a branch and
  a pull request body only, so those steps are where the rule is checked.
- The PO sets it when it creates the ticket (`set version`); the architect confirms it during
  refinement, or proposes a correction. Only the PO runs `set version`: the first version of a
  technical ticket the architect files goes through it like a move.
- Moving a target version changes a commitment, so it goes through the PO: the architect proposes
  the move on the ticket (`comment`) and messages the PO `<id> version change`; the PO confirms
  it, sets it (`set version`) and messages the architect `<id> version set`. The board carries
  the move; the general plan names no open ticket, so it does not change.
- A release is one version: its release ticket lists every ticket whose target version is that
  version (`read version`).

---

## What a ticket carries

Written from `ticket.template.md`, in this folder; a release ticket from `release.template.md`.

- the client's requirement, verbatim;
- acceptance criteria;
- its target version, which every ticket carries;
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
2. it has no conflict with its base branch: the default branch, or the production branch the
   layer names for a hotfix;
3. its branch contains the base branch's current tip. QA brings it current by merging the base
   into it (never a rebase, which could not be pushed unforced), pushes, re-runs the checks, and
   only then messages the architect `<id> ready to merge, PR #<n>`; a hotfix it leaves there for
   its release, with `<id> ready to merge, hotfix`. A pull request that was conflict-free and
   green but behind its base has turned a downstream project's default branch red.

**Merges are serialized**, one at a time, in the architect's merge queue (`refine-ticket`
§ Merge queue), in the order the architect records on the tickets, under every merge policy. The
architect asks the owner, or merges under `low-risk`, only for the pull request at the head of
the queue, and only while all three conditions hold. After each merge it messages the QA of the
next one `<id> bring current`: QA brings that branch current and re-checks it before the
architect asks for it or merges it.

The PO's closed ticket catalog pull request (`po-ticket` Step 6) joins the same queue, merged on
the owner's word. It carries no ticket of its own, so it owes none of the three conditions and no
QA brings it current; before the owner is asked for it, the architect checks each row it adds
against its board page (`refine-ticket` § Merge queue).

A red CI or a conflict after Ready to merge sends the ticket back to Changes requested, with a
comment: QA moves it, when it brings the branch current.

---

## Release stage

A project whose layer declares deploy targets ships its Done tickets, and its hotfixes, in
releases. The architect groups them (`refine-ticket` § Group a release) and the CI/CD session
deploys them (`release-ticket`). A project with no deploy target closes a ticket after Done.

- A **release ticket** has the type `release`, ships one version V, is created in Refinement,
  and lists every ticket whose target version is V.
- It enters **Ready for prod** only when every ticket it lists is Done, except a hotfix, which is
  at Ready to merge into the production branch the layer names with every § Ready to merge
  condition met against that branch's current tip; the default branch's CI is green; and the QA
  of each area the batch touches has checked it on staging or preview, with evidence on the
  release ticket. A hotfix
  gets a release of its own, and the CI/CD session merges it as that release's deploy step.
- A release ships everything merged since the last one, so before **In release** the CI/CD
  session flags every merged ticket aimed at a later version: each one sits behind a feature
  flag, or its target version moves (§ Target version).
- It enters **In release** on the owner's word, and each irreversible step needs its own word,
  recorded on the release ticket.
- It enters **Released** once every deploy target it touches passed its check in production.
- **The production branch** is the one the layer's § Branching model names: `production` by
  default, or the project's own name, such as `prod`. Every ticket skill means that branch when
  it says "the production branch".
- The default branching (a long-lived production branch), its tags-only alternative, the deploy
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
validated_by: verify:skills:test # scripts/verify-skills.mjs judges the structure only
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
