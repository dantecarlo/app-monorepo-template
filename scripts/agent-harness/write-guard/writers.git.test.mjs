#!/usr/bin/env node
// ---------------------------------------------------------------------------
// writers.git — which git subcommands change the tree, index, history or
// branches, which write only a file they are told to, and which rewrite the
// working-tree files their pathspecs name. The commands are those of
// Certifipago's enforce-agent-writes test.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/writers.git.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { literal } from './expansion.mjs'
import {
  gitFileTargets,
  gitTreeTargets,
  gitWrite
} from './writers.git.mjs'

const call = ({ command }) => {
  const [sub, ...rest] = command.split(' ')
  return { rest: rest.map((text) => literal({ text })), sub }
}

for (const command of [
  'status --short',
  'log --oneline -5',
  'diff origin/master...HEAD -- src',
  'show HEAD:package.json',
  'fetch origin master',
  'stash list',
  'branch -a',
  'branch',
  'branch --show-current',
  'tag --list',
  'tag --contains HEAD',
  'tag',
  'worktree list',
  'config --get user.email',
  'config user.name',
  'config get user.name',
  'reflog -5',
  'symbolic-ref HEAD',
  'remote -v',
  'remote get-url origin',
  'archive -o tree.tar HEAD',
  'rev-parse --show-toplevel'
]) {
  test(`a git read is no write: git ${command}`, () => {
    assert.equal(gitWrite(call({ command })), undefined)
  })
}

for (const [command, write] of [
  ['add .', 'add'],
  ['commit -m x', 'commit'],
  ['push', 'push'],
  ['pull', 'pull'],
  ['checkout -- src/a.ts', 'checkout'],
  ['switch main', 'switch'],
  ['reset --hard', 'reset'],
  ['restore src/a.ts', 'restore'],
  ['rm src/a.ts', 'rm'],
  ['mv a b', 'mv'],
  ['merge origin/master', 'merge'],
  ['stash', 'stash'],
  ['stash pop', 'stash pop'],
  ['clean -fd', 'clean'],
  ['tag v1', 'tag'],
  ['tag -d v1', 'tag'],
  ['branch -D old', 'branch'],
  ['branch topic', 'branch'],
  ['apply fix.patch', 'apply'],
  ['worktree add ../wt', 'worktree add'],
  ['init', 'init'],
  ['config user.name x', 'config'],
  ['config --unset user.name', 'config'],
  ['notes add -m x', 'notes add'],
  ['update-ref refs/heads/x HEAD', 'update-ref'],
  ['reflog expire --all', 'reflog'],
  ['symbolic-ref HEAD refs/heads/x', 'symbolic-ref'],
  ['remote add up x', 'remote add'],
  ['gc', 'gc']
]) {
  test(`a git write names its subcommand: git ${command}`, () => {
    assert.equal(gitWrite(call({ command })), write)
  })
}

for (const [command, targets] of [
  ['archive -o tree.tar HEAD', ['tree.tar']],
  ['archive HEAD', []],
  ['diff --output=d.patch', ['d.patch']],
  ['format-patch -1', ['.']],
  ['format-patch -o out -1', ['out']],
  ['bundle create b.bundle HEAD', ['b.bundle']],
  ['status', []]
]) {
  test(`a git file write names its file: git ${command}`, () => {
    assert.deepEqual(
      gitFileTargets(call({ command })).map(({ text }) => text),
      targets
    )
  })
}

for (const [command, targets] of [
  ['checkout -- AGENTS.md', ['AGENTS.md']],
  ['checkout main -- AGENTS.md', ['main', 'AGENTS.md']],
  ['checkout -b topic', []],
  ['restore --source=HEAD AGENTS.md', ['AGENTS.md']],
  ['restore -s HEAD AGENTS.md', ['AGENTS.md']],
  ['rm AGENTS.md', ['AGENTS.md']],
  ['rm --cached AGENTS.md', []],
  ['restore --staged AGENTS.md', []],
  ['restore --staged --worktree AGENTS.md', ['AGENTS.md']],
  ['mv AGENTS.md docs/a.md', ['AGENTS.md', 'docs/a.md']],
  ['clean -f knip.json', ['knip.json']],
  ['add AGENTS.md', []],
  ['commit -m x AGENTS.md', []]
]) {
  test(`a git tree write names the files it rewrites: git ${command}`, () => {
    assert.deepEqual(
      gitTreeTargets(call({ command })).map(({ text }) => text),
      targets
    )
  })
}
