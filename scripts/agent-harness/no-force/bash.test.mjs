#!/usr/bin/env node
// ---------------------------------------------------------------------------
// bash — the force or skip a Bash command passes, read by bash.mjs with the
// write guard's tokenizer and judged by command.mjs: every simple command
// of a list, a pipeline, a group, a function body, a compound command and
// a substitution; every whole line Bash runs before one it cannot parse;
// a failure swallowed by `|| true`; and the command a wrapper runs (`eval`,
// `sh -c`, `coproc`, `pwsh -c`, `find -exec`, `xargs`, a here-doc fed to a
// shell). A multi-word quoted span, a here-doc's body and the words of
// `echo` are text.
//
// Usage:
//   node --test scripts/agent-harness/no-force/bash.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import { bashScript, PARSE_BUDGET } from './bash.mjs'
import { bashForce } from './command.mjs'

for (const [command, option, program] of [
  ['git push "--force"', '--force', 'git push'],
  ["git push '-f' origin main", '-f', 'git push'],
  ['git status && git push -f', '-f', 'git push'],
  ['git status; git clean -fd', '-fd', 'git clean'],
  ['git log | git push -f', '-f', 'git push'],
  ['( git branch -D old )', '-D', 'git branch'],
  ['{ git checkout -B main; }', '-B', 'git checkout'],
  ['if true; then git push -f; fi', '-f', 'git push'],
  ['for b in a c; do git branch -D "$b"; done', '-D', 'git branch'],
  ['case "$x" in a) git tag -f v1 ;; esac', '-f', 'git tag'],
  ['clean() { git clean -fdx; }', '-fdx', 'git clean'],
  ['GIT_TRACE=1 git push -f', '-f', 'git push'],
  ['time -p git push -f', '-f', 'git push'],
  ['echo "$(git push --force)"', '--force', 'git push'],
  ['echo `git push -f`', '-f', 'git push'],
  ['diff <(git push -f) b', '-f', 'git push'],
  ['git \\\n  push \\\n  --force', '--force', 'git push'],
  ['taskkill //F //PID 4', '//F', 'taskkill'],
  ['rm -rf dist && cp -f a b', '-rf', 'rm'],
  ["HUSKY=0 git commit -m 'a b'", 'HUSKY=0', 'git commit'],
  ['export HUSKY=0 && git commit -m x', 'HUSKY=0', 'export'],
  ['git commit --no-verify -m "a b"', '--no-verify', 'git commit'],
  // Bash runs every whole line before the one it cannot parse.
  ["git push --force origin x\necho 'it's pushed'", '--force', 'git push'],
  ["rm -rf dist\necho 'build dir didn't exist'", '-rf', 'rm'],
  ["echo a\n\ngit clean -fdx\necho 'x", '-fdx', 'git clean'],
  // A function body, in every form Bash reads one.
  ['function clean { git clean -fdx; }', '-fdx', 'git clean'],
  ['function f { rm -rf x; }; f', '-rf', 'rm'],
  ['function cleanup { rm -rf "$1"; }\ncleanup dist', '-rf', 'rm'],
  ['function f() { git push -f; }', '-f', 'git push'],
  ['function f\n{ git push -f; }', '-f', 'git push'],
  // A failure swallowed by `|| true` or `|| :`.
  ['npm test || true', '|| true', 'npm'],
  ['pnpm lint || :', '|| :', 'pnpm'],
  ['git push origin main || /bin/true', '|| /bin/true', 'git push'],
  ['{ pnpm test || true; }', '|| true', 'pnpm'],
  // A wrapper that runs a command of its own.
  ['eval rm -rf x', '-rf', 'rm'],
  ["eval 'git push --force'", '--force', 'git push'],
  ["sh -c 'git push --force'", '--force', 'git push'],
  ["dash -c 'rm -rf x'", '-rf', 'rm'],
  ["zsh -c 'git clean -fdx'", '-fdx', 'git clean'],
  ["bash -lc 'git branch -D old'", '-D', 'git branch'],
  ['sudo sh -c "rm -rf x"', '-rf', 'rm'],
  ['coproc rm -rf x', '-rf', 'rm'],
  ['coproc worker { git push -f; }', '-f', 'git push'],
  [
    'powershell -Command "Remove-Item -Recurse -Force dist"',
    '-Force',
    'remove-item'
  ],
  ["pwsh -c 'git push -f'", '-f', 'git push'],
  ['pwsh -NoProfile -Command git push --force', '--force', 'git push'],
  ['find . -exec rm -rf {} +', '-rf', 'rm'],
  ['find . -name x -execdir git rm -f {} \\;', '-f', 'git rm'],
  ['find . -name x | xargs rm -rf', '-rf', 'rm'],
  ['ls | xargs -I {} git branch -D {}', '-D', 'git branch'],
  ["cat <<'EOF' | sh\ngit push --force\nEOF", '--force', 'git push'],
  ['bash <<EOF\nrm -rf dist\nEOF', '-rf', 'rm'],
  ['sh -c "eval \'git push -f\'"', '-f', 'git push'],
  // A long option git reads by its unambiguous prefix.
  ['git commit --no-verif -m x', '--no-verif', 'git commit'],
  ['git push --forc', '--forc', 'git push'],
  // A setting that moves the git hooks away.
  [
    'git -c core.hooksPath=/dev/null commit -m x',
    '-c core.hooksPath=/dev/null',
    'git commit'
  ],
  ['git config core.hooksPath /dev/null', 'core.hooksPath', 'git config'],
  // Single lines bash runs that the reader once could not parse.
  ['for ((i=0;i<3;i++)); do rm -rf x$i; done', '-rf', 'rm'],
  ['[[ $b =~ ^(main|master)$ ]] && git push --force', '--force', 'git push'],
  ['[[ x == @(a|b) ]] && rm -rf x', '-rf', 'rm'],
  ['shopt -s extglob\nrm -rf !(keep)', '-rf', 'rm'],
  ['(( n > 0 )) && git push -f', '-f', 'git push'],
  ['if (( 2 > 1 )); then git clean -fdx; fi', '-fdx', 'git clean'],
  ['(( $(git push --force) ))', '--force', 'git push'],
  ['((git push -f); echo b)', '-f', 'git push'],
  ['[[ ( -n a ) && -z "" ]] && git push -f', '-f', 'git push'],
  ['[[ "a b" =~ (a b) ]] || git branch -D old', '-D', 'git branch'],
  ['rm -rf *.@(js|ts)', '-rf', 'rm'],
  // An array's elements are words: a quote or a substitution in one counts,
  // and the `)` that closes it is the real one.
  ['files=( $(git ls-files) ); rm -rf x', '-rf', 'rm'],
  ['local a=( $(ls) ); git push --force', '--force', 'git push'],
  ['a=( "$(ls)" ); rm -rf x', '-rf', 'rm'],
  ['a=( $((1+2)) ); rm -rf x', '-rf', 'rm'],
  ['declare -A m=( [k]="$(date)" ); rm -rf x', '-rf', 'rm'],
  ["a=(\"x\" ')'); rm -rf x", '-rf', 'rm'],
  ['a=( $(git push --force) )', '--force', 'git push'],
  ['a=( `git push -f` )', '-f', 'git push'],
  // A quoted `)` inside an extended glob does not close it.
  ['[[ $x == @("a)"|b) ]] && rm -rf x', '-rf', 'rm'],
  // A trap's text runs later, as a command of its own.
  ["trap 'rm -rf x' EXIT", '-rf', 'rm'],
  ['trap "git push --force" INT TERM', '--force', 'git push'],
  // A failure swallowed by an exit that reports success.
  ['pnpm lint || exit 0', '|| exit 0', 'pnpm'],
  ['npm test || return 0', '|| return 0', 'npm']
]) {
  test(`\`${command}\` passes a force option`, () => {
    assert.deepEqual(bashForce({ command }), { option, program })
  })
}

for (const command of [
  'git commit -m "never use --force here"',
  "git commit -m 'git push -f is refused'",
  'git commit -m "$(cat <<\'EOF\'\nfix: no --force\nEOF\n)"',
  'cat <<EOF > notes.txt\ngit push --force\nEOF',
  'echo --force',
  'printf "%s\\n" --force',
  'grep -rn -- --force docs',
  'rg -n "git push --force" scripts',
  'git commit -m "$(cat <<\'EOF\'\nnever --no-verify or HUSKY=0\nEOF\n)"',
  'rm -r dist && cp -f a b',
  'docker rm -f web',
  'git push origin main',
  // Bash refuses a line it cannot parse whole, so nothing on it runs.
  'git push "unterminated',
  'git push --force "unterminated',
  'echo ok\ngit push --force "unterminated',
  // A failure handled, not swallowed.
  'npm test || echo failed',
  'npm test || exit 1',
  'true',
  'npm test && true',
  // Text, not an option.
  'git diff --stat HUSKY=0',
  "git grep -n -e '--force'",
  "git grep -- '--no-verify'",
  'git log --format=%h --follow a.txt',
  'git log -- a.txt --force',
  'tool -- --force',
  "sh -c 'echo --force'",
  "find . -name '*--force*' -print",
  'xargs echo --force',
  // git's dry run and the reads of a hooks setting.
  'git push -n origin main',
  'git config --get core.hooksPath',
  'git config core.hooksPath',
  'git config get core.hooksPath',
  'git config --list',
  'git config user.name x',
  // The same constructs, with nothing forced.
  'for ((i=0;i<3;i++)); do echo $i; done',
  '[[ $b =~ ^(main|master)$ ]] && echo ok',
  'shopt -s extglob\nls !(keep)',
  '((echo a); echo b)',
  '[[ $1 == --force ]] && echo forced',
  'test "$1" = --force',
  "trap '' INT",
  'trap - EXIT',
  'npm test || exit',
  'a=( $(git ls-files) ); echo x',
  "a=(\"x\" ')' 'y z'); echo \"${a[@]}\"",
  'a=(\n  one # the first\n  two\n); echo "${a[1]}"',
  '[[ $x == @("a)"|b) ]] && echo y'
]) {
  test(`\`${command}\` passes no force option`, () => {
    assert.equal(bashForce({ command }), undefined)
  })
}

// The raw words of each simple command of a script, as one string each.
const commandsOf = ({ script }) =>
  script.map((item) => item.words.map(({ raw }) => raw).join(' '))

test('a command that parses is its own script', () => {
  const read = bashScript({ command: 'a; b' })
  assert.deepEqual(commandsOf({ script: read.script }), ['a', 'b'])
})

test('past a line bash cannot parse, the script is the longest prefix of whole lines that parses', () => {
  const read = bashScript({ command: 'a\nb "x\ny"\nc "z' })
  assert.deepEqual(commandsOf({ script: read.script }), ['a', 'b "x\ny"'])
})

// The reader errors bash raises on a lone line too, so nothing on it runs.
for (const command of ['a "x', 'git push --force `x', 'git push -f )']) {
  test(`one line bash refuses too leaves no script: ${command}`, () => {
    assert.deepEqual(bashScript({ command }), { script: [] })
  })
}

// Every other reader error is one bash may not raise: unreadable, which the
// hook refuses. Bash runs a here-doc that never ends, to the end of input.
for (const [command, problem] of [
  ['git push --force <<EOF', /an unterminated here-doc/u],
  ['ls apps/(group)/x.tsx', /an unexpected parenthesis/u],
  ['echo $(ls', /an unterminated \$\( or \(/u],
  ['rm -rf dist\ncase x in a', /a case/u],
  ['echo >', /with no target/u]
]) {
  test(`a reader error bash may not raise is unreadable: ${JSON.stringify(command)}`, () => {
    const read = bashScript({ command })
    assert.equal(read.script, undefined)
    assert.match(read.unreadable ?? '', problem)
  })
}

test("nesting past the tokenizer's cap is unreadable", () => {
  const read = bashScript({
    command: `echo ${'$('.repeat(40)}x${')'.repeat(40)}`
  })
  assert.equal(read.script, undefined)
  assert.match(read.unreadable, /nested deeper than/u)
})

test('a command whose prefixes cost more than the budget to try is unreadable, in well under the timeout', () => {
  const tail = Array.from({ length: 5000 }, (_, at) => `echo line ${at}`)
  const command = ['echo a', 'echo "x', ...tail].join('\n')
  assert.ok(command.length ** 2 / 2 > PARSE_BUDGET)
  const started = Date.now()
  const read = bashScript({ command })
  assert.match(read.unreadable ?? '', /too long to read/u)
  assert.ok(Date.now() - started < 3000, `took ${Date.now() - started} ms`)
})

test('a long command cut by its last line is read up to that line', () => {
  const head = Array.from({ length: 5000 }, (_, at) => `echo line ${at}`)
  const read = bashScript({
    command: [...head, 'git push -f', 'echo "x'].join('\n')
  })
  assert.equal(read.script.length, 5001)
  assert.deepEqual(
    bashForce({ command: [...head, 'git push -f', 'echo "x'].join('\n') }),
    { option: '-f', program: 'git push' }
  )
})

test("husky's own prepare script is no agent command: pnpm runs it, and it spawns its git config itself", () => {
  const { scripts } = JSON.parse(
    readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')
  )
  assert.equal(scripts.prepare, 'husky')
  for (const command of ['pnpm install', 'pnpm run prepare', scripts.prepare]) {
    assert.equal(bashForce({ command }), undefined, command)
  }
  assert.deepEqual(
    bashForce({ command: 'git config core.hooksPath .husky/_' }),
    { option: 'core.hooksPath', program: 'git config' }
  )
})
