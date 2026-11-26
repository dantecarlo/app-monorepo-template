#!/usr/bin/env node
// ---------------------------------------------------------------------------
// bash — the force option a Bash command passes, read with the write
// guard's tokenizer: every simple command of a list, a pipeline, a group,
// a compound command and a substitution. A multi-word quoted span, a
// here-doc's body and the words of `echo` are text.
//
// Usage:
//   node --test scripts/agent-harness/no-force/bash.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { bashForce } from './bash.mjs'

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
  ['git commit --no-verify -m "a b"', '--no-verify', 'git commit']
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
  'git push "unterminated'
]) {
  test(`\`${command}\` passes no force option`, () => {
    assert.equal(bashForce({ command }), undefined)
  })
}
