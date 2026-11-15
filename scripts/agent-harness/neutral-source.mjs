// ---------------------------------------------------------------------------
// neutral-source — reads the neutral agent sources, `.agents/agents/*.agent.md`,
// the one place an agent is written. Every runtime's file is projected from
// them by `pnpm agent-harness:generate`.
//
// Ported from Certifipago's scripts/agent-harness/neutral-source.mjs.
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const FRONTMATTER_DELIMITER = '---\n'
const SOURCE_SUFFIX = '.agent.md'

// The schema is CLOSED: exactly these keys, no more, no fewer. An unknown key
// is a hard failure naming the field — never a warning, never a best-effort
// render.
const REQUIRED_FIELDS = ['description', 'model', 'name', 'tools']

// A deliberately tiny reader for the only YAML shapes these sources use:
// `key: value` and `key: >` followed by an indented folded block. Pulling in a
// full YAML parser to read four keys would add a dependency the harness has to
// trust, and this refuses anything it does not recognize instead of guessing.
const FIELD_RE = /^([a-z][a-zA-Z0-9_-]*):[ \t]*(.*)$/
const FOLD_MARKERS = ['>', '|']
const INDENTED_RE = /^\s+\S/

// Read in one pass into records, then interpret them. A blank line closes an
// open fold, and an indented line outside one fails FIELD_RE and trips the
// assert.
const parseFrontmatterFields = ({ path, text }) => {
  const records = []
  let folding = false

  for (const line of text.split('\n')) {
    if (line.trim() === '') {
      folding = false
      continue
    }

    if (folding && INDENTED_RE.test(line)) {
      records.at(-1).folded.push(line.trim())
      continue
    }

    const match = FIELD_RE.exec(line)
    assert.ok(
      match,
      `${path}: cannot read frontmatter line as a field: ${line}`
    )
    const [, key, inlineValue] = match
    folding = FOLD_MARKERS.includes(inlineValue)
    records.push({ folded: [], inlineValue, key })
  }

  return Object.fromEntries(
    records.map(({ folded, inlineValue, key }) => [
      key,
      FOLD_MARKERS.includes(inlineValue)
        ? folded.join(' ')
        : inlineValue.trim()
    ])
  )
}

export const parseNeutralSource = ({ path, text }) => {
  assert.ok(
    text.startsWith(FRONTMATTER_DELIMITER),
    `${path}: must open with a --- frontmatter block`
  )
  const closing = text.indexOf(
    `\n${FRONTMATTER_DELIMITER}`,
    FRONTMATTER_DELIMITER.length
  )
  assert.notEqual(closing, -1, `${path}: frontmatter is never closed`)

  const frontmatterText = text.slice(
    FRONTMATTER_DELIMITER.length,
    closing + 1
  )
  const body = text.slice(closing + 1 + FRONTMATTER_DELIMITER.length)
  const fields = parseFrontmatterFields({ path, text: frontmatterText })

  const declared = Object.keys(fields).sort()
  const unmapped = declared.filter((key) => !REQUIRED_FIELDS.includes(key))
  assert.deepEqual(
    unmapped,
    [],
    `${path}: adapter=claude field=${unmapped.join(',')} is not in the closed schema`
  )
  const missing = REQUIRED_FIELDS.filter((key) => !declared.includes(key))
  assert.deepEqual(
    missing,
    [],
    `${path}: adapter=claude field=${missing.join(',')} is required and absent`
  )

  return { body, fields, frontmatterText }
}

export const readNeutralAgents = ({ directory }) =>
  readdirSync(directory)
    .filter((entry) => entry.endsWith(SOURCE_SUFFIX))
    .sort()
    .map((entry) => {
      const path = join(directory, entry)
      const parsed = parseNeutralSource({
        path,
        text: readFileSync(path, 'utf8').replaceAll('\r\n', '\n')
      })
      const name = entry.slice(0, -SOURCE_SUFFIX.length)

      assert.equal(
        parsed.fields.name,
        name,
        `${path}: declares name=${parsed.fields.name} but is filed as ${name}`
      )
      return { ...parsed, name, path }
    })
