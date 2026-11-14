// ---------------------------------------------------------------------------
// vitest-sequence — the shuffled order every workspace's suite runs under.
//
// The seed comes from the commit, so the same tree draws the same order and a
// new commit draws a new one. `VITEST_SEQUENCE_SEED` picks an order by hand.
//
// The seed fixes the order of the tests INSIDE each file. It does not fix the
// file order: vitest shuffles the glob result, and that result comes back in a
// different order on consecutive runs of the same tree. Each file runs in its
// own module registry (`isolate`, on by default), so the coupling a shuffle
// surfaces is the coupling between tests of one file.
//
// A checkout that resolves no commit sha throws here, and vitest fails to load
// the config. A suite that runs in file order reports the same green as a
// shuffled one.
// ---------------------------------------------------------------------------

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const SEED_ENV_VAR = 'VITEST_SEQUENCE_SEED'

// 12 hex digits is 48 bits: a distinct seed per commit, inside the integer
// range a JS number represents exactly.
const SEED_HEX_DIGITS = 12
const HEX_RADIX = 16

// A sha1 checkout reports 40 hex digits, a sha256 checkout 64.
const COMMIT_SHA = /^[0-9a-f]{40,64}$/

export const seedFromCommitSha = ({ sha }) => {
  if (!COMMIT_SHA.test(sha)) {
    throw new Error(
      `vitest-sequence: \`git rev-parse HEAD\` produced ` +
        `${JSON.stringify(sha)}, which is not a commit sha. The suite ` +
        `takes its order from the commit, so it does not run here. Set ` +
        `${SEED_ENV_VAR} to pick an order by hand.`
    )
  }
  return parseInt(sha.slice(0, SEED_HEX_DIGITS), HEX_RADIX)
}

export const resolveSeed = ({ env, sha }) => {
  const override = env[SEED_ENV_VAR]
  if (override === undefined || override.trim() === '') {
    return { seed: seedFromCommitSha({ sha }), source: 'the commit' }
  }

  const seed = Number(override)
  if (!Number.isSafeInteger(seed)) {
    throw new Error(
      `vitest-sequence: ${SEED_ENV_VAR}=${JSON.stringify(override)} is ` +
        `not an integer.`
    )
  }
  return { seed, source: SEED_ENV_VAR }
}

export const replayNotice = ({ seed, source, workspace }) =>
  `vitest-sequence: ${workspace} runs shuffled — seed ${seed}, from ` +
  `${source}. Replay with: ` +
  `${SEED_ENV_VAR}=${seed} pnpm --filter ${workspace} test — same order ` +
  `within each file; the file order is redrawn every run.`

export const workspaceName = ({ packageDir }) =>
  JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8')).name

export const readCommitSha = () => {
  try {
    return execSync('git rev-parse HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
  } catch {
    return ''
  }
}

// The `sequence` block each workspace's vitest.config.ts spreads in. It prints
// before returning, so the seed is on screen ahead of the run.
export const testSequence = ({ packageDir }) => {
  const { seed, source } = resolveSeed({
    env: process.env,
    sha: readCommitSha()
  })

  console.log(
    replayNotice({
      seed,
      source,
      workspace: workspaceName({ packageDir })
    })
  )

  return { seed, shuffle: true }
}
