---
name: propagate-from-template
description: >
  Selective diff-based sync of improvements from app-monorepo-template into a
  downstream project. Classifies changes as safe/major/locked, applies scripts
  and gates first, fixes drift, adapts namespaces, preserves domain code, and
  commits with a traceable conventional commit.
  USE WHEN: user says "sync from template", "pull template changes",
  "propagate template updates", or "update from upstream template".
---

# propagate-from-template

Syncs improvements from `app-monorepo-template` into the current downstream
project using a selective diff-based workflow. The template shares no git
history with downstream projects — never rebase or merge.

---

## Precondition — clean tree and identity check

Before fetching the template, the working tree must be clean and the project
identity must be consistent:

```bash
git status --short          # must return empty — commit or stash WIP first
pnpm check:identity         # must pass — fix any identity drift before syncing
```

A dirty working tree causes unrelated changes to contaminate the sync. An
identity failure means namespace references are inconsistent and must be
resolved on a clean baseline before importing new template content.

Also confirm the `template` remote exists:

```bash
git remote -v | grep template
```

If missing: `git remote add template <template-repo-url> && git fetch template`.

If any precondition fails, stop and report the blocker.

---

## Step 1 — Fetch

```bash
git fetch template
```

---

## Step 2 — Inspect and classify

Run one diff per category. For each changed file, assign one of three labels:

| Label | Meaning | Action |
|---|---|---|
| `safe` | Config, scripts, or gates with no breaking changes | Copy or apply directly |
| `major` | Breaking major version bump (Next.js, Tailwind, etc.) | Individual gated migration — do not bulk-copy |
| `locked` | Framework-governed dep (Expo's react, react-native, nativewind) | Update via `expo install` only — never via npm latest |

```bash
# Code standards and linting
git diff template/main -- eslint.config.mjs eslint.rules.mjs docs/code-standards.md

# TypeScript baseline
git diff template/main -- tsconfig.base.json

# Build pipeline (typically safe)
git diff template/main -- turbo.json scripts/

# Agent context
git diff template/main -- .claude/skills/ .claude/agents/ AGENTS.md CLAUDE.md

# Infrastructure docs
git diff template/main -- docs/infrastructure.md docs/propagation.md

# E2E harness
git diff template/main -- playwright.config.ts e2e/ docs/e2e.md
```

---

## Step 3 — Apply: scripts and gates first

Apply `safe` changes to `scripts/` and gate files (`check-identity.mjs`,
`verify-maps.mjs`, `verify-tests.mjs`) before any other category. Then run
the gates:

```bash
pnpm check:identity
pnpm verify:maps
pnpm verify:tests
```

The gates must pass before proceeding to remaining categories. If they fail,
the failures are the next thing to fix (see Step 4).

For other `safe` files:

```bash
git show template/main:<file> > <file>
```

For files with project-specific content, merge manually — preserve all project
sections.

**Never apply wholesale** to:
- `CLAUDE.md` — project sections must survive.
- `AGENTS.md` — project-specific orientation must survive.
- `docs/maps/global-map.md` — downstream projects own their own map.
- `pnpm-lock.yaml` — always regenerated, never copied.

`major` changes require a standalone migration branch, not inline application.

`locked` deps must go through `expo install <package>@<version>` to respect
the Expo SDK peer-dep matrix.

---

## Step 4 — fix-drift

After copying the gates, run them immediately. The newly-copied gates will
surface existing drift in the downstream project that was previously
undetected. Fix all reported drift before committing the sync:

- Identity mismatches → update namespace references (see Step 5)
- Dead map references → create the missing file or remove the stale reference
- Missing test coverage → add the required unit tests

Do not skip this step or defer the fixes — committing with known drift defeats
the purpose of the gates.

Common failure modes:

| Failure | Cause | Fix |
|---|---|---|
| `check:identity` mismatch | Namespace reference not updated | Update the reference (see Step 5) |
| ESLint error in new rule | New rule fires on existing code | Apply auto-fix with `pnpm lint:fix`, then review |
| TypeScript error | New `tsconfig.base.json` strictness | Fix the offending type annotation |
| `verify-maps` dead ref | Skill path referenced in global-map but not yet created | Create the file or remove the reference |

---

## Step 5 — namespace-adapt

When template changes reference `@app/*` paths, package names, or
environment-variable prefixes, adapt them to the downstream project's
namespace before committing.

**Scan for residual `@app/` references:**

```bash
rg "@app/" --type ts -l
rg "@app/" --type json -l
```

**Checklist:**
- `@app/*` import aliases → `@<project-slug>/*` (most handled by
  `pnpm init <slug>` / `scripts/init-project.mjs`; the scan above catches
  residuals)
- `package.json` `name` fields in each workspace package
- `apps/mobile/app.json`: `slug`, `ios.bundleIdentifier`, `android.package`
- Env-var prefixes: verify `NEXT_PUBLIC_` and `EXPO_PUBLIC_` variables match
  the downstream project's naming conventions

Run `pnpm check:identity` after adapting. A passing result confirms all
namespace references are consistent.

---

## Step 6 — Don't clobber domain code

Template changes to `apps/` and `packages/` are structural guides, not
content to copy. The downstream project owns its domain code:

- Data layer is swappable via the service/adapter seam — adapt the interface,
  not the implementation.
- RLS policies and migrations live in the downstream project's adapter; do not
  overwrite them.
- Apply only structural template changes (file layout, barrel exports, seam
  boundaries) and preserve all project-specific logic.

Verify the seam is intact after any change to `packages/`:

```bash
rg "from 'react'|from 'next'|from '@supabase" packages/core/src \
  --type-add 'ts:*.ts' --type-add 'tsx:*.tsx' -l
```

Zero matches = seam intact. Non-zero = propagation introduced a framework
import into core; revert the offending hunk.

---

## Step 7 — Final gate and commit

```bash
pnpm install   # regenerate lock if package.json changed
pnpm validate  # full gate — must be green
```

`pnpm validate` green = propagation done. Then commit:

```bash
git add <changed files>
git commit -m "chore(template-sync): pull <topic> from template@$(git rev-parse --short template/main)"
```

One commit per category. Do not batch unrelated categories into a single
commit.

---

## Clean tree gate

This skill must leave the working tree clean. After committing:

```bash
git status --short
```

Should return empty. If not, either commit or discard the residual changes
before reporting done.
