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
  // Not a force option by the LAW's text, which decides code; typed, the
  // hook stays conservative and refuses it.
  [
    'chromium --force-device-scale-factor=1',
    '--force-device-scale-factor=1',
    'chromium'
  ],
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

for (const [command, option, program] of [
  ['rm -f build.log', '-f', 'rm'],
  ['rm -rf dist', '-rf', 'rm'],
  ['rm -Rf dist', '-Rf', 'rm'],
  ['/bin/rm -r -f dist', '-f', 'rm'],
  ['rm --force dist', '--force', 'rm'],
  ['git commit --no-verify -m fix', '--no-verify', 'git commit'],
  ['git push --no-verify', '--no-verify', 'git push'],
  ['git commit -n -m fix', '-n', 'git commit'],
  ['git commit -anm fix', '-anm', 'git commit'],
  ['HUSKY=0 git commit -m fix', 'HUSKY=0', 'git commit'],
  ['env HUSKY=0 git commit -m fix', 'HUSKY=0', 'git commit'],
  ['sudo env -i HUSKY=0 git push', 'HUSKY=0', 'git push'],
  ['export HUSKY=0', 'HUSKY=0', 'export'],
  ['declare -x HUSKY=0', 'HUSKY=0', 'declare'],
  ['HUSKY=0', 'HUSKY=0', 'HUSKY=0']
]) {
  test(`\`${command}\` skips a check`, () => {
    assert.deepEqual(found({ command }), { option, program })
  })
}

// git reads an unambiguous prefix of a long option as the option itself.
for (const [command, option, program] of [
  ['git push --fo', '--fo', 'git push'],
  ['git push --for', '--for', 'git push'],
  ['git push --forc origin main', '--forc', 'git push'],
  ['npm install --FORC', '--FORC', 'npm'],
  ['git push --forc=x', '--forc=x', 'git push'],
  ['git commit --no-v -m x', '--no-v', 'git commit'],
  ['git commit --no-verif -m x', '--no-verif', 'git commit'],
  ['git push --NO-VERI', '--NO-VERI', 'git push']
]) {
  test(`\`${command}\` abbreviates a refused long option`, () => {
    assert.deepEqual(found({ command }), { option, program })
  })
}

// A git setting that moves the hooks away: on any subcommand through
// `-c` or `--config-env`, and every write form of `git config`.
for (const [command, option, program] of [
  [
    'git -c core.hooksPath=/dev/null commit -m x',
    '-c core.hooksPath=/dev/null',
    'git commit'
  ],
  [
    'git -C ../wt -c CORE.HOOKSPATH= push',
    '-c CORE.HOOKSPATH=',
    'git push'
  ],
  [
    'git --config-env=core.hooksPath=HOOKS commit',
    '--config-env=core.hooksPath=HOOKS',
    'git commit'
  ],
  [
    'git --config-env core.hooksPath=HOOKS status',
    '--config-env core.hooksPath=HOOKS',
    'git status'
  ],
  ['git config core.hooksPath /dev/null', 'core.hooksPath', 'git config'],
  ['git config --global core.hookspath x', 'core.hookspath', 'git config'],
  ['git config --local core.hooksPath ""', 'core.hooksPath', 'git config'],
  ['git config -f .git/config core.hooksPath x', 'core.hooksPath', 'git config'],
  ['git config --add core.hooksPath x', 'core.hooksPath', 'git config'],
  [
    'git config --replace-all core.hooksPath x',
    'core.hooksPath',
    'git config'
  ],
  ['git config --unset core.hooksPath', 'core.hooksPath', 'git config'],
  ['git config --unset-all core.hooksPath', 'core.hooksPath', 'git config'],
  ['git config set core.hooksPath x', 'core.hooksPath', 'git config'],
  ['git config unset core.hooksPath', 'core.hooksPath', 'git config'],
  ['git config --remove-section core', 'core', 'git config'],
  ['git config --rename-section core old', 'core', 'git config']
]) {
  test(`\`${command}\` moves the git hooks away`, () => {
    assert.deepEqual(found({ command }), { option, program })
  })
}

for (const command of [
  'git config --get core.hooksPath',
  'git config --get-all core.hooksPath',
  'git config --get-regexp hookspath',
  'git config core.hooksPath',
  'git config get core.hooksPath',
  'git config --list',
  'git config list --show-origin',
  'git config user.name x',
  'git config --global core.autocrlf false',
  'git -c core.pager=cat log',
  'git config --remove-section user'
]) {
  test(`\`${command}\` leaves the git hooks where they are`, () => {
    assert.equal(found({ command }), undefined)
  })
}

for (const command of [
  'rm build.log',
  'rm -r dist',
  'git commit -m -n',
  'git commit -mn',
  'git commit -F notes.txt',
  'git push -n origin main',
  'git log -n 5',
  'HUSKY=1 git commit -m fix',
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
  'tool --no-force',
  // Long options that are no prefix of a refused one.
  'git log --format=%h',
  'git log --follow a.txt',
  'git log --f',
  'git commit --no-',
  'git commit --no-edit',
  'wget --no-verbose x',
  'tool --foo',
  // HUSKY=0 as an argument sets nothing.
  'git diff --stat HUSKY=0',
  'echo HUSKY=0',
  'tool HUSKY=0',
  // Patterns and operands, not options.
  'git grep -n -e --force',
  'git grep -- --no-verify',
  'git -C ../repo grep --force',
  'tool -- --force',
  'git push origin -- --force'
]) {
  test(`\`${command}\` passes no force option`, () => {
    assert.equal(found({ command }), undefined)
  })
}

test('an empty command passes no force option', () => {
  assert.equal(forceOf({ words: [] }), undefined)
})
