# Proposal: the ticket flow, seven skills every project adopts and a branch check

> **Status:** open

## Why

Certifipago runs one product with several long-lived Claude Code sessions: a requirements owner,
an architect, dev sessions per area and QA sessions per area. Passing context from one session to
the next contaminates each one and drifts. The owner approved a portable specification of a flow
in which the ticket is the only carrier of context, and sent it to the template to evaluate, build
and return its changes. It is copied verbatim into this folder as `source-spec.md`, so this record
does not depend on another session's scratchpad. The template has no skill for any role of it, no
board, and no check of a ticket branch.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-16 at 12:23, relayed by the Certifipago - Arquitecto session (translated from Spanish):
  "all of this ... needs its own skill or subagent, and it can be decoupled, and send it to the
  template so it also evaluates and executes it and sees whether it needs any change, and if it
  does, tells you, so both stay on par and the template is used as the base"
- 2026-11-16, relayed the same way (translated from Spanish): a session may split its work into
  subagents or subsessions; each one is deleted as soon as it finishes; none stays idle; and no
  session duplicates one that exists.
- 2026-11-16 at 12:38, the release stage, § 8b of the source (translated from Spanish): "when a
  group of tickets is ready, mark them ready for prod and there ask its corresponding CI/CD to
  launch the deploy ... we also need a strategy, which must also be adaptable, for the web
  deployment. It can be a branching"; and, approving § 8b as written (translated from Spanish):
  "I approve it"
- 2026-11-16 at 12:52, the target version (translated from Spanish): "that the PO and the
  architect put, in some field of the ticket, which version the ticket they create is aimed at.
  That way the CI/CD will know which tickets to deploy"

Two corrections from Certifipago's Arquitecto, accepted by the coordinator on 2026-11-16, are
applied below: the board adapter has three kinds of filler, and Ready to merge requires the
default branch's current tip. The release stage the owner approved at 12:38 is § 8b of the same
file, copied with it, and built here with the template's changes to it; the target version the
owner asked for at 12:52 is not in the source, and is built here as changes to it.

## What changes

- **Seven skills** under `.claude/skills/`, each in the shape `.claude/skills/new-skill/SKILL.md`
  sets (frontmatter, USE WHEN and DO NOT USE, a CONTRACT and an Output):
  - `ticket-flow`, the contract every role reads first: the pre-flight, the board operations and
    their GitHub Issues mapping, the states and transitions, the architect as dispatcher, the
    one-line messages, the roles, the rules, the ticket identity, the target version, what a
    ticket carries, the Ready to merge conditions, the release stage, and two templates: `ticket.template.md`, the body a
    ticket is written from, and `release.template.md`, the body of a release ticket;
  - five role procedures, `po-ticket`, `refine-ticket`, `dev-ticket`, `qa-ticket` and
    `release-ticket` (the CI/CD role), each opening with "read `ticket-flow` first" and never
    restating it; `release-ticket` holds the deploy targets, the default branching and its
    tags-only alternative, the migration rules and the hotfix;
  - `process-intake`, which writes a project's layer, docs/process/ticket-flow.md, from
    `ticket-flow.template.md` in its own folder.
- **The skills' structural check.** No gate checks a skill's shape today, so
  `scripts/verify-skills.mjs` (pure) and `scripts/verify-skills.test.mjs` hold the seven to their
  sections: the shape above, every state, role and board operation named, the role skills'
  opening and the two tables they must not copy, and the three templates' sections.
- **The branch check.** `scripts/verify-ticket-branch.mjs`, pure and tested, checks a branch
  `<type>/<id>-<slug>` and that the pull request body names the same id. `pnpm verify:ticket-branch`
  runs it; it is not in `validate`. `pnpm verify:ticket-branch:test` runs its test and the skills'
  structural test, and is in `validate`, because both run offline.
- **The router and the docs.** A `process` table in the `AGENTS.md` router with the seven skills;
  `docs/harness.md`, `docs/maps/global-map.md`, `.claude/skill-registry.md` and the
  `template.manifest.json` claims of every new file.
- **The living spec.** `openspec/specs/harness/ticket-flow/spec.md`, prefix `TICKET`, with its row
  in `openspec/README.md` § 2.1, next to harness/mcp.

## Changes to the source spec

The template's answers to the source's § 9, and every change it makes to the source:

1. § 9, one skill or five: the six skills § 7 lists, plus `release-ticket` for § 8b; the five role skills are procedures that open with "read `ticket-flow` first" and never restate it.
2. Skills, not subagents: a role is played by a whole long-lived session, so the unit is a skill that session loads; a session may still use subagents for its own subtasks, under § 5 rule 3.
3. The board is a declared interface of operations (create a ticket, read it, move its state, comment, link a branch or PR, and the two of item 48), and the skills speak only in those operations (decision 51).
4. A project fills the board interface with one of three kinds: (a) `gh`, GitHub Issues, the template's default; (b) an MCP connector (Notion, Jira or Linear); (c) the project's own scripts.
5. The project layer names the adapter kind and, for each operation, the command or tool call that performs it.
6. Example of kind (c), not shipped by the template: Certifipago's scripts/board/board-client.mjs, board-config.mjs and board-check.mjs, driven by .agents/board.config.json and a Notion REST token with the state field `Estado`, with a plan-to-board sync and a `verify:board-config` gate.
7. The GitHub Issues mapping: a ticket is an issue, a state is a `ticket:<state>` label, the type is a `type:<type>` label, a comment is an issue comment, and the pull request links the issue with `Refs #<id>`, so the architect, not the merge, closes it at Closed.
8. With no board adapter in the project layer, every ticket skill stops and sends the team to `process-intake`; no skill invents a board.
9. A ticket enters Ready for dev only when every ticket it depends on is Done.
10. Two tickets that reserve the same file are sequenced by the architect: the second depends on the first, or one is re-planned.
11. Ready to merge requires the pull request's CI green, no conflict with the default branch, and the branch containing the default branch's current tip.
12. QA brings the branch current (merge or rebase, as the project layer says), re-runs the checks, and only then asks the owner; the reason: a pull request that was conflict-free and green but behind its base turned Certifipago's master red (its #841).
13. Merges are serialized, one at a time, in the order the architect sets and records on the tickets; after each merge, the next ticket in the queue is brought current again before it is asked.
14. A red CI or a conflict after Ready to merge sends the ticket back to Changes requested, with a comment.
15. A ticket has an id and a type (`feature`, `fix`, `tech`, `chore`); its branch is `<type>/<id>-<slug>`, and the pull request body names the id (`#<number>` for a numbered id, the key itself for a keyed one such as `PROJ-42`).
16. The ticket type maps to the Conventional Commit type of its commits: `feature` to `feat`, `fix` to `fix`, `chore` to `chore`, and `tech` to the one that describes the change (`refactor`, `perf`, `test`, `build`, `ci` or `docs`).
17. § 9, where QA evidence lives: in a pull request comment, screenshots attached for a UI area and query or test output as text for a backend area; the ticket links that comment; large artefacts, such as Playwright traces, stay CI artefacts linked the same way; nothing goes into the repository.
18. Verification reuses what exists: `dev-ticket` builds test first under the project's workflow (`sdd` when a living spec changes), runs `validate-all` and `pnpm validate`, and writes its Risk line as `AGENTS.md` says; `qa-ticket` runs the area's end-to-end checks with `docs/e2e.md` and `runtime-verify`; neither restates them.
19. § 9, how `process-intake` reads a link: through an MCP connector when one is configured (Notion, Atlassian), through a plain fetch only for a public page, otherwise it asks the team to paste the document; it never scrapes a page that needs a login.
20. § 9, with nothing to read: `process-intake` proposes the core states as the defaults and asks the team to confirm them.
21. `process-intake` writes docs/process/ticket-flow.md from a template in its folder, with a section for the adapter kind and its per-operation mapping, the state names mapped onto the core, the roles and sessions, the approvals, the merge policy, the ticket identity and the branch check in CI.
22. The template has no `/init` yet (Stage 6), so `process-intake` ships as a standalone skill that `/init` will call.
23. § 9, a gate that checks the board: none is added to `validate`, because the template's own branches carry no ticket ids and checking the board needs the network; `scripts/verify-ticket-branch.mjs` is the pure check a project may add to its CI, a decision its project layer records.
24. § 4, a question message: a session that asks on the ticket messages the owner of the answer with the one line `<id> question`.
25. § 2, a change of scope: the PO records it on the ticket, quoting the client verbatim, and messages the architect `<id> scope changed`, so the architect re-refines it.
26. § 7, the ticket template: `ticket-flow` ships it as `ticket.template.md`, one section per item of § 6, and `po-ticket` writes a ticket from it.
27. The seven skills are routed in a `process` table of the `AGENTS.md` router, `release-ticket` included.
28. § 8b, the release states: Ready for prod, In release and Released follow Done, with their transitions and notifier lines, the CI/CD role joins the roles table, and `release-ticket` is its skill.
29. Ready for prod requires every listed ticket Done, the default branch's CI green, and the batch checked on staging or preview by the QA of each touched area, with evidence on the release ticket.
30. While that evidence is gathered the release ticket sits in Refinement: the architect asks each touched area's QA with `<release-id> check on staging`, QA answers `<release-id> staging checked`, and a failed check becomes a fix ticket the release then lists, or its feature is switched off by its flag, before the release moves on.
31. Deploy targets are adapters declared in the project layer like the board adapter; each declares its kind (a branch a host deploys, a CLI, an over-the-air update, a store build, a migration push), its trigger, order, check and rollback, and the secret store it reads.
32. A mobile target declares whether a change ships as an over-the-air update (JS-only, the same runtime version) or needs a store build (a native change); they are two target kinds.
33. Migrations in a release are backward compatible, expand then contract in a later release, because a mobile app version already in the store keeps running against the new schema for days; a migration that would break the live app or web has its contract step split into its own later release.
34. A migration has no rollback beyond a forward fix, and its target says so.
35. The release ticket carries the listed tickets, the version per target, the migrations, the changelog, the rollback per target, the staging evidence and the owner's go for each irreversible step, recorded on the ticket; `ticket-flow` ships it as `release.template.md`.
36. Credentials stay out of tickets: deploy secrets live in the host or CI secret store the target names, and a ticket never holds one.
37. A failed target runs that target's declared rollback and stops the release: the release ticket goes back to Refinement with a comment, and the CI/CD role messages the architect `<release-id> <target> failed`.
38. Every deploy and every merge to `production` stays the owner's word (§ 5 rule 4), per release and per irreversible step, given in the CI/CD session and recorded on the release ticket.
39. A hotfix is a ticket of type `fix` on a branch from `production`; it goes through QA like any other ticket, its Ready to merge asks for `production`'s current tip instead of the default branch's, and after it ships `production` merges back into the default branch on the owner's word.
40. The default branching of § 8b is the recommended one and the tags-only alternative is described beside it, both in `release-ticket`; the template ships no `production` branch of its own, it is the default a project's layer adopts.
41. With a release stage, the architect closes the tickets a release lists once it is Released and messages the PO `<release-id> released`; a project with no deploy targets closes a ticket after Done, as § 3 says.
42. A release ticket has the type `release` and no branch of its own; the release pull request, from the default branch to `production`, is merged and never rebased, and a project's branch check in CI skips it.
43. `process-intake` asks for the deploy targets and the branching model, and the process-layer template has a section for each.
44. A plan that spans several areas is split by the architect into one ticket per area, linked by their dependencies, so each ticket has one dev session, one branch and one QA session.
45. The ticket's target version: a ticket carries the version it is aimed at, the PO proposes it when creating the ticket (`po-ticket`), the architect confirms or corrects it during refinement (`refine-ticket`), and § 6 lists it among a ticket's contents.
46. A release is one version: the release ticket for version V lists every ticket whose target is V, and reaches Ready for prod only when all of them are Done, on top of the earlier Ready for prod conditions.
47. A merged ticket aimed at a later version: a release ships everything merged since the last one, so before In release `release-ticket` flags every merged ticket whose target is a later version, and each one sits behind a feature flag or its target moves; this holds for a tag on the default branch as well as for the `production` branch.
48. Moving a target version changes a commitment, so it goes through the PO: the architect proposes the move on the ticket and messages the PO `<id> version change`; the PO confirms it, sets it, updates the plan and messages the architect `<id> version set`; a correction during refinement is such a move.
49. The board adapter's operations gain `read version` and `set version`; in the GitHub Issues default the target version is the issue's milestone (`gh issue edit --milestone`), a release version is a milestone, and the release ticket lists the milestone's issues.
50. Example only, not shipped: Certifipago's script adapter maps the target version to a Notion select named Versi&oacute;n.

## Out of scope

- A gate that reads the board, or an open pull request's state: it needs the network and a
  token; decision 9 of the brief keeps it out of `validate`.
- Wiring `verify:ticket-branch` into this template's CI: its own branches carry no ticket ids.
- An MCP or script board adapter: the template ships the GitHub Issues mapping; a project writes
  its own in its layer.
- A `production` branch, a deploy job or a host configuration in the template: § 8b's branching is
  the default a project adopts; the template's own repository deploys nothing.
- `/init` calling `process-intake`: `/init` is Stage 6; the coordinator adds the row to the plan's
  `/init` table.
- The other skills of `.claude/skills/`: the structural check judges only the seven ticket skills,
  as most others carry no DO NOT USE, CONTRACT or Output yet.

## Affected specs

- `openspec/specs/harness/ticket-flow/spec.md` (new): added TICKET-01 to TICKET-19.

## Open questions

- **Q1** — Decision 38 of `docs/INIT_AND_HARNESS_PLAN.md` defines a `low-risk` merge policy,
  under which an agent may merge a green, up-to-date pull request whose Risk line is `none`; the
  source's § 5 rule 4 says merges stay the owner's. The skills keep rule 4 and record the policy in
  the project layer; should a `low-risk` project let QA merge without asking?
- **Q2** — `verify:ticket-branch:test` runs both offline tests of the flow, the branch check's and
  the skills' structural one, because the brief allows only the two `verify:ticket-branch` scripts.
  A separate `verify:skills:test` would name the second one honestly; the owner decides.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
