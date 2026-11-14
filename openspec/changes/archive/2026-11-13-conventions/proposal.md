# Proposal: align three conventions with Certifipago

> **Status:** archived — 2026-11-13

## Why

Three template conventions differ from Certifipago's for no reason worth keeping, and the owner
decided each one as recommended (`docs/INIT_AND_HARNESS_PLAN.md`, "Open decisions" D-S1, D-S3 and
D-S4; Roadmap step 2.0):

- **D-S1.** The style-constant suffix is `.styles.ts`, the only plural among the binding suffixes
  (`.type.ts`, `.constant.ts`, `.hook.ts`, `.service.ts`, `.adapter.ts`). Certifipago already
  uses `.style.ts` in 156 files; the template has 56 such files, so the template renames.
- **D-S3.** Prettier formats Markdown, and it has broken template docs: the 2026-11-04 audit
  (`docs/audits/2026-11-04-harness-audit.md`, unit 7) repaired a mangled section of
  `docs/code-standards.md` and a mangled glob of `docs/maps/global-map.md`. It also realigns a
  whole table when one cell changes, so a five-row plan edit shows as +170/-45. Certifipago keeps
  Markdown out of Prettier.
- **D-S4.** The one decision record lives in `docs/architecture/decisions/`, but a decision record
  is not always an architecture decision: several of Certifipago's ten, in `docs/decisions/`, are
  product or security decisions.

The owner's words:

- 2026-11-13 (translated from Spanish): "apply the recommendations you mention"

## What changes

- **D-S1.** The 56 `*.styles.ts` files become `*.style.ts`, with every import that names them.
  The suffix contract follows: the `check-file` suffix glob and its message in
  `eslint.rules.mjs`, the magic-number and width overrides for style files, the local lint rule
  messages, the literal-exempt suffixes of `verify:maps`, and the comment of `verify:structure`.
  A case in `eslint-local-rules/index.test.mjs` pins the configured glob: it refuses a new
  `*.styles.ts` and accepts a `*.style.ts`. `AGENTS.md`, `README.md`, `docs/code-standards.md`
  (whose suffix table gains the style row), `docs/architecture/*.md`, `docs/harness.md`,
  `docs/maps/*.md` and the skills that scaffold or audit blocks (`arch`, `component`, `screen`,
  `feature`, `fractal-verify`, `modify`, `quality`, `validate-all`) name the new suffix.
- **D-S3.** `.prettierignore` excludes Markdown, and the root `format` and `format:check` scripts
  stop listing it; `format:check` stays for code and JSON. `lint-staged` lists no Markdown, so it
  is unchanged. `docs/code-standards.md` § 13 says where Markdown's shape is held instead. No
  Markdown file is reformatted.
- **D-S4.** `docs/architecture/decisions/0001-pluggable-providers.md` moves to
  `docs/decisions/` with its history, and every reference follows: the manifest claim, the global
  map's link and row, `docs/code-standards.md`, `openspec/README.md`,
  `openspec/templates/design.md` and the `sdd` skill.

## Out of scope

- Certifipago's side of the conventions: D-S2 (tests beside their units) and D-S5 (the language
  of owner quotes) change Certifipago, not the template, through the conformance track (K8).
- pnpm 11.9.0 (D-S6), its own change (Roadmap step 2.3).
- The exported style constants (`ASYNC_BOUNDARY_STYLES`, `BUTTON_BASE_CLASS` and the like) keep
  their names: the decision names the file suffix, not the constants. One export of the lint
  configuration does change: `STYLES_FILE_OVERRIDE` in `eslint.rules.mjs` becomes
  `STYLE_FILE_OVERRIDE`, so a derived project whose `eslint.config.mjs` imports it renames the
  import (a breaking change, as the rename commit says).
- Records that stay as written: the archived changes under `openspec/changes/archive/`, the
  2026-11-04 audit data, and the plan's own account of the decisions.

## Affected specs

- None. The harness stays unspecified, as decided in `2026-11-11-adopt-sdd`.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
-->
