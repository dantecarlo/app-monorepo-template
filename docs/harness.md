# The harness — every gate, and how to add one

The harness is the set of automated checks that decide whether a change is done.
It is not advice. Each piece either fails a command or it does not exist.

> **The principle behind all of it:** an instruction is not a gate. Two rules
> written in the same voice hold very differently when one is backed by a hook
> and the other by prose. `docs/code-standards.md` §21 is the ledger that keeps
> that difference visible.

---

## The four layers

A change passes through them in this order. Each layer is cheaper than the one
after it, so the cheap ones run first.

| Layer      | When it runs    | What it costs | What it catches                    |
| ---------- | --------------- | ------------- | ---------------------------------- |
| **Editor** | As you type     | free          | Types, lint rules, formatting      |
| **Hooks**  | On commit       | seconds       | Staged-file lint, commit message   |
| **Gate**   | `pnpm validate` | minutes       | Everything below                   |
| **CI**     | On push and PR  | minutes       | The gate again, on a clean machine |

---

## Layer 1 — the editor

TypeScript and ESLint run in the editor from the same config the gate uses. There
is no separate "editor config" to drift from.

---

## Layer 2 — git hooks

Managed by Husky, in `.husky/`.

| Hook         | Command                 | What it enforces                  |
| ------------ | ----------------------- | --------------------------------- |
| `pre-commit` | `pnpm exec lint-staged` | ESLint + Prettier on staged files |
| `commit-msg` | `pnpm exec commitlint`  | Conventional commits              |

Hooks are deliberately thin. Semantic checks belong in the gate, where they can
see the whole repo — a hook that reads only staged files cannot tell you that a
file you did not touch now has no owner.

---

## Layer 3 — the gate

```bash
ATL_TEMPLATE_SELF=1 pnpm validate
```

**Nothing is done until this exits 0.** Check the exit code, not the tail of a
pipe: `pnpm validate | tail` reports the exit status of `tail`, which is always 0. Use `pnpm validate > log 2>&1; echo $?`.

The chain runs in cost order:

### 3a. Instant gates — they run first

| Gate                            | Proves                                                    |
| ------------------------------- | --------------------------------------------------------- |
| `pnpm verify:lint-rules:test`   | The local ESLint rules still report what they must        |

A broken rule fails here, before anything expensive builds.

### 3b. Turbo — lint, typecheck, test, build

`turbo run lint typecheck test build format:check` across every workspace.
`format:check` has no workspace task yet, so it runs nothing: formatting is
enforced by the `prettier/prettier` ESLint rule on workspace TS/TSX, and by
the pre-commit hook on staged files.

### 3c. The verify scripts

| Gate                  | Proves                                                    |
| --------------------- | --------------------------------------------------------- |
| `verify:tests`        | Every unit has a sibling test                             |
| `verify:maps`         | The global map resolves, and no stray magic literals      |
| `verify:pairing`      | A service has its adapter and vice versa                  |
| `verify:structure`    | Screen and component folders satisfy the block contract   |
| `verify:security`     | The static security posture holds                         |
| `verify:theme-sync`   | Web and mobile themes agree                               |
| `docs:diagrams:check` | Every committed diagram matches its spec and the tokens   |
| `check:identity`      | The template's default identity is gone (skipped on self) |
| `knip`                | No dead exports, no unlisted or unused dependencies       |

### 3d. What the gate deliberately excludes

E2E and runtime smokes are **not** in `pnpm validate` — they need a built app and
a browser, which would make the offline gate slow and flaky.

```bash
pnpm test:e2e      # Playwright, needs a prior build
pnpm smoke:web     # next build + a real HTTP probe
pnpm smoke:mobile  # expo export + a Hermes bundle assertion
```

---

## Layer 4 — CI

`.github/workflows/ci.yml` runs `pnpm install` then the same gate, with
`ATL_TEMPLATE_SELF=1`. CI runs no check that a developer cannot run locally.

---

## The local ESLint rules

Rules the repo owns, in `eslint-local-rules/`. Each exists because a written rule
was being broken with nothing to notice.

| Rule                                 | Scope                          | Backs                                        |
| ------------------------------------ | ------------------------------ | -------------------------------------------- |
| `local/core-import-boundary`         | `packages/core/src/**`         | The domain layer imports nothing external    |
| `local/pure-domain-adapter`          | `src/services/**/*.adapter.ts` | Rule 6 — an adapter is a sync DTO mapper     |
| `local/suffix-contract`              | views and hooks                | §3.1 — types live in the block's `*.type.ts` |
| `local/no-justifying-comment`        | everywhere                     | §1.2 — comments say what the code does       |
| `local/logic-in-view`                | views                          | §14a — logic lives in hooks                  |
| `local/single-use-state`             | views                          | §14a                                         |
| `local/no-inline-tailwind-classname` | views                          | Classes live in `*.styles.ts`                |
| `local/single-object-params`         | everywhere                     | Rule 5                                       |
| `local/no-non-ascii-identifier`      | everywhere                     | §15 — English everywhere                     |

---

## How to add a gate

The order matters. A gate added in the wrong order lands red and gets disabled,
which is worse than not having it.

1. **Measure first.** Run the check by hand across the repo and count the
   violations. A gate is only ever added to a codebase that already passes it.
2. **Fix the code, or drop the gate.** There is no third option, and in
   particular there is no exemption file — see the ratchet in §20. If the code
   cannot be fixed, the gate does not describe this project.
3. **Write the detector as a pure module.** `*.detect.mjs` for a lint rule,
   `scripts/<name>.mjs` for a verify script. Pure means no filesystem and no
   git inside it, so its tests drive it with fixtures.
4. **Write its test.** Synthetic fixtures, one case per rule, including the
   cases that must NOT fire.
5. **Scope it.** A rule that fires on files it was never meant to judge is a
   wiring bug, not a finding. Prove the glob before trusting the count.
6. **Prove it fires.** Plant a violation on purpose and watch it fail. A gate
   that is silently unwired reports zero exactly like a gate that passes.
7. **Wire it into `pnpm validate`.**
8. **Document it** — this file, its §21 row in `docs/code-standards.md`, and
   `docs/maps/global-map.md`.

> Step 6 is not paranoia. It has already caught two unwired rules in this repo:
> one defined but never imported, and one scoped so wide it reported 607
> failures against files it should never have read.

---

## The escape hatches, and their discipline

Flexibility without weakening the gate, in order of preference (§20):

1. **Tune the rule** so it never fires on the legitimate pattern. Best.
2. **Scoped path override** in `eslint.config.mjs`, when the false positive is
   systematic in one area — as with the vendored skill under
   `.claude/skills/archify/**`, which is pinned upstream and not ours to
   reformat.
3. **A justified inline disable**, with a written reason, one rule per line.

**Never an allowlist file.** A list of blessed paths freezes a backlog into a
file nobody reads. A ceiling — one number per scope that can only go down, with
a measurement date — is the sanctioned way to carry a backlog.
