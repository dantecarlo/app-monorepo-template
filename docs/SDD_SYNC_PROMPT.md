# SDD Context-Sync Prompt (canonical — fill the header, then paste)

Paste this as the first message in any session working on a portfolio app — whether you are starting fresh or already mid-build. It syncs you onto the orchestrator-level SDD layer (change `template-superset-rollout`, AUTOMATIC + HYBRID store) and the hardened template superset standard, then has you continue under SDD without redoing finished work.

> The per-project repos (iexam / ruta-en-moto / verifipagos) ship a PRE-FILLED copy of this file at `docs/SDD_SYNC_PROMPT.md` — if you are inside one of those repos, use that copy (its header is already filled). This canonical template copy uses placeholders.

Fill before starting:

```
{{PROJECT_SLUG}}  = ____________   (one of: iexam | ruta-en-moto | verifipagos)
{{PROJECT_PATH}}  = ____________   (the path that matches your slug below)
```

Slug → path map (authoritative):

| Slug | Path |
|---|---|
| `iexam` | `/Users/dcnunez/IExam` |
| `ruta-en-moto` | `/Users/dcnunez/ruta-en-moto` |
| `verifipagos` | `/Users/dcnunez/SafePays` |
| `template` (app-monorepo-template) | `/Users/dcnunez/Orquestador/refs/app-monorepo-template` |

Scope guard: **Wacho Express is EXCLUDED. sh-pedidos is NEVER PUSH and its untracked files must be preserved.** Touch neither.

You are syncing onto a new layer — do NOT reset, do NOT discard context, do NOT redo finished/green/pushed work. The template (source of the superset) lives at `/Users/dcnunez/Orquestador/refs/app-monorepo-template`.

## STEP 1 — SYNC CONTEXT (light; pull only what you likely lack)
Always pass `project` explicitly on every engram call — engram may auto-promote saves to the `engram-memory` child repo, so never rely on auto-detected project.

1. Recent thread: `mem_context(project: "{{PROJECT_SLUG}}")`.
2. Your per-project sync observation lives under `project: "orquestador"` with the SHORT project name in the key (NOT the dashed slug). Search → then `mem_get_observation(id: <returned>)` for full content:
   - `iexam` → `mem_search("sdd/modernize-iexam/template-sync", project: "orquestador")`
   - `ruta-en-moto` → `mem_search("sdd/modernize-ruta/template-sync", project: "orquestador")`  (key is `modernize-ruta`, NOT `modernize-ruta-en-moto`)
   - `verifipagos` → `mem_search("sdd/modernize-verifipagos/template-sync", project: "orquestador")`
   Also pull your modernized baseline (under your OWN project): iexam → `mem_search("re-sync modernized baseline", project: "iexam")`; ruta-en-moto → `mem_search("re-sync verified modernized baseline", project: "ruta-en-moto")`; verifipagos → `mem_search("modernization stack confirmed main", project: "verifipagos")`. A zero result = wrong key/scope, not a missing record.
3. New orchestrator-level SDD artifacts — ON DISK at `/Users/dcnunez/Orquestador/openspec/changes/template-superset-rollout/` (engram under `project: "orquestador"` mirrors proposal/spec/design; tasks not mirrored). Read the files; any engram miss is non-fatal.
4. Refresh the shared mirror in place: `git -C /Users/dcnunez/Orquestador/engram-memory pull --ff-only` (NESTED `memories/<group>/`: template, portfolio, conventions, sdd, env, sessions; index is `README.md`). Re-hydrate only files changed in the pull via `mem_save`, using each file's frontmatter `topic_key`, priority `template/baseline.md` → `portfolio/*` → `conventions/*`.

## STEP 2 — ABSORB THE STANDARD
Read the SDD change that defines what {{PROJECT_SLUG}} must satisfy, at `/Users/dcnunez/Orquestador/openspec/changes/template-superset-rollout/`:
- `specs/template-superset-standard` — provider ports, edge-safe origin guard, scrubPII, deterministic validation gate, light/dark SSR theme, login feature, dependency placement, push integrity.
- `specs/template-propagation` — per-project superset parity, NO duplicate direct integrations, logic-in-view remediation, config preservation, per-project dep placement + push, final verification gate.
- `design.md` (9 ADRs) and `tasks.md`.
Re-anchor on `{{PROJECT_PATH}}/docs/GENERAL_PLAN.md` (Status Snapshot, What's DONE with evidence + REAL vs MOCK, PENDING with sizing/BLOCKING/deps, NEEDS FROM OWNER, Path to Launch).

Planning of `template-superset-rollout` is COMPLETE (proposal/spec/design/tasks = done; `next_recommended: sdd-apply`) — treat the specs/design/tasks as the agreed standard. Hold two things at once: the superset parity bar, and exactly what is ALREADY built/green/pushed in {{PROJECT_SLUG}} (from STEP 1.2) so you do NOT redo it. You are closing the gap to the bar, not rebuilding.

## STEP 3 — CONTINUE UNDER SDD (AUTOMATIC, HYBRID, STRICT TDD)
1. Per-project SDD Init Guard (MANDATORY): `mem_search("sdd-init/{{PROJECT_SLUG}}", project: "{{PROJECT_SLUG}}")` — it will MISS (only `orquestador` is initialized). Run `sdd-init` for {{PROJECT_SLUG}} FIRST (detects stack, caches testing capabilities, activates Strict TDD), then proceed. Don't ask; just initialize.
2. Route by the change's `state.yaml.next_recommended` / the dispatcher (`sdd-status` → `sdd-continue`/`sdd-apply`/`sdd-verify`). Never infer phase from which artifacts exist. Never blind-overwrite an existing SDD artifact on re-run — read + MERGE (incl. `sdd/{change}/apply-progress` for apply continuation batches).
3. STRICT TDD: write the failing test FIRST, then implement to green.
4. Persist as you go: project progress → `mem_save(project: "{{PROJECT_SLUG}}", type: "architecture", scope: "project", capture_prompt: false)`. Portfolio/template-level decisions → save to `project: "orquestador"` AND contribute to the mirror (engram first, repo second: `mem_save` with a stable `topic_key`, then add/update `memories/<group>/<slug>.md` with frontmatter + update `README.md` index + conventional commit/push).

## NON-NEGOTIABLES
- Conventional commits, NO AI attribution / `Co-Authored-By`. Push fast-forward to your default remote branch as the **dantecarlo** identity (the template's branch is `main`; the per-project apps use `master`).
- Use `bat`/`rg`/`fd`/`sd` — never `cat`/`grep`/`find`/`sed`.
- Hexagonal/fractal: arrow-only functions, single-object params, file suffixes, max 500 lines/file, i18n for ALL UI strings, adapter seam mandatory, ZERO framework imports in `packages/core`.
- Validation gate = plain `pnpm validate` GREEN, run with nvm node + `NODE_OPTIONS=--max-old-space-size=6144` (validate OOMs under turbo concurrency; brew node is broken). Nothing is DONE until it's green.

## GOTCHAS
- Engram may auto-promote saves to the `engram-memory` child repo — ALWAYS pass `project` explicitly.
- Per-project sync keys use the SHORT name under `project: "orquestador"` (`modernize-iexam` / `modernize-ruta` / `modernize-verifipagos`); the dashed slug or `project: {{PROJECT_SLUG}}` returns ZERO — that is a wrong-key miss.
- The shared mirror is NESTED (`memories/<group>/`), not flat.
- A `mem_search` miss is non-fatal — note it and continue.
