# Verify report: 2026-11-14-agents-router

> **Verified:** 2026-11-14 at `48ddfc0`

## Scenarios

This change adds no delta: the agent harness and the validation gates stay unspecified
(`openspec/README.md` § 2.1). Its proof is one row per gate case and per test, each seen red
before its code existed and green after.

### `verify:instruction-entry` — `scripts/verify-instruction-entry.test.mjs`

Red: the cases and checks run against the gate with `run` stubbed to return no finding (T1, before
the detector). Green: the same file against the gate as committed in `7668b33`.

| Case or check                                                                                | Expected            | Red  | Green |
| -------------------------------------------------------------------------------------------- | ------------------- | ---- | ----- |
| "a tree with AGENTS.md, README.md and no CLAUDE.md passes"                                   | 0 findings          | pass | green |
| "a missing AGENTS.md is caught, not skipped"                                                 | 1 finding           | fail | green |
| "a missing README.md is caught, not skipped"                                                 | 1 finding           | fail | green |
| "a CLAUDE.md at the root is refused: Claude Code would read it instead of AGENTS.md"         | 1 finding           | fail | green |
| "a CLAUDE.md that imports AGENTS.md is still refused"                                        | 1 finding           | fail | green |
| "a .claude/CLAUDE.md is refused"                                                             | 1 finding           | fail | green |
| "a CLAUDE.local.md is refused"                                                               | 1 finding           | fail | green |
| "a CLAUDE.md in a subfolder is refused"                                                      | 1 finding           | fail | green |
| "a lower-case claude.md is refused, as a case-insensitive disk finds it"                     | 1 finding           | fail | green |
| "a mixed-case Claude.Local.MD is refused"                                                    | 1 finding           | fail | green |
| "every instruction file that blocks AGENTS.md is named on its own"                           | 2 findings          | fail | green |
| "a file whose name only contains CLAUDE.md stays silent"                                     | 0 findings          | pass | green |
| "a finding names the file and says why it blocks AGENTS.md"                                  | kind, path, message | fail | green |
| "a missing root file is named as missing"                                                    | kind, path, message | fail | green |
| "the cases fail against a gate that finds nothing"                                           | a blinded gate fails | pass | green |
| "the default listing is git: a CLAUDE.md not yet added is refused"                           | `['CLAUDE.md']`     | fail | green |
| "the default listing is git: a staged .claude/CLAUDE.md is refused"                          | the staged path     | fail | green |
| "the default listing is git: a CLAUDE.local.md a .gitignore ignores is not seen"             | `[]`                | pass | green |
| "the gate run over a planted CLAUDE.md exits 1 and names it"                                 | exit 1, path named  | fail | green |
| "the gate run over a healthy repository exits 0"                                             | exit 0, PASS        | pass | green |

Red: 15 of 20 failed, each for the stated reason (a planted file not refused, a missing root file
not reported); the five that passed are the ones that expect no finding. Green: 20 of 20.

**The planted violation in this worktree.** With an untracked `CLAUDE.md` at the root and a
`.claude/CLAUDE.md` written in, `node scripts/verify-instruction-entry.mjs` exited 1 and named
both; with them removed it exited 0.

**Mutants.** Each mutant of `scripts/verify-instruction-entry.mjs`, run against the committed test
in a scratch copy, fails at least one test:

| Mutant                                               | Failing tests |
| ---------------------------------------------------- | ------------- |
| `git ls-files` without `--cached`                    | 1             |
| without `--others`                                   | 2             |
| without `--exclude-standard`                         | 1             |
| the name matched case-sensitively                    | 11            |
| the name not anchored to a path segment              | 1             |
| `.local` not matched                                 | 3             |
| a missing root file never reported                   | 3             |
| a root file judged present without reading the disk  | 3             |

### `codex-budget:test` — `scripts/codex-budget.test.mjs`

| Test                                                                     | Red                                                                                         | Green |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ----- |
| "the Codex config sets the project-doc budget before any table header"   | fail before `.codex/config.toml` existed (ENOENT); fail on a fixture with the key under `[agents]` | green |
| "AGENTS.md fits the Codex project-doc budget, with CRLF line endings"    | fail on an oversized fixture: 65536 bytes with LF, 66560 with CRLF, over the 65536 budget  | green |
| "every line ending counts as CRLF, once"                                 | pass (it drives the counter alone, with no file)                                            | green |

The two fixtures ran the committed test from a scratch copy, beside the real `.codex/config.toml`
or a fixture one; the oversized `AGENTS.md` fits with LF and breaches only once its line endings
are counted as CRLF, which is the case decision 39 names.

### The router — `AGENTS.md`

| Check                                                                                  | Result                                                                    |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Every directory under `.claude/skills/` is the Load skill of exactly one Router row    | 27 skills, 27 rows, none unrouted, none unknown, none twice               |
| Every gate a Validated by cell names is a script in `package.json`                     | 10 distinct names, none missing                                           |
| No Spanish line                                                                        | `verify:english` green                                                    |
| The LAWs hold no product name, no link, no count or dated number in prose              | read by hand; the one owner quote of the donor's LAWs left with the styling LAW |

## Sizes

`AGENTS.md` at `48ddfc0`: 27360 bytes with LF endings, 27810 with CRLF, 450 lines; at `53bcd3c` it
held 13712 bytes with LF and 13955 with CRLF. The budget is 65536, so the file fits with room;
it also fits Codex's 32 KiB default today.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-14, at `48ddfc0` (turbo 24 of 24 tasks; `report:spec-drift` lists 0 of 8 living specs).

## Not verified

- That Codex reads `.codex/config.toml` from the repository and loads the whole of `AGENTS.md`:
  no Codex CLI ran here. The plan's C1 measure (Codex quotes the last section of `AGENTS.md`)
  belongs to step 3.2, when the projector generates the file.
- A CLAUDE.md the repository does not list: one above the root or in the home directory, and an
  ignored CLAUDE.local.md. The gate's `notCovered` says so.
- That every Router row sends a task to the right skill, and that the LAWs are followed: review.
