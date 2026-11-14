// ---------------------------------------------------------------------------
// Pure resolver behind the package-src-alias rule in ./index.mjs.
//
// A package source reaches its own modules through the `#src/` key of its
// package.json. Given the linted file's absolute path and a specifier, this
// returns what the rule does with it:
//   null                                        — not a path this rule judges
//   { alias: '#src/<path>' }                    — the specifier to write instead
//   { alias: null }                             — own-path form with no fix: it
//                                                 leaves the package's src, or
//                                                 names src itself
// The fix is computed from the file's own path, so it is the same whichever
// folder ESLint runs from.
// ---------------------------------------------------------------------------

import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'

export const SRC_ALIAS = '#src/'
const APP_ALIAS = '@/'
const RELATIVE_PREFIXES = ['./', '../']
const RELATIVE_SELF = ['.', '..']
const PARENT_SEGMENT = '..'
const PACKAGE_SRC = /^(.*[\\/]packages[\\/][^\\/]+[\\/]src)[\\/]/

const isRelative = ({ source }) =>
  RELATIVE_SELF.includes(source) ||
  RELATIVE_PREFIXES.some((prefix) => source.startsWith(prefix))

export const isOwnPathForm = ({ source }) =>
  source.startsWith(APP_ALIAS) || isRelative({ source })

export const toSrcAlias = ({ filename, source }) => {
  if (!isOwnPathForm({ source })) return null
  const match = PACKAGE_SRC.exec(filename)
  if (!match) return { alias: null }
  const srcRoot = match[1]
  const target = source.startsWith(APP_ALIAS)
    ? resolve(srcRoot, source.slice(APP_ALIAS.length))
    : resolve(dirname(filename), source)
  const path = relative(srcRoot, target)
  const leavesSrc =
    path === '' || isAbsolute(path) || path.split(sep)[0] === PARENT_SEGMENT
  if (leavesSrc) return { alias: null }
  return { alias: `${SRC_ALIAS}${path.split(sep).join('/')}` }
}
