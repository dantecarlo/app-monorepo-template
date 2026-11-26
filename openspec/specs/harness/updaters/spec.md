# harness/updaters — living spec

> **Governs:** `.agents/contracts/updaters.json`, `scripts/verify-updaters.mjs`, `scripts/updaters/run.mjs`, `scripts/updaters/branch.mjs`, `scripts/updaters/label.mjs`, `scripts/updaters/steps.mjs`
> **ID prefix:** `UPDATERS`
> **Derived from:** `docs/harness.md`, `docs/INIT_AND_HARNESS_PLAN.md`
> **Verified against the code:** 2026-11-25 at `1539a3f`

## Purpose

The updaters unit of the harness keeps current what drifts on its own, through updaters that all
share one shape. It owns the updater registry, the gate that holds every entry to that shape and
to the rule-proposal rule, and the runner that checks each updater and turns one that is out of
date into a single pull request a person merges. What a given updater updates belongs to its own
unit: the MCP docs updater to harness/mcp. Which paths are rule files belongs to the write guard,
whose own classifier the gate and the runner ask.

## Requirements

### Requirement: UPDATERS-01 — One registry entry per updater, every field declared

The updater registry `.agents/contracts/updaters.json` SHALL hold an `updaters` list whose every
entry has exactly the keys `id`, `command`, `runsIn`, `network`, `secrets`, `writes`, `proposal`
and `verify`; `pnpm verify:updaters` refuses a missing key, an unknown key, an `id` that is not
kebab-case or is listed twice, a `runsIn` that is not a non-empty list of `ci` and `local`,
`network`, `secrets` or `writes` that are not lists of non-empty strings, a `writes` path that is
not repository-relative, and a `proposal` that is not true or false.

**Evidence:** `.agents/contracts/updaters.json:3`, `scripts/verify-updaters.mjs:60-78`, `scripts/verify-updaters.mjs:153-163`, `scripts/verify-updaters.mjs:199-239`, `scripts/verify-updaters.mjs:243-275`

#### Scenario: a registry whose entries are declared

- **GIVEN** a registry with one entry holding every key, each of its shape
- **WHEN** `pnpm verify:updaters` runs
- **THEN** it passes
- **Test:** `scripts/verify-updaters.test.mjs` › "a registry whose every entry is declared passes"

#### Scenario: a key the registry does not know

- **GIVEN** an entry with a `schedule` key
- **WHEN** `pnpm verify:updaters` runs
- **THEN** it fails, naming the entry and the key
- **Test:** `scripts/verify-updaters.test.mjs` › "an entry with a key the registry does not know fires"

#### Scenario: a key left out

- **GIVEN** an entry without `verify`
- **WHEN** `pnpm verify:updaters` runs
- **THEN** it fails, naming the entry and the missing key
- **Test:** `scripts/verify-updaters.test.mjs` › "an entry without its verify key fires"

#### Scenario: where an updater runs

- **GIVEN** an entry whose `runsIn` holds `nightly`
- **WHEN** `pnpm verify:updaters` runs
- **THEN** it fails, naming the value and the two it may use
- **Test:** `scripts/verify-updaters.test.mjs` › "a runsIn value other than ci or local fires"

#### Scenario: the id of an updater

- **GIVEN** an entry whose id is `McpDocs`, or two entries with the same id
- **WHEN** `pnpm verify:updaters` runs
- **THEN** it fails once for each, naming the id
- **Test:** `scripts/verify-updaters.test.mjs` › "an id that is not kebab-case fires"
- **Test:** `scripts/verify-updaters.test.mjs` › "an id listed twice fires"

#### Scenario: the repository's registry

- **GIVEN** the template's own registry
- **WHEN** `node scripts/verify-updaters.mjs` runs
- **THEN** it exits 0 and states how many updaters it judged
- **Test:** `scripts/verify-updaters.test.mjs` › "the gate exits 0 over the repository and states what it judged"

### Requirement: UPDATERS-02 — Every command an updater runs is a root script

`pnpm verify:updaters` SHALL refuse a `command` or a `verify` entry that is not `pnpm <script>`
naming a script the root `package.json` defines.

**Evidence:** `scripts/verify-updaters.mjs:74`, `scripts/verify-updaters.mjs:140-151`

#### Scenario: a command with no script

- **GIVEN** an entry whose command is `pnpm docs:refresh`, a script `package.json` does not define
- **WHEN** `pnpm verify:updaters` runs
- **THEN** it fails, naming the entry and the script
- **Test:** `scripts/verify-updaters.test.mjs` › "a command naming a script package.json does not define fires"

#### Scenario: a verify command with no script

- **GIVEN** an entry whose `verify` holds a script `package.json` does not define
- **WHEN** `pnpm verify:updaters` runs
- **THEN** it fails, naming the entry and the script
- **Test:** `scripts/verify-updaters.test.mjs` › "a verify entry naming a script package.json does not define fires"

#### Scenario: a command that is not a script

- **GIVEN** an entry whose command is `node scripts/update-mcp-docs.mjs`
- **WHEN** `pnpm verify:updaters` runs
- **THEN** it fails, saying a command is `pnpm <script>`
- **Test:** `scripts/verify-updaters.test.mjs` › "a command that is not pnpm and one script fires"

### Requirement: UPDATERS-03 — An updater that writes a rule file is a proposal

`pnpm verify:updaters` SHALL refuse an entry whose `proposal` is not true while its `writes`
holds a path that `ruleFor` (`scripts/agent-harness/write-guard/policy.mjs`) classifies as a rule
file under the write guard's policy, `.agents/contracts/write-guard.json`, or a path with a
wildcard, which no classifier can read; and it SHALL fail when that policy cannot be read.

**Evidence:** `scripts/verify-updaters.mjs:101-107`, `scripts/verify-updaters.mjs:130-138`, `scripts/verify-updaters.mjs:170-195`, `scripts/agent-harness/write-guard/policy.mjs:108-117`

#### Scenario: a rule file written by an updater that proposes nothing

- **GIVEN** an entry with `proposal: false` whose `writes` holds `.agents/contracts/mcp-servers.json`
- **WHEN** `pnpm verify:updaters` runs
- **THEN** it fails, naming the entry, the path, what the write guard says it guards and
  `proposal: true`
- **Test:** `scripts/verify-updaters.test.mjs` › "a writes path the write guard calls a rule file fires while proposal is false"

#### Scenario: the same updater as a proposal

- **GIVEN** the same entry with `proposal: true`
- **WHEN** `pnpm verify:updaters` runs
- **THEN** it passes
- **Test:** `scripts/verify-updaters.test.mjs` › "the same rule-file path passes with proposal true"

#### Scenario: a wildcard

- **GIVEN** an entry with `proposal: false` whose `writes` holds `docs/**`
- **WHEN** `pnpm verify:updaters` runs
- **THEN** it fails, naming the path
- **Test:** `scripts/verify-updaters.test.mjs` › "a wildcard writes path fires while proposal is false"

#### Scenario: the rule files come from the policy

- **GIVEN** one entry writing `docs/rules/policy.md`, judged under a policy that lists
  `docs/rules/**` and under one that does not
- **WHEN** the gate judges it under each
- **THEN** it fails under the first and passes under the second
- **Test:** `scripts/verify-updaters.test.mjs` › "the gate reads the rule files from the write guard's policy"

#### Scenario: a policy that cannot be read

- **GIVEN** a write-guard policy that does not parse
- **WHEN** `pnpm verify:updaters` runs
- **THEN** it fails, naming the policy
- **Test:** `scripts/verify-updaters.test.mjs` › "a write-guard policy that cannot be read fires"

#### Scenario: the gate as a process

- **GIVEN** a scratch tree whose updater writes `AGENTS.md` with `proposal: false`
- **WHEN** `node scripts/verify-updaters.mjs --root <tree>` runs
- **THEN** it exits 1 and names the entry and the path
- **Test:** `scripts/verify-updaters.test.mjs` › "the gate exits 1 over a tree whose updater writes a rule file and names it"

### Requirement: UPDATERS-04 — The runner checks every updater where it runs

`pnpm updaters:run` SHALL run `<command> --check` for each updater whose `runsIn` holds the
`--where` of the run (`local` when none is given), only the one `--only` names when it names
one, and nothing more for an updater whose check exits 0; a registry the gate refuses, an
`--only` that names no updater and a `--where` other than `ci` or `local` run nothing and exit 1.

**Evidence:** `scripts/updaters/run.mjs:417-436`, `scripts/updaters/run.mjs:443-463`

#### Scenario: an updater that is current

- **GIVEN** an updater whose check exits 0
- **WHEN** `pnpm updaters:run --where ci` runs
- **THEN** it runs that check and no other command, and exits 0
- **Test:** `scripts/updaters/run.test.mjs` › "a current updater runs its check and nothing else"

#### Scenario: an updater that runs elsewhere

- **GIVEN** an updater whose `runsIn` is `ci`
- **WHEN** `pnpm updaters:run --where local` runs
- **THEN** it runs nothing, says the updater was skipped and why, and exits 0
- **Test:** `scripts/updaters/run.test.mjs` › "an updater that does not run where the run does is skipped and runs nothing"

#### Scenario: one updater by its id

- **GIVEN** two updaters, and `--only` naming the second, or naming none of them
- **WHEN** `pnpm updaters:run` runs
- **THEN** it checks the second alone; with an id it does not know it runs nothing and exits 1
- **Test:** `scripts/updaters/run.test.mjs` › "--only runs that updater alone"
- **Test:** `scripts/updaters/run.test.mjs` › "--only naming no updater exits 1 and runs nothing"

#### Scenario: a registry the gate refuses

- **GIVEN** a registry with an entry the gate refuses
- **WHEN** `pnpm updaters:run` runs
- **THEN** it prints the gate's findings, runs nothing and exits 1
- **Test:** `scripts/updaters/run.test.mjs` › "a registry the gate refuses runs nothing and exits 1"

#### Scenario: the runner as a process

- **GIVEN** a scratch tree whose one updater runs in `ci`
- **WHEN** `node scripts/updaters/run.mjs --root <tree> --where local` runs, then with
  `--where nightly`
- **THEN** the first exits 0 and says it skipped the updater, the second exits 1 naming `--where`
- **Test:** `scripts/updaters/run.test.mjs` › "the runner as a process skips an updater of another place and refuses an unknown --where"

### Requirement: UPDATERS-05 — An out-of-date updater becomes one pull request from `updates/<id>`

When an updater's check exits 2, `pnpm updaters:run` SHALL, on a working tree with no change,
start detached from the default branch when the remote holds no `updates/<id>` (UPDATERS-10 says
how it starts from one the remote holds), run the updater and then its `verify` commands, commit
the change with a Conventional Commit that carries no attribution, push it to `updates/<id>`
only, open one pull request from it or update the one already open, and return to the ref it
started on; an update that changes nothing commits nothing and opens nothing.

**Evidence:** `scripts/updaters/run.mjs:194-240`, `scripts/updaters/run.mjs:242-305`, `scripts/updaters/run.mjs:309-389`, `scripts/updaters/branch.mjs:40-89`

#### Scenario: no pull request open yet

- **GIVEN** an updater whose check exits 2, no `updates/<id>` on the remote and no open pull
  request from it
- **WHEN** `pnpm updaters:run --where ci` runs
- **THEN** git and gh are called in this order: status, the current ref, the default branch, the
  fetch of the default branch, `ls-remote` of `updates/<id>`, `checkout --detach` of the default
  branch, the update, status, each verify command, add, commit, push to `updates/<id>`,
  `gh pr list --head updates/<id>`, `gh pr create`, and the checkout back; the pull request is
  ready for review and carries no label
- **Test:** `scripts/updaters/run.test.mjs` › "an out-of-date updater opens one pull request from updates/<id>"

#### Scenario: a pull request already open

- **GIVEN** the same updater with pull request #7 open from `updates/<id>`
- **WHEN** `pnpm updaters:run --where ci` runs
- **THEN** it edits #7's title and body and creates none
- **Test:** `scripts/updaters/run.test.mjs` › "an out-of-date updater with an open pull request updates it"

#### Scenario: an update that changes nothing

- **GIVEN** an updater whose check exits 2 but whose update leaves the default branch unchanged
- **WHEN** `pnpm updaters:run --where ci` runs
- **THEN** it commits nothing, opens nothing, returns to its ref and exits 0
- **Test:** `scripts/updaters/run.test.mjs` › "an update that changes nothing commits nothing and opens nothing"

#### Scenario: a working tree with changes

- **GIVEN** an out-of-date updater and a working tree with an uncommitted change
- **WHEN** `pnpm updaters:run --where ci` runs
- **THEN** it moves no branch, opens nothing and exits 1, naming the change
- **Test:** `scripts/updaters/run.test.mjs` › "a working tree with changes is refused before any branch moves"

### Requirement: UPDATERS-06 — A rule proposal opens as a draft that quotes the LAW

`pnpm updaters:run` SHALL open the pull request as a draft labelled `rule-proposal`, whose body
quotes the LAW "A rule is not edited to fit the work" of `AGENTS.md`, when the updater declares
`proposal: true` or its diff touches a path `ruleFor` classifies as a rule file. It SHALL make the
label current with no force option: read it with `gh label list`, then `gh label create` it when
it is missing, or `gh label edit` it when its colour or description differs, and leave a current
one alone.

**Evidence:** `scripts/updaters/run.mjs:148-164`, `scripts/updaters/run.mjs:343-346`, `scripts/updaters/run.mjs:242-305`, `scripts/updaters/label.mjs:14-55`

#### Scenario: a diff that touches a rule file

- **GIVEN** an updater with `proposal: false` whose update changes `.agents/contracts/mcp-servers.json`
- **WHEN** `pnpm updaters:run --where ci` runs
- **THEN** it lists the labels and creates the missing one, then a draft pull request labelled
  `rule-proposal` whose body quotes the LAW and names the path
- **Test:** `scripts/updaters/run.test.mjs` › "a diff that touches a rule path opens a draft labelled rule-proposal that quotes the LAW"

#### Scenario: a label that is already there

- **GIVEN** a `rule-proposal` label whose colour and description differ, and another that is
  current
- **WHEN** `pnpm updaters:run --where ci` opens a proposal over each
- **THEN** the first is edited with `gh label edit`, the second is only listed, and neither is
  created
- **Test:** `scripts/updaters/run.test.mjs` › "a rule-proposal label whose colour or description differs is edited, and a current one is left"

#### Scenario: an updater that declares a proposal

- **GIVEN** an updater with `proposal: true` whose update changes no rule file
- **WHEN** `pnpm updaters:run --where ci` runs
- **THEN** its pull request is a draft labelled `rule-proposal`
- **Test:** `scripts/updaters/run.test.mjs` › "an updater that declares proposal true opens a draft labelled rule-proposal"

#### Scenario: an open pull request becomes a proposal

- **GIVEN** pull request #7 open from `updates/<id>`, and an update that now touches a rule file
- **WHEN** `pnpm updaters:run --where ci` runs
- **THEN** it adds the label to #7 and turns it back into a draft
- **Test:** `scripts/updaters/run.test.mjs` › "an open pull request that becomes a rule proposal is labelled and turned into a draft"

### Requirement: UPDATERS-07 — A failure opens nothing

`pnpm updaters:run` SHALL exit 1 and open no pull request for an updater whose check exits 1,
going on to the next updater, or whose update or `verify` command fails, which commits nothing
and stops the run with the tree left detached where the update ran, for a person to read.

**Evidence:** `scripts/updaters/run.mjs:319-330`, `scripts/updaters/run.mjs:454-461`, `scripts/updaters/run.mjs:473-481`

#### Scenario: a check that fails

- **GIVEN** two updaters, the first of whose checks exits 1
- **WHEN** `pnpm updaters:run --where ci` runs
- **THEN** it reports the first as failed, runs no git and no gh for it, checks the second, and
  exits 1
- **Test:** `scripts/updaters/run.test.mjs` › "a failed check opens nothing, reports the failure and the run checks the next updater"

#### Scenario: a verify command that fails

- **GIVEN** an out-of-date updater whose verify command exits 1 after the update
- **WHEN** `pnpm updaters:run --where ci` runs
- **THEN** it adds, commits and pushes nothing, opens nothing, says the tree is left detached
  where the update of `updates/<id>` ran, and exits 1
- **Test:** `scripts/updaters/run.test.mjs` › "a failing verify command commits nothing and opens nothing"

### Requirement: UPDATERS-08 — Nothing reaches the default branch without a person

`pnpm updaters:run` SHALL never merge, approve or enable auto-merge on a pull request, never
push to the default branch, merge with git only the default branch into the detached update
(or abort that merge), and hand git, gh and the updaters the environment it was given,
unchanged.

**Evidence:** `scripts/updaters/run.mjs:360-367`, `scripts/updaters/run.mjs:405-415`, `scripts/updaters/branch.mjs:68-84`

#### Scenario: every run of the suite

- **GIVEN** the calls every case of the runner's suite recorded
- **WHEN** they are read together
- **THEN** none is `gh pr merge`, `gh pr review` or an auto-merge, every push names
  `updates/<id>` and never the default branch, every `git merge` merges `origin/<default>` or
  aborts, and every environment handed out is the one the run was given
- **Test:** `scripts/updaters/run.test.mjs` › "no run merges, approves, enables auto-merge, pushes the default branch or changes the environment"

### Requirement: UPDATERS-09 — A dry run runs no git and no gh

`pnpm updaters:run --dry-run` SHALL run the check of each updater it selects and print what it
would do for each one out of date, and run no git and no gh command.

**Evidence:** `scripts/updaters/run.mjs:391-403`, `scripts/updaters/run.mjs:464-467`

#### Scenario: a dry run over an out-of-date updater

- **GIVEN** an updater whose check exits 2
- **WHEN** `pnpm updaters:run --where ci --dry-run` runs
- **THEN** it runs the check alone, prints the branch, the commands, the commit and the pull
  request it would open, and exits 0
- **Test:** `scripts/updaters/run.test.mjs` › "a dry run prints the plan and runs no git or gh"

### Requirement: UPDATERS-10 — `updates/<id>` is appended to, never rewritten

`pnpm updaters:run` SHALL never rewrite `updates/<id>`: when the remote holds it, the runner
SHALL fetch it, check it out detached, merge the default branch into it with a normal merge, put
the update's commit on top and push it with no force option. When that merge conflicts, it SHALL
abort the merge, return to the ref it started on, open nothing, print one line naming the branch
and the conflicting paths, go on to the next updater and exit 1. No git, gh or shell call it makes
SHALL pass a force option, as the no-force hook reads one, or a `+` refspec, following the LAW
"A force option is never used" of `AGENTS.md`.

**Evidence:** `scripts/updaters/branch.mjs:40-89`, `scripts/updaters/run.mjs:360-367`, `scripts/updaters/run.mjs:473-481`, `scripts/updaters/label.mjs:14-55`

#### Scenario: the remote holds `updates/<id>`

- **GIVEN** an out-of-date updater whose `updates/<id>` the remote holds, with pull request #7
  open from it
- **WHEN** `pnpm updaters:run --where ci` runs
- **THEN** after the fetch of the default branch and `ls-remote` it fetches `updates/<id>`,
  checks it out detached, runs `git merge --no-edit origin/<default>`, then the update, the
  verify commands, add and commit, pushes `HEAD:refs/heads/updates/<id>` with no force option and
  edits #7; the commit says the default branch was merged in
- **Test:** `scripts/updaters/run.test.mjs` › "an existing updates/<id> gets the default branch merged in and the update on top, pushed without force"

#### Scenario: a merge that conflicts

- **GIVEN** two updaters, the first out of date with an `updates/<id>` whose merge of the default
  branch conflicts in `docs/mcp.md`
- **WHEN** `pnpm updaters:run --where ci` runs
- **THEN** it lists the conflicting paths, aborts the merge, checks out its ref again, runs no
  update and opens nothing, prints one line naming `updates/<id>` and `docs/mcp.md`, checks the
  second updater, and exits 1
- **Test:** `scripts/updaters/run.test.mjs` › "a merge that conflicts opens nothing, names the branch and the conflict, and exits 1"

#### Scenario: every call of the suite

- **GIVEN** the calls every case of the runner's suite recorded, a merge among them
- **WHEN** each is read with the no-force hook's reader (`scripts/agent-harness/no-force/forms.mjs`)
- **THEN** none passes a force option and no word of any starts with `+`
- **Test:** `scripts/updaters/run.test.mjs` › "no call of any run passes a force option or a + refspec"
