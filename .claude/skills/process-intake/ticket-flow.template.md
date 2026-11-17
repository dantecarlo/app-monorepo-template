# Ticket flow — <project>

> Written by `process-intake` on <YYYY-MM-DD> from the source below. The core is
> `.claude/skills/ticket-flow/SKILL.md`, which projects never fork; this file is the project's
> layer, and every ticket skill reads it first. Change it through `process-intake`.

## Board adapter

- **Kind:** <`gh`, GitHub Issues | `mcp`, the connector | `scripts`, the project's own>
- **Board:** <the repository, database or project, with its link>

| Operation | Command or tool call |
| --- | --- |
| create | `gh issue create --title "<title>" --body-file <file> --label ticket:backlog --label type:<type>` |
| read | `gh issue view <id> --comments` |
| move | `gh issue edit <id> --remove-label ticket:<from> --add-label ticket:<to>` |
| comment | `gh issue comment <id> --body-file <file>` |
| link | the pull request body names `Refs #<id>`, then `gh issue comment <id> --body "Branch <b>, PR <url>"` |
| read version | `gh issue view <id> --json milestone --jq .milestone.title`; for a version, `gh issue list --milestone "<version>" --state all` |
| set version | `gh issue edit <id> --milestone "<version>"` |

## States

| Core state | This project's name |
| --- | --- |
| Backlog | Backlog |
| Refinement | Refinement |
| Ready for dev | Ready for dev |
| In dev | In dev |
| Ready for QA | Ready for QA |
| In QA | In QA |
| Changes requested | Changes requested |
| Ready to merge | Ready to merge |
| Done | Done |
| Closed | Closed |
| Ready for prod | Ready for prod |
| In release | In release |
| Released | Released |

## Roles and sessions

| Role | Session | Area |
| --- | --- | --- |
| PO | <session name> | all |
| Architect | <session name> | all |
| Dev | <session name, one row per session> | <App, Web or Backend> |
| QA | <session name, one per dev area> | <the area it checks> |
| CI/CD | <session name> | every deploy target |
| Independent area | <session name, such as Marketing> | <its own tickets> |

## Approvals

- **Specs:** <such as: SDD proposals, approved by the owner in the architect's session>
- **Pushing a branch and opening a pull request:** <dev does it | ask the owner first>
- **Other:** <any approval the team names, and where it is given>

## Merge policy

- **Policy:** `manual`
- **What each policy allows:** `manual`, the default, keeps a human in the loop: QA asks the
  owner for every merge. `low-risk` lets QA merge, without asking, a pull request that meets every
  condition of `ticket-flow` rule 4 (Ready to merge into the default branch, at the head of the
  merge order, its Risk line `Risk: none` or only passive files, and no irreversible step), and
  record that merge on the ticket; any other pull request waits for the owner, as under `manual`.
- **What no policy covers:** a merge to `production`, a deploy, a production migration, a store
  submission and every other irreversible step stay the owner's word.
- **Bringing a branch current:** <merge | rebase>
- **Merge method:** <merge commit | squash | rebase>

## Ticket identity

- **Id:** <`#123`, a GitHub issue | a key such as `PROJ-42`>
- **Target version:** <the issue's milestone | the board field that holds it>
- **Types:** `feature`, `fix`, `tech`, `chore`, and `release` for a release ticket

## Branch check in CI

- **Runs in CI:** <no | yes, in the workflow <path>>
- When yes, every pull request into the default branch runs
  `pnpm verify:ticket-branch --branch "$HEAD_REF" --body "$PR_BODY"`; the release pull request
  into `production`, whose head is the default branch, skips it.

## Deploy targets

<None: this project has no release stage, and a ticket closes after Done. Otherwise one row per
target, in the order a release runs them.>

| Target | Kind | Trigger | Order | Check | Rollback | Secrets in |
| --- | --- | --- | --- | --- | --- | --- |
| <name> | <host branch, CLI, OTA update, store build or migration push> | <what starts it> | <1 to n> | <how production is checked> | <how it is undone; a migration: forward fix only> | <the host or CI secret store> |

## Branching model

- **Model:** <the default, a long-lived `production` branch | tags only>
- **Default branch:** <name>, deployed to <staging or preview>
- **Production:** <the `production` branch | the tags `web-vX` and `app-vX` on the default branch>
- **Mobile tag:** `app-vX.Y.Z`
- **Store track:** named by the owner for each release

## Source

- <the link, read through <connector> on <YYYY-MM-DD> | pasted by <who> on <YYYY-MM-DD> | the
  core defaults, confirmed by the team on <YYYY-MM-DD>>
