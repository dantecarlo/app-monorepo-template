---
name: propagate-from-template
description: >
  Selective diff-based sync of improvements from app-monorepo-template into a
  downstream project. Fetches the template remote, inspects the diff by
  category, applies changes carefully, validates, and commits with a traceable
  conventional commit.
  USE WHEN: user says "sync from template", "pull template changes",
  "propagate template updates", or "update from upstream template".
---

# propagate-from-template

Syncs improvements from `app-monorepo-template` into the current downstream
project using a selective diff-based workflow. The template shares no git
history with downstream projects — never rebase or merge.

---

## Pre-flight checks

Before starting, verify:

1. The working tree is clean (`git status --short` returns empty).
2. The `template` remote exists (`git remote -v | grep template`).
   If missing: `git remote add template <template-repo-url> && git fetch template`.
3. `pnpm validate` is currently green on the base branch.

If any check fails, stop and report the blocker.

---

## Step 1 — Fetch

```bash
git fetch template
```

---

## Step 2 — Inspect diff by category

Run one diff per category. Read the output before deciding what to apply.

```bash
# Code standards and linting
git diff template/main -- eslint.config.mjs eslint.rules.mjs docs/code-standards.md

# TypeScript baseline
git diff template/main -- tsconfig.base.json

# Build pipeline
git diff template/main -- turbo.json scripts/

# Agent context
git diff template/main -- .claude/skills/ .claude/agents/ AGENTS.md CLAUDE.md

# Infrastructure docs
git diff template/main -- docs/infrastructure.md docs/propagation.md

# E2E harness
git diff template/main -- playwright.config.ts e2e/ docs/e2e.md
```

For each category, determine:
- **Apply as-is** — template change is standalone and does not conflict.
- **Merge manually** — downstream project has project-specific content in the
  same file; apply only the template delta.
- **Skip** — change does not apply to this project (e.g. a template-only demo).

---

## Step 3 — Apply selectively

For files that can be applied as-is:

```bash
git show template/main:<file> > <file>
```

For files requiring a manual merge, read both versions and apply only the
additive or corrective delta. Preserve all project-specific sections.

**Never apply wholesale** to:
- `CLAUDE.md` — project sections must survive.
- `AGENTS.md` — project-specific orientation must survive.
- `docs/maps/global-map.md` — downstream projects own their own map.
- `pnpm-lock.yaml` — always regenerated, never copied.

---

## Step 4 — Validate

```bash
pnpm install   # regenerate lock if package.json changed
pnpm validate  # full gate must be green
```

If the gate fails, fix before committing. Common failure modes:

| Failure | Cause | Fix |
|---|---|---|
| ESLint error in new rule | New rule fires on existing code | Apply auto-fix with `pnpm lint:fix`, then review |
| TypeScript error | New `tsconfig.base.json` strictness | Fix the offending type annotation |
| verify-maps dead ref | New skill path referenced in global-map but not yet created | Create the file or remove the reference |

---

## Step 5 — Check adapter seam

After applying any change to `packages/`:

```bash
rg "from 'react'|from 'next'|from '@supabase" packages/core/src \
  --type-add 'ts:*.ts' --type-add 'tsx:*.tsx' -l
```

Zero matches = seam intact. Non-zero = propagation introduced a framework
import into core; revert the offending hunk.

---

## Step 6 — Commit

```bash
git add <changed files>
git commit -m "chore(template-sync): pull <topic> from template@$(git rev-parse --short template/main)"
```

One commit per category. Do not batch unrelated categories into a single commit.

---

## Clean tree gate

This skill must leave the working tree clean. After committing:

```bash
git status --short
```

Should return empty. If not, either commit or discard the residual changes
before reporting done.
