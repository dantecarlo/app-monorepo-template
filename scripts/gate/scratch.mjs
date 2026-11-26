// ---------------------------------------------------------------------------
// Scratch trees for companion suites. `withScratchTree` builds `files`
// under a fresh directory in the OS temp directory, hands its root to `use`,
// and removes it before returning, with no `force`: it created the root,
// so a root already gone is an error. Every caller of an exported CASES
// list, a blinded re-run included, leaves the temp directory as it found it.
// Given an `origin`, the root is a git checkout whose origin remote is that
// URL, as a clone of it is: it holds no commit, so nothing in it is
// read-only.
// ---------------------------------------------------------------------------

import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

import { gitFreeEnv } from '../git-free-env.mjs'

const git = ({ args, root }) =>
  execFileSync('git', ['-C', root, ...args], {
    env: gitFreeEnv(),
    stdio: 'ignore'
  })

export const withScratchTree = ({ files, origin, prefix, use }) => {
  const root = mkdtempSync(resolve(tmpdir(), prefix))
  try {
    Object.entries(files).forEach(([name, text]) => {
      const target = join(root, name)
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, text)
    })
    if (origin !== undefined) {
      git({ args: ['init', '-q'], root })
      git({ args: ['remote', 'add', 'origin', origin], root })
    }
    return use({ root })
  } finally {
    rmSync(root, { recursive: true })
  }
}
