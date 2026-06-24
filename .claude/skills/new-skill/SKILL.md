---
name: new-skill
description: >
  Authoring guide for new template skills: valid frontmatter with bare name (no plugin
  prefix — template uses bare names like "arch", "component", not "plugin:arch"),
  specific USE WHEN triggers, LLM-first step-by-step instructions, code snippets in
  template conventions (arrow-only, no-semi, alias imports), DO/DON'T table. Register
  via `registry` skill after creation.
  USE WHEN: "create skill", "new skill [name]", "author skill for [task]",
  "write a skill that does [X]", "add a skill for [domain]".
---

# New Skill

> A skill is a persistent, reusable instruction set for the LLM.
> It must be LLM-first: clear steps, concrete patterns, decision trees — not vague prose.
>
> Template convention: bare `name:` — no plugin namespace prefix. Use `arch` not
> `project:arch`. Two words: `fix-test`, `new-skill` — all lowercase kebab-case.

---

## Step 0 — Collect Requirements

Confirm or infer:

1. **Skill name** — bare kebab-case: `create-widget`, not `project:create-widget`
2. **Trigger description** — when should this skill fire? (USE WHEN list)
3. **What it produces** — one sentence: "Generates X files following Y conventions"
4. **The steps** — what must the LLM do, in order?
5. **Code patterns** — what does the output look like? (snippets are required)
6. **Project scope** — does it apply to both web and mobile?

---

## SKILL.md Structure

```markdown
---
name: {skill-name}          # bare kebab-case — NO plugin: prefix
description: >
  One-paragraph description of what it does.
  USE WHEN: explicit trigger phrases — "create component", "new component [name]".
  DO NOT USE: cases where a different skill applies (optional, for disambiguation).
---

# {Skill Title}

> One-line context. Which other skill to read first (if any).

---

## Pre-flight Checklist

Before starting:

1. Read the source file.
2. Check existing patterns.

---

## Decision Tree (if the skill has branching paths)

\`\`\`
Is X true?
├── YES → do A
└── NO → is Y true?
    ├── YES → do B
    └── NO  → do C
\`\`\`

---

## Step N — {Step Name}

{Description of what to do.}

\`\`\`typescript
// Arrow const, no-semi, I-prefix interfaces, alias imports
export const {Name} = ({ label }: I{Name}) => {
  // ...
}
\`\`\`

Rules:

- Bullet list of constraints for this step

---

## After {Skill Name}

- [ ] Verification step 1
- [ ] Run `pnpm typecheck`

---

## DO vs DON'T

| DO                        | DON'T                   |
| ------------------------- | ----------------------- |
| Concrete correct behavior | Concrete wrong behavior |

---

## Common Mistakes

1. Mistake description and fix.
```

---

## Frontmatter Rules

```yaml
---
name: {skill-name}         # bare kebab-case — no plugin: prefix
description: >             # block scalar, multi-line
  Full description.
  USE WHEN: trigger phrases, comma-separated.
  DO NOT USE: anti-trigger cases (optional).
---
```

- `name`: bare kebab-case — `arch`, `component`, `fix-test`
- `description`: first sentence = what it does; `USE WHEN:` = trigger phrases;
  `DO NOT USE:` = cases where another skill applies
- Template convention: no `plugin:` or namespace prefix in `name:`

---

## Writing LLM-First Instructions

**Good**: decision trees, ordered steps, code snippets with `{Placeholder}` variables,
explicit rules ("Arrow const — no `function` keyword"), DO/DON'T table.

**Bad**: prose about what the skill "aims to achieve", vague "follow best practices",
or instructions that require the LLM to infer obvious steps.

Every step must answer: "What exactly does the LLM write/generate/check here?"

All code snippets must follow template conventions:
- Arrow const — no `function` keyword
- No semicolons
- Single quotes
- `@/` or `@app/*` alias imports — no relative paths
- `I{Name}` for interfaces, `{Name}Type` for type aliases, `{Name}Enum` for enums

---

## Step-by-Step: What to Generate

1. Create the directory: `.claude/skills/{skill-name}/`
2. Write `SKILL.md` with correct frontmatter and content
3. Run `registry` to regenerate `.claude/skill-registry.md`
4. Commit both files with a `feat(skills):` conventional commit

---

## Quality Checklist (before finalizing)

- [ ] `name:` is bare kebab-case (no plugin: prefix)
- [ ] `description` starts with what it does, ends with `USE WHEN:` phrases
- [ ] Every step has a code snippet in template conventions (arrow-only, no-semi)
- [ ] Decision trees for branching paths
- [ ] DO/DON'T table covers 3–5 most common mistakes
- [ ] Post-checklist items include runnable commands (`pnpm typecheck`, etc.)
- [ ] No vague prose — every instruction is executable by the LLM
- [ ] `registry` updated and committed alongside the new skill
