# Verify report: 2026-11-18-eslint-by-pattern

> **Verified:** 2026-11-18 at `80b2f4a`

## Scenarios

Every test ran green in `ATL_TEMPLATE_SELF=1 pnpm validate` at `80b2f4a`:
`verify:lint-rules:test` 182 of 182, `verify:dependency-seams:test` 29 of 29.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| SEAM-09 | the base rules | `eslint-local-rules/eslint-config.cases.mjs` › "a new app inherits the base rules" | green |
| SEAM-09 | the React rules | `eslint-local-rules/eslint-config.cases.mjs` › "a new app that declares react inherits the React rules" | green |
| SEAM-09 | the filename rules | `eslint-local-rules/eslint-config.cases.mjs` › "a new app inherits the filename and folder rules" | green |
| SEAM-09 | the styling pillar | `eslint-local-rules/eslint-config.cases.mjs` › "a new app inherits the styling pillar" | green |
| SEAM-09 | the logic-in-hook rules | `eslint-local-rules/eslint-config.cases.mjs` › "a new app inherits the logic-in-hook rules" | green |
| SEAM-09 | the suffix contract | `eslint-local-rules/eslint-config.cases.mjs` › "a new app inherits the suffix contract" | green |
| SEAM-09 | the dependency seam | `eslint-local-rules/dependency-seam.cases.mjs` › "a new app under apps/ inherits the rule with no config change" | green |
| SEAM-09 | no block names an app | `eslint-local-rules/eslint-config.cases.mjs` › "no ESLint config or rule names an app" | green |
| SEAM-10 | an app that declares next | `eslint-local-rules/eslint-config.cases.mjs` › "an app that declares next gets the Next.js block" | green |
| SEAM-10 | an app that declares expo | `eslint-local-rules/eslint-config.cases.mjs` › "an app that declares expo gets the Expo block" | green |
| SEAM-10 | an app that declares neither | `eslint-local-rules/eslint-config.cases.mjs` › "an app that declares neither next nor expo gets no framework block" | green |
| SEAM-10 | any dependency field, and a folder that is no app | `eslint-local-rules/eslint-config.cases.mjs` › "a framework declared in any dependency field counts, and a folder with no package.json is no app" | green |
| SEAM-10 | a package.json that cannot be parsed | `eslint-local-rules/eslint-config.cases.mjs` › "an app package.json that cannot be parsed fails the config load, naming it" | green |

Each test was seen red first:

- **The detection** (T1): "a framework declared in any dependency field counts…" failed with
  `ERR_MODULE_NOT_FOUND` for `scripts/eslint-config.detect.mjs` before the module existed.
- **The fixture apps** (T2), linted through today's config wrapped in a `createConfig` that
  ignored its argument, so the fixture's `package.json` could not be read:
  - base: `apps/fixture/src/helpers/greeting.helper.ts` reported `[]` where
    `2 @typescript-eslint/naming-convention` was due;
  - React: `Card.component.tsx` reported `[]`, `2 react/jsx-sort-props` due;
  - filename and folder: `format.ts` and `ui/statusDot/StatusDot.component.tsx` reported `[]`;
  - styling pillar: `Home.style.ts` reported `[]` where `local/style-positions-only` and
    `local/style-token-values` were due, and `homeVariants.helper.ts` only `local/dependency-seam`,
    `local/ui-kit-boundary` missing;
  - Next.js: `fixture-next` reported `2 no-restricted-syntax` on the async screen and nothing on
    the `<img>`;
  - neither: `fixture`'s `src/app/page.tsx` reported `[]` where the filename rule was due;
  - Expo: `fixture-expo`'s probe screen reported `[]` where `2 expo/no-dynamic-env-var` was due.
    The first probe (`src={process.env[key]}`) is not a shape the Expo rule reads (it reads a
    `const x = process.env[key]` declarator), so the probe was rewritten and the red re-observed
    against a copy of the base config: still `[]`.
  - the load case: "Missing expected exception", the builder read no manifest;
  - the naming case: 33 lines named an app, across `eslint.config.mjs`, `eslint.rules.mjs`, the
    two styling scopes and one comment of the new detection module.
- **Seen green before the restructure, by construction:** the logic-in-hook, suffix-contract and
  seam cases. Those overrides were already written by suffix (`**/*.component.tsx`) or by pattern,
  and F.8 unit 1 registered the `local` plugin over `apps/*/**`, so a new app already got them.
- **The gate's pin**, "a dependency in any dependency field of a package.json is judged", passed
  before and after `verify:dependency-seams` took its manifest reading from the new module: it
  pins that behaviour, it is not a red test.

## Identical output on today's tree

Method: `proof.mjs` (scratch, outside the worktree) ran ESLint's Node API over every lintable file
at `2793860` and at `d039b6c`, from the repository root and from each of the 8 workspace folders
as `pnpm lint` runs it (check-file reads paths from the cwd), and resolved the config of every file
the root run lints, keys and plugins sorted.

| Measure | Before (`2793860`) | After (`d039b6c`) |
| ------- | ------------------ | ----------------- |
| Files linted from the root | 886 | 888 (the two new `.mjs` modules) |
| Findings from the root | 29 | 29, the same file, rule, line, column and message |
| Files linted from the workspaces | 808 | 808 |
| Findings from the workspaces | 29 | 29, identical |
| Distinct resolved configs | 63 | 63 |
| Resolved configs identical | — | 180 of 886 |

`eslint --print-config` over 32 files of every kind (web screen, web and mobile `ui/` style, web
component, Next route and middleware, mobile Expo route, mobile screen and hook, tests, test
infrastructure, `.d.ts`, app configs, core, core test, i18n, supabase and cloudflare tests, tokens
source, tokens config and generator, tooling module, a root script, `eslint.rules.mjs`, the local
rules): 12 identical, every package, tokens, tooling and root file among them; the 20 app files
differ only by the two differences below.

The differences, every one in the resolved config of app files; no finding changed:

1. **The ui folder casing reaches every app and every cwd** (706 app files). The web block's
   `check-file/folder-naming-convention` key `apps/web/src/components/ui/**/!(__tests__)/` becomes
   `src/components/ui/**/!(__tests__)/` in a block for every app. The glob cannot name the app with
   a wildcard: check-file checks every part a wildcard captures against PascalCase, and an app
   folder is lowercase. Mobile files newly carry the rule, and the rule now also runs under
   `pnpm lint`, whose cwd is the app folder and where the old key never matched. Kept: every
   `components/ui` folder of both apps is PascalCase, so no finding appears from the root or from
   either app; a planted `ui/badDot/` reports from both app cwds.
2. **One message text** (87 component and screen files). The client async-view selector's message
   said "exempt via the apps/web screen allowlist"; it now says "exempt in the screens of every
   Next.js app", since the exemption follows the apps that declare `next`. No file of today's tree
   reports it.

Kept out, with the reason: `packages/tokens/scripts/generate.mjs` gets no Node globals while
`packages/tooling`'s `.mjs` modules do; widening that block to `packages/*/**/*.mjs` would change
its config and no finding. And `packages/tokens` keeps the browser globals and React rules it never
declared (`docs/code-standards.md` § 24, open question).

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-18, at `80b2f4a`.

## Not verified

- A React package under `packages/`: the framework blocks read the apps only (out of scope).
- `scripts/verify-allowlist-freshness.mjs` and `scripts/verify-maps.mjs` still walk the two app
  folders by name; outside this change.
