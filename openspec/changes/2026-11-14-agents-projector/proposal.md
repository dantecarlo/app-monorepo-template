# Proposal: the `.agents/` neutral agent source, the four-runtime projector and `projection-check`

> **Status:** open

## Why

The template ships one agent, `.claude/agents/validator.md`, written by hand for Claude Code
alone. Codex, OpenCode and Copilot get no agent at all, and `.codex/config.toml` is
hand-written with a header saying step 3.2's projector will generate it. Nothing would notice
a projection edited by hand, a source with no projection, or a projection with no source.

`docs/INIT_AND_HARNESS_PLAN.md` binds the fix:

- Roadmap step 3.2: "`.agents/` structure, the four-runtime projector and `projection-check`;
  agents with `gradedBy`; `sdd-steward`", done when "`projection-check` green". This change is
  its part A: the structure, the projector and the drift gate.
- Decision 13: "Every other machinery file is product-free"; decision 14: "Skills hold
  procedure, never values"; decision 15: "Generated outputs are never hand-edited. Each output
  has exactly one writer and a drift gate".
- Decision 39: "The generated Codex config sets the budget, and a test fails when `AGENTS.md`,
  counted with CRLF endings, outgrows it".
- The donor row of the harness core: "Neutral agent source projected to `.claude/`,
  `.opencode/`, `.codex/`, `.github/agents`; `projection-check` is step 1 of `validate`".
- The runtime matrix: "Every projection is a generated copy with a drift gate. Symlinks break
  on Windows clones."
- The P2 exit: "projections regenerate byte-identical".

The owner's words:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The
  screen or section files must contain only positioning, and the components are what must hold
  the other styles, but everything centralized in styles and the tokens. Fix everything you
  mention applying what is recommended, and once everything is fixed tell the Arquitecto to
  integrate it and fix everything"
- 2026-11-14 (translated from Spanish): "yes, merge the three in that order when they are green,
  and continue"

## What changes

- **The neutral source.** `.agents/agents/validator.agent.md` holds the validator, moved from
  `.claude/agents/validator.md` with one line added, `model: fable`, the model the donor's
  validator source declares. Its frontmatter is the donor's closed schema: exactly
  `description`, `model`, `name` and `tools`, and the file name equals `name`.
- **The projector**, ported from Certifipago's `scripts/agent-harness/` into
  `scripts/agent-harness/`: `neutral-source.mjs` (the closed-schema reader),
  `claude-projection.mjs` (identity for Claude), `adapters.mjs` (Codex, OpenCode and Copilot,
  with `EXPRESSIVENESS` and an empty `MODEL_MAP`), `projection-manifest.mjs` (the complete-tree
  comparison and the hash manifest), `generate.mjs` (parses every source before it writes, then
  writes each file atomically by rename), `check.mjs` (`projection-check`) and `sync.mjs`
  (generate, then judge with the read-only checker).
- **The generated outputs**, each written only by `pnpm agent-harness:generate`:
  `.claude/agents/validator.md`, identical to its source; `.codex/agents/validator.toml`;
  `.codex/config.toml`; `.opencode/agents/validator.md`; `opencode.json`;
  `.github/agents/validator.agent.md`; and `.agents/projection-manifest.json`, the sha256 of
  every output.
- **`projection-check`** fails on a missing, extra, changed or untracked output, and on a
  manifest that differs from the render, then prints "Run pnpm agent-harness:generate". It runs
  first in `validate`, and `agent-harness:test` right after it.
- **The tests**, ported from the donor: `adapters.test.mjs`, `projection-generation.test.mjs`,
  `expressiveness.test.mjs` and `sync.test.mjs`, plus a real-git run of `check.mjs` over a
  scratch repository.
- **The wiring**, as `docs/harness.md` ("How to add a gate") asks: the `package.json` scripts
  `agent-harness:{generate,projection-check,sync,test}` and `validate`; `.prettierignore` for
  the generated JSON; `template.manifest.json`, where `core` owns every new file;
  `docs/harness.md`; `docs/maps/global-map.md`; and the "Validation gate" prose of `AGENTS.md`.

## Decisions

Made before this proposal, by the session that scheduled the step:

1. The projector targets the four runtimes the plan names: Claude Code, Codex, OpenCode and
   Copilot, and projects all four. Choosing runtimes is `/init`'s job in Stage 6.
2. The neutral sources live in `.agents/agents/*.agent.md`. The validator moves there with the
   donor's model, so `.claude/agents/validator.md` becomes a generated output identical to its
   source. `MODEL_MAP` stays empty, so the non-Claude outputs leave the model out, as the
   donor's do.
3. The non-Claude prelude points at `AGENTS.md`, not at the donor's
   docs/agent-harness/project-context.md, which the template does not have.
4. `.codex/config.toml` becomes a generated output. It keeps `project_doc_max_bytes = 65536`
   above `[agents]`, so `scripts/codex-budget.test.mjs` stays green; the `[agents]` table keeps
   the donor's `max_depth = 2` and `max_threads = 4`; the "hand-written" header goes.
5. `projection-check` lists the tracked files with `git ls-files` through `spawnSync` and
   `gitFreeEnv`, the way `scripts/verify-english.mjs` does, instead of porting the donor's
   repository-state.mjs and git-runner.mjs. It runs first in `validate`, and
   `agent-harness:test` right after it.
6. The generated JSON files get `.prettierignore` entries, every new file gets an owner in
   `template.manifest.json`, and the docs above name the gate.

Made by this change, each where the donor's code would ship a broken or redundant output:

7. **The prelude drops "and report its version".** The donor asks for the version of its
   project-context file, which its spawn probe reads back; `AGENTS.md` carries no version and
   the probe is not ported, so the prelude reads "Read `AGENTS.md` before anything else."
8. **The OpenCode and Copilot descriptions are written as double-quoted YAML strings.** The
   donor writes the description as a plain scalar, and a plain scalar cannot hold ": ": the
   validator's "Read-only: never edits files." makes the frontmatter fail to parse ("Nested
   mappings are not allowed in compact mappings", from the `yaml` package). A JSON string is a
   valid YAML double-quoted scalar, so the renderer writes `JSON.stringify(description)`.
9. **The Codex prompt escapes `\` and `"""`.** The donor puts the body inside a TOML multi-line
   basic string unescaped, where a backslash starts an escape and `"""` ends the string. No body
   holds either today; the renderer escapes both, so a later prompt with a regular expression or
   a Windows path cannot break the agent's TOML file.
10. **`opencode.json` names no `instructions` file.** OpenCode discovers `AGENTS.md` itself and
    loads the configured instructions "alongside discovered AGENTS.md files"
    (opencode.ai/docs/instructions); naming `AGENTS.md` there would add it again. The donor
    lists its project-context file, which OpenCode would not otherwise read.
11. **`check.mjs` takes `--root`**, as `scripts/verify-instruction-entry.mjs` does, so its test
    runs the gate as a process over a scratch git repository.
12. **The generated `.codex/config.toml` keeps the budget comment** step 3.1 wrote (why the key
    sits above every table header, and which test holds it); only the "hand-written" header
    goes.

## Out of scope

- **Choosing runtimes.** All four are projected; `/init` selects them in Stage 6.
- **Part B of step 3.2**: `gradedBy`, `sdd-steward` and `verify:router-coverage`.
- **The `.agents/skills` mirror**, so Codex agents get no skills yet.
- **The donor's generated-outputs.json and `verify:sole-writer`**: step 4.1.
- **The donor's codex-readonly**, its read-only Codex launcher: part B or step 3.3.
- **The donor's projection-shape.test**, which needs the decoy-`GIT_DIR` helper of step 3.3.
- **The donor's receipts, spawn probe, `update` and shadowing scripts**, and its other agents,
  which are product-specific.
- **A model for the non-Claude runtimes**: `MODEL_MAP` stays empty until an id is verified
  against its runtime.
- **Running any runtime.** No Codex, OpenCode or Copilot CLI runs here; the outputs are checked
  for their shape, not loaded.
- **`docs/code-standards.md` § 21**: its row for the new gate belongs to the session that owns
  that file in this wave.
- **Certifipago**: decisions 8 and 9 are defects of its projector, reported to its own session.

## Affected specs

- None. No living spec governs `scripts/`, `.agents/`, `.claude/agents/`, `.codex/`,
  `.opencode/`, `.github/agents/` or `opencode.json`: the eight specs under `openspec/specs/`
  govern the packages and apps (`openspec/README.md` § 2.1), and the agent harness and the
  validation gates stay unspecified, as decided in `2026-11-11-adopt-sdd`. The projector is
  tooling, which § 1 sizes as needing no spec; its proof is the tests and gates each task runs,
  recorded in the verify report.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
