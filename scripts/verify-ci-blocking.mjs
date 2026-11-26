#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-ci-blocking — no CI job or step lets its failure pass.
//
// `continue-on-error` marks a job or a step whose failure GitHub Actions
// reports and then ignores: the check it is runs, and skips. The LAW "A
// check is never forced or skipped" (AGENTS.md) forbids it, so the gate
// refuses the key in every workflow under .github/workflows/, a job's or a
// step's, its value `true` or an expression, and in every fenced yaml or
// yml block of a doc under docs/, since a project copies a workflow from
// the doc that shows it. `continue-on-error: false` lets nothing through,
// and passes. A line inside a block scalar (`run: |`) is text, not a key.
//
// Usage:
//   node scripts/verify-ci-blocking.mjs [--root <directory>]
// ---------------------------------------------------------------------------

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
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
const DOCS = 'docs'
const DOC_FILE = /\.md$/u
// A fence that opens a yaml block (```yaml, ~~~yml), and any fence.
const YAML_FENCE = /^\s*(?<fence>```|~~~)\s*ya?ml\b/iu
const FENCE = /^\s*(?<fence>```|~~~)/u
const KEY = /^\s*(?:-\s+)?(?<quote>["']?)continue-on-error\k<quote>\s*:(?<value>.*)$/u
const COMMENT = /(?:^|\s+)#.*$/u
const QUOTED = /^(?<quote>["'])(?<inner>.*)\k<quote>$/u
const OFF = 'false'
const BLOCK_SCALAR = /:\s*[|>][-+\d]*$/u
const INDENT = /^\s*/u
const KEY_START = /^\s*(?:-\s+)?/u

const indentOf = ({ line }) => line.match(INDENT)[0].length

const keyColumnOf = ({ line }) => line.match(KEY_START)[0].length

const withoutComment = ({ text }) => text.replace(COMMENT, '').trim()

const valueOf = ({ raw }) => {
  const text = withoutComment({ text: raw })
  return text.match(QUOTED)?.groups.inner ?? text
}

const opensBlock = ({ line }) => {
  const content = withoutComment({ text: line })
  return content !== '' && BLOCK_SCALAR.test(content)
}

// Every `continue-on-error` key of yaml `lines`, numbered from `first`,
// skipping the text of a block scalar.
const keysOf = ({ first, lines }) => {
  const found = []
  let blockIndent = null
  lines.forEach((line, index) => {
    if (blockIndent !== null) {
      if (line.trim() === '' || indentOf({ line }) > blockIndent) return
      blockIndent = null
    }
    if (opensBlock({ line })) blockIndent = keyColumnOf({ line })
    const match = line.match(KEY)
    if (match) {
      found.push({
        line: first + index,
        value: valueOf({ raw: match.groups.value })
      })
    }
  })
  return found
}

/**
 * The yaml lines of a markdown `text`: each fenced yaml block, its lines
 * and the number of its first.
 */
export const yamlBlocksOf = ({ text }) => {
  const blocks = []
  let open = null
  text.split(LINE_BREAK).forEach((line, index) => {
    if (open === null) {
      const fence = YAML_FENCE.exec(line)
      if (fence !== null) {
        open = { fence: fence.groups.fence, first: index + 2, lines: [] }
      }
      return
    }
    if (FENCE.exec(line)?.groups.fence === open.fence) {
      blocks.push(open)
      open = null
      return
    }
    open.lines.push(line)
  })
  // A fence never closed runs to the end of the doc, as Markdown reads it.
  return open === null ? blocks : [...blocks, open]
}

const findingsOf = ({ keys, path }) =>
  keys
    .filter(({ value }) => value !== OFF)
    .map(({ line, value }) => ({
      detail:
        `${path}:${line}: continue-on-error: ${value} lets a failing job or ` +
        'step pass, which skips the check it is',
      line,
      path
    }))

export const gate = defineGate({
  claims:
    `no workflow under ${WORKFLOWS}/ (.yml or .yaml) and no fenced yaml or ` +
    `yml block of a doc under ${DOCS}/ carries a continue-on-error key, a ` +
    "job's or a step's, quoted or not, whose value is anything but false; " +
    'a line inside a block scalar (| or >) is not a key.',
  id: 'verify-ci-blocking',
  notCovered:
    'a continue-on-error written in flow style ({ continue-on-error: true }); ' +
    'a workflow a doc shows outside a fenced yaml block, or in a file ' +
    `outside ${DOCS}/; an expression that is always false; and the other ` +
    'ways a job lets a failure pass, such as `|| true` in a run script or ' +
    'an `if: always()` that reports success.',
  run: ({ docs, workflows }) => [
    ...workflows.flatMap(({ path, text }) =>
      findingsOf({
        keys: keysOf({ first: FIRST_LINE, lines: text.split(LINE_BREAK) }),
        path
      })
    ),
    ...docs.flatMap(({ path, text }) =>
      yamlBlocksOf({ text }).flatMap(({ first, lines }) =>
        findingsOf({ keys: keysOf({ first, lines }), path })
      )
    )
  ]
})

const walkDocs = ({ directory, root }) =>
  readdirSync(join(root, directory))
    .sort()
    .flatMap((name) => {
      const path = `${directory}/${name}`
      if (statSync(join(root, path)).isDirectory()) {
        return walkDocs({ directory: path, root })
      }
      return DOC_FILE.test(name) ? [path] : []
    })

export const collectContext = ({ root }) => {
  const workflows = join(root, WORKFLOWS)
  return {
    docs: existsSync(join(root, DOCS))
      ? walkDocs({ directory: DOCS, root }).map((path) => ({
          path,
          text: readFileSync(join(root, path), 'utf8')
        }))
      : [],
    workflows: existsSync(workflows)
      ? readdirSync(workflows)
          .filter((name) => WORKFLOW_FILE.test(name))
          .sort()
          .map((name) => ({
            path: `${WORKFLOWS}/${name}`,
            text: readFileSync(join(workflows, name), 'utf8')
          }))
      : []
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
  const blocks = context.docs.reduce(
    (count, { text }) => count + yamlBlocksOf({ text }).length,
    0
  )
  reportGate({
    context,
    denominator:
      `${context.workflows.length} workflow file(s) under ${WORKFLOWS} and ` +
      `${blocks} fenced yaml block(s) across ${context.docs.length} doc(s) ` +
      `under ${DOCS}`,
    gate
  })
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(HERE, 'verify-ci-blocking.mjs')
) {
  main()
}
