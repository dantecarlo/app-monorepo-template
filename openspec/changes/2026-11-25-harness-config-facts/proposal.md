# Proposal: the project's facts in the harness config

> **Status:** open

## Why

Decision 13 makes one file the only one that names the project: "identity, vocabulary, stack,
paths" (`docs/INIT_AND_HARNESS_PLAN.md:569`), and Stage 4.2 lists the project facts
(`docs/INIT_AND_HARNESS_PLAN.md:298`). The change that built the harness config left them out of
scope (`openspec/changes/archive/2026-11-20-harness-config/proposal.md:70`), so
`.agents/contracts/harness-config.schema.json` declares only `workflow`, `delivery` and `backend`.

Certifipago keeps the facts in its own `.agents/harness.config.json`, in the blocks `identity`,
`vocabulary`, `stack`, `core`, `skills` and `delivery`, each with an optional `$comment`. Its
`verify:core-purity` reads `identity`, `vocabulary`, `core` and `skills`, and a derived repository
points that gate at its own product by rewriting only `identity`. Its architect asked that the
template's schema gain these blocks rather than Certifipago moving them. Today the template's
gate refuses each of them as an undeclared key, and it reads no list, so the schema could not
declare `forbiddenInCore` at all.

The owner's words, verbatim:

- 2026-11-05 (translated from Spanish): "Remember that if something changes in certifipago, it
  should also be implemented in the template and vice versa"
- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"

## What changes

- **The schema gains the facts**, with Certifipago's block and field names and types:
  `identity` (`product`, `repository`, `packageScope`), which every config holds; and
  `vocabulary` (`forbiddenInCore`), `stack` (`monorepo`, `mobile`, `web`, `backend`,
  `architecture`), `core` (`directory`) and `skills` (`trees`, `lock`, `valueSources`,
  `valueTerms`), which a config may hold. Inside a block, a field is required when Certifipago's
  reader needs it: all three of `identity` (`projectIdentity` names a missing or blank one),
  `forbiddenInCore`, `directory` and the four of `skills` (`verify:core-purity` dereferences each).
  No reader reads `stack`, so its fields are optional. Each block takes its own `$comment` and is
  closed with `additionalProperties: false`.
- **The gate reads lists and non-blank text.** `pnpm verify:harness-config` reads the `array`
  type, `items` and `minLength`, so a list and its items are judged, and a blank identity, a blank
  forbidden term or a blank path is refused: Certifipago's reader refuses a blank identity, and a
  blank term would match every line.
- **The template names itself.** `.agents/harness.config.json` gains `identity`
  (`app-monorepo-template`, `dantecarlo/app-monorepo-template`, `@app`, the scope of every
  workspace package) and the two `stack` facts true under every prune.
- **process-intake fills the identity.** When `.agents/harness.config.json` is absent, § Step 4
  writes `identity` with the project's own names, never the template's.
- **Docs.** `docs/harness.md` 3h, `docs/code-standards.md` § 21, `docs/maps/global-map.md`, and a
  follow-up row and a parity row in `docs/INIT_AND_HARNESS_PLAN.md`.

## Out of scope

- **Porting `check:identity`.** Its tokens (`app-monorepo-template`, `@app/`, `com.app.template`)
  are the template's defaults, which it finds left in a derived project; the config's `identity`
  is the project's own, which `pnpm run init` rewrites. Reading them from there would make the
  gate look for the project's own name.
- **Porting `verify:skill-neutrality`.** It forbids the names
  `.agents/contracts/downstream-projects.json` declares, not `identity` or `vocabulary`; the one
  value it shares, `.claude/skills`, would come from a `skills` block whose `lock`,
  `valueSources` and `valueTerms` no template gate reads, and it reads vendored skills that a
  `skills.lock` would exclude.
- **`vocabulary`, `core` and `skills` values in the template.** No template gate reads them.
  Certifipago's `core.directory` is its .agents/core folder, the portable half of its harness that
  `verify:core-purity` walks; the template has no such folder, and `packages/core/src` is the
  domain, which in a derived project names its product.
- **`stack.mobile`, `stack.web` and `stack.backend` in the template.** The `web-next` and
  `mobile-expo` prunes remove an app, and `backend.kind` already holds the backend.
- **`pnpm run init` rewriting `identity`.** It replaces `app-monorepo-template` and `@app/`, so a
  renamed project keeps `packageScope: "@app"`: a follow-up, F76.
- **A reader module and `verify:core-purity` in the template.** Nothing in the template reads
  `identity` yet.

## Affected specs

- `openspec/specs/harness/ticket-flow/spec.md`: adds TICKET-34, beside TICKET-20; the unit governs
  `.agents/contracts/harness-config.schema.json`.
