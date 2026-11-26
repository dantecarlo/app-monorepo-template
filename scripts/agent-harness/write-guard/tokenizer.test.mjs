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
import { commandStart, createParser } from './tokenizer.mjs'

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
  assert.deepEqual(
    commandsOf({ script: parse({ source: 'function f () { ls; }' }) }),
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

// An array's elements are words, so its `)` is the one that closes it and
// a substitution inside it is a command the judges read.
test("an array's elements are words: a quoted ) stays inside, and a substitution is read", () => {
  const source = "a=(\"x\" ')' $(ls b) `ls c`) echo"
  const [command] = parse({ source })
  assert.deepEqual(
    command.words.map((word) => word.raw),
    ["a=(\"x\" ')' $(ls b) `ls c`)", 'echo']
  )
  assert.deepEqual(commandsOf({ script: parse({ source }) }), [
    "a=(\"x\" ')' $(ls b) `ls c`) echo",
    'ls b',
    'ls c'
  ])
})

test('an array spans lines and skips its comments', () => {
  const [command] = parse({ source: 'a=(\n  one # the first )\n  two\n) echo' })
  assert.deepEqual(
    command.words.map((word) => word.raw),
    ['a=(\n  one # the first )\n  two\n)', 'echo']
  )
})

test('a comment is skipped', () => {
  assert.deepEqual(
    commandsOf({ script: parse({ source: 'ls # > a.log\ntouch b' }) }),
    ['ls', 'touch b']
  )
})

// bashRefuses marks the errors bash raises on a lone line too, so nothing
// on that line runs: an unterminated quote or backtick and an unbalanced
// `)`. Bash runs a here-doc that never ends, to the end of its input.
for (const [source, problem, bashRefuses] of [
  ['echo "unterminated', /an unterminated quote/, true],
  ["echo 'unterminated", /an unterminated quote/, true],
  ["echo $'unterminated", /an unterminated quote/, true],
  ['cat <<EOF\nno end', /an unterminated here-doc/, false],
  ['echo $(ls', /an unterminated \$\( or \(/, false],
  ['echo `ls', /an unterminated backtick/, true],
  ['echo ${X', /an unterminated \$\{/, false],
  ['echo $(( 1 + 2', /an unterminated \$\(\(/, false],
  ['ls apps/(group)/x.tsx', /an unexpected parenthesis/, false],
  ['ls )', /an unbalanced \)/, true],
  ['echo >', /a > with no target/, false],
  ['rm !(keep', /an unterminated extended glob/, false],
  ['[[ $x =~ (a ]]', /an unterminated regex/, false],
  ['a=( x', /an unterminated array/, false],
  ['a=( x; y )', /an unexpected ; in an array/, false],
  ['ls @("a)|b)', /an unterminated quote in an extended glob/, false]
]) {
  test(`what cannot be read throws, naming why: ${JSON.stringify(source)}`, () => {
    const error = problemOf({ source })
    assert.match(error.message, problem)
    assert.equal(error.deep, false)
    assert.equal(error.bashRefuses, bashRefuses)
  })
}

// `((…))` and `for ((…;…;…))` are arithmetic, whose substitutions still
// run; `((cmd); cmd)`, whose `((` closes no `))`, is two subshells.
for (const [source, commands] of [
  ['(( i++ ))', []],
  ['(( x > 5 )) && touch a', ['touch a']],
  ['for ((i=0;i<3;i++)); do touch x$i; done', ['do touch x$i', 'done']],
  ['if (( $(touch a) > 1 )); then ls; fi', ['touch a', 'then ls', 'fi']],
  ['((echo a); echo b)', ['echo a', 'echo b']],
  ['echo $(( (1 + 2) * 3 ))', ['echo $(( (1 + 2) * 3 ))']]
]) {
  test(`an arithmetic command is read: ${source}`, () => {
    assert.deepEqual(commandsOf({ script: parse({ source }) }), commands)
  })
}

test('an arithmetic command writes no file: its > compares', () => {
  const [group] = parse({ source: '(( x > 5 ))' })
  assert.equal(group.type, 'group')
  assert.deepEqual(group.redirects, [])
})

// `[[ … ]]` holds a condition: its `&&`, `||`, `(`, `)`, `<` and `>` are
// operators, and the word after `=~` a regex whose parentheses, `|` and
// spaces inside parentheses are its own.
for (const [source, commands] of [
  ['[[ a < b && c > d ]]', ['[[ a < b && c > d ]]']],
  ['[[ ( -f a ) || -d b ]] && touch c', ['[[ ( -f a ) || -d b ]]', 'touch c']],
  [
    '[[ $b =~ ^(main|master)$ ]] && touch y',
    ['[[ $b =~ ^(main|master)$ ]]', 'touch y']
  ],
  ['[[ "a b" =~ (a b) ]]', ['[[ "a b" =~ (a b) ]]']],
  ['[[ $(touch a) == b ]]', ['[[ $(touch a) == b ]]', 'touch a']],
  ['[[ x == @(a|b) ]] || ls', ['[[ x == @(a|b) ]]', 'ls']]
]) {
  test(`a [[ condition is one command: ${source}`, () => {
    const script = parse({ source })
    assert.deepEqual(commandsOf({ script }), commands)
    assert.deepEqual(script[0].redirects, [])
  })
}

// An extended glob, `!( @( *( +( ?(`, is part of its word.
for (const [source, words] of [
  ['rm -rf !(keep)', ['rm', '-rf', '!(keep)']],
  ['ls *.@(js|ts) +(a) ?(b) *(c)', ['ls', '*.@(js|ts)', '+(a)', '?(b)', '*(c)']],
  ['ls !(a|!(b))', ['ls', '!(a|!(b))']]
]) {
  test(`an extended glob is one word: ${source}`, () => {
    const [command] = parse({ source })
    assert.deepEqual(
      command.words.map((word) => word.raw),
      words
    )
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

for (const [source, start] of [
  ['git status', 'git status'],
  ['! time -p git status', 'git status'],
  ['if true', 'true'],
  ['{ rm -rf x', 'rm -rf x'],
  ['function clean { git clean -fdx', 'git clean -fdx'],
  ['function clean', ''],
  ['coproc rm -rf x', 'rm -rf x'],
  ['coproc worker { git push -f', 'git push -f']
]) {
  test(`a command's own words start past its keywords: ${source}`, () => {
    const [command] = parse({ source })
    assert.equal(
      command.words
        .slice(commandStart({ words: command.words }))
        .map((word) => word.raw)
        .join(' '),
      start
    )
  })
}
