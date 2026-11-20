# Proposal: the updater registry, its gate, and the runner that turns an update into a pull request

> **Status:** open

## Why

The template keeps several things current by hand or not at all. `pnpm mcp:docs` refreshes the
MCP server docs only when someone runs it, and it cannot say "out of date" without writing: a run
exits 0 whether it wrote or not, and 1 on a failure, so no scheduler can tell the three apart
(`scripts/update-mcp-docs.mjs:52-53`). Nothing schedules it: F33 waits on the owner. The other
things that drift (the vendored archify skill, the action SHAs `verify:workflow-pins` holds, the
dependencies, the agent rules) have gates but no updater, and an updater written for each, with
its own shape, would leave nothing to hold them to one safety rule: an updater that rewrites a
rule file edits a rule to fit the work, which the LAW forbids unless the owner decides it.

This change is slice 1 of nine: the contract every updater follows, the gate that holds it, the
`--check` and `--json` modes of the first updater, and the runner. The schedule, which closes F33,
is slice 2.

The owner's words, verbatim:

- 2026-11-20 (translated from Spanish): "But we also need a policy updater, and also a skill
  updater that runs periodically"
- 2026-11-20 (translated from Spanish), choosing every policy offered: "Versions and security",
  "Agent rules", "Shared rules", and "Apply doctor also in Claude and whatever it is called in
  other harnesses, to update ours too"

## What changes

- **The registry.** `.agents/contracts/updaters.json` lists every periodic updater, one entry
  each: its `id` (kebab-case, unique, the branch `updates/<id>` its pull request comes from), its
  `command` (`pnpm <script>`), `runsIn` (`ci`, `local` or both), the `network` hosts it reaches,
  the `secrets` it reads, the repository paths it `writes`, `proposal` (true when its pull request
  proposes a rule change) and the `verify` commands its change must pass. It starts with one
  entry, `mcp-docs`. It is a contract, so the write guard asks before anyone edits it.
- **The gate.** `pnpm verify:updaters` (`scripts/verify-updaters.mjs`), inside `validate` through
  the gate registry, refuses an unknown key, a missing key, a `runsIn` value other than `ci` or
  `local`, an id that is not kebab-case or is listed twice, a `command` or `verify` entry that is
  not `pnpm <script>` of a script the root `package.json` defines, and a `writes` path the write
  guard classifies as a rule file (`ruleFor` of `scripts/agent-harness/write-guard/policy.mjs`,
  never a second list), or one with a wildcard, while `proposal` is not true.
- **`--check` and `--json` on `pnpm mcp:docs`.** `--check` asks the registry and writes nothing:
  it exits 0 when the block is current, 2 when a run would rewrite it, and 1 on a failure.
  `--json` prints the run as one JSON document. The update mode's output and exit codes stay as
  they were, pinned by a test written first and by a differential run against the base.
- **The runner.** `pnpm updaters:run [--only <id>] [--where ci|local] [--dry-run]`
  (`scripts/updaters/run.mjs`) runs `<command> --check` for every updater that runs where it does.
  An updater that is out of date is run on `updates/<id>`, rebuilt from the default branch; its
  `verify` commands run; the change is committed with a Conventional Commit and no attribution,
  pushed to `updates/<id>` only, and opened as one pull request per updater, or the open one is
  updated. A pull request whose updater declares `proposal: true`, or whose diff touches a rule
  path, opens as a draft labelled `rule-proposal` and quotes the LAW "A rule is not edited to fit
  the work". A failed check opens nothing. `--dry-run` runs the checks and prints the plan, and
  runs no git and no gh. `git`, `gh` and the shell are injected, so the tests drive it with fakes.
- **The docs.** `docs/harness.md` gains a section on the updaters; `docs/mcp.md` describes the two
  new modes.

## Out of scope

- The scheduled workflow `.github/workflows/updaters.yml` and its token: slice 2, which needs the
  owner's decisions on the token and the schedule, and closes F33.
- Updaters for the action pins (slice 3), the dependencies and advisories (slice 4), the skills
  (slices 5 and 6, the second needing the archify licence decision), the agent rules (slice 7),
  the shared rules (slice 8) and a local doctor (slice 9).
- Holding a run to its `writes`: the runner classifies the diff it got, and review reads a diff
  outside the declared paths.

## Affected specs

- `openspec/specs/harness/mcp/spec.md`: added MCP-09, MCP-10
- `openspec/specs/harness/updaters/spec.md`: a new spec, added UPDATERS-01 to UPDATERS-09
