// ---------------------------------------------------------------------------
// Removes a file, or a folder with everything under it, that may already be
// gone.
//
// `rmSync`'s `force` passes over a missing path without a word, so a removal
// that meant to find something never learns it was not there. This helper
// accepts one failure as success, ENOENT: the path is not there, which is
// the state the caller asked for. Every other failure, a file held open, a
// permission denied, is rethrown as it was raised. A caller that created the
// path itself calls `rmSync` with no `force`, since for it a missing path is
// a real error. A junction or a symbolic link is removed as the link itself,
// and its target is never entered.
// ---------------------------------------------------------------------------

import nodeFs from 'node:fs'

const NOT_FOUND = 'ENOENT'

/**
 * Removes `path` recursively; returns when it is already gone. `fs` is
 * injected by tests and by callers that inject their own.
 */
export const removePath = ({ fs = nodeFs, path }) => {
  try {
    fs.rmSync(path, { recursive: true })
  } catch (error) {
    if (error?.code !== NOT_FOUND) throw error
  }
}
