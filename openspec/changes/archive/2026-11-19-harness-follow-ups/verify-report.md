# Verify report: 2026-11-19-harness-follow-ups

> **Verified:** 2026-11-19 at `9b1fef4`

## Scenarios

Every test ran green in `ATL_TEMPLATE_SELF=1 pnpm validate` at `9b1fef4`:
`verify:lint-rules:test` 216 of 216, `verify:dependency-seams:test` 39 of 39,
`verify:allowlist-freshness:test` 22 of 22, `verify:tests:test` 34 of 34 and
`tests:into-blocks:test` 14 of 14.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| SEAM-04 | a dynamic import | `eslint-local-rules/dependency-seam.cases.mjs` › "a dynamic import outside the seam is refused" | green |
| SEAM-04 | a dynamic import with a template literal | `eslint-local-rules/dependency-seam.cases.mjs` › "a dynamic import with a template literal outside the seam is refused" | green |
| SEAM-04 | a require | `eslint-local-rules/dependency-seam.cases.mjs` › "a require outside the seam is refused" | green |
| SEAM-04 | an import-equals require | `eslint-local-rules/dependency-seam.cases.mjs` › "an import-equals require outside the seam is refused" | green |
| SEAM-04 | an import() type | `eslint-local-rules/dependency-seam.cases.mjs` › "an import() type outside the seam is refused" | green |
| SEAM-04 | a mocked vendor | `eslint-local-rules/dependency-seam.cases.mjs` › "a vi.mock of a package outside its seam is refused" | green |
| SEAM-04 | a re-export | `eslint-local-rules/dependency-seam.cases.mjs` › "a re-export outside the seam is refused" | green |
| SEAM-04 | an export-all re-export | `eslint-local-rules/dependency-seam.cases.mjs` › "an export-all re-export outside the seam is refused" | green |
| SEAM-04 | a path of the project | `eslint-local-rules/dependency-seam.cases.mjs` › "a path of the project is never judged as a package" | green |
| SEAM-08 | an unregistered dependency | `scripts/verify-dependency-seams.test.mjs` › "a package.json dependency the registry does not name fails" | green |
| SEAM-08 | a stale entry | `scripts/verify-dependency-seams.test.mjs` › "a registry entry for a package nothing declares is stale" | green |
| SEAM-08 | a package.json that cannot be read | `scripts/verify-dependency-seams.test.mjs` › "a package.json that cannot be parsed fails, naming it, and no entry is called stale" | green |
| SEAM-08 | a package.json that is not an object | `scripts/verify-dependency-seams.test.mjs` › "a package.json that is not a JSON object fails, naming it" | green |
| SEAM-08 | a source that cannot be parsed | `scripts/verify-dependency-seams.test.mjs` › "a source file that cannot be parsed fails, naming it" | green |
| SEAM-08 | a glob that matches nothing | `scripts/verify-dependency-seams.test.mjs` › "a seam glob that matches no file fails" | green |
| SEAM-08 | a config file ESLint skips | `scripts/verify-dependency-seams.test.mjs` › "a file ESLint does not lint that imports a package outside its seam fails" | green |
| SEAM-08 | a green states what it judged | `scripts/verify-dependency-seams.test.mjs` › "the gate exits 0 over a clean tree and states what it judged" | green |
| SEAM-08 | a registry the gate refuses | `scripts/verify-dependency-seams.test.mjs` › "the gate counts no file-package pair against a registry it refuses" | green |
| SEAM-10 | an app that declares next | `eslint-local-rules/eslint-config.cases.mjs` › "an app that declares next gets the Next.js block" | green |
| SEAM-10 | an app that declares expo | `eslint-local-rules/eslint-config.cases.mjs` › "an app that declares expo gets the Expo block" | green |
| SEAM-10 | an app that declares neither | `eslint-local-rules/eslint-config.cases.mjs` › "an app that declares neither next nor expo gets no framework block" | green |
| SEAM-10 | a package that declares react | `eslint-local-rules/eslint-config.cases.mjs` › "a package that declares react gets the React rules" | green |
| SEAM-10 | a package that declares no react | `eslint-local-rules/eslint-config.cases.mjs` › "a package that declares no react, packages/tokens among them, gets the Node globals and no React rule" | green |
| SEAM-10 | any dependency field, and a folder that is no app | `eslint-local-rules/eslint-config.cases.mjs` › "a framework declared in any dependency field counts, and a folder with no package.json is no app" | green |
| SEAM-10 | a package is listed under react only | `eslint-local-rules/eslint-config.cases.mjs` › "a package that declares react is listed under react, and never under next or expo" | green |
| SEAM-10 | a package.json that cannot be parsed | `eslint-local-rules/eslint-config.cases.mjs` › "an app package.json that cannot be parsed fails the config load, naming it" | green |
| SEAM-10 | a package's package.json that cannot be parsed | `eslint-local-rules/eslint-config.cases.mjs` › "a package package.json that cannot be parsed fails the config load, naming it" | green |
| SEAM-10 | a package.json that is not an object | `eslint-local-rules/eslint-config.cases.mjs` › "an app package.json that is not a JSON object fails the config load, naming it" | green |

Each new test was seen red first, for the reason it names:

- **The detection branches** (T1, `6f1fcd7`) existed and no case reached them, so each case was
  seen red against the detection with its branch removed, one at a time, the file restored after:
  - `export * from`, `import x = require()`, `import()` types and a template-literal specifier:
    "Should have 1 error but had 0";
  - a path of the project, with `isLocal` dropped: "Should have no errors but had 4";
  - a registry the rule cannot read, with `readJson` returning `{}`: the inputs read
    `{ registry: {} }` where `null` was due;
  - the registry entry with an unknown key, a glob name, a note that is not text, and the
    allowlist entry with an unknown key: "expected 1 finding(s), got 0" (2 and 0 for the
    allowlist); the seam that is not an array crashed the run.
- **The manifests and the count** (T2, `602953b`), against the gate before the fix:
  - a manifest that cannot be parsed: "expected 1 finding(s), got 2", two stale entries (`react`,
    `zod`) and nothing about the manifest;
  - a manifest holding `null`: `TypeError: Cannot read properties of null (reading 'unreadable')`;
  - the refused registry: the population line printed "3 file-package pair(s) outside their
    seam" against a registry refused for "zod is infra and names no seam".
- **The React package and packages/tokens** (T3, `c110264`), against the config before the fix:
  - the detection listed `react: ['apps/web']` where `['apps/web', 'packages/ui']` was due;
  - a package manifest holding `{`: "Missing expected exception";
  - the fixture package's component reported `[]` where `2 react/jsx-sort-props` was due;
  - `packages/tokens/src/tokens.constant.ts`: `browser: true, jsx: true, node: false`, with the
    React, React Hooks and jsx-a11y plugins and rules.
- **The gates** (T4, `5a88207`), before the fix:
  - `verify:allowlist-freshness`, a style file of `apps/admin/`: "expected 1 finding(s), got 0";
  - `verify:tests`, the components and hooks of `apps/kiosk/`, which declares `expo`: "expected
    0 finding(s), got 2"; a manifest holding `{`: exit 0 where 1 was due;
  - `verify:maps --root <tree>`: `--root` was read as two scan roots, check (B) also scanned the
    folder that is no app, and check (D) never named `apps/admin/src/screens/Admin`;
  - the naming case: 9 lines named an app across the three gates.
- **Pins, green before and after:** "an app package.json that is not a JSON object fails the
  config load, naming it", "a source file that cannot be parsed fails, naming it", and "a folder
  under apps/ with no package.json is no app".

## Identical output on today's tree

Method: `proof.mjs` (scratch, outside the worktree) ran ESLint's Node API over every file the root
config lints, resolved the config of each, and ran `verify:allowlist-freshness`, `verify:maps`,
`verify:tests` and `verify:dependency-seams` as processes, at `510a6ed` (the base) and at
`5a88207`; `proof-ws.mjs` ran ESLint from each of the 8 workspace folders, as `pnpm lint` runs it.

- **ESLint from the root:** 1033 files, 26 messages, the same file, rule, line, column, message
  and severity for every one, before and after.
- **ESLint from each workspace:** 950 files across the 8 workspaces, 26 messages, identical
  per workspace: `apps/mobile` 3, `apps/web` 18, `packages/tokens` 5 (the same five warnings,
  none of them a React rule), every other workspace 0.
- **The configs:** 10 files resolve a different config, all under `packages/tokens/`: the browser
  globals, the JSX parser and the React set give way to the Node globals. Every other file
  resolves the same config.
- **The gates:** `verify:allowlist-freshness`, `verify:maps` and `verify:dependency-seams` print
  the same output, byte for byte, and exit 0; `verify:tests` prints the same counts (264 test
  files, 124 units, 8 workspaces, 1 frozen exception) and exits 0, its NOT covered clause
  reworded from "mobile components and hooks" to "the components and hooks of an app that
  declares expo".

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-19, at `9b1fef4`. `report:spec-drift`, which
  only reports, listed 1 of 11 living specs behind its code: harness/dependency-seams, whose
  verified line the archive moves.

## Not verified

- **The registry cache of an editor session**, left as it is: `local/dependency-seam` reads the
  registry once per ESLint process, so an editor sees an edit only after its ESLint server
  restarts. No test drives an editor session.
- **A package that declares `next` or `expo`** gets no framework block, by design; no case lints
  one.
- **A React Native package** that declares `react` gets the React set without the Expo block's
  jsx-a11y relaxations; none exists, and no case lints one.
- **`verify:tests` still walks a folder with no `package.json`**, since
  `scripts/move-tests-into-blocks.test.mjs`, outside this change, moves a test of one.
- **`verify:maps` prints offenders with absolute paths on Windows**: `toRepoRel` strips the root
  with a `/` separator, as before this change.
