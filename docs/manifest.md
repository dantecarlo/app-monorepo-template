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

### Maintainer material

The `template-maintainer` capability (group `maintainer`) owns the template's
own plans and audits: `docs/GENERALIZATION_PLAN.md`,
`docs/INIT_AND_HARNESS_PLAN.md` and `docs/audits/**`. They name donor products
and record how this template was built, so they must never ship.

- **No preset selects it**, so init always removes it from a derived project.
- **The brand gate exempts it.** The planned `verify:generic` gate (blocker B3)
  scans what ships for product names; maintainer material never ships, so the
  gate skips the paths this capability claims.

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
| `remove-dep`       | `file`, `name`, `scope` | Drops one dependency record                     |
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
file another owner keeps. Each hole below needs region markers or an injected
adapter (blocker B4); a delete-only executor cannot close it.

| Absent capability     | What breaks                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `supabase`            | `apps/web/src/app/layout.tsx` (via `SupabaseProviders`) and `apps/mobile/src/app/_layout.tsx` keep their Supabase imports                  |
| `i18n`                | `apps/web/src/app/layout.tsx` and the `LanguageSwitcher` blocks keep their `@app/i18n` imports                                             |
| `e2e-playwright`      | `scripts.smoke:mobile-web` and the CI `mobile-web` job still call Playwright                                                               |
| `web-next`            | `verify-security-static`, `verify-theme-sync`, `verify-maps` and the knip workspaces still read `apps/web`                                 |
| `mobile-expo`         | `verify-maps` and the knip workspaces still name `apps/mobile`                                                                             |
| `diagrams`            | `pnpm validate` still calls `docs:diagrams:check` (B2); the global map rows for `docs/diagrams/` and `build-diagrams` fail `verify:maps`   |
| `template-maintainer` | Never selected, so always absent: the global map rows for the plans and `docs/audits/`, and the plan citations in code-standards, go stale |

`copy` and `render` read from `templates/`, which does not exist yet; no
capability declares either verb today.
