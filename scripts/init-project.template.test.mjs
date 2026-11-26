// ---------------------------------------------------------------------------
// init-project on the template's own names. Only the template carries them:
// a derived project already names its workspaces after itself, so init has
// nothing of the template's left to rename there. The template-maintainer
// capability claims this suite and no preset selects it, so /init removes
// it from every derived project (docs/manifest.md § Maintainer material).
//
// The rename runs on a scratch tree outside the repository that holds the
// root package.json, a root script and init-project itself, as this
// repository holds them.
//
// Run: node --test scripts/init-project.template.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

import { withScratchTree } from './gate/scratch.mjs'
import { gitFreeEnv } from './git-free-env.mjs'
import { ownersOf, REPO_ROOT } from './prune-boundary.repository.mjs'

const OWNER = 'template-maintainer'
const SLUG = 'demo-app'
const INIT = 'scripts/init-project.mjs'
const ROOT_SCRIPT = 'scripts/smoke-web-render.mjs'
const ROOT_MANIFEST = 'package.json'
const SCRATCH_PREFIX = 'init-project-template-'

const read = ({ file, root }) => readFileSync(join(root, file), 'utf8')

test('template-maintainer alone claims this suite, so /init removes it', () => {
  assert.deepEqual(ownersOf({ file: import.meta.filename }), [OWNER])
})

test('a root script that names a workspace gets the new name', () => {
  const smoke = withScratchTree({
    files: Object.fromEntries(
      [INIT, ROOT_MANIFEST, ROOT_SCRIPT].map((file) => [
        file,
        read({ file, root: REPO_ROOT })
      ])
    ),
    prefix: SCRATCH_PREFIX,
    use: ({ root }) => {
      execFileSync(process.execPath, [INIT, SLUG], {
        cwd: root,
        env: gitFreeEnv(),
        stdio: 'ignore'
      })
      return read({ file: ROOT_SCRIPT, root })
    }
  })

  assert.match(smoke, new RegExp(`@${SLUG}/web`))
  assert.doesNotMatch(smoke, /@app\//)
})
