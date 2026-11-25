# The harness — every gate, and how to add one

The harness is the set of automated checks that decide whether a change is done.
It is not advice. Each piece either fails a command or it does not exist.

> **The principle behind all of it:** an instruction is not a gate. Two rules
> written in the same voice hold very differently when one is backed by a hook
> and the other by prose. `docs/code-standards.md` §21 is the ledger that keeps
> that difference visible.

---

## The four layers

A change passes through them in this order. Each layer is cheaper than the one
after it, so the cheap ones run first.

| Layer      | When it runs    | What it costs | What it catches                    |
| ---------- | --------------- | ------------- | ---------------------------------- |
| **Editor** | As you type     | free          | Types, lint rules, formatting      |
| **Hooks**  | On commit, merge | seconds      | Staged-file lint, commit message; merged worktrees removed |
| **Gate**   | `pnpm validate` | minutes       | Everything below                   |
| **CI**     | On push and PR  | minutes       | The gate again, on a clean machine |

---

## Layer 1 — the editor

TypeScript and ESLint run in the editor from the same config the gate uses. There
is no separate "editor config" to drift from.

---

## Layer 2 — git hooks

Managed by Husky, in `.husky/`.

| Hook         | Command                 | What it enforces                  |
| ------------ | ----------------------- | --------------------------------- |
| `pre-commit` | `pnpm exec lint-staged` | ESLint + Prettier on staged files |
| `commit-msg` | `pnpm exec commitlint`  | Conventional commits              |
| `post-merge` | `node scripts/prune-worktrees.mjs --quiet` | Removes merged worktrees, then fast-forwards the main checkout; never fails the merge |

`git commit --no-verify` skips both commit hooks; CI's `commitlint` job lints the
commit messages of a pull request again, its default ignores aside (Layer 4).

`post-merge` runs after a local `git merge` or `git pull`, in whichever
worktree ran it, and is the only hook that changes other checkouts.
`pnpm worktrees:prune` runs the same pruner by hand, and `--dry-run` prints
what it would remove and move, touching nothing. It starts with `git fetch
--prune origin`, stopped after 30 s or the seconds
`PRUNE_WORKTREES_FETCH_SECONDS` names, rounded up to whole milliseconds
(any value that is not a positive number fails the run before it touches
anything); a fetch stopped there is ended with every process it started
(`taskkill /T /F` on Windows, section 3g), skips the prune and the fast-forward, prints one line that says so, under
`--quiet` too, and exits 0, so a stalled remote holds a merge or a pull for
that long at most. After the fetch it removes a linked worktree only when
its branch's upstream is gone, its HEAD is in the default branch (the one
`origin/HEAD` names),
`git status` shows nothing modified or untracked and no ignored file outside
what an install, a build or the next session writes again (`node_modules/`,
the build outputs at a root, `.husky/_/`, and an `.atl/` that holds only
the two files the skill-registry skill writes again, `skill-registry.md`
and `.skill-registry.cache.json`), and `git ls-files -v` marks no file
skip-worktree or assume-unchanged, edits `git status` cannot see; an env
file and anything else under `.atl/`, told apart by name, keep it. Those
reads run again just before each removal, so a change made while it
removes the others, an ignored file nothing rebuilds included, keeps that
worktree. It never removes the main checkout, the worktree it runs in, a
locked worktree, one under
`.claude/worktrees/` or one holding another worktree, and it deletes the
branch only while its tip is the commit it judged. Last, it fast-forwards
the main checkout with `git merge --ff-only` when that checkout is on the
default branch. Any tracked local change there, staged or not, a
line-ending-only one included, blocks it, and so does whatever git refuses
(a local commit, an untracked file the merge would overwrite); the checkout
then stays and a line says how far behind it is and why. A dry run predicts
that refusal without moving anything: a HEAD that is not an ancestor of the
default branch, and whatever a dry run of the checkout
(`git read-tree -m -u --dry-run`) refuses, as an untracked file it would
overwrite, make it say "would leave" where it would otherwise say "would
fast-forward". That dry checkout runs against a copy of the index in a
scratch directory, refreshed first as `git merge --ff-only` refreshes it,
so a file whose timestamp alone changed is no refusal, and the main
checkout's own index and its `index.lock` are left alone. A run that fails before it removes anything exits 1 and
says nothing was removed; one that fails after a removal, at the
fast-forward say, still prints its report, the removals and the summary,
then git's message and how many worktrees it removed before it failed,
and exits 1. The fast-forward fires that checkout's own `post-merge`;
the pruner runs it with
`PRUNE_WORKTREES_RUNNING` set, and a run that finds it set exits at once,
so the rest of that hook still runs. A dry run ends with what the pruner
does not cover: it still runs `git fetch --prune`, a worktree another
process holds as its current directory on Windows is emptied and
unregistered, the merge waits for the prune, on Windows a fetch stopped at
its bound ends without git's own cleanup (its remote helper is ended with it
since the process reaper's change, though the printed line still says it runs
on: F74), and an ignored file written in
the moment between the last check and git's own removal goes with the
worktree.
`core.hooksPath` stays the relative `.husky/_` husky writes at repository
level, so each worktree runs the hooks of its own checkout. Never set it per
worktree or as an absolute path: git 2.55 copied an absolute per-worktree
value into every new worktree, which then ran another checkout's hooks.

Hooks are deliberately thin. Semantic checks belong in the gate, where they can
see the whole repo — a hook that reads only staged files cannot tell you that a
file you did not touch now has no owner.

---

## Layer 3 — the gate

```bash
ATL_TEMPLATE_SELF=1 pnpm validate
```

**Nothing is done until this exits 0.** Check the exit code, not the tail of a
pipe: `pnpm validate | tail` reports the exit status of `tail`, which is always 0. Use `pnpm validate > log 2>&1; echo $?`.

### The gate registry

`pnpm validate` runs `scripts/validate.mjs`, which runs the steps of the gate
registry, `.agents/contracts/gates.json`, in order: `pnpm <id>` for each step,
or the step's own `command`. The first step that fails stops the run, and the
runner exits with that step's exit code, as the `&&` chain it replaced did. A
registry the runner refuses, or a registry, root `package.json` or
`template.manifest.json` it cannot read, runs no step and exits 1.

```bash
pnpm validate --list             # every step with its fields; runs none
pnpm validate --profile strict   # also the strict-only steps (none today)
```

| Field        | Holds                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------- |
| `id`         | The root `package.json` script the step runs, unless it carries a `command`                    |
| `capability` | The owner whose prune removes the step: `core`, never pruned, or a capability of the manifest  |
| `stage`      | `preflight`, `workspace` or `repository` (3a, 3b, 3c); a stage never runs before the one above |
| `profile`    | The lowest quality profile that runs it: `standard` (the default) or `strict`                  |
| `cost`       | `instant`, `seconds` or `minutes`, declared; the run prints the measured time beside it        |
| `blind`      | `exported-cases`, on the one step that blinds a `defineGate` gate                              |

**Every gate script is registered.** Each root script named `verify:*` or
`*:test` is a step, or an entry of the registry's `outside` list, which names
the script, the capability whose prune removes the entry, and the reason
`pnpm validate` does not run it: `verify:ticket-branch` (the template's own
branches carry no ticket id) and `verify:expo` (it reaches the network). The
runner refuses an unregistered one, and a stale or doubled entry, before any
step runs, so a gate added to `package.json` cannot silently stay out of the
gate.

**A capability's prune removes its gates by data.** An absent capability takes
every step it owns, as it takes the dependency-registry entries it owns
([manifest.md](manifest.md) § Registry entries have owners too); nothing edits
a command chain. The registry is a contract, so the write guard asks before
anyone edits it (3f): removing a step removes a gate.

`pnpm validate:test` (`scripts/validate.test.mjs`, a preflight step) proves the
registry and its runner: the registry gate refuses each defect it names; the
runner, run as a process over scratch trees with a fake `pnpm`, runs the steps
in order, stops at the first failure with its exit code, and refuses what it
cannot read; the `sdd` prune drops its four steps and keeps the rest in order;
every capability's prune, with the scripts it unsets, leaves a registry the
pruned `package.json` runs and no step running a file it removes; and every
gate the run reaches is blinded by exactly one step, whose companion's exported
`CASES` fail against `blindGate`, run as a git hook would run them.

> **Pending merge.** The harness-config branch (unit 4.1b) adds
> `verify:harness-config` to the old chain. It gets its registry entry when the
> two branches meet; until it does, the runner refuses the merged tree, naming
> the script.

### 3a. Preflight — the instant gates run first

| Gate                            | Proves                                                    |
| ------------------------------- | --------------------------------------------------------- |
| `pnpm agent-harness:projection-check` | Every projected agent file equals what its neutral source renders, and is committed (see 3e) |
| `pnpm agent-harness:test`       | The projector's reader, adapters, hook projection, writer, checker and sync still behave |
| `pnpm write-guard:test`         | The write guard decides every cell of its table, its errors and its switch-off, reads every Windows spelling of a path (or refuses what it cannot read) and every checkout that holds it, judges a 10,000-folder path in under a second, every checkout rule glob matches a file and every module the hook loads is a rule file, and the real hook answers a payload on stdin end to end, through a junction too (see 3f) |
| `pnpm reap:test`               | The process reaper's core decides each rule over synthetic process tables (an orphan, a live parent, a reused pid, POSIX reparenting, unknown names, a family matched by executable and script and never by text in the arguments, persistent and watch work, node's watch flags, the wrappers, live Git for Windows shells and tmux, its own ancestry, the spared processes, the grace period); the adapter lists and ends on each platform through an injected spawn; the command's modes, lock, second listing, bound and exit codes; the session hook's kill mode and its exit 0 on any failure; and `runBounded` ends a real child's tree on Windows (see 3g) |
| `pnpm verify:agent-context:test` | The agent-context gate fails each defect it names, on synthetic entries and over a scratch tree |
| `pnpm verify:agent-context`     | Every agent of `.agents/agents/` has an entry in `.agents/agent-context.json` whose `gradedBy` names the skills that grade it, each a folder of `.claude/skills/` holding a `SKILL.md`, whose `writes` is true or false, whose `surface`, if any, lists repository-relative folders beside `writes: true`, and which holds no other key; no entry names an agent that is gone (see 3e) |
| `pnpm verify:harness-config:test` | The harness config gate fails each defect it names, a key given twice and an `additionalProperties` other than `false` among them, against the repository's schema, and over a scratch tree; the schema's merge policies are the ones the ticket skills name, `manual` the default |
| `pnpm verify:harness-config`    | `.agents/harness.config.json` holds only the sections and settings `.agents/contracts/harness-config.schema.json` declares, each a value it allows and every required one there, the database-test mode under a `supabase` backend only, and neither file gives a key twice in one object; the schema uses only the keywords the gate reads, `additionalProperties` only as `true` or `false`, and sets it to `false` on every object outside a conditional branch (see 3h) |
| `pnpm verify:manifest`          | `template.manifest.json` is well formed                   |
| `pnpm verify:manifest:coverage` | Every tracked file has exactly one owner, no stale claims |
| `pnpm verify:manifest:test`     | The pure engine behind both still behaves                 |
| `pnpm validate:test`            | The gate registry and its runner hold, its prunes leave a runnable registry, and every gate it runs is blinded (above) |
| `pnpm verify:lint-rules:test`   | The local ESLint rules still report what they must        |
| `pnpm verify:allowlist-freshness:test` | The styling allowlist gate fails a stale entry and an unlisted violation |
| `pnpm verify:allowlist-freshness` | Every entry of `eslint-style-positioning-allowlist.json` still breaks its rule, and every violation in the `src/` of every app is listed; prints the live count |
| `pnpm verify:dependency-seams:test` | The dependency-seam gate fails each drift it names, planted in a scratch tree, and asks ESLint which files it ignores |
| `pnpm verify:dependency-seams` | Every `package.json` dependency is in `.agents/contracts/dependencies.json` and every entry is declared; a `package.json` it cannot read fails, naming it; every seam glob matches a file; the configs ESLint ignores import inside their seams; every entry of `eslint-dependency-seam-allowlist.json` is still a violation under a migration the registry declares open, every open migration is named by an entry, and every violation is listed; prints the live counts, and none against a registry it refuses |

Structural drift fails here, before anything expensive builds. See
[manifest.md](manifest.md). The projection check is step 1 of the registry: an agent
file edited by hand fails before anything else runs.

### 3b. Workspace — turbo: lint, typecheck, test, build

`turbo run lint typecheck test build format:check` across every workspace.
`format:check` has no workspace task yet, so it runs nothing: formatting is
enforced by the `prettier/prettier` ESLint rule on workspace TS/TSX, and by
the pre-commit hook on staged files.

### 3c. Repository — the verify scripts

| Gate                  | Proves                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `verify:tests`        | Every unit has a test, in the `__tests__/` of its own folder and named after it; the components and hooks of an app that declares `expo` are exempt |
| `verify:maps`         | The global map resolves and covers every domain and screen of every app, and no stray magic literals; `--root <dir>` runs it over another tree |
| `verify:pairing`      | A service has its adapter and vice versa                                                  |
| `verify:structure`    | Screen and component folders satisfy the block contract                                   |
| `verify:security`     | The static security posture holds                                                         |
| `verify:theme-sync`   | Every generated token output (the web `theme.css`, the NativeWind preset, the mobile `themeVars`, the `themeNames` the shared `tv` registers) equals its regeneration from `tokens.constant.ts`; `verify:theme-sync:test` plants a hand edit in each and an un-regenerated source change |
| `verify:mcp-docs`     | The generated block of `docs/mcp.md` is what `pnpm mcp:docs` wrote and lists every server, package and capability of `.agents/contracts/mcp-servers.json` plus `.mcp.json`, with each server's exact pin and its direct `node` command; offline, and it refuses `npx`, a missing or inexact version and a first argument that does not name the entry. `verify:mcp-docs:test` plants each drift; `mcp:docs:test` drives the updater with an injected registry |
| `verify:ticket-branch:test` | `scripts/verify-ticket-branch.test.mjs` drives the branch check (below, 3d) with a valid ticket branch and pull request body and each refusal, under the default ticket identity and under example layers (a TASK-slug one among them), with each malformed block and flag, and as a process over a scratch working directory |
| `verify:skills:test` | `scripts/verify-skills.test.mjs` holds the seven ticket skills of `.claude/skills/` to their sections (the shape of `new-skill`, every state, role and board operation of `ticket-flow`, Dropped among the states of its table and of the process template's, the role skills' opening and the contract tables they must not copy, the three templates, the ticket template's target version marked `**Version (required):**`, and both merge policies, `manual` and `low-risk`, named in `ticket-flow` rule 4, `refine-ticket`'s merge queue, `process-intake`'s mapping step and the process template, each beside `.agents/harness.config.json`, where the project records its own, and the process template's Policy line names `delivery.mergePolicy` in it; the policy read fail closed: `ticket-flow` rule 4 and `refine-ticket`'s merge queue say that a value other than `low-risk`, a missing file, or a file that does not parse means `manual`, and that the policy is read from the default branch's copy, never from the pull request's own branch; the production branch: the process template's Branching model, whose Production branch line gives `production`, the default; the merge queue: `refine-ticket` has its § Merge queue, `qa-ticket`'s hand-off step names `<id> ready to merge, PR #<n>`, and `qa-ticket` holds no `Ready to merge → Done`; the ticket identity: `ticket-flow` names `branchTypes` and the `json ticket-identity` block, `process-intake`'s mapping step names the block, and the process template ships one that the branch check reads with no finding and whose fields are its defaults; QA's checkout: `qa-ticket`'s Step 2 adds its worktree with `--detach` and its Step 5 pushes with `git push origin HEAD:<branch>`; and the hotfix: `qa-ticket`'s hand-off step, `refine-ticket`'s release step and `ticket-flow`'s messages name `<id> ready to merge, hotfix`, and `release-ticket`'s Hotfix section says that QA leaves it at Ready to merge; and the board as the source: `ticket-flow`'s Board operations and the process template's Board adapter name the board the source of every open ticket, and the closed ticket catalog: `refine-ticket`'s § Record the closed tickets names `§ Closed Ticket Catalog` and one pull request per close or release, `po-ticket` names no `edits:`, since the PO does no repository work, and `refine-ticket`'s merge queue says that the architect brings the catalog pull request current itself and that each row it adds matches its board page in id, title, target version and closing pull request; and the drop: `ticket-flow` has its § Dropped, naming `Superseded by:`, and its messages name `<id> dropped`, which `po-ticket`'s Step 6 — Drop a ticket, `refine-ticket`'s § Drop a ticket, `dev-ticket`'s § Changes requested and `qa-ticket`'s Step 7 also name, and `refine-ticket`'s § Record the closed tickets names `### Dropped tickets`; and the later bring-current: `refine-ticket`'s merge queue brings a ticket's pull request current from a spare worktree of its own, never QA's or the dev's, names `--detach` and `git push origin HEAD:<branch>`, pushes in the background and says that a code conflict goes back to the dev session, none of `ticket-flow`, `refine-ticket` and `qa-ticket` names `<id> bring current`, and `qa-ticket` holds no `Ready to merge → Changes requested`), with synthetic cases and over the repository; it also runs the cases of `.claude/skills/general-plan/validate-general-plan.test.mjs` |
| `docs:diagrams:check` | Every committed diagram matches its spec and the tokens                                   |
| `verify:specs`        | Every living spec and change has its shape, and every test a scenario names exists        |
| `report:spec-drift`   | Lists the living specs whose governed code moved past their verified commit; never blocks |
| `verify:english`      | No tracked text outside the i18n catalogs holds a Spanish line, unless allowlisted        |
| `verify:instruction-entry` | `AGENTS.md` and `README.md` exist, and no `CLAUDE.md` or `CLAUDE.local.md` in any folder makes Claude Code read it instead of `AGENTS.md` |
| `verify:unicode-safety` | No tracked text file holds a zero-width character (U+200B to U+200D, U+2060, U+FEFF), a direction embedding, override or isolate (U+202A to U+202E, U+2066 to U+2069), a tag character (U+E0000 to U+E007F) or an invisible filler (U+115F, U+1160, U+3164, U+FFA0); the emoji joiner U+200D is allowed under `packages/i18n/src/locales/`, a file holding a NUL byte is skipped as binary, and a finding names the file, the line, the column and the code point. `verify:unicode-safety:test` plants each code point and runs the gate over a scratch repository |
| `verify:workflow-pins` | Every `uses:` of every workflow under `.github/workflows/` (`.yml` or `.yaml`), a step and a reusable workflow alike, is pinned to a full 40-character commit SHA, the tag it was resolved from kept as a comment; a local action (`./`) and a Docker image (`docker://`) are exempt; a line inside any block scalar (`\|` or `>`, a `run:` script and a folded `name:` alike) is not judged, a comment never opens one, and a quoted `"uses":` key is judged. `verify:workflow-pins:test` plants a tag, a branch, a short SHA and a missing ref |
| `verify:skill-frontmatter` | Every `.claude/skills/*/SKILL.md` has a frontmatter that parses, a `name` that is its folder, and a description of at most 1,024 characters once parsed (the line break a `>` block keeps counted) that holds `USE WHEN:` and `DO NOT USE:`; a skill `.claude/skills-lock.json` lists (archify) is vendored and gets the parse, name and length checks only. `verify:skill-frontmatter:test` plants each refusal, both quoting styles and both block styles |
| `verify:skill-neutrality` | No file under `.claude/skills/` (a `SKILL.md`, a template, a reference or a script, a vendored skill included) names a downstream project: a name `.agents/contracts/downstream-projects.json` declares for one, matched as a whole word in any letter case, so a product name also catches the package scope, slug and bundle id built from it, and a name inside a longer word does not. A downstream project's core-purity gate refuses a first-party skill that names a product, so a template skill that names one is refused on sync. The list names donor products, so it is `template-maintainer` material and never ships: a derived project finds it absent and the gate forbids nothing, saying so in its denominator, while the template, run with `ATL_TEMPLATE_SELF=1`, fails without it; a list that does not parse, declares no project, or gives a project no name fails too. A new downstream project is one entry of that list. `verify:skill-neutrality:test` plants each refusal with synthetic names and runs the gate over a scratch tree |
| `git-free-env:test`, `hook-git-dir:test` | `gitFreeEnv()` drops every `GIT_*` variable, in any case, from the environment a script hands to git or to a child; `withHookGitDir` runs a flow with `GIT_DIR` and `GIT_INDEX_FILE` naming a decoy repository, as a git hook exports them, reports whether anything under the decoy changed, and puts both variables back and removes the decoy however the flow ends. Every suite that spawns git runs one end-to-end case under it and asserts the decoy is left alone; `init-project:test` takes its whole copy under it |
| `worktrees:prune:test` | `scripts/prune-worktrees.test.mjs` drives the pruner (Layer 2) over a scratch origin, its clone and one linked worktree per case, `--dry-run` first: the merged clean worktree goes and its branch with it; every reason to keep one is seen kept and printed, an ignored file nothing rebuilds, an env file, a file under `.atl/`, a note beside the two skill-registry files in `.atl/`, a lock, an edit hidden by `--skip-worktree` or `--assume-unchanged` and a file that differs only in its line endings among them; a branch whose tip moved after it was judged stays; an `.atl/` that holds only those two files goes with its worktree; an ignored file nothing rebuilds, written after the decision, keeps the worktree at the check just before its removal, and a worktree still clean there goes with its branch; a dry run removes and moves nothing, states the real run's decisions and ends with what is not covered; the main checkout is fast-forwarded to `origin/HEAD`'s branch, whatever its name, and is left, with the reason, over any tracked local change, staged, line-ending-only or in a file the fast-forward does not touch, and over git's refusal, named by its first line that is not a hint and the files it lists; a dry run says it would leave a main checkout that diverged, and one with an untracked file the fast-forward would overwrite, with git's refusal, and touches neither, while a file whose timestamp alone changed and an `index.lock` already in the main checkout leave its "would fast-forward" as it was; the worktree the command runs in survives the `post-merge` that fast-forward fires; an unset `origin/HEAD` exits 1 naming `git remote set-head origin --auto`; a step that fails after a removal exits 1 and still reports the removal, never "nothing was removed"; a fetch from a remote that never answers is stopped at `PRUNE_WORKTREES_FETCH_SECONDS`, and the run says so, removes and moves nothing and exits 0, where the same repositories with a remote that answers are pruned and moved; on Windows a fetch stopped at its bound ends the ssh command git started; the bound is 30 s, a value that is not a positive number throws, naming it, and one that is no whole number of milliseconds is rounded up; and the real `.husky/post-merge`, run by `git hook run`, prunes and exits 0 even when the pruner fails |
| `verify:router-coverage` | Every "Load skill" cell of the Router tables of `AGENTS.md` (its `## Router` section) names, in backticks, a skill with a `.claude/skills/<name>/SKILL.md`, and every skill, read as `verify:skill-frontmatter` reads them, has a row; every "Validated by" cell is `review` or cites, in backticks, only scripts the root `package.json` defines, the text outside the backticks (`lint` (jsx-a11y)) explaining them; a Router table missing either column, a Router with no table and an `AGENTS.md` with no Router fail too. An `/init` prune that drops a skill leaves its row dead and fails this gate until Stage 6 removes the row. `verify:router-coverage:test` plants each refusal and runs the gate over a scratch tree |
| `codex-budget:test`   | The generated `.codex/config.toml` sets `project_doc_max_bytes` above every table header, and `AGENTS.md`, counted with CRLF endings, fits it: Codex drops what is past the budget |
| `check:identity`      | The template's default identity is gone (skipped on self)                                 |
| `knip`                | No dead exports, no unlisted or unused dependencies                                       |

### 3d. What the gate deliberately excludes

E2E and runtime smokes are **not** in `pnpm validate` — they need a built app and
a browser, which would make the offline gate slow and flaky.

```bash
pnpm test:e2e      # Playwright, needs a prior build
pnpm smoke:web     # next build + a real HTTP probe
pnpm smoke:mobile  # expo export + a Hermes bundle assertion
```

`pnpm mcp:docs` is not in `pnpm validate` either: it asks the npm registry for the
latest release of each MCP server and rewrites the generated block of
[mcp.md](mcp.md). The gate only checks that block offline (`verify:mcp-docs`).

`pnpm verify:ticket-branch` is not in `pnpm validate` either, and nothing in the
template runs it: the template's own branches carry no ticket id. It is the pure
check a project that adopts the ticket flow (`.claude/skills/ticket-flow/SKILL.md`)
may add to its CI, a decision its `docs/process/ticket-flow.md` records:

```bash
pnpm verify:ticket-branch --branch "$HEAD_REF" --body "$PR_BODY"
```

It judges under the project's ticket identity: the one fenced block with the
info string `json ticket-identity` in `docs/process/ticket-flow.md` under its
working directory, or in the file `--layer <path>` names. The block holds
`idPattern` (a regular-expression source for one id, matched whole),
`branchTypes` (the prefixes a branch may start with) and `slug` (`required` or
`optional`); `--id-pattern`, `--types` and `--slug` each replace one field.
With no layer or no block it keeps the defaults: a type of `feature`, `fix`,
`tech` or `chore`, an id that is a number or an upper-case key, and a required
slug. A malformed block or flag is a finding that names the file or the flag and
the field, never a silent default.

```bash
pnpm verify:ticket-branch --branch <b> --body <text> \
  [--layer <path>] [--id-pattern <source>] [--types <a,b>] [--slug <required|optional>]
```

It passes a branch `<type>/<id>-<slug>`, or `<type>/<id>` when the slug is
optional, whose type, id and lower-case kebab slug the identity allows and whose
pull request body names the same id, `#123` for a number and the id itself
otherwise (`PROJ-42`, `TASK-min-app-version-app`), and exits 1 with every defect
named on its own. Its pass line names the identity it judged under. It never
reads the board: whether the ticket exists and which state it is in needs the
network.

### 3e. The agent projections

An agent is written once, in `.agents/agents/<name>.agent.md`: a frontmatter of
exactly `description`, `model`, `name` and `tools`, the file named after `name`,
then the prompt. `pnpm agent-harness:generate` is the one writer of what each
runtime reads, and `scripts/agent-harness/` holds the projector:

| Output                              | Runtime     |
| ----------------------------------- | ----------- |
| `.claude/agents/<name>.md`          | Claude Code, identical to the source |
| `.codex/agents/<name>.toml`, `.codex/config.toml` | Codex; the config also holds the `AGENTS.md` budget |
| `.opencode/agents/<name>.md`, `opencode.json` | OpenCode |
| `.github/agents/<name>.agent.md`    | Copilot     |
| `.claude/settings.json`             | Claude Code: the hooks of `.agents/hooks.json` (3f, 3g) |
| `.agents/projection-manifest.json`  | none: the sha256 of every output |

To change an agent, edit its source, run `pnpm agent-harness:generate` (or
`pnpm agent-harness:sync`, which then runs the checker over the result), review
the diff and commit every file it wrote. Never edit an output: the projection
check fails on a missing, extra, changed or uncommitted one, and on a stale
manifest, and says to run the generator. A field a runtime has no slot for is
declared in `EXPRESSIVENESS` with its reason (Codex cannot restrict tools), and
the model reaches a runtime other than Claude Code only through `MODEL_MAP`,
which is empty, so those agents run on the model of the session that starts
them.

Every agent also names the skill that grades it, in `.agents/agent-context.json`:
`gradedBy` lists the skills whose procedure and report its output is held to,
the skill it runs (`sdd-steward` runs `sdd`) or, when it runs no single one,
the skill that defines and judges what it returns (`validator` answers to
`validate-all`, which sets its groups and its report and rolls their verdicts
into one). The entry also says what the agent may write, which the write
guard (3f) reads: `writes: false` makes it read-only (`validator`),
`writes: true` makes it a writer (`sdd-steward`), and an optional `surface`
beside `writes: true` holds a writer to those repository-relative folders. An
agent added without its entry fails `pnpm verify:agent-context`, as does an
entry with no `gradedBy` or no `writes`, a `gradedBy` naming a folder of
`.claude/skills/` that holds no `SKILL.md`, a `surface` that is empty, leaves
the repository or sits beside `writes: false`, any other key (a misspelled
`surface` would leave an agent unguarded), and an entry whose agent is gone.
Whether the named skill is the right grader, and whether `writes` and
`surface` are the right ones, is review's to judge, and no runner yet runs a
skill's evals with the agent as the executor.

### 3f. The agent write guard

A Claude Code hook that asks the human before anyone, the main session
included, edits a rule file, and refuses a read-only agent's writes. It backs
the LAW "A rule is not edited to fit the work" (`AGENTS.md`), which review alone
held before (F66). It is written once, for every runtime, and wired per
runtime:

| Piece                                  | What it is                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| `.agents/contracts/write-guard.json`   | The policy: the rule-file globs, each with what it guards, and the switch-off variable |
| `.agents/agent-context.json`           | `writes` and `surface` of each agent (3e)                                    |
| `scripts/agent-harness/write-guard/`   | The engine, `paths.mjs`, `policy.mjs` and `decide.mjs`, and the Claude Code adapter, `claude-hook.mjs`, each with its test |
| `.agents/hooks.json`                   | The neutral hook source: name, event, matcher, script, timeout               |
| `.claude/settings.json`                | Generated from it by `pnpm agent-harness:generate` (3e); never edited by hand |

The rule files are the lint configs and local rules, `commitlint.config.js`,
`.prettierrc*`, `.prettierignore`, `knip.json`, every `*allowlist*.json`,
`scripts/verify-*`, `.agents/contracts/**`, `.claude/skills/**`, `AGENTS.md` and
`template.manifest.json`, plus every file that could switch the guard off
quietly: `.claude/settings*.json`, `.agents/agent-context.json`,
`.agents/hooks.json`, the agent sources and projections (`.agents/agents/**`,
`.claude/agents/**`: renaming the validator would drop its policing), the
guard's code and the modules it loads (`scripts/manifest.mjs`, whose glob
reader it uses, and `scripts/manifest-owners.mjs`), `.husky/**`,
`.github/workflows/**`, and the user-level `~/.claude/settings.json` and
`~/.claude/settings.local.json`, where `disableAllHooks` switches every hook
off; and `.agents/harness.config.json`, whose `delivery.mergePolicy: low-risk` lets
an agent merge without asking (3h). `package.json` is not one. A glob reads as
the manifest's do, with letter
case ignored, against the path relative to EVERY checkout that holds the file,
so a rule file of a sibling worktree, or of a clone under the temp dir, is one
too, and a `.git` planted inside a checkout cannot hide one. A glob that starts
`~/` is read against the path relative to the home folder (`os.homedir()`). A
`.git` file or folder below a checkout root is a rule path as well, set in the
engine rather than the policy, since a planted one would move the root.

For Edit, Write and NotebookEdit it decides as follows. "—" prints nothing,
which leaves the call to the session's own permissions; the guard never
allows. A deny wins over an ask.

| Target                                        | Read-only agent | Surface agent | Writer, main session or unlisted agent |
| --------------------------------------------- | --------------- | ------------- | -------------------------------------- |
| Scratch (the OS temp dir, `$TEMP`, `$TMP`, `$TMPDIR`, `/tmp`) or a sink (`/dev/null`) | — | — | — |
| Rule file                                     | deny            | ask           | ask                                    |
| Surface path that is not a rule file          | n/a             | —             | —                                      |
| Other repository path                         | deny            | deny          | —                                      |
| Outside the repository, not scratch           | deny            | deny          | —                                      |
| A path spelling it cannot read (below)        | deny            | deny          | ask                                    |
| Guard error                                   | deny            | deny          | ask                                    |
| `.agents/agent-context.json` unreadable       | deny            | deny          | deny for every subagent, writers and unlisted agents included; the main session is judged as above |
| `ATL_WRITE_GUARD=off`                         | —               | —             | —                                      |

Claude Code sets `agent_type` inside a subagent, and the main session carries
none. A read-only agent is `writes: false`, a surface agent has a `surface`,
and an agent the context does not list is a writer. A broken agent context
refuses every subagent, writers included, since the guard cannot tell which
ones are read-only; that is the safer side. Each tool's own key names its
target: `file_path` for Edit and Write, `notebook_path` for NotebookEdit.

A path is read as Windows reads it before it is judged: backslashes,
Git Bash's `/d/…`, the drive letter's case, `..` and `.`, the dots and spaces
that end a segment (`AGENTS.md.`), the `\\?\`, `\\.\` and `\\?\UNC\`
prefixes, and a share of this machine (`\\localhost\C$\…`, also by
`127.0.0.1` or the machine's name), read as its drive. Then the deepest
folder of the path that exists is canonicalised by the disk
(`fs.realpathSync.native`), which expands 8.3 short names (`AGENTS~1`,
`TEMPLA~1.JSO`), follows links and junctions, and fixes the letter case; the
rest is appended. The spellings it cannot read are refused for a policed agent
and asked of anyone else: an NTFS stream (`AGENTS.md::$DATA`,
`contracts::$INDEX_ALLOCATION\…`), a drive-relative path (`C:AGENTS.md`), a
device path that names no drive (`\\?\Volume{…}\`), a share of this machine
that is no drive share, an admin drive share (`\\<host>\C$\…`) of any other
host, since this machine also answers to its LAN address
(`\\192.168.x.y\C$\…`) and to an IPv6 literal (`\\0--1.ipv6-literal.net\C$\…`),
and a short name that names nothing on disk. Any other share on another host is
outside. No share is ever probed, so a slow network cannot run the hook past
its timeout. The walk costs a few probes whatever the depth: a
path 10,000 folders deep is judged in milliseconds.

Every reason names the rule, the file and how to proceed; a rule file cites the
LAW. Stdin that is not a JSON payload prints nothing, and a hook that crashes,
or whose engine fails to load, still refuses a subagent and asks the main
session. `ATL_WRITE_GUARD=off` is read before any module of the guard is
imported, so it silences even a guard that cannot load.

To switch it off, launch the session with `ATL_WRITE_GUARD=off`, or put
`"disableAllHooks": true` in `.claude/settings.local.json`. That file is
git-ignored, and it is where a project's own permissions go: `.claude/settings.json`
is generated.

- **It runs from the main checkout.** Claude Code runs the hook from
  `${CLAUDE_PROJECT_DIR}`, so a fix to the guard takes effect only once the main
  checkout moves to it.
- **A headless session cannot answer an ask.** Under `claude -p` a rule-file edit
  is refused, `--dangerously-skip-permissions` included (F66).
- **A read-only agent writes under the OS temp dir.** Its logs and probes go in a
  folder from `mktemp -d`.
- **Live check** (decision 34), 2026-11-20, in a clone under the temp dir with the
  generated settings: `claude -p` asked to Write `AGENTS.md` was refused with the
  guard's reason, and asked to Write `docs/write-guard-probe.md` it succeeded.

**Not covered:** Bash and PowerShell, for every actor: a shell command can still
write a rule file, or make the junction or link a file tool then writes
through, and the donor's tokenizer comes in a later slice. Codex, OpenCode and
Copilot run no adapter yet; each gets one after a live test. A surface agent
may write its surface folders in any other checkout on the disk, since a
surface is read against the nearest checkout that holds the target; no agent
declares a surface yet. User-level settings moved by `CLAUDE_CONFIG_DIR`, and
the managed settings an administrator installs, are not read. Nor why a rule
changed, which review reads.

### 3g. The process reaper

On Windows a killed parent does not take its children with it. A Claude Code
session that crashes or is restarted, a background shell the harness stops, or
a stopped `pnpm validate` leaves its MCP servers, turbo, the vitest workers,
esbuild and `git-remote-https` running with a dead parent, and over a day they
fill the machine's memory. The reaper ends them; the owner asked for it as
priority 1 on 2026-11-20.

| Piece                                            | What it is |
| ------------------------------------------------ | ---------- |
| `.agents/contracts/process-reaper.json`          | The families it may end, the processes it spares, the 60 s grace and the 8 s bound; a rule file |
| `scripts/agent-harness/reaper/plan.mjs`          | The pure core: from the process list, as data, each process's entry and the trees to end and keep, each with its reason |
| `scripts/agent-harness/reaper/platform.mjs`      | The adapter: it lists with `Get-CimInstance Win32_Process` on Windows and `ps -eo pid=,ppid=,lstart=,rss=,args=` under `LC_ALL=C` on POSIX, whose absolute `lstart` gives a process the same start time in every listing, and ends a tree with `taskkill /PID <pid> /T /F`, or SIGTERM then SIGKILL after 2 s |
| `scripts/agent-harness/reaper/bounded-child.mjs` | `runBounded`: a child with a time bound, ended with its whole tree at the bound; the worktree pruner's fetch runs through it |
| `scripts/agent-harness/reaper/lock.mjs`          | The lock that keeps one killing reaper at a time |
| `scripts/agent-harness/reaper/reap.mjs`          | The command, `pnpm reap` and `pnpm reap:kill` |
| `scripts/agent-harness/reaper/session-start.mjs` | The Claude Code `SessionStart` hook |

**What it ends.** An orphan: a process whose parent pid names no live process,
or names one that started after it (the pid was reused); on POSIX also one
under pid 1 or the user's subreaper (`systemd --user`, a WSL `/init`). A family
matches a process's entry alone, never text anywhere in its command line: its
own executable and, for node or python, the script it runs, its first argument
that is not a flag, with the arguments after it. It ends an orphan only when
that entry matches a family, and then with its whole descendant tree: an MCP
server npx started from its cache, the known MCP server entrypoints (context7,
codegraph serve --mcp, shadcn mcp, next-devtools, metro, expo-mcp,
react-native-docs, lottiefiles, scrapling), a one-shot vitest run and its
workers, a one-shot turbo run, the esbuild service, a one-shot tsc, jest workers
and `git-remote-https`. A wrapper, a console (`cmd.exe`, `conhost.exe`,
powershell, pwsh), a POSIX shell (`sh`, `bash`, `env`, `timeout`) or the npx
launcher, is read only by what it wraps and goes only with the one reapable
process it wraps, its childless consoles aside. Each `npx -y <pkg>` server is
four processes, `cmd.exe`, `conhost.exe`, the npx launcher and the server, and
the launcher holds about as much memory as the server.

**What it never ends.** Persistent and watch work, without the owner's word: the
families are one-shot runs, so `turbo run dev` or `start`, the turbo daemon,
`vitest` without `run`, `tsc --watch`, tsserver and the dev servers (`next dev`,
`expo start`, metro) match none. Nor does a node process in watch mode, one whose
flags before its script name `--watch`, `--watch-path <path>`,
`--watch-path=<path>` or `--watch-preserve-output`, a wrapper included, and a
tree that holds one is kept. Its own ancestry. A tree that holds a process
the contract spares: the shared MCP proxy, however it is launched (the
`mcp-proxy` executable, `python -m mcp_proxy`, a node `mcp-proxy` script), which
runs detached by design; every Git for Windows (MSYS) process, whose runtime
reports a parent already gone while it still works, so a live `sh.exe` or
`bash.exe` would read as an orphan; and tmux or screen, servers detached by
design. A tree that holds a process younger than 60 s, or one whose start time
the listing cannot read. And anything outside the families. Every tree it keeps
is printed with its reason.

**The commands.** `pnpm reap` is a dry run: one line per tree it would end (its
root pid, family, the wrapper it came through, age, process count and MB), one
`kept` line per tree it keeps and why, then the total MB. `pnpm reap:kill` ends
them; `--json` prints the plan as one JSON line and `--quiet` only the total
line. A killing run first creates `atl-process-reaper.lock` in the OS temp
directory, exclusively; another reaper that finds it held prints so and exits 0
at once, and a lock older than 30 s, left by a reaper that died, is taken over.
Right before its kills it lists the processes again and leaves every tree whose
root pid is gone or now names a process that started at another time, since a
tree kill follows a reused pid. It exits 0 when it finished, with or without
ends, and 1 on a failure: a listing that fails, a tree it could not end, an
unknown option. It ends within 8 s: a run that reaches the bound ends no tree it
had not already decided on, says so and exits 1. `signalProcessTree` stops a
taskkill after 5 s (TOOLING-12).

**The hook.** `.agents/hooks.json` runs `session-start.mjs` at every
`SessionStart`, with no matcher (start, resume, clear and compaction) and a
15 s hook timeout: the reaper with `--kill --quiet`, whose total line Claude
Code adds to the session's context. It never blocks or fails the session: the
reaper is imported inside a `try`, and whatever goes wrong, a reaper that hangs
included, prints one line to stderr and exits 0. Like the write guard it runs
from the main checkout (`${CLAUDE_PROJECT_DIR}`). To switch it off, put
`"disableAllHooks": true` in `.claude/settings.local.json`.

**Not covered:** an orphan whose parent pid was reused by a process that does
not read as newer than it, such as one whose start time the listing cannot
read, stays; a runaway that still has its parent is out of scope, however much
memory it holds; and so is an orphan outside the families: an orphaned `pnpm`
keeps the turbo or vitest below it, whose parent is still alive, and a Git for
Windows shell is spared, so a tree a dead Git Bash leaves behind stays, except
for a family process that becomes an orphan itself. A one-shot run that matches
a family but should survive is added to the spare list, on the owner's word. On
POSIX a process forked between the SIGTERM and the SIGKILL is not reached, and
the pruner's stopped fetch still signals git alone, as before. Codex, OpenCode
and Copilot run no adapter, as for the write guard.

### 3h. The harness config

`.agents/harness.config.json` holds the project's harness settings, one file,
and `.agents/contracts/harness-config.schema.json` is their contract: every
section, setting, allowed value and default. The template ships the defaults.
Both are rule files of the write guard (3f): `delivery.mergePolicy: low-risk`
lets an agent merge without asking, so only the owner changes it.

| Setting                  | Values                                | Read by |
| ------------------------ | ------------------------------------- | ------- |
| `workflow.mode`          | `sdd` (default), `odd` (decision 40)  | nothing yet; `/init` section 8 asks it. The `sdd` prune sets `odd` |
| `delivery.mergePolicy`   | `manual` (default), `low-risk` (decision 38) | the architect's merge queue: `ticket-flow` rule 4 and `refine-ticket` § Merge queue; `process-intake` writes it |
| `backend.kind`           | `supabase` (default), `own`, `none`   | nothing yet; the `supabase` prune sets `none`. `own` is a backend of the project's, which the harness does not manage |
| `backend.databaseTests`  | `linked` (default), `local`, `off`; under `supabase` only | nothing yet: F57 keeps its own setting in `packages/supabase/package.json`, which moves here once both have merged |

`pnpm verify:harness-config` holds the file to the schema, and validates by
it rather than restating its rules, so a new setting or value is a change to
the schema alone. A missing or unparsable file, a key the schema does not
declare, a value it does not allow, a missing setting and a database-test mode
under a backend other than `supabase` each fail it. It reads only the JSON
Schema keywords it knows (`type`, `properties`, `required`,
`additionalProperties`, `enum`, `const`, `if`, `then`, `else`, and the
annotations), and refuses any other in the schema, as it refuses a default
outside its own values: a rule it skipped would pass every config. It reads
`additionalProperties` only as `true` or `false`, never as a schema, and every
object of the schema outside an `if`, `then` or `else` sets it to `false`, so
every key the file holds is one the schema declares. A key given twice in one
object, in either file, fails it too: `JSON.parse` keeps the last value, while
a reader may act on the first.

The project layer of the ticket flow, docs/process/ticket-flow.md, records no
merge policy of its own: its `Policy` line names `delivery.mergePolicy`, and
`verify:skills:test` holds the template to it. A project that wrote its policy
in that line before moves the value here when it takes this change; until it
does, the architect reads `manual`, the stricter policy.

The two sections that read the policy, `ticket-flow` rule 4 and
`refine-ticket` § Merge queue, fail closed: a missing setting, any value
other than `low-risk`, a missing file, or a file that does not parse means
`manual`. Both read the file from the default branch's copy, never from the
pull request's own branch, which could otherwise change its own policy, and
`verify:skills:test` holds both to say so. In a project with no
`.agents/harness.config.json`, `process-intake` writes the whole template file
with the chosen policy, then runs `pnpm verify:harness-config`: the key alone
would make a file that fails the gate.

**Not covered:** whether a setting is the right one for the project; whether
the tree agrees with the file (a `supabase` backend with no
`packages/supabase`); and anything that reads `workflow.mode` or `backend`,
which nothing does yet.

---

## Layer 4 — CI

`.github/workflows/ci.yml` runs `pnpm install` then the same gate, with
`ATL_TEMPLATE_SELF=1`. CI runs no check that a developer cannot run locally.

On a pull request, the `commitlint` job lints the commits of the pull request,
from its base SHA to its head SHA, with `commitlint.config.js`, on a checkout
of the whole history. A commit made with `git commit --no-verify` skips the
`commit-msg` hook, so this is where it is caught, with one gap: commitlint's
default ignores pass, unlinted, a message with any line that starts
`Merge pull request`, `Merge branch …`, `Merge … into …` or `Merge tag …` (so a
body line can excuse a bad subject), one whose first line starts with `Merged`,
`Automatic merge`, `Auto-merged`, `Revert`, `Reapply`, `fixup!`, `squash!` or
`amend!`, or one that is only a version number, in the hook and in CI alike. The same check runs locally as
`pnpm exec commitlint --from origin/main --to HEAD`.

Every action a workflow runs is pinned to a full commit SHA, the tag it was
resolved from kept as a comment, and `verify:workflow-pins` fails one that is
not.

---

## The local ESLint rules

Rules the repo owns, in `eslint-local-rules/`. Each exists because a written rule
was being broken with nothing to notice.

| Rule                                 | Scope                          | Backs                                        |
| ------------------------------------ | ------------------------------ | -------------------------------------------- |
| `local/core-import-boundary`         | `packages/core/src/**`         | The domain layer imports nothing external    |
| `local/pure-domain-adapter`          | `src/services/**/*.adapter.ts` | Rule 6 — an adapter is a sync DTO mapper     |
| `local/suffix-contract`              | views and hooks                | §3.1 — types live in the block's `*.type.ts` |
| `local/no-justifying-comment`        | everywhere                     | §1.2 — comments say what the code does       |
| `local/logic-in-view`                | views                          | §14a — logic lives in hooks                  |
| `local/single-use-state`             | views                          | §14a                                         |
| `local/no-inline-tailwind-classname` | views                          | Classes live in `*.style.ts`                 |
| `local/single-object-params`         | everywhere                     | Rule 5                                       |
| `local/no-non-ascii-identifier`      | everywhere                     | §15 — English everywhere                     |
| `local/style-positions-only`         | every app, outside the component blocks | §22 — a screen or section only positions |
| `local/style-token-values`           | every style file and view of every app | §22 — every value is a token        |
| `local/ui-kit-boundary`              | every app, outside `components/ui` | §22 — only `ui/` imports a UI kit        |
| `local/dependency-seam`              | `apps/*/**` and `packages/*/**`, by pattern | §23 — every package registered, imported only inside its seam |

Every rule is wired by pattern, never per app (`docs/code-standards.md` § 24): a shared rule set
reaches `apps/*/**` and `packages/*/**`, the React set reaches every app and every package whose
`package.json` declares `react`, and the Next.js and Expo blocks every app that declares `next` or
`expo`, read by `scripts/eslint-config.detect.mjs` when the config loads. A package that declares
no `react`, `packages/tokens` among them, runs with the Node globals and no React rule. So an app
added under `apps/`, or a package under `packages/`, is judged with no config change. The fixtures
under `eslint-local-rules/__fixtures__/` prove it: the lint-rule tests lint them through the config
`eslint.config.mjs` builds for that folder (`createConfig`), as `apps/<fixture>/` or
`packages/<fixture>/`, and a plain React app is refused for a violation of every shared rule
family. The gates that walk the apps read the same list: `verify:allowlist-freshness` and
`verify:maps` walk every folder under `apps/` that holds a `package.json`, and `verify:tests`
exempts the components and hooks of the apps that declare `expo`.

---

## How to add a gate

The order matters. A gate added in the wrong order lands red and gets disabled,
which is worse than not having it.

1. **Measure first.** Run the check by hand across the repo and count the
   violations. A gate is only ever added to a codebase that already passes it.
2. **Fix the code, or drop the gate.** There is no third option, and in
   particular there is no exemption file — see the ratchet in §20. If the code
   cannot be fixed, the gate does not describe this project.
3. **Write the detector as a pure module.** `*.detect.mjs` for a lint rule,
   `scripts/<name>.mjs` for a verify script. Pure means no filesystem and no
   git inside it, so its tests drive it with fixtures.
4. **Write its test.** Synthetic fixtures, one case per rule, including the
   cases that must NOT fire. A test that spawns git, or a child that runs
   git, starts it in `gitFreeEnv()` (`scripts/git-free-env.mjs`), and the
   suite runs one end-to-end case inside `withHookGitDir`
   (`scripts/hook-git-dir.mjs`) asserting `decoyWritten` is false: a hook
   runs the suite with `GIT_DIR` set, and a git that inherits it writes to
   the hook's repository whatever its `cwd`.
5. **Scope it.** A rule that fires on files it was never meant to judge is a
   wiring bug, not a finding. Prove the glob before trusting the count.
6. **Prove it fires.** Plant a violation on purpose and watch it fail. A gate
   that is silently unwired reports zero exactly like a gate that passes.
7. **Register it in `.agents/contracts/gates.json`**, never in a command
   chain: a step at its place in its stage, with the capability whose prune
   removes it, its profile and its cost, and `blind: "exported-cases"` on the
   one step that runs a `defineGate` gate, whose companion exports `CASES`
   and registers its tests only as the entry point (`registerCases`).
   `pnpm validate --list` shows where it runs.
8. **Document it** — this file, its §21 row in `docs/code-standards.md`, and
   `docs/maps/global-map.md`.

> Step 6 is not paranoia. It has already caught two unwired rules in this repo:
> one defined but never imported, and one scoped so wide it reported 607
> failures against files it should never have read.

---

## The escape hatches, and their discipline

Flexibility without weakening the gate, in order of preference (§20):

1. **Tune the rule** so it never fires on the legitimate pattern. Best.
2. **Scoped path override** in `eslint.config.mjs`, when the false positive is
   systematic in one area — as with the vendored skill under
   `.claude/skills/archify/**`, which is pinned upstream and not ours to
   reformat.
3. **A justified inline disable**, with a written reason, one rule per line.

**Never an allowlist file**, but for the three below. A list of blessed paths
freezes a backlog into a file nobody reads. A ceiling — one number per scope that can only go down, with
a measurement date — is the sanctioned way to carry a backlog.

One exception, approved with the `english-only` change:
`scripts/verify-english.allow.json` may name a single line that must keep
text the gate reads as Spanish, each with its reason: Spanish itself (a quoted
product label), or a non-English accented word the gate cannot tell from
Spanish, such as a person's name a test needs or a loanword like
"caf&eacute;". It blesses lines, not paths, and `verify:english` fails on an entry
that excuses no line, so it cannot hold a backlog; it ships empty. The gate
reads the allowlist like any other file, so an entry writes a Spanish-only
character as a JSON Unicode escape and matches a line of plain Spanish words
with a `pattern` on a fragment of it.

The second, approved with the styling pillar (2026-11-14):
`eslint-style-positioning-allowlist.json` lets `local/style-positions-only` or
`local/style-token-values` skip one file, as `{ path, rule, reason }`, where a
value truly cannot move. It ships empty. `verify:allowlist-freshness` re-derives
every violation with the rules' own detection and fails an entry whose file no
longer breaks its rule, so the list only shrinks; a new entry is a hand edit,
with its reason, in the diff. Turborepo does not hash the list into the lint
task, so a lint result cached before an edit to it is reused.

The third, decided with F.8 (decisions 51 and 58): `eslint-dependency-seam-allowlist.json`
freezes the imports a migration has yet to move, one `{ path, package, migration, reason }` per
file and package, `migration` the id of a migration the registry declares open (the
`openMigrations` of `.agents/contracts/dependencies.json`, each `{ id, note }`). An entry counts,
for the rule and the gate, only while its migration is open; F.8 drove the list to empty and the
template declares no open migration, so it refuses any entry, while a derived project lists the
imports its open migrations have yet to move (F59). `verify:dependency-seams` re-derives every
violation with the rule's own detection, uncached, and fails an entry whose import is gone, an
import it does not list, a pair listed twice, an entry without an open migration and an open
migration no entry names, so it only shrinks. Neither the list nor the registry is a
Turborepo input of the lint task, which is why the gate does not trust a cached lint result.
