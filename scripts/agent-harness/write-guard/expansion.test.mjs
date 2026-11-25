#!/usr/bin/env node
// ---------------------------------------------------------------------------
// expansion — what a word expands to as far as a path can need it: a
// variable set earlier in the same command, the scratch and home variables,
// the substitutions whose output is known, and the argument helpers the
// writers read options with. The host is synthetic.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/expansion.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  clusters,
  expand,
  known,
  literal,
  operandsOf,
  optionValue,
  parseOptions,
  splitArgs
} from './expansion.mjs'
import { SAFE, UNKNOWN } from './scan.mjs'
import { createParser } from './tokenizer.mjs'

const SCRATCH = 'C:\\Users\\me\\AppData\\Local\\Temp'
const HOME = 'C:\\Users\\me'
const ROOT = 'c:/work/repo'

const stateFor = ({ cwd = ROOT, vars = new Map() } = {}) => ({
  cwd,
  host: { homeDir: HOME, scratchRoots: [SCRATCH, '/tmp'], windows: true },
  rootOf: () => ROOT,
  vars
})

// The word `text` as the tokenizer reads it.
const wordOf = ({ text }) =>
  createParser({ source: `echo ${text}` }).parseAll()[0].words[1]

const expanded = ({ state = stateFor(), text }) =>
  expand({ state, word: wordOf({ text }) })

for (const [text, value] of [
  ['notes.log', 'notes.log'],
  ['"a b"/c', 'a b/c'],
  ['$TEMP/a.log', `${SCRATCH}/a.log`],
  ['${TMPDIR}/a.log', `${SCRATCH}/a.log`],
  ['$TMP/a', `${SCRATCH}/a`],
  ['$HOME/.claude/settings.json', `${HOME}/.claude/settings.json`],
  ['~/.claude/settings.json', `${HOME}/.claude/settings.json`],
  ['$PWD/a', `${ROOT}/a`],
  ['/tmp/$$.log', `/tmp/${SAFE}.log`],
  ['/tmp/$RANDOM', `/tmp/${SAFE}`],
  ['${X:-/tmp/x}', '/tmp/x'],
  ['$(( 1 + 2 ))', SAFE],
  ['<(ls)', '/dev/fd/63'],
  ['$(mktemp -d)', `${SCRATCH}/${SAFE}`],
  ['$(mktemp -d -p .)', `./${SAFE}`],
  ['$(mktemp /tmp/aXXXX)', `/tmp/a${SAFE}`],
  ['$(pwd)/a', `${ROOT}/a`],
  ['$(git rev-parse --show-toplevel)/out.log', `${ROOT}/out.log`],
  ['$(dirname a/b/c)', 'a/b'],
  ['$(realpath a/b)', 'a/b'],
  ['$(echo a b)', 'a b'],
  ['$(date +%s)', SAFE],
  ['$(ls; ls)', SAFE]
]) {
  test(`a word expands as a path needs it: ${text}`, () => {
    const found = expanded({ text })
    assert.equal(found.text, value)
    assert.deepEqual(found.unknown, [])
  })
}

for (const [text, names] of [
  ['$X/log', ['$X']],
  ['${X:-$Y}', ['${X}']],
  ['${X#a}', ['${X#…}']],
  // A braced form the tokenizer cannot read is named by its placeholder.
  ['${!a}', [`\${${UNKNOWN}?…}`]]
]) {
  test(`a word that depends on an unset variable is unknown: ${text}`, () => {
    const found = expanded({ text })
    assert.ok(found.text.includes(UNKNOWN))
    assert.deepEqual(found.unknown, names)
  })
}

test('a variable set earlier in the command expands to its value', () => {
  const vars = new Map([['S', known({ text: '/tmp/v1' })]])
  assert.equal(
    expanded({ state: stateFor({ vars }), text: '$S/log' }).text,
    '/tmp/v1/log'
  )
})

test('$PWD after a cd the guard cannot follow is unknown', () => {
  assert.deepEqual(
    expanded({ state: stateFor({ cwd: null }), text: '$PWD/a' }).unknown,
    ['$PWD']
  )
})

test('the raw text of a word is kept for the reason', () => {
  assert.equal(expanded({ text: '"$S/a"' }).raw, '"$S/a"')
})

// -- the argument helpers ----------------------------------------------------
const args = ({ texts }) => texts.map((text) => literal({ text }))

test('splitArgs splits options from operands, and -- ends the options', () => {
  const { operands, options } = splitArgs({
    args: args({ texts: ['-m', '644', '--mode=7', 'a', '--', '-b'] }),
    valued: ['-m']
  })
  assert.deepEqual(
    operands.map(({ text }) => text),
    ['a', '-b']
  )
  assert.deepEqual(
    options.map(({ flag, value }) => [flag, value?.text]),
    [
      ['-m', '644'],
      ['--mode', '7']
    ]
  )
  assert.equal(optionValue({ flags: ['--mode'], options }).text, '7')
})

test('operandsOf keeps the operands only', () => {
  assert.deepEqual(
    operandsOf({ args: args({ texts: ['-rf', 'dist', 'out'] }) }).map(
      ({ text }) => text
    ),
    ['dist', 'out']
  )
})

test('clusters reads each letter of a short-option bundle and the value one takes', () => {
  assert.deepEqual(
    clusters({
      args: args({ texts: ['-sSLo', 'out', '-Dh'] }),
      valued: ['o', 'D']
    }).map(({ letter, value }) => [letter, value?.text]),
    [
      ['s', undefined],
      ['S', undefined],
      ['L', undefined],
      ['o', 'out'],
      ['D', 'h']
    ]
  )
})

// -- globs, NUL bytes and brace overflow ---------------------------------------
for (const [text, pattern] of [
  ['*.md', '*.md'],
  ['scripts/*.mjs', 'scripts/*.mjs'],
  ['AGENT?.md', 'AGENT?.md'],
  ['"a b"/*.md', 'a b/*.md']
]) {
  test(`an unquoted wildcard makes a word a glob: ${text}`, () => {
    assert.equal(expanded({ text }).glob?.pattern, pattern)
  })
}

for (const text of ["'*.md'", '"*.md"', 'a\\*', 'plain.md']) {
  test(`a quoted or escaped wildcard, or none, makes no glob: ${text}`, () => {
    assert.equal(expanded({ text }).glob, undefined)
  })
}

test('a quoted wildcard beside an unquoted one is escaped in the pattern', () => {
  assert.equal(expanded({ text: '"*"*' }).glob.pattern, '\\**')
})

test('a word ends at its first NUL, as Bash reads it', () => {
  assert.equal(
    expand({
      state: stateFor(),
      word: {
        parts: [{ lit: 'AGENTS.md\u0000.txt', quoted: false }],
        raw: 'x'
      }
    }).text,
    'AGENTS.md'
  )
})

test('a brace expansion past its bound is unknown, by what it is', () => {
  const found = expand({
    state: stateFor(),
    word: { parts: [{ overflow: true }], raw: '{1..9999}' }
  })
  assert.ok(found.text.includes(UNKNOWN))
  assert.match(found.unknown[0], /brace expansion/)
})

// -- options, clustered and long ------------------------------------------------
for (const [texts, value, operands] of [
  [['-qO', 'out.json', 'url'], 'out.json', ['url']],
  [['-qOout.json', 'url'], 'out.json', ['url']],
  [['-fsSLo', 'out.json', 'url'], 'out.json', ['url']],
  [['--output', 'out.json', 'url'], 'out.json', ['url']],
  [['--output=out.json', 'url'], 'out.json', ['url']],
  [['-q', 'url', '--', '-x'], undefined, ['url', '-x']]
]) {
  test(`parseOptions reads a value from a cluster or a long option: ${texts.join(' ')}`, () => {
    const parsed = parseOptions({
      args: args({ texts }),
      long: ['--output'],
      short: 'oO'
    })
    assert.equal(
      parsed.value({ long: '--output', short: ['o', 'O'] })?.text,
      value
    )
    assert.deepEqual(
      parsed.operands.map(({ text }) => text),
      operands
    )
  })
}

test('parseOptions says which flags a call holds', () => {
  const parsed = parseOptions({
    args: args({ texts: ['-sSLO', '--remote-name-all', 'u'] }),
    long: [],
    short: ''
  })
  assert.equal(parsed.has({ long: ['--remote-name-all'] }), true)
  assert.equal(parsed.has({ short: ['O'] }), true)
  assert.equal(parsed.has({ short: ['o'] }), false)
})
