#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-workflow-pins — every action a workflow runs is pinned to a commit.
//
// A tag such as `v4` is a name its owner can move: the next run of a
// workflow that says `actions/checkout@v4` runs whatever commit the tag names
// by then, and so does every project that inherits the workflow from this
// template. A full 40-character commit SHA names one commit for good. The
// gate reads every workflow under .github/workflows/ and refuses a `uses:`
// whose ref is anything else: a tag, a branch, a short SHA, or no ref at
// all. A local action (`./...`) and a Docker image (`docker://...`) are
// exempt: the first is in the repository, the second is no git ref.
//
// The tag a SHA was resolved from stays on its line as a comment, as in
// `# v4.4.0`, for the reader; the gate does not read it. A line inside a
// block scalar (a `run: |` script) is text, not a key, and is not judged.
//
// Usage:
//   node scripts/verify-workflow-pins.mjs [--root <directory>]
// ---------------------------------------------------------------------------

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineGate, reportGate } from './gate/gate.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT_FLAG = '--root'
const NOT_FOUND = -1
const FIRST_LINE = 1
const LINE_BREAK = /\r?\n/u
const WORKFLOWS = '.github/workflows'
const WORKFLOW_FILE = /\.ya?ml$/u
const REF_SEPARATOR = '@'

// A `uses:` key, as a step's first key (`- uses:`) or as a job's.
const USES_LINE = /^\s*(?:-\s+)?uses:(?<value>.*)$/u
// A YAML comment: a `#` that opens the value or follows a space.
const COMMENT = /(?:^|\s+)#.*$/u
const QUOTED = /^(?<quote>["'])(?<inner>.*)\k<quote>$/u
// A key whose value is a block scalar, `|` or `>` with its indicators: the
// lines indented under it are its text.
const BLOCK_SCALAR = /:\s*[|>][-+\d]*\s*(?:#.*)?$/u
const INDENT = /^\s*/u
const FULL_SHA = /^[\da-f]{40}$/u
const EXEMPT_PREFIXES = ['./', 'docker://']

const indentOf = ({ line }) => line.match(INDENT)[0].length

const valueOf = ({ raw }) => {
  const text = raw.replace(COMMENT, '').trim()
  return text.match(QUOTED)?.groups.inner ?? text
}

// Every `uses:` key of a workflow, with its line number, skipping the text
// of a block scalar.
export const usesOf = ({ text }) => {
  const found = []
  let blockIndent = null
  text.split(LINE_BREAK).forEach((line, index) => {
    const indent = indentOf({ line })
    if (blockIndent !== null) {
      if (line.trim() === '' || indent > blockIndent) return
      blockIndent = null
    }
    if (BLOCK_SCALAR.test(line)) blockIndent = indent
    const match = line.match(USES_LINE)
    if (match) {
      found.push({
        line: index + FIRST_LINE,
        value: valueOf({ raw: match.groups.value })
      })
    }
  })
  return found
}

const isExempt = ({ value }) =>
  EXEMPT_PREFIXES.some((prefix) => value.startsWith(prefix))

const judgeUse = ({ line, path, value }) => {
  if (isExempt({ value })) return []
  const at = value.lastIndexOf(REF_SEPARATOR)
  const where = `${path}:${line}: uses: ${value}`
  if (at === NOT_FOUND) {
    return [
      {
        detail: `${where} names no ref, so it runs whatever the default branch holds`,
        line,
        path
      }
    ]
  }
  const ref = value.slice(at + REF_SEPARATOR.length)
  return FULL_SHA.test(ref)
    ? []
    : [
        {
          detail: `${where} is pinned to ${ref}, not to a full 40-character commit SHA`,
          line,
          path
        }
      ]
}

export const gate = defineGate({
  claims:
    `every uses: of every workflow under ${WORKFLOWS}/ (.yml or .yaml), ` +
    'a step and a reusable workflow alike, quoted or not, is pinned to a ' +
    'full 40-character commit SHA; a local action (./) and a Docker image ' +
    '(docker://) are exempt, and a line inside a block scalar is not a key.',
  id: 'verify-workflow-pins',
  notCovered:
    'whether a SHA exists, is the commit its tag comment names, or comes ' +
    'from an owner worth trusting, which the gate cannot see offline; the ' +
    'action.yml of a composite action outside the workflows folder and the ' +
    'actions it calls; a uses: written in flow style ({ uses: ... }) or ' +
    'split over lines; the image tag a docker:// ref names; and the ' +
    'actions a pinned action runs in turn.',
  run: ({ workflows }) =>
    workflows.flatMap(({ path, text }) =>
      usesOf({ text }).flatMap(({ line, value }) =>
        judgeUse({ line, path, value })
      )
    )
})

export const collectContext = ({ root }) => {
  const directory = join(root, WORKFLOWS)
  if (!existsSync(directory)) return { workflows: [] }
  return {
    workflows: readdirSync(directory)
      .filter((name) => WORKFLOW_FILE.test(name))
      .sort()
      .map((name) => ({
        path: `${WORKFLOWS}/${name}`,
        text: readFileSync(join(directory, name), 'utf8')
      }))
  }
}

const readRoot = () => {
  const index = process.argv.indexOf(ROOT_FLAG)
  return index === NOT_FOUND
    ? resolve(HERE, '..')
    : resolve(process.argv[index + 1])
}

const main = () => {
  const context = collectContext({ root: readRoot() })
  const uses = context.workflows.reduce(
    (count, { text }) => count + usesOf({ text }).length,
    0
  )

  reportGate({
    context,
    denominator:
      `${uses} uses: line(s) across ${context.workflows.length} workflow ` +
      `file(s) under ${WORKFLOWS}`,
    gate
  })
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(HERE, 'verify-workflow-pins.mjs')
) {
  main()
}
