#!/usr/bin/env node
// ---------------------------------------------------------------------------
// forms — the force option one simple command passes, read from its words:
// a long form on any tool, `taskkill /F`, and git's short force options by
// the letters each subcommand gives that meaning. The nearest legitimate
// commands pass.
//
// Usage:
//   node --test scripts/agent-harness/no-force/forms.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { forceOf } from './forms.mjs'

const wordsOf = ({ command }) => command.split(' ')
const found = ({ command }) => forceOf({ words: wordsOf({ command }) })

for (const [command, option, program] of [
  ['git push --force', '--force', 'git push'],
  ['git push --force-with-lease', '--force-with-lease', 'git push'],
  [
    'git push --force-with-lease=main:abc',
    '--force-with-lease=main:abc',
    'git push'
  ],
  ['git push --force-if-includes', '--force-if-includes', 'git push'],
  ['npm install --force', '--force', 'npm'],
  ['pnpm install --FORCE', '--FORCE', 'pnpm'],
  ['docker rm --force web', '--force', 'docker'],
  ['Remove-Item -Recurse -Force dist', '-Force', 'remove-item'],
  ['Stop-Process -Id 4 -Force:$true', '-Force:$true', 'stop-process'],
  ['tool -force', '-force', 'tool'],
  ['tool --force=true', '--force=true', 'tool']
]) {
  test(`the long form in \`${command}\` is a force option`, () => {
    assert.deepEqual(found({ command }), { option, program })
  })
}

for (const [command, option] of [
  ['taskkill /F /PID 4', '/F'],
  ['taskkill /pid 4 /f', '/f'],
  ['taskkill //F //PID 4', '//F'],
  ['taskkill.exe -f /IM node.exe', '-f'],
  ['C:/Windows/System32/TASKKILL.EXE /T /F /PID 4', '/F']
]) {
  test(`\`${command}\` is taskkill's force option`, () => {
    assert.deepEqual(found({ command }), { option, program: 'taskkill' })
  })
}

for (const [subcommand, letters] of [
  ['add', 'f'],
  ['clean', 'f'],
  ['fetch', 'f'],
  ['mv', 'f'],
  ['push', 'f'],
  ['rm', 'f'],
  ['tag', 'f'],
  ['worktree', 'f'],
  ['branch', 'fDMC'],
  ['checkout', 'fB'],
  ['switch', 'fC']
]) {
  for (const letter of letters) {
    test(`\`git ${subcommand} -${letter}\` is a force option`, () => {
      assert.deepEqual(
        found({ command: `git ${subcommand} -${letter}` }),
        {
          option: `-${letter}`,
          program: `git ${subcommand}`
        }
      )
    })
  }
}

for (const [command, option, program] of [
  ['git clean -xfd', '-xfd', 'git clean'],
  ['git rm -rf dist', '-rf', 'git rm'],
  ['git push -uf origin main', '-uf', 'git push'],
  ['git push origin main -f', '-f', 'git push'],
  ['git worktree remove -f ../wt', '-f', 'git worktree'],
  ['git switch --discard-changes main', '--discard-changes', 'git switch'],
  ['git -C ../repo push -f', '-f', 'git push'],
  ['git -c core.pager=cat branch -D old', '-D', 'git branch'],
  ['git --git-dir=.git --no-pager tag -f v1', '-f', 'git tag'],
  ['/usr/bin/git.exe checkout -B main', '-B', 'git checkout']
]) {
  test(`\`${command}\` is git's force option`, () => {
    assert.deepEqual(found({ command }), { option, program })
  })
}

for (const [command, program] of [
  ['sudo git push -f', 'git push'],
  ['env GIT_TRACE=1 git push -f', 'git push'],
  ['timeout 60 git push -f', 'git push'],
  ['nohup npm install --force', 'npm']
]) {
  test(`\`${command}\` is read through its wrapper`, () => {
    assert.equal(found({ command })?.program, program)
  })
}

for (const command of [
  'rm -f build.log',
  'rm -rf dist',
  'cp -f a b',
  'ln -sf a b',
  'docker rm -f web',
  'git log -f',
  'git grep -f patterns.txt',
  'git commit -F message.txt',
  'git tag -F notes.txt v1',
  'git tag -mfix v1',
  'git tag -m -f v1',
  'git push -o -f origin main',
  'git checkout -bfeature',
  'git switch -c feature',
  'git branch -d old',
  'git branch -m old new',
  'git branch -ufeature',
  'git push -u origin main',
  'git push --no-force-if-includes',
  'git clean -n',
  'git clean -e -f',
  'git worktree add -b feature ../wt',
  'git worktree add -B feature ../wt',
  'git worktree remove ../wt',
  'git rm -- -f',
  'git -C -f status',
  'taskkill /PID 4',
  'taskkill /T /PID 4',
  'echo --force',
  'printf %s --force',
  'grep -- --force notes.txt',
  'rg --fixed-strings -- --force',
  'Copy-Item -Force:$false a b',
  'tool --force=false',
  'tool --forced',
  'tool --no-force'
]) {
  test(`\`${command}\` passes no force option`, () => {
    assert.equal(found({ command }), undefined)
  })
}

test('an empty command passes no force option', () => {
  assert.equal(forceOf({ words: [] }), undefined)
})
