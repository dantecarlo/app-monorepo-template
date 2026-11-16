#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-theme-sync — every generated token output equals its regeneration.
//
// packages/tokens/scripts/generate.mjs writes the web theme (theme.css), the
// NativeWind preset (tailwind-preset.cjs), the mobile theme variables
// (src/themeVars.constant.ts) and the theme names the web's tailwind-merge
// reads (src/themeNames.constant.ts) from
// packages/tokens/src/tokens.constant.ts alone (decision 59). This gate renders them again in memory from the
// source and compares each with the committed file, so a hand edit of an
// output, a source change nobody regenerated, or a generator change whose
// outputs were not rewritten, each fails, naming the file and its first
// differing line.
//
// The comparison ignores line endings: with core.autocrlf a Windows checkout
// holds the committed files as CRLF while the generator writes LF.
//
// Usage:
//   node scripts/verify-theme-sync.mjs [--root <dir>]
// ---------------------------------------------------------------------------

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import {
  GENERATE_COMMAND,
  loadTokens,
  OUTPUTS,
  renderOutputs,
  SOURCE
} from '../packages/tokens/scripts/generate.mjs'
import { defineGate, reportGate } from './gate/gate.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')
const PACKAGE = 'packages/tokens'
const END_OF_FILE = '<end of file>'

// The token source and every generated output, repository-relative.
export const SOURCES = Object.freeze({
  ...Object.fromEntries(
    Object.entries(OUTPUTS).map(([id, path]) => [id, `${PACKAGE}/${path}`])
  ),
  tokens: `${PACKAGE}/${SOURCE}`
})

const normalize = (text) => text.replace(/\r\n/gu, '\n')

export const collectContext = ({ root }) => {
  const packageDir = join(root, PACKAGE)
  let rendered
  try {
    rendered = renderOutputs({ tokens: loadTokens({ packageDir }) })
  } catch (error) {
    return {
      error: `${SOURCES.tokens}: the generator cannot render it (${error.message.split('\n')[0]})`,
      outputs: []
    }
  }
  return {
    outputs: rendered.map(({ content, path }) => {
      const file = join(packageDir, path)
      return {
        committed: existsSync(file)
          ? normalize(readFileSync(file, 'utf8'))
          : null,
        expected: content,
        path: `${PACKAGE}/${path}`
      }
    })
  }
}

// The first line where the committed file leaves its regeneration.
const firstDifference = ({ committed, expected }) => {
  const found = committed.split('\n')
  const wanted = expected.split('\n')
  const length = Math.max(found.length, wanted.length)
  const index = Array.from({ length }, (_, at) => at).find(
    (at) => found[at] !== wanted[at]
  )
  return {
    found: found[index] ?? END_OF_FILE,
    line: index + 1,
    wanted: wanted[index] ?? END_OF_FILE
  }
}

const compareOutput = ({ committed, expected, path }) => {
  if (committed === null) {
    return [`missing: ${path} is not there; run \`${GENERATE_COMMAND}\``]
  }
  if (committed === expected) return []
  const { found, line, wanted } = firstDifference({ committed, expected })
  return [
    `drift: ${path} differs from its regeneration at line ${line}: ` +
      `expected ${JSON.stringify(wanted)}, found ${JSON.stringify(found)}; ` +
      `run \`${GENERATE_COMMAND}\``
  ]
}

export const gate = defineGate({
  claims:
    'every generated token output (the web theme, the NativeWind preset, ' +
    'the mobile theme variables and the theme names) equals what ' +
    'packages/tokens/scripts/generate.mjs writes from tokens.constant.ts.',
  id: 'verify-theme-sync',
  notCovered:
    'whether a token value is the right one, which only review judges; ' +
    'the rules apps/web/src/app/globals.css still writes by hand, which ' +
    'apps/web/src/app/__tests__/globals.test.ts reads; and whether a ' +
    'consumer loads the output it needs.',
  run: ({ error, outputs }) =>
    error ? [error] : outputs.flatMap(compareOutput)
})

const main = () => {
  const { values } = parseArgs({
    options: { root: { default: REPO_ROOT, type: 'string' } }
  })
  reportGate({
    context: collectContext({ root: resolve(values.root) }),
    denominator:
      `${Object.keys(OUTPUTS).length} generated output(s) regenerated ` +
      `from ${SOURCES.tokens}`,
    gate
  })
}

if (import.meta.main) main()
