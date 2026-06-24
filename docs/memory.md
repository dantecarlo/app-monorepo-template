# Shared Engram memory

Projects bootstrapped from this template share a single versioned Engram memory
mirror hosted at:

**https://github.com/dantecarlo/orquestador-engram-memory**

The repo acts as the durable, cross-session, cross-project record for
portfolio-level decisions, conventions, and architecture knowledge. Engram is
the fast, in-session store; the repo is the permanent ledger and onboarding
source.

---

## LOAD — hydrating a fresh session

Run this flow at the start of every session before doing any substantive work:

1. Clone or pull the shared memory repo locally (read-only pull is sufficient).
2. Identify the relevant memory files for the current project:
   - `memories/template/baseline/` — template-wide conventions and architecture
     decisions (load first, highest priority).
   - `memories/portfolio/state/` — cross-project portfolio state and context.
   - `memories/portfolio/policies/` — shared team policies and guardrails.
3. For each file, call `mem_save` with the `topic_key` from the file's
   frontmatter and the file's content. This re-hydrates Engram with the
   authoritative shared record.
4. Forward all loaded conventions and policies to any delegated sub-agents via
   their prompt context so they operate with the same shared baseline.

Priority order: template/baseline → portfolio/state → portfolio/policies.

---

## CONTRIBUTE — keeping the shared repo in sync

Apply this flow whenever a portfolio-level decision, cross-project convention,
or reusable architecture discovery is made:

1. **Engram first**: call `mem_save` with a stable `topic_key` (e.g.
   `template/baseline/auth-model` or `portfolio/policies/naming-conventions`).
   Record `type`, `title`, and full `content` (what / why / where / learned).
2. **Repo second**: add or update the matching markdown file at
   `memories/<group>/<slug>.md`. Every file must include a YAML frontmatter
   block:

   ```yaml
   ---
   title: Short searchable title
   type: decision | architecture | pattern | policy | config | discovery
   topic_key: template/baseline/<slug>
   engram_id: <id returned by mem_save>
   exported_at: <ISO 8601 date>
   ---
   ```

3. Update the repo's `README.md` index table with the new or changed entry.
4. Commit with a conventional commit message (no AI attribution, no
   Co-Authored-By) and push.

Rule of thumb: **Engram first, repo second.** Never update only the repo — the
repo is a mirror of what Engram already holds.

---

## Scope of what belongs here

Contribute to the shared memory when the knowledge is:

- Applicable across multiple projects bootstrapped from this template.
- A decision that a future agent bootstrapping a new project would need.
- A hard-won discovery, gotcha, or edge case that is not obvious from the code.
- A policy or convention that overrides or extends what is written in CLAUDE.md.

Do not contribute project-specific implementation details, secrets, or anything
scoped only to a single product.
