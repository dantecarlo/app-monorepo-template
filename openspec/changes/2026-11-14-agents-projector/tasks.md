# Tasks: 2026-11-14-agents-projector

- [ ] T1 — the neutral source `.agents/agents/validator.agent.md` (the validator moved, `model: fable` added), the Claude projection, the projection manifest, `generate` and `check` with `--root`; `projection-generation.test.mjs`, RED first; `agent-harness:{generate,projection-check,test}` scripts; `.prettierignore` and `core` ownership for the new files · Requirements: none · Commit: —
- [ ] T2 — the Codex adapter and the takeover of `.codex/config.toml` (budget above `[agents]`, `max_depth = 2`, `max_threads = 4`, the prompt escaped); `adapters.test.mjs` Codex cases, RED first; `codex-budget:test` still green · Requirements: none · Commit: —
- [ ] T3 — the OpenCode and Copilot adapters, `opencode.json` with no `instructions` entry, the descriptions as double-quoted YAML; their `adapters.test.mjs` cases and `expressiveness.test.mjs`, RED first · Requirements: none · Commit: —
- [ ] T4 — `sync` and `sync.test.mjs`, RED first; `agent-harness:sync`; `validate` starts with `agent-harness:projection-check` then `agent-harness:test`; `docs/harness.md`, `docs/maps/global-map.md` and the "Validation gate" prose of `AGENTS.md` name them · Requirements: none · Commit: —
- [ ] T5 — `verify-report.md`, then the archive to `openspec/changes/archive/2026-11-14-agents-projector/` as the last commit · Requirements: none · Commit: —

<!--
A task names every requirement it satisfies. When it is done, tick it and write the short sha of
the commit that holds it: "- [x] T1 — … · Requirements: CORE-04 · Commit: 1a2b3c4".
A task that touches no requirement (a migration of data, a doc) says "Requirements: none".
-->
