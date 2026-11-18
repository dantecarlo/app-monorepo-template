# <release-id> — release <version or date>

> **Type:** release · created in Refinement

The body of a release ticket of the ticket flow (`.claude/skills/ticket-flow/SKILL.md`). The
architect writes it (`refine-ticket` § Group a release), the QA of each touched area adds the
staging evidence (`qa-ticket`), and the CI/CD session records the owner's go and each target's
result (`release-ticket`). No credential ever goes in it: a target names the secret store it
reads.

## Version

This release ships <V>. It lists every ticket whose target version is <V>, read from the board
(`read version`), and each one is Done before it reaches Ready for prod, except a hotfix, which is
at Ready to merge into `production` with every Ready to merge condition met against
`production`'s current tip: the CI/CD session merges it as this release's deploy step.

## Tickets

| Ticket | Title | Area | State |
| --- | --- | --- | --- |
| <id> | <title> | <Web> | <Done, or Ready to merge into `production` for a hotfix> |

Merged since the last release but aimed at a later version, each settled before In release:

| Ticket | Target version | Settled by |
| --- | --- | --- |
| <id> | <a later version> | <behind the feature flag <name>, or its target moved to <V>, confirmed by the PO> |

## Versions per target

| Target | Version |
| --- | --- |
| <web> | <the `production` commit, or `web-vX.Y.Z`> |
| <app> | `app-vX.Y.Z`, runtime version <n>, shipped as <an over-the-air update or a store build> |

## Migrations

| Migration | Step | Backward compatible | Rollback |
| --- | --- | --- | --- |
| <file> | <expand, or contract> | <yes: the store version <v> of the app keeps working> | forward fix only |

## Changelog

- <one line per ticket, in the client's terms>

## Rollback

| Target | Rollback |
| --- | --- |
| <web> | <redeploy the previous production commit> |
| <migrations> | forward fix only |

## Staging evidence

| Area | QA session | Evidence |
| --- | --- | --- |
| <Web> | <session> | <the link to the comment> |

## Owner's go

| Step | The owner's words | Date | Session |
| --- | --- | --- | --- |
| the release | "<words>" | <YYYY-MM-DD> | <the CI/CD session> |
| <each irreversible step: a production migration, a store submission, the merge to `production`> | "<words>" | <YYYY-MM-DD> | <the CI/CD session> |
