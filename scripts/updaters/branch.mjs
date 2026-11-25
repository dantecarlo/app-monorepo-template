// ---------------------------------------------------------------------------
// branch — where an update of `pnpm updaters:run` starts, checked out
// detached: `updates/<id>` as the remote holds it, with the default branch
// merged in by a normal merge, or the default branch when the remote holds
// no `updates/<id>`. The update's commit then goes on top, so the branch is
// appended to and never rewritten, and no call passes a force option or a
// `+` refspec (the LAW "A force option is never used", AGENTS.md): a fetch
// that would move a remote-tracking branch backwards is refused by git, a
// finding for a person to read.
//
// A merge that conflicts is a finding too, never something to force past:
// the merge is aborted, the tree returns to the ref the run started on, and
// a MergeConflict names the branch and the conflicting paths.
// ---------------------------------------------------------------------------

import { EXIT, MergeConflict, must } from './steps.mjs'

const trackingOf = ({ name }) =>
  `refs/heads/${name}:refs/remotes/origin/${name}`

const conflictsOf = ({ env, git }) =>
  must({
    result: git({ args: ['diff', '--name-only', '--diff-filter=U'], env }),
    what: 'git diff --name-only --diff-filter=U'
  })
    .stdout.split(/\r?\n/u)
    .filter((path) => path !== '')

const checkoutDetached = ({ env, git, ref }) =>
  must({
    result: git({ args: ['checkout', '--detach', ref], env }),
    what: `git checkout --detach ${ref}`
  })

/**
 * Checks out where the update of `branch` starts. `back` are the git
 * arguments that return to the ref the run started on. Returns what the
 * update is measured against and how it started, for its messages.
 */
export const startUpdate = ({ back, base, branch, env, git }) => {
  const baseRef = `origin/${base}`
  must({
    result: git({
      args: ['fetch', 'origin', trackingOf({ name: base })],
      env
    }),
    what: `git fetch origin ${base}`
  })
  const held = must({
    result: git({
      args: ['ls-remote', '--heads', 'origin', `refs/heads/${branch}`],
      env
    }),
    what: `git ls-remote origin ${branch}`
  }).stdout.trim()
  if (held === '') {
    checkoutDetached({ env, git, ref: baseRef })
    return { against: base, how: `started from ${base}` }
  }
  must({
    result: git({
      args: ['fetch', 'origin', trackingOf({ name: branch })],
      env
    }),
    what: `git fetch origin ${branch}`
  })
  checkoutDetached({ env, git, ref: `origin/${branch}` })
  const merged = git({ args: ['merge', '--no-edit', baseRef], env })
  if (merged.status !== EXIT.current) {
    const conflicts = conflictsOf({ env, git })
    if (conflicts.length === 0) {
      must({ result: merged, what: `git merge ${baseRef}` })
    }
    must({
      result: git({ args: ['merge', '--abort'], env }),
      what: 'git merge --abort'
    })
    must({ result: git({ args: back, env }), what: 'git checkout' })
    throw new MergeConflict(
      `${baseRef} does not merge into ${branch}, a conflict in ` +
        `${conflicts.join(', ')}; the merge was aborted, nothing was ` +
        'committed and no pull request opened'
    )
  }
  return {
    against: `${branch} with ${base} merged in`,
    how: `with ${base} merged in`
  }
}
