---
name: release-ticket
description: >
  The CI/CD role of the ticket flow: takes a release ticket in Ready for prod, gets the owner's
  word, runs every deploy target the release touches in the project's order (each irreversible
  step on its own word), checks each one, rolls a failed one back as it declares, checks
  production and moves the release to Released. Holds the deploy target kinds, the default
  branching with a `production` branch and its tags-only alternative, the migration rules and the
  hotfix. Never decides whether to release.
  USE WHEN: "<release-id> ready for prod", "deploy the release", "ship to production", "ship the
  hotfix", "which branch deploys what", a CI/CD session of the ticket flow starts work.
  DO NOT USE: grouping tickets into a release (the architect's `refine-ticket`), checking a batch
  on staging (`qa-ticket`), or a project whose layer declares no deploy target (run
  `process-intake`).
---

# Release ticket — the CI/CD role: deploy a release target by target, on the owner's word

Read `ticket-flow` first (`.claude/skills/ticket-flow/SKILL.md`), its pre-flight included: this
procedure uses its board operations, states, messages and rules and never restates them. It also
reads the deploy targets and the branching model of docs/process/ticket-flow.md; a layer that
declares no deploy target → stop and send the team to `process-intake`.

---

## Step 1 — Read the release

On `<release-id> ready for prod`: `read` the release ticket. It carries the tickets it lists, the
version per target, the migrations, the changelog, the rollback per target and the staging
evidence of every touched area, for one version V. Something missing, a ticket whose target
version is V not listed or not Done (`read version`), or the default branch's CI red →
`comment` it, message the architect `<release-id> question`, and stop.

**Merged for a later version.** A release ships everything merged since the last one, under the
default branching and a tag on the default branch alike. List every ticket merged since the last
release, and `read version` for each: one whose target is later than V is flagged on the release
ticket (`comment`), and the architect is messaged `<release-id> question`. Each flagged ticket
sits behind a feature flag the architect names, or its target version moves to V through the PO.
Go on only once every flagged ticket is settled on the release ticket.

---

## Step 2 — The owner's word for the release

Ask in this session: "`<release-id>`: `<n>` tickets, targets `<target, in order>`, migrations
`<list>`. Release it?" Wait. This session runs targets; it never decides to release.

- **Yes** → record the go in the release ticket's Owner's go (the words, the date, this
  session), then `move` it to In release.
- **No** → `comment` the answer; the release stays in Ready for prod.

---

## Step 3 — Each target, in order

Run the targets the release touches in the order the project layer declares; migrations first
in the default branching. For each target:

1. An irreversible step (a production migration, a store submission, the merge to `production`)
   → ask the owner for that step in this session, and record the go on the release ticket.
2. Trigger it as the target declares. Its secrets come from the store the target names: never
   from the ticket, and never printed.
3. Run its check.
4. **Fails** → run its declared rollback (a migration has none beyond a forward fix: stop),
   `comment` the result, `move` the release back to Refinement, message the architect
   `<release-id> <target> failed`, and run no later target.
5. **Passes** → `comment` the version it shipped and its check's result.

---

## Step 4 — Check production, then Released

Run every touched target's check against production and smoke-check the flows the changelog
names, `comment` the result, `move` the release to Released, and message the architect
`<release-id> released`.

---

## Deploy targets

A deploy target is an adapter, declared in the project layer like the board adapter. Each one
declares its kind, its trigger, its order, its check, its rollback and the secret store it reads.

| Kind | What ships | A trigger, for example | Rollback |
| --- | --- | --- | --- |
| host branch | a branch a host deploys | the merge of the release pull request into `production` | redeploy the previous production commit |
| CLI | what a command deploys | `<cli> deploy --prod` | the CLI's own rollback, or the previous version |
| OTA update | a mobile JS-only change on the same runtime version | `eas update --branch production` | republish the previous update |
| store build | a mobile native change, a new runtime version | the tag `app-vX.Y.Z`, then the build and the submission to the store track the owner names | a new build: a reviewed submission is not undone |
| migration push | schema migrations | the push of the release's migrations to the production project | a forward fix only |

A mobile target declares which of the two a change takes: an over-the-air update when only
JavaScript changed and the runtime version is the same, a store build when native code or the
runtime version changed. Certifipago, for example, declares a host branch (Vercel, its production
branch moved to `production`), a store build (EAS build and Play submit, run by its CI/CD
session) and a migration push (Supabase, to the production project).

---

## Branching

**The default, recommended:**

- The default branch is integration, deployed to staging or preview; QA works there.
- A long-lived `production` branch is what is live.
- A web release is a pull request from the default branch to `production`, merged on the owner's
  word and never rebased; the host deploys it. A project's branch check in CI skips that pull
  request, whose head is the default branch.
- A mobile release is a tag, `app-vX.Y.Z`, on that `production` commit; this session builds it
  and submits it to the store track the owner names.
- The batch's schema migrations go to production first, on the owner's word, so the web and the
  app find the schema they expect.
- A batch is everything merged since the last release; unfinished work stays behind a feature
  flag or off the default branch.

**The alternative, tags only:** a project may declare tags (`web-vX`, `app-vX`) on the default
branch instead, each tag running a deploy job; it has no `production` branch, and a hotfix is a
`fix` ticket on the default branch shipped by a new tag.

The template ships no `production` branch of its own: the project layer's branching model says
which one a project adopted.

---

## Migrations

- Every migration in a release is backward compatible: it expands the schema, and the contract
  step ships in a later release. A mobile app version already in the store keeps running against
  the new schema for days.
- A migration that would break the live app or web (a dropped or renamed column the live
  version reads) → stop, `comment` that its contract step needs its own later release, and
  message the architect `<release-id> question`.
- A migration has no rollback beyond a forward fix, and its target says so.

---

## Hotfix

1. A hotfix is a ticket of type `fix` on a branch cut from `production` (`dev-ticket` Step 3).
2. It goes through QA like any other ticket; its Ready to merge asks for `production`'s current
   tip, and it is merged into `production` on the owner's word.
3. The architect lists it in a release ticket of its own, and this session ships it with
   Steps 1 to 4.
4. Once it is live, `production` merges back into the default branch, through a pull request
   merged on the owner's word.

---

## CONTRACT

```yaml
# skill: release-ticket — the CI/CD role; the board operations come from ticket-flow.
reads:
  - .claude/skills/ticket-flow/SKILL.md
  - docs/process/ticket-flow.md # its deploy targets and branching model
board_operations: [read, move, comment, read version]
moves:
  - Ready for prod → In release # on the owner's word only
  - In release → Released
  - In release → Refinement # a failed target
messages: ['<release-id> released', '<release-id> <target> failed', '<release-id> question']
validated_by: review
done_when: every touched target passed its check in production and the release is Released
```

---

## Output

The reply block of `ticket-flow` § Output, plus one line per target:

```text
Target: <name> — <kind> — <version> — <check passed | failed, rolled back as declared>
```
