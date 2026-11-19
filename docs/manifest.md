# Capability manifest — the deterministic init contract

`template.manifest.json` is the single answer to two questions:

1. **Who owns every file in this repo?**
2. **What exactly happens when the user answers an init question?**

Nothing about project setup is left to judgment. Every choice maps to declared
actions, reviewed in git, executed the same way every time.

> **The rule that makes this work:** an LLM authors the manifest once, and a
> human reviews it. The init command only executes what the manifest declares.
> No model interprets anything at init time.

> **Status:** the manifest and its two gates are real and run in
> `pnpm validate`. The executor that applies it at init, the `templates/`
> folder that `copy` and `render` read from, and the preset CI matrix are
> **planned** (phases P5–P7 of `docs/INIT_AND_HARNESS_PLAN.md`). Today
> `pnpm init` only renames the template identity.

---

## Ownership model

`claims` is the only source of truth for file ownership.

| Rule                | Meaning                                                            |
| ------------------- | ------------------------------------------------------------------ |
| Exactly one owner   | Every tracked file belongs to one capability, or to `core`         |
| `core` is permanent | Files claimed by `core` are never removed by any answer            |
| Absent = removed    | A capability that is not selected has every path it claims deleted |

Ownership answers **"who deletes this file by default"** — nothing more.

### Cross-cutting effects are verbs, not claims

Deselecting `supabase` must also delete `apps/web/src/lib/supabase/**`, but that
subtree is owned by `web-next`. Claiming it twice would make pruning depend on
evaluation order, which is exactly the non-determinism this design exists to
kill.

So cross-cutting removal is a declared `remove` action instead. Ownership stays
single; secondary effects stay explicit; the **preset CI matrix** (clean clone →
init → `pnpm validate`, planned) is what will prove they are complete.

### Registry entries have owners too

Every entry of `.agents/contracts/dependencies.json` names an `owner`: a
capability id, or `core`. An absent capability takes every entry it owns, with
its seam globs, the way it takes the files it claims; the owner decided it
per entry on 2026-11-19.

- **Which owner.** Ownership follows the claims, as it does for files: the
  capability that claims every `package.json` declaring the package, or, for a
  workspace package (`@app/*`), its folder. When no capability's claims alone
  remove the package, the one whose claims and `remove-dep` actions together
  remove it (`supabase` for `@supabase/supabase-js`, `e2e-playwright` for
  `@playwright/test`). Otherwise `core`, as is `node:*`.
- **The cross-cutting case is a verb.** A `remove-dep` that takes a package
  from the last `package.json` declaring it also takes the package's entries,
  unless their owner is `core`. So `@sentry/nextjs` belongs to `web-next`,
  whose `package.json` declares it, and the `sentry` prune's `remove-dep`
  takes it; a web-only project that keeps Sentry loses the
  `@sentry/react-native` entry with `mobile-expo`.
- **The gate.** `verify:manifest:coverage` fails an entry with no owner and an
  owner the manifest does not declare; `verify:dependency-seams` refuses an
  owner that is not text.

### Regions: the lines a capability owns in a file it does not claim

A capability often adds a few lines to a file another owner keeps: a key in an
`.env.example`, an alias in a Vitest config, an entry in
`pnpm-workspace.yaml`. A **region** claims those lines. It runs from a line
`# region <capability>` to a line `# endregion <capability>`, each marker alone
on its line and written in the file's own comment syntax: `#` in YAML and
dotenv, `//` in JavaScript and TypeScript, `<!-- region <capability> -->` in
Markdown. The prune of that capability drops both markers and every line
between; the regions of other capabilities stay.

| Rule              | Meaning                                                                    |
| ----------------- | -------------------------------------------------------------------------- |
| One owner         | A region names one declared capability; `core` owns none, it is never pruned |
| No nesting        | A region closes before the next one opens                                  |
| Balanced          | Every region closes, under the name it opened with                         |
| Outside a table   | A Markdown table row cannot hold a marker: the region wraps a whole table  |
| Exact spelling    | A comment that reads as a marker but breaks its grammar (a capitalised keyword or owner, a doubled space) is a finding, never text |

`verify:manifest:coverage` fails a region that breaks a rule, naming the file
and the line. No verb is added: a region owns lines the way a claim owns a
file. Documentation quotes a marker inside a sentence, as here, never alone on
a line, where it would open a region of its own file.

A living spec holds a capability's part the same way: the part's own
`Governs` line in a region of the header, and its requirements in a region of
the requirements (`openspec/README.md` § 2.2). The capability's prune drops
them, and the prune of the unit's owner removes the whole spec, so a
capability never needs a spec of its own.

### Maintainer material

The `template-maintainer` capability (group `maintainer`) owns the template's
own plans and audits: `docs/GENERALIZATION_PLAN.md`,
`docs/INIT_AND_HARNESS_PLAN.md`, `docs/audits/**`, and the template's own
OpenSpec changes, `openspec/changes/**`. They name donor products and record
how this template was built, so they must never ship.

- **No preset selects it**, so init always removes it from a derived project.
- **The brand gate exempts it.** The planned `verify:generic` gate (blocker B3)
  scans what ships for product names; maintainer material never ships, so the
  gate skips the paths this capability claims.

### The SDD machinery

The `sdd` capability (group `workflow`) owns what a derived project needs to
run Spec-Driven Development: `openspec/README.md`, `openspec/config.yaml`,
`openspec/templates/**`, the `verify:specs` and `report:spec-drift` gates with
their detectors and tests, and the `sdd` skill. Every preset selects it. The
two helpers the gates import, `scripts/gate/**` and `scripts/git-free-env.mjs`,
belong to `core`: other gates are built on them.

Each living spec under `openspec/specs/` is claimed by the capability whose
unit it governs (`design-tokens`, `i18n`, `web-next`, `mobile-expo`,
`supabase`, `cloudflare`), or by `sdd`, whose `onAbsent` removes
`openspec/specs/**`. An optional capability that adds a part to a unit owns a
region of that unit's spec, never a spec of its own (§ Regions).

### The optional Sentry capability

The `sentry` capability (group `observability`) owns every Sentry file, and no
preset selects it: PostHog is the default observability provider, so `/init`
prunes Sentry unless the project picks it (`docs/observability.md`).

- It **claims** the web root files no other claim covers:
  `apps/web/instrumentation.ts`, `apps/web/next-sentry.config.ts`, the three
  `apps/web/sentry.*.config.ts` and `apps/web/__tests__/next-sentry.config.test.ts`.
  `web-next` therefore claims its own root files by name instead of
  `apps/web/**`, and its `onAbsent` removes `apps/web/**`, which keeps what an
  absent `web-next` deletes.
- It **removes** what sits inside the apps' `src/`, which `web-next` and
  `mobile-expo` own: both Sentry adapters, their tests and the SDK mock.
- It **drops** `@sentry/nextjs` and `@sentry/react-native` with `remove-dep`,
  which takes their registry entries too, and sets `expo.plugins` of
  `apps/mobile/app.json` to the list without `@sentry/react-native/expo` with
  `patch-json`.
- It **owns regions** of files other owners keep: its keys in both
  `.env.example`, the `@sentry/react-native` alias of
  `apps/mobile/vitest.config.ts`, the `@sentry/cli` entry of `allowBuilds` in
  `pnpm-workspace.yaml`, and its rows of `docs/maps/global-map.md`.
- It **owns the Sentry part of each app's spec** as regions of
  `openspec/specs/apps/web/spec.md` and `openspec/specs/apps/mobile/spec.md`:
  the `Governs` line of the Sentry files in the header, the paragraph of the
  Purpose, and every requirement whose tests or files the prune deletes (WEB-81
  to WEB-84, MOBILE-80 to MOBILE-82). The `sentry` prune drops those regions;
  an app's prune removes its whole spec, so a project that keeps Sentry and
  drops an app loses that app's part and no claim is left behind.

`packages/tooling/src/__tests__/prune-boundary.test.mjs` proves the prune
leaves no dangling reference. With the capability's regions dropped, it fails
when a file the prune keeps imports a file the prune deletes or a dependency it
removes, names a pruned file by a quoted relative path, keeps an
`.env.example` key only pruned files read, or is a living spec that cites a
pruned file; when a kept `app.json` would list a plugin of a removed
dependency, or the patched plugin list drifts from `app.json`; and when the
registry the prune leaves would fail `verify:dependency-seams`. The same test
holds the registry true for the `mobile-expo` and `supabase` prunes. A Next.js config cannot be pruned by deleting a file
it imports, so `apps/web/next.config.ts` applies every
`next-<capability>.config.ts` beside it and names none.

---

## The six verbs

The action vocabulary is closed. A seventh verb is a design conversation, never
an ad-hoc script — that is the entire point.

| Verb               | Required fields         | What it does                                    |
| ------------------ | ----------------------- | ----------------------------------------------- |
| `remove`           | `paths`                 | Deletes paths a claim cannot express            |
| `copy`             | `from`, `to`            | Brings a file in from `templates/` (planned)    |
| `render`           | `from`, `to`            | Same as `copy`, with answer substitution        |
| `patch-json`       | `file`, `op`, `path`    | Sets or unsets a key (`set` also needs `value`) |
| `remove-dep`       | `file`, `name`, `scope` | Drops one dependency record, and from the last `package.json` declaring it the package's registry entries |
| `remove-workspace` | `entry`                 | Drops one `pnpm-workspace.yaml` entry           |

---

## The two gates

Both run first in `pnpm validate`, before anything expensive.

### `pnpm verify:manifest` — is the manifest well formed?

Offline and pure. Unique kebab-case ids, non-empty claims, repo-relative paths,
known verbs with their required fields, `requires`/`conflictsWith` that resolve
and do not contradict, and presets that are internally satisfiable.

### `pnpm verify:manifest:coverage` — is the manifest true?

Walks every `git ls-files` path and fails on:

| Finding       | Meaning                                                        |
| ------------- | -------------------------------------------------------------- |
| `unclaimed`   | A hole. Init would leave this file behind whatever the answers |
| `conflicts`   | Two owners. Pruning would depend on evaluation order           |
| `staleClaims` | Drift. The manifest describes a repo that no longer exists     |
| `unowned`     | A registry entry with no owner, or one the manifest does not declare |
| `regions`     | A region whose owner is unknown, whose markers do not balance, or a misspelled marker |

Together they close the door in both directions: the manifest cannot omit
reality, and it cannot invent it.

The pure engine behind both is `scripts/manifest.mjs`, driven by synthetic
fixtures in `scripts/manifest.test.mjs` (`pnpm verify:manifest:test`).

---

## Adding a capability

1. Add the entry with `id`, `title`, `group`, and `claims`.
2. Move the paths it owns out of `core` or out of whichever capability held
   them — ownership is single, so a new claim always takes from someone.
3. Declare `requires` / `conflictsWith` where selection is not free.
4. Declare `onAbsent` actions for whatever file ownership cannot express.
5. Add it to every preset it belongs in.
6. Run `pnpm verify:manifest && pnpm verify:manifest:coverage`.

**A new file with no owner fails the gate.** That is deliberate: it forces an
explicit ownership decision instead of a silent default.

---

## Adding a capability to an existing repo

Adding a file means claiming it. The gate will tell you the moment you forget,
so the loop is short:

```bash
pnpm verify:manifest:coverage
```

Untracked files are invisible to `git ls-files`, so stage new files before
expecting the gate to see them.

---

## Known gaps

`scripts.validate` in `package.json` is a single long `&&` chain, so
`patch-json` cannot surgically remove one step from it. Until that chain is
restructured into discrete keys, a capability cannot declaratively drop its own
validation step. This blocks the init executor and is tracked as harvest work
(blocker B2).

### `onAbsent` holes (blocker B4)

Deleting files cannot remove a stale import, a doc section or a CI job inside a
file another owner keeps. Each hole below needs a region, a rewrite or an
injected adapter (blocker B4); a delete-only executor cannot close it.
`prune-boundary` lists most of them for any capability.

| Absent capability     | What breaks                                                                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase`            | `apps/web/src/app/layout.tsx` (via `SupabaseProviders`) and `apps/mobile/src/app/_layout.tsx` keep their Supabase imports                           |
| `i18n`                | `apps/web/src/app/layout.tsx` and the `LanguageSwitcher` blocks keep their `@app/i18n` imports                                                      |
| `e2e-playwright`      | `scripts.smoke:mobile-web` and the CI `mobile-web` job still call Playwright                                                                        |
| `web-next`            | `verify-security-static`, `verify-maps` and the knip workspaces still read `apps/web`                                          |
| `mobile-expo`         | `verify-maps` and the knip workspaces still name `apps/mobile`                                                                                      |
| `diagrams`            | `pnpm validate` still calls `docs:diagrams:check` (B2); the global map rows for `docs/diagrams/` and `build-diagrams` fail `verify:maps`            |
| `sdd`                 | `pnpm validate` still calls `verify:specs`, `report:spec-drift` and their tests (B2); the global map rows for them and the skill fail `verify:maps` |
| `english-artifacts`   | `pnpm validate` still calls `verify:english` and its test (B2); the global map rows for the gate fail `verify:maps`                                 |
| `sentry`              | `docs/observability.md`, `docs/architecture/web.md`, `docs/architecture/mobile.md` and the env table of `AGENTS.md` still describe the Sentry files and keys; the `pnpm-workspace.yaml` comment on the isolated linker names `@sentry/core` as its evidence |
| any with a spec       | its spec under `openspec/specs/` goes, and its row in the `openspec/README.md` § 2.1 table stays                                                    |
| `template-maintainer` | Never selected, so always absent: the global map rows for the plans and `docs/audits/`, and the plan citations in code-standards, go stale          |

`copy` and `render` read from `templates/`, which does not exist yet; no
capability declares either verb today.
