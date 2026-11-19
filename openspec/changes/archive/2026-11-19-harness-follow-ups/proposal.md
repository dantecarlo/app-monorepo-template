# Proposal: the dependency-seam gate fails closed, and every workspace reads the one workspace list

> **Status:** archived — 2026-11-19

## Why

Two follow-ups of `docs/INIT_AND_HARNESS_PLAN.md` found by the living specs, F53 and F55, leave
the harness/dependency-seams unit short of what its gate claims and what decision 52 asks.

- **F53.** The native review of F.8 unit 1 found that `pnpm verify:dependency-seams` skips a
  `package.json` it cannot read without a word (`scripts/verify-dependency-seams.mjs:114-119`), so
  every dependency that manifest declares passes unregistered, and the entries it alone declares
  are reported as stale. Against a registry it refuses, the gate still prints a count of seam
  violations computed from that registry, and a registry that is JSON `null` crashes it with a
  `TypeError` (`scripts/verify-dependency-seams.mjs:219-234`). Some detection branches no case
  reaches: `export * from`, `import x = require()`, `import()` types, a template-literal
  specifier, a project path, several registry and allowlist shape checks, and a source file the
  gate cannot parse.
- **F55.** After F.8 unit 1b the ESLint config applies the React rule set to the apps that declare
  `react` and to no package (`scripts/eslint-config.detect.mjs:80-111`), so a React package added
  under `packages/` would get the shared rules without the React set; and `packages/tokens`, which
  declares no `react`, keeps a block of its own with the browser globals and the React rule set it
  does not need (`eslint.config.mjs:269-290`). Three gates still walk the two apps by name:
  `scripts/verify-allowlist-freshness.mjs:45`, `scripts/verify-maps.mjs:112` and
  `scripts/verify-maps.mjs:381`, and the mobile presence exemption of
  `scripts/verify-tests.mjs:93`.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the other
  styles, but everything centralized in styles and the tokens. Fix everything you mention applying
  what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix
  everything"
- 2026-11-15 (translated from Spanish): "And something important, web and app have to be
  standardized, and any other project, that is, they have to always follow the same rules and
  centralize it if possible, because if later plain React is added for example it should follow
  the same rules"

## What changes

- **The gate fails closed on a manifest it cannot read (F53).** A root, `apps/*` or `packages/*`
  `package.json` that cannot be read or parsed, or is not a JSON object, is a finding naming the
  file; while one is unreadable, no registry entry is called stale, since what that manifest
  declares is unknown.
- **The gate counts nothing against a registry it refuses (F53).** A registry that cannot be read,
  JSON `null` included, or that holds a malformed entry, is reported alone, as today, and the
  gate's population line says no file-package pair was judged instead of printing a count taken
  from it.
- **The untested detection branches get their cases (F53).** One rule case per import form of
  SEAM-04 no case reached, one for a project path, and one gate case per registry and allowlist
  shape check and for a source the gate cannot parse.
- **The React rule set follows `react` in any workspace (F55).** `scripts/eslint-config.detect.mjs`
  reads every folder under `apps/` and `packages/` that holds a `package.json`; the React rule set
  (the JSX parser, the browser globals, the React plugins and rules) applies to every app and
  every package that declares `react`, the Next.js and Expo blocks stay with the apps. A package
  `package.json` that cannot be parsed fails the config load, as an app's does.
- **`packages/tokens` is a package like the others (F55).** Its own block goes: it runs with the
  Node globals every package has, and with no React rule or browser global, since it declares no
  `react`. The open question of `docs/code-standards.md` § 24 is answered this way.
- **The gates read the apps from the same list (F55).** `verify:allowlist-freshness` and
  `verify:maps` walk the app folders that list holds, and `verify:tests` exempts the components and
  hooks of every app that declares `expo`, not of a folder named `mobile`. `verify:maps` takes a
  `--root`, like the other gates, so a case can run it over a scratch tree. These gates have no
  living spec, so this part changes no requirement.
- **No finding changes on today's tree.** ESLint over every file the root config lints, and the
  four gates, report the same before and after, which the verify report records; the only config
  that changes is the one of the `packages/tokens` files.

## Out of scope

- **The registry cache of an editor session.** `local/dependency-seam` reads the registry and the
  allowlist once, when the rule module loads (`eslint-local-rules/index.mjs:914-915`), so an editor
  session sees an edit to either only after its ESLint server restarts. It stays as it is: the
  gate re-reads both on every run, uncached.
- **Root scripts.** The seam rule covers `apps/*` and `packages/*` only; root scripts import no
  vendor today.
- **A package that declares `next` or `expo`.** Their blocks hold App Router and Expo Router file
  names, which only an app has; a package that declares either gets the React set when it also
  declares `react`, and no framework block.
- **The walk of `verify:tests`.** It still walks every folder under `apps/` and `packages/`, a
  `package.json` or not: `scripts/move-tests-into-blocks.test.mjs` moves a test of a package folder
  that holds none, and that file is outside this change.
- **F59**, whether the gate refuses every allowlist entry, which the owner decides.

## Affected specs

- `openspec/specs/harness/dependency-seams/spec.md`: modified SEAM-04, SEAM-08 and SEAM-10.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
