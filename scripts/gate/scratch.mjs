// ---------------------------------------------------------------------------
// Scratch trees for companion suites. `withScratchTree` builds `files`
// under a fresh directory in the OS temp directory, hands its root to `use`,
// and removes it before returning, with no `force`: it created the root,
// so a root already gone is an error. Every caller of an exported CASES
// list, a blinded re-run included, leaves the temp directory as it found it.
// ---------------------------------------------------------------------------

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

export const withScratchTree = ({ files, prefix, use }) => {
  const root = mkdtempSync(resolve(tmpdir(), prefix))
  try {
    Object.entries(files).forEach(([name, text]) => {
      const target = join(root, name)
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, text)
    })
    return use({ root })
  } finally {
    rmSync(root, { recursive: true })
  }
}
