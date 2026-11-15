# Verify report: 2026-11-14-agents-projector

> **Verified:** 2026-11-15 at `5c2c1a2`

## Scenarios

This change adds no delta: the agent harness and the validation gates stay unspecified
(`openspec/README.md` § 2.1). Its proof is one row per test, each seen red before its code
existed and green after, the mutants below, and the planted violations.

Red, for every file: the test ran against stub modules that export the same names and do
nothing (a reader that accepts anything, renderers that return empty text, a checker that finds
nothing). The checker cases of T1 ran a second time against the real reader and writer with the
checker still stubbed, so each failed because no drift was reported. Green: the file as
committed.

### `scripts/agent-harness/projection-generation.test.mjs` (T1)

| Test                                                                                           | Red                         | Green |
| ---------------------------------------------------------------------------------------------- | --------------------------- | ----- |
| "a folded description is read as one line, and the body is kept whole"                         | fail                        | green |
| "given the committed neutral sources, rendering twice produces identical bytes"               | fail: no agent rendered     | green |
| "given the committed projection, it already equals what the neutral sources render"           | fail: validator.md missing  | green |
| "the Claude projection is the neutral source, byte for byte"                                    | fail: nothing written       | green |
| "given a generated projection, regenerating it changes nothing"                                 | fail: nothing written       | green |
| "the manifest records the sha256 of every rendered output"                                      | fail: no manifest           | green |
| "given a deleted output, the checker reports it missing instead of passing"                     | fail: no drift reported     | green |
| "given an output nobody generates, the checker reports it extra"                                | fail: no drift reported     | green |
| "given a hand-edited output, the checker reports it changed"                                    | fail: no drift reported     | green |
| "given an output checked out with CRLF endings, the checker sees no drift"                      | pass (expects no finding)   | green |
| "given a hand-edited manifest, the checker reports it changed"                                  | fail: no drift reported     | green |
| "given no manifest, the checker reports it missing"                                             | fail: no drift reported     | green |
| "given a source carrying a field outside the closed schema, generation fails and writes nothing" | fail: no exception          | green |
| "given a source missing a required field, generation fails and writes nothing"                  | fail: no exception          | green |
| "given a source whose declared name disagrees with its filename, generation fails"              | fail: no exception          | green |
| "given a rendered output that is not committed, the checker names it"                           | fail                        | green |
| "given every output committed, the tracking check stays quiet"                                  | pass (expects no finding)   | green |
| "projection-check run over a repository whose output git does not list exits 1 and names it"   | fail: exit 0                | green |
| "projection-check run over a repository with every output added exits 0"                        | fail: no summary printed    | green |
| "projection-check run over a hand-edited output exits 1 and says how to fix it"                 | fail: exit 0                | green |

Red: 18 of 20 failed against the stubs; the two that passed expect no finding.

### `scripts/agent-harness/adapters.test.mjs` (T2 Codex, T3 OpenCode and Copilot)

| Test                                                                                     | Red                           | Green |
| ---------------------------------------------------------------------------------------- | ----------------------------- | ----- |
| "given a field no target maps, {opencode, codex, copilot} refuses to render"             | fail ×3: no exception         | green |
| "given the closed schema, {opencode, codex, copilot} points the agent at AGENTS.md first" | fail ×3                       | green |
| "given the same source twice, {opencode, codex, copilot} renders identical bytes"        | pass ×3 (empty equals empty)  | green |
| "given a description carrying a colon and a quote, {opencode, copilot} writes it as one YAML string" | fail ×2: no description line | green |
| "the OpenCode agent is a subagent with each of its tools enabled"                         | fail                          | green |
| "the Copilot agent names itself and lists its tools inline"                               | fail                          | green |
| "given an unmapped model, the OpenCode config omits it and names no instruction file"     | fail                          | green |
| "given a mapped model, the OpenCode config lists the mapped id"                           | fail                          | green |
| "given an unmapped model, the Codex agent leaves it out"                                  | pass (expects absence)        | green |
| "given a mapped model, the Codex agent renders the mapped id"                             | fail                          | green |
| "given any agent, the Codex config stays repository-local"                                | fail                          | green |
| "the Codex config raises the project-doc budget before any table"                         | fail                          | green |
| "the Codex config says it is generated, and nothing says it is hand-written"              | fail                          | green |
| "given an agent, the Codex config registers it as a named sub-table"                      | fail                          | green |
| "given the projection, no registered path restates CODEX_HOME"                            | fail: no agent registered     | green |
| "given the projection, every registered agent file resolves"                              | pass (nothing registered)     | green |
| "given the committed tree, no adapter output escapes into ~/.codex"                       | fail: no `.codex/agents`      | green |
| "given a description carrying a quote, Codex escapes it"                                  | fail                          | green |
| "given a prompt carrying a backslash and a triple quote, Codex keeps it one string"       | fail                          | green |

Red: T2, 11 of 14 Codex cases failed; T3, 10 of 12 OpenCode and Copilot cases failed. The cases
that passed expect an absence or equality an empty stub also satisfies.

### `scripts/agent-harness/expressiveness.test.mjs` (T3)

| Test                                                                                        | Red                           | Green |
| ------------------------------------------------------------------------------------------- | ----------------------------- | ----- |
| "every adapter declares what it carries and what it cannot"                                  | fail: two adapters declared   | green |
| "a field an adapter claims to support REACHES its output"                                    | pass (only two adapters seen) | green |
| "every foreign adapter declares the model as mapped, with its reason"                        | fail                          | green |
| "an unmapped Claude alias never reaches a foreign target"                                    | pass (expects absence)        | green |
| "the shipped map carries no alias, so every foreign agent inherits its session model"        | fail                          | green |
| "a mapped alias renders as the target’s own model id"                                        | fail                          | green |
| "a field declared unexpressible is absent from the output"                                   | pass (expects absence)        | green |
| "every canonical field is either carried or declared missing"                                | pass (only two adapters seen) | green |
| "codex declares that it cannot restrict tools"                                               | pass (Codex landed in T2)     | green |
| "opencode declares that the filename carries the name"                                       | fail                          | green |

### `scripts/agent-harness/sync.test.mjs` (T4)

| Test                                                                          | Red                          | Green |
| ----------------------------------------------------------------------------- | ---------------------------- | ----- |
| "a sync whose own check comes back clean has converged"                       | pass (expects no finding)    | green |
| "a check still failing after the write is reported, not swallowed"            | fail                         | green |
| "the finding names how many passes were spent"                                | fail                         | green |
| "sync writes, then re-checks with the read-only checker"                      | fail: neither was called     | green |
| "a second sync over a converged tree writes the same bytes"                   | pass (empty equals empty)    | green |
| "a generator that throws leaves the checker unrun"                            | fail: no exception           | green |
| "a sync with the real writer and checker converges over a fresh tree"         | fail: no output rendered     | green |

### The donor's two defects, run against the donor's code

| Mutant (the donor's line restored)                                    | Failing tests                                                                 |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| the Codex prompt written unescaped                                    | "given a prompt carrying a backslash and a triple quote, Codex keeps it one string" |
| the YAML description written as a plain scalar                        | both "…writes it as one YAML string" cases: the line is not one string        |

### Mutants of the checker

Each mutant, run against the committed tests, fails at least one:

| Mutant                                                   | Failing tests |
| -------------------------------------------------------- | ------------- |
| the owned directories never walked                       | 12            |
| an output read without folding CRLF to LF                | 2             |
| the manifest never judged                                | 2             |
| an untracked output never reported                       | 1             |
| a changed output never reported                          | 2             |

### The committed outputs, read by real parsers

Outside the gate, with the `yaml` and `smol-toml` packages already in `node_modules` (neither is
a dependency of the root, so no committed test imports them):

| Output                                | Parser      | Result                                                               |
| ------------------------------------- | ----------- | -------------------------------------------------------------------- |
| `.claude/agents/validator.md`         | `yaml`      | parses: `name`, `description`, `tools`, `model`                      |
| `.opencode/agents/validator.md`       | `yaml`      | parses: `description`, `mode`, `tools` as a map of four `true`       |
| `.github/agents/validator.agent.md`   | `yaml`      | parses: `name`, `description`, `tools` as a list of four             |
| `.codex/config.toml`                  | `smol-toml` | `project_doc_max_bytes` 65536; `[agents]` holds `max_depth` 2, `max_threads` 4 and `validator` with `config_file = "agents/validator.toml"` |
| `.codex/agents/validator.toml`        | `smol-toml` | `developer_instructions` equals the prelude plus the source body, byte for byte |

The donor's plain-scalar frontmatter, given the validator's description, does not parse:
`yaml` reports "Nested mappings are not allowed in compact mappings".

### Planted violations in this worktree

| Plant                                                         | Result                                                                                       |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| the hand-written `.codex/config.toml` of step 3.1, before T2's generate | `projection-check` reported 4 deviations: `missing: .codex/agents/validator.toml`, `changed: .codex/config.toml`, `untracked: …`, `changed: .agents/projection-manifest.json` |
| a line appended to `.opencode/agents/validator.md`            | `ATL_TEMPLATE_SELF=1 pnpm validate` exit 1 at its first step: `changed: .opencode/agents/validator.md`, "Run pnpm agent-harness:generate and review the diff." |
| the plant removed                                             | `projection-check` exit 0, 6 outputs                                                          |

**Byte-identical regeneration.** `pnpm agent-harness:sync` over the committed tree rewrote all
seven files and left `git status` clean; the checker then found the six outputs matching.

**The validator moved unchanged.** `.claude/agents/validator.md` at `5c2c1a2` differs from the
hand-written file at `e8a4489` by one added line, `model: fable`.

## Sizes

`AGENTS.md` at `5c2c1a2`: 28169 bytes with LF endings, 28629 with CRLF, 460 lines; the budget is
65536.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-15, at `5c2c1a2` (turbo 24 of 24 tasks;
  `agent-harness:test` 63 of 63; `projection-check` 6 outputs). It also exited 0 at each work
  unit before its commit: `c993c2f`, `3f453a3` and `5c535cd`.

## Not verified

- That Codex, OpenCode and Copilot load their projection: no CLI of theirs ran here. The outputs
  are held to their documented shape and parsed by a YAML and a TOML parser, not spawned. The
  plan's C1 measure (Codex quotes the last section of `AGENTS.md`) still waits for a Codex run.
- That OpenCode and Copilot resolve Claude tool names (`Read`, `Grep`); the donor documents that a
  runtime falls back to its own defaults on a name it does not know.
- That `projection-check` ignores a hook's `GIT_DIR`: it runs git under `gitFreeEnv`, but the
  decoy-`GIT_DIR` test waits for step 3.3's helper.
- `docs/code-standards.md` § 21 has no row for `agent-harness:projection-check` yet: that file is
  outside this change.
