---
name: improve-skill
description: >
  8-dimension skill audit and tracked-change proposal, confirm before overwrite. Audits:
  frontmatter validity (bare name — no plugin prefix, flag as drift if namespaced),
  trigger clarity, instruction completeness, code patterns, DO/DON'T table, actionable
  checklists, staleness, eval coverage. Shows a diff of proposed changes. Re-index via
  `registry` after edits.
  USE WHEN: "improve skill", "upgrade skill", "audit skill quality",
  "skill is not working well", "update [skill] instructions", "fix [skill]".
---

# Improve Skill

> Read the existing skill completely before proposing any changes.
> Report findings, propose improvements, confirm before writing.
> After overwriting, run `registry` to update `.claude/skill-registry.md`.

---

## Pre-flight

1. Read the target `SKILL.md` completely.
2. Check if the skill references other skills — read those too.
3. Note: no `evals/` directory is required in the template (optional).

---

## 8 Audit Dimensions

### Dimension 1 — Frontmatter Validity

```yaml
# ✅ Template convention — bare kebab-case name
name: arch

# ❌ Plugin-namespaced — drift in the template context
name: react-fractal:arch
name: frontend-quality:arch
```

Issues to flag:
- Missing `name` or `description`
- `name` is plugin-namespaced (e.g. `plugin:skill`) → flag as drift; bare name is correct
- `USE WHEN:` missing or vague (`"any coding task"` is too broad)
- `DO NOT USE:` missing when the skill might be confused with a sibling skill

---

### Dimension 2 — Trigger Clarity

The `USE WHEN:` list must be specific enough that the LLM reliably loads this
skill and reliably does NOT load it when irrelevant.

```
✅ Specific: "create component", "new component [name]", "add a [name] component"
❌ Vague: "any development task", "coding", "when working with React"
```

Check: are there sibling skills that could be confused with this one? If so,
add `DO NOT USE:`.

---

### Dimension 3 — Instruction Completeness

For each step in the skill, verify the LLM knows:
- What to generate/write/check?
- What the output looks like? (requires a code snippet)
- What rules to enforce?
- What to do if the situation is ambiguous? (requires a decision tree)

Missing any of these → add them.

---

### Dimension 4 — Code Patterns

Every step that produces code must have a snippet with `{Placeholder}` variables
showing the exact expected output in template conventions:

```
✅ Arrow const, no-semi, I-prefix interfaces, @/ alias imports
❌ function keyword, semicolons, relative imports, Props suffix (not I-prefix)
```

---

### Dimension 5 — DO/DON'T Table

Must cover 3–5 most common mistakes. Each row:
- DO: concrete correct behavior
- DON'T: concrete wrong behavior (not "don't do bad things")

---

### Dimension 6 — Checklist Items Are Actionable

```
✅ Actionable: "pnpm typecheck", "run `registry` to update the index"
❌ Vague: "make sure it's correct", "verify the implementation"
```

---

### Dimension 7 — Staleness

Check for:
- References to deprecated APIs (MSW v1 syntax, React class components, etc.)
- Library-version-specific behavior that may have changed
- Convention drift: `function` keyword where arrow-only is required;
  `{Name}Props` interface naming where `I{Name}` is the convention;
  plugin-namespaced `name:` where bare name is the template standard

---

### Dimension 8 — Eval Coverage (Optional)

If an `evals/` directory exists next to the SKILL.md, verify the eval cases
still reflect the current skill instructions. If none exist, suggest 1–2 minimal
input/expected output pairs that would catch regressions.

---

## Improvement Report Format

```markdown
# Skill Audit — {skill-name}

## Summary

{1–3 sentence overall assessment}

## Issues Found

### [HIGH] {Dimension name}: {issue title}

{description of the problem}
Proposed fix: {specific change}

### [MEDIUM] {Dimension name}: {issue title}

...

### [LOW] {Dimension name}: {issue title}

...

## Proposed Changes

\`\`\`diff
- old line
+ new line
\`\`\`

## No Action Needed

- {dimension}: passes — {brief reason}

## Recommendation

Apply {N} high-priority fixes before this skill is reliable.
```

---

## After Report — Get Confirmation

Show the report. Ask:

> "Apply all HIGH changes now? I'll leave MEDIUM and LOW for you to review first."

On confirmation:
1. Write the improved `SKILL.md`
2. Run `registry` to regenerate `.claude/skill-registry.md`

**Never overwrite without confirmation.**

---

## DO vs DON'T

| DO                                                       | DON'T                                  |
| -------------------------------------------------------- | -------------------------------------- |
| Read the full skill before auditing                      | Skim and guess at issues               |
| Show a diff of proposed changes                          | Rewrite without showing what changed   |
| Confirm before overwriting                               | Silently replace the existing file     |
| Flag plugin-namespaced `name:` as drift                  | Accept `plugin:skill` as valid in template |
| Reindex via `registry` after overwriting                 | Leave the registry stale               |
| Preserve working patterns that don't violate dimensions  | Change things that aren't broken       |
