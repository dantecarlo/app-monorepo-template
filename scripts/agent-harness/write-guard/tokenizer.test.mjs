#!/usr/bin/env node
// ---------------------------------------------------------------------------
// tokenizer — the Bash reader: commands, operators, words and their parts,
// redirects, here-docs, substitutions, groups, and what it refuses to read.
// Built from the command shapes of Certifipago's enforce-agent-writes test.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/tokenizer.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { SAFE, UNKNOWN } from './scan.mjs'
import { createParser } from './tokenizer.mjs'

const parse = ({ source }) => createParser({ source }).parseAll()

// Every simple command of a script, substitutions and groups included, as
// the raw text of its words.
const commandsOf = ({ script }) =>
  script.flatMap((item) => {
    if (item.type === 'group') {
      return commandsOf({ script: item.script })
    }
    const nested = [
      ...item.words,
      ...item.redirects.flatMap((redirect) =>
        redirect.target ? [redirect.target] : []
      )
    ].flatMap((word) =>
      word.parts.flatMap((part) => [
        ...('sub' in part ? commandsOf({ script: part.sub }) : []),
        ...(part.subs ?? []).flatMap((sub) => commandsOf({ script: sub }))
      ])
    )
    return [item.words.map((word) => word.raw).join(' '), ...nested]
  })

const problemOf = ({ source }) => {
  try {
    parse({ source })
  } catch (error) {
    assert.equal(error.unreadable, true, error.message)
    return error
  }
  return assert.fail(`${source} was read`)
}

test('a redirect is read with its operator, its fd and its target', () => {
  const [command] = parse({ source: 'pnpm verify:maps 2> err.log' })
  assert.deepEqual(
    command.words.map((word) => word.raw),
    ['pnpm', 'verify:maps']
  )
  assert.equal(command.redirects[0].fd, '2')
  assert.equal(command.redirects[0].op, '>')
  assert.equal(command.redirects[0].target.raw, 'err.log')
})

for (const [source, op] of [
  ['echo x >> a.log', '>>'],
  ['echo x &> a.log', '&>'],
  ['echo x >| a.log', '>|'],
  ['echo x >& a.log', '&>']
]) {
  test(`a writing redirect is read as ${op}: ${source}`, () => {
    assert.equal(parse({ source })[0].redirects[0].op, op)
  })
}

test('a dup redirect names no file', () => {
  const [command] = parse({ source: 'pnpm verify:maps 2>&1 | tail -5' })
  assert.deepEqual(command.redirects, [{ fd: '2', op: 'dup' }])
  assert.equal(command.op, '|')
})

test('each item carries the operator that follows it', () => {
  const script = parse({ source: 'a | b && c || d; e & f' })
  assert.deepEqual(
    script.map((item) => item.op),
    ['|', '&&', '||', ';', '&', '']
  )
})

test('quotes and escapes join into one word whose parts say what was quoted', () => {
  const [command] = parse({ source: 'echo "C:\\work\\a b"x\'y\'' })
  const word = command.words[1]
  assert.deepEqual(
    word.parts.map((part) => [part.lit, part.quoted]),
    [
      ['C:\\work\\a b', true],
      ['x', false],
      ['y', true]
    ]
  )
})

test('a parameter is read with its operator and its alternative', () => {
  const [command] = parse({ source: 'echo ${TMPDIR:-/tmp}/a $X ${#Y}' })
  assert.deepEqual(command.words[1].parts[0], {
    alt: '/tmp',
    op: ':-',
    param: 'TMPDIR'
  })
  assert.deepEqual(command.words[2].parts[0], {
    alt: '',
    op: '',
    param: 'X'
  })
  assert.equal(command.words[3].parts[0].param, UNKNOWN)
})

test('substitutions, backticks and arithmetic keep the commands they run', () => {
  assert.deepEqual(
    commandsOf({
      script: parse({
        source: 'echo $(rm -rf src) `touch a` $(( 1 + $(touch b) ))'
      })
    }),
    [
      'echo $(rm -rf src) `touch a` $(( 1 + $(touch b) ))',
      'rm -rf src',
      'touch a',
      'touch b'
    ]
  )
})

test('arithmetic is a safe part', () => {
  const [command] = parse({ source: 'echo $(( 1 + 2 ))' })
  assert.equal(command.words[1].parts[0].safe, true)
  assert.equal(SAFE, '\u0001')
})

test('a here-doc body lands on its redirect, with whether it expands', () => {
  const [quoted] = parse({
    source: "cat > /tmp/p.mjs <<'EOF'\nconsole.log($X)\nEOF"
  })
  const heredoc = quoted.redirects.find((one) => one.heredoc).heredoc
  assert.deepEqual(heredoc, { body: 'console.log($X)', expand: false })
  const [open] = parse({ source: 'cat <<EOF\n$(touch a)\nEOF' })
  assert.equal(open.redirects[0].heredoc.expand, true)
})

test('a here-string is read as <<<', () => {
  const [command] = parse({ source: "node <<< 'console.log(1)'" })
  assert.equal(command.redirects[0].op, '<<<')
})

test('a group, a function and a process substitution are read', () => {
  assert.deepEqual(
    commandsOf({
      script: parse({ source: '(cd /tmp && touch x) && touch y' })
    }),
    ['cd /tmp', 'touch x', 'touch y']
  )
  assert.deepEqual(
    commandsOf({ script: parse({ source: 'f() { ls; }' }) }),
    ['', '{ ls', '}']
  )
  const [diff] = parse({ source: 'diff <(ls a) <(ls b)' })
  assert.equal(diff.words[1].parts[0].process, true)
})

test('an array assignment is one word', () => {
  const [command] = parse({ source: 'a=(1 2) echo' })
  assert.deepEqual(
    command.words.map((word) => word.raw),
    ['a=(1 2)', 'echo']
  )
})

test('a comment is skipped', () => {
  assert.deepEqual(
    commandsOf({ script: parse({ source: 'ls # > a.log\ntouch b' }) }),
    ['ls', 'touch b']
  )
})

for (const [source, problem] of [
  ['echo "unterminated', /an unterminated quote/],
  ['cat <<EOF\nno end', /an unterminated here-doc/],
  ['echo $(ls', /an unterminated \$\( or \(/],
  ['echo `ls', /an unterminated backtick/],
  ['echo ${X', /an unterminated \$\{/],
  ['echo $(( 1 + 2', /an unterminated \$\(\(/],
  ['ls apps/(group)/x.tsx', /an unexpected parenthesis/],
  ['ls )', /an unbalanced \)/],
  ['echo >', /a > with no target/]
]) {
  test(`what cannot be read throws, naming why: ${JSON.stringify(source)}`, () => {
    const error = problemOf({ source })
    assert.match(error.message, problem)
    assert.equal(error.deep, false)
  })
}

const FAR_PAST_THE_CAP = 3000

test('substitutions nested past the cap throw a deep error, at once', () => {
  const start = performance.now()
  const error = problemOf({
    source: `echo ${'$('.repeat(FAR_PAST_THE_CAP)}x${')'.repeat(FAR_PAST_THE_CAP)}`
  })
  assert.equal(error.deep, true)
  assert.match(error.message, /nested deeper than 32/)
  assert.ok(performance.now() - start < 500)
})

test('substitutions nested a few deep are read', () => {
  assert.equal(
    commandsOf({
      script: parse({ source: 'echo $(echo $(echo $(echo x)))' })
    }).length,
    4
  )
})

test('parseExpanding reads a here-doc body as a double-quoted word', () => {
  const parts = createParser({ source: 'a $(touch b) c' }).parseExpanding()
  assert.ok(parts.some((part) => 'sub' in part))
})
