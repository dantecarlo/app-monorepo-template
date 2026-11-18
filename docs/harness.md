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
| **Hooks**  | On commit       | seconds       | Staged-file lint, commit message   |
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

The chain runs in cost order:

### 3a. Instant gates — they run first

| Gate                            | Proves                                                    |
| ------------------------------- | --------------------------------------------------------- |
| `pnpm agent-harness:projection-check` | Every projected agent file equals what its neutral source renders, and is committed (see 3e) |
| `pnpm agent-harness:test`       | The projector's reader, adapters, writer, checker and sync still behave |
| `pnpm verify:manifest`          | `template.manifest.json` is well formed                   |
| `pnpm verify:manifest:coverage` | Every tracked file has exactly one owner, no stale claims |
| `pnpm verify:manifest:test`     | The pure engine behind both still behaves                 |
| `pnpm verify:lint-rules:test`   | The local ESLint rules still report what they must        |
| `pnpm verify:allowlist-freshness:test` | The styling allowlist gate fails a stale entry and an unlisted violation |
| `pnpm verify:allowlist-freshness` | Every entry of `eslint-style-positioning-allowlist.json` still breaks its rule, and every violation is listed; prints the live count |
| `pnpm verify:dependency-seams:test` | The dependency-seam gate fails each drift it names, planted in a scratch tree, and asks ESLint which files it ignores |
| `pnpm verify:dependency-seams` | Every `package.json` dependency is in `.agents/contracts/dependencies.json` and every entry is declared; every seam glob matches a file; the configs ESLint ignores import inside their seams; every entry of `eslint-dependency-seam-allowlist.json` is still a violation and every violation is listed; prints the live counts |

Structural drift fails here, before anything expensive builds. See
[manifest.md](manifest.md). The projection check is step 1 of the chain: an agent
file edited by hand fails before anything else runs.

### 3b. Turbo — lint, typecheck, test, build

`turbo run lint typecheck test build format:check` across every workspace.
`format:check` has no workspace task yet, so it runs nothing: formatting is
enforced by the `prettier/prettier` ESLint rule on workspace TS/TSX, and by
the pre-commit hook on staged files.

### 3c. The verify scripts

| Gate                  | Proves                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `verify:tests`        | Every unit has a test, in the `__tests__/` of its own folder and named after it           |
| `verify:maps`         | The global map resolves, and no stray magic literals                                      |
| `verify:pairing`      | A service has its adapter and vice versa                                                  |
| `verify:structure`    | Screen and component folders satisfy the block contract                                   |
| `verify:security`     | The static security posture holds                                                         |
| `verify:theme-sync`   | Every generated token output (the web `theme.css`, the NativeWind preset, the mobile `themeVars`, the `themeNames` the shared `tv` registers) equals its regeneration from `tokens.constant.ts`; `verify:theme-sync:test` plants a hand edit in each and an un-regenerated source change |
| `verify:mcp-docs`     | The generated block of `docs/mcp.md` is what `pnpm mcp:docs` wrote and lists every server, package and capability of `.agents/contracts/mcp-servers.json` plus `.mcp.json`; offline, and it never judges a version. `verify:mcp-docs:test` plants each drift; `mcp:docs:test` drives the updater with an injected registry |
| `verify:ticket-branch:test` | `scripts/verify-ticket-branch.test.mjs` drives the branch check (below, 3d) with a valid ticket branch and pull request body and each refusal, under the default ticket identity and under example layers (a TASK-slug one among them), with each malformed block and flag, and as a process over a scratch working directory |
| `verify:skills:test` | `scripts/verify-skills.test.mjs` holds the seven ticket skills of `.claude/skills/` to their sections (the shape of `new-skill`, every state, role and board operation of `ticket-flow`, the role skills' opening and the contract tables they must not copy, the three templates, the ticket template's target version marked `**Version (required):**`, and both merge policies, `manual` and `low-risk`, named in `ticket-flow` rule 4, `refine-ticket`'s merge queue, `process-intake`'s mapping step and the process template, whose Policy line gives `manual`; the merge queue: `refine-ticket` has its § Merge queue, `qa-ticket`'s hand-off step names `<id> ready to merge, PR #<n>`, and `qa-ticket` holds no `Ready to merge → Done`; the ticket identity: `ticket-flow` names `branchTypes` and the `json ticket-identity` block, `process-intake`'s mapping step names the block, and the process template ships one that the branch check reads with no finding and whose fields are its defaults; QA's checkout: `qa-ticket`'s Step 2 adds its worktree with `--detach` and its Step 5 pushes with `git push origin HEAD:<branch>`; and the hotfix: `qa-ticket`'s hand-off step, `refine-ticket`'s release step and `ticket-flow`'s messages name `<id> ready to merge, hotfix`, and `release-ticket`'s Hotfix section says that QA leaves it at Ready to merge), with synthetic cases and over the repository |
| `docs:diagrams:check` | Every committed diagram matches its spec and the tokens                                   |
| `verify:specs`        | Every living spec and change has its shape, and every test a scenario names exists        |
| `report:spec-drift`   | Lists the living specs whose governed code moved past their verified commit; never blocks |
| `verify:english`      | No tracked text outside the i18n catalogs holds a Spanish line, unless allowlisted        |
| `verify:instruction-entry` | `AGENTS.md` and `README.md` exist, and no `CLAUDE.md` or `CLAUDE.local.md` in any folder makes Claude Code read it instead of `AGENTS.md` |
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

---

## Layer 4 — CI

`.github/workflows/ci.yml` runs `pnpm install` then the same gate, with
`ATL_TEMPLATE_SELF=1`. CI runs no check that a developer cannot run locally.

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
reaches `apps/*/**` and `packages/*/**`, and a framework's block (React, Next.js, Expo) reaches
every app whose `package.json` declares it, read by `scripts/eslint-config.detect.mjs` when the
config loads. So an app added under `apps/` is judged with no config change. The fixture apps under
`eslint-local-rules/__fixtures__/apps/` prove it: the lint-rule tests lint them through the config
`eslint.config.mjs` builds for that folder (`createConfig`), as `apps/<fixture>/`, and a plain
React app is refused for a violation of every shared rule family.

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
   cases that must NOT fire.
5. **Scope it.** A rule that fires on files it was never meant to judge is a
   wiring bug, not a finding. Prove the glob before trusting the count.
6. **Prove it fires.** Plant a violation on purpose and watch it fail. A gate
   that is silently unwired reports zero exactly like a gate that passes.
7. **Wire it into `pnpm validate`.**
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
freezes the imports that broke `local/dependency-seam` when it landed, one
`{ path, package, reason }` per file and package, the reason starting with the F.8 unit that
removes it (`F.8 unit 2: …`). It is the one list that ships with a backlog, and units 2 to 8 drive
it to empty. `verify:dependency-seams` re-derives every violation with the rule's own detection,
uncached, and fails an entry whose import is gone, an import it does not list, a pair listed twice
and an entry without its unit, so it only shrinks. Neither the list nor the registry is a
Turborepo input of the lint task, which is why the gate does not trust a cached lint result.
