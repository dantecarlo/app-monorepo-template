#!/usr/bin/env node
// ---------------------------------------------------------------------------
// validate-general-plan — structural gate for a project's docs/GENERAL_PLAN.md.
//
// Asserts the handoff-grade plan is well-formed:
//
//   - YAML frontmatter present with required fields: project, last_updated, status
//   - every REQUIRED template section heading is present
//   - the DONE section is non-empty (has content before the next heading)
//   - the PENDING section is non-empty
//   - a "Needs from user" / "NEEDS FROM OWNER" section exists
//
// Prints a PASS/FAIL line per check. Exits 1 on any failure, 0 on success.
//
// Usage:
//   node validate-general-plan.mjs docs/GENERAL_PLAN.md
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const target = process.argv[2]

if (!target) {
  console.error('validate-general-plan: FAIL — no path argument.')
  console.error('Usage: node validate-general-plan.mjs <path-to-GENERAL_PLAN.md>')
  process.exit(1)
}

const absPath = resolve(process.cwd(), target)

let raw
try {
  raw = readFileSync(absPath, 'utf8')
} catch {
  console.error(`validate-general-plan: FAIL — cannot read file: ${target}`)
  process.exit(1)
}

const results = []
const check = ({ name, ok, detail }) => {
  results.push({ name, ok, detail })
}

// ---------------------------------------------------------------------------
// Frontmatter — must be a leading --- ... --- block with required keys.
// ---------------------------------------------------------------------------

const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---/)
const frontmatter = frontmatterMatch ? frontmatterMatch[1] : ''

check({
  name: 'Frontmatter block present',
  ok: Boolean(frontmatterMatch),
  detail: frontmatterMatch ? '' : 'no leading --- ... --- block found'
})

const requiredFields = ['project', 'last_updated', 'status']
for (const field of requiredFields) {
  const fieldRegex = new RegExp(`^${field}\\s*:\\s*\\S+`, 'm')
  const present = fieldRegex.test(frontmatter)
  check({
    name: `Frontmatter field "${field}" present and non-empty`,
    ok: present,
    detail: present ? '' : `missing or empty "${field}:" in frontmatter`
  })
}

// ---------------------------------------------------------------------------
// Required section headings — matched on a stable keyword per heading so small
// title edits (emoji, casing, trailing words) don't break the gate.
// ---------------------------------------------------------------------------

const requiredSections = [
  { label: 'Header & Snapshot', pattern: /^##?\s+.*\bsnapshot\b/im, alt: /general plan/im },
  { label: 'Status Snapshot', pattern: /^##\s+status snapshot/im },
  { label: 'Product Vision & Scope', pattern: /^##\s+.*\b(vision|scope)\b/im },
  { label: 'Current Stack & Architecture', pattern: /^##\s+.*\b(stack|architecture)\b/im },
  { label: 'What\'s DONE', pattern: /^##\s+.*\bdone\b/im },
  { label: 'What\'s PENDING', pattern: /^##\s+.*\bpending\b/im },
  { label: 'Needs from user / owner', pattern: /^##\s+.*\b(needs from|necesito del usuario)\b/im },
  { label: 'Path to Launch', pattern: /^##\s+.*\blaunch\b/im },
  { label: 'Technical Details, Conventions & Gotchas', pattern: /^##\s+.*\bgotchas\b/im },
  { label: 'Risks & Open Decisions', pattern: /^##\s+.*\brisks?\b/im }
]

for (const section of requiredSections) {
  const present = section.pattern.test(raw) || (section.alt ? section.alt.test(raw) : false)
  check({
    name: `Section "${section.label}" present`,
    ok: present,
    detail: present ? '' : `no heading matched for "${section.label}"`
  })
}

// ---------------------------------------------------------------------------
// Non-empty section bodies — the heading must be followed by real content
// before the next "## " heading (ignoring HTML-comment guidance and blanks).
// ---------------------------------------------------------------------------

const sectionBodyHasContent = ({ headingPattern }) => {
  const lines = raw.split('\n')
  let inSection = false
  for (const line of lines) {
    if (!inSection) {
      if (headingPattern.test(line)) inSection = true
      continue
    }
    if (/^##\s+/.test(line)) break
    const trimmed = line.trim()
    if (trimmed === '') continue
    if (trimmed.startsWith('<!--') || trimmed.startsWith('-->') || trimmed.startsWith('<!')) continue
    // A table separator alone is not content; anything else counts.
    if (/^\|[\s|:-]+\|$/.test(trimmed)) continue
    return true
  }
  return false
}

const doneHasContent = sectionBodyHasContent({ headingPattern: /^##\s+.*\bdone\b/i })
check({
  name: 'DONE section is non-empty',
  ok: doneHasContent,
  detail: doneHasContent ? '' : 'no content between the DONE heading and the next section'
})

const pendingHasContent = sectionBodyHasContent({ headingPattern: /^##\s+.*\bpending\b/i })
check({
  name: 'PENDING section is non-empty',
  ok: pendingHasContent,
  detail: pendingHasContent ? '' : 'no content between the PENDING heading and the next section'
})

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------

for (const { name, ok, detail } of results) {
  if (ok) {
    console.log(`PASS — ${name}`)
  } else {
    console.error(`FAIL — ${name}${detail ? ` (${detail})` : ''}`)
  }
}

const failed = results.filter((r) => !r.ok)

if (failed.length === 0) {
  console.log(`\nvalidate-general-plan: OK — ${results.length} checks passed for ${target}`)
  process.exit(0)
}

console.error(`\nvalidate-general-plan: FAIL — ${failed.length} of ${results.length} checks failed.`)
process.exit(1)
