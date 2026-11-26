#!/usr/bin/env node
// ---------------------------------------------------------------------------
// move-tests-into-blocks — moves every unit test into the `__tests__/` of its
// own unit's folder, the place verify-tests requires (owner decision 57).
//
// It asks verify-tests where each misplaced test belongs, so the two never
// disagree, and for each test that has a destination:
//   - moves it with `git mv`, so history follows the file;
//   - rewrites the relative specifiers inside it (imports, re-exports,
//     `import()`, `require`, `vi.mock`, `vi.importActual` and their kin): to
//     the `@/` alias when its workspace's tsconfig maps `@/*` onto `src/` and
//     the specifier points inside it, otherwise to the same file one folder
//     deeper;
//   - rewrites every citation of its old path in the Markdown under
//     `openspec/specs/` and `docs/`. Archived OpenSpec changes are history and
//     are never read.
//
// A test with no destination (its stem names no unit, a destination that
// already exists) is listed and left where it is, and the run exits 1. A moved
// test that builds a path from its own folder (`import.meta.dirname`,
// `__dirname`, ...) is named for review: only a reader can tell what such a
// path means. A second run moves nothing.
//
// Usage:
//   node scripts/move-tests-into-blocks.mjs [--root <dir>] [--dry-run]
// ---------------------------------------------------------------------------

import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from 'node:fs'
import { join, posix, resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { gitFreeEnv } from './git-free-env.mjs'
import {
  classifyTests,
  collectContext,
  FINDING_KIND
} from './verify-tests.mjs'

const { dirname, normalize, relative } = posix

const REPO_ROOT = resolve(import.meta.dirname, '..')
const ID = 'move-tests-into-blocks'

const CITATION_ROOTS = ['openspec/specs', 'docs']
const CITATION_EXTENSION = '.md'
const IGNORED_DIRS = new Set(['.git', 'node_modules'])
const TSCONFIG = 'tsconfig.json'
const ALIAS_KEY = '@/*'
const ALIAS_PREFIX = '@/'
const ALIAS_WILDCARD = '/*'
const WORKSPACE_DEPTH = 2

const MOVABLE_KINDS = new Set([
  FINDING_KIND.beside,
  FINDING_KIND.higher,
  FINDING_KIND.noUnit
])

// A quoted relative specifier in a module position: after `from` or a bare
// `import`, or as the first argument of `import()`, `require()`,
// `require.resolve()` and the Vitest and Jest module helpers, a type argument
// (`vi.importActual<typeof import('./x')>('./x')`) included.
const SPECIFIER =
  /(?<=(?:\bfrom|\bimport|\brequire(?:\.resolve)?|\b(?:vi|jest)\.(?:mock|doMock|unmock|doUnmock|importActual|importMock|requireActual)(?:<[^;\n]*>)?)\s*\(?\s*)(?<quote>['"])(?<specifier>\.{1,2}\/[^'"\n]*)\k<quote>/gu

// A path built from the test's own folder, which a move silently re-points.
const SELF_RELATIVE =
  /\bimport\.meta\.(?:dirname|filename|url)\b|\b__dirname\b|\b__filename\b/u

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')

const workspaceOf = (path) =>
  path.split('/').slice(0, WORKSPACE_DEPTH).join('/')

const withDotSlash = (path) => (path.startsWith('.') ? path : `./${path}`)

// Pure: the relative specifiers of a test moved from `from` to `to`, re-aimed
// at the same files. `alias` is `{ prefix, folder }` when the workspace maps
// `@/` onto a folder, else null.
export const rewriteSpecifiers = ({ alias, from, text, to }) => {
  let count = 0
  const rewritten = text.replace(SPECIFIER, (match, quote, specifier) => {
    const target = normalize(`${dirname(from)}/${specifier}`)
    const next =
      alias !== null && target.startsWith(`${alias.folder}/`)
        ? `${alias.prefix}${target.slice(alias.folder.length + 1)}`
        : withDotSlash(relative(dirname(to), target))
    if (next === specifier) return match
    count += 1
    return `${quote}${next}${quote}`
  })
  return { count, text: rewritten }
}

// Pure: every citation of a moved path, where it is the whole path — the
// start of the text, or after a character that cannot be in a path, or after
// a run of `./` and `../` — and nothing that continues a path follows it.
export const rewriteCitations = ({ moves, text }) =>
  moves.reduce(
    (state, { from, to }) => {
      const pattern = new RegExp(
        `(?<=(?:^|[^A-Za-z0-9_.\\-/])(?:\\.{1,2}/)*)${escapeRegExp(from)}(?![A-Za-z0-9_\\-/]|\\.[A-Za-z0-9])`,
        'gmu'
      )
      let count = state.count
      const next = state.text.replace(pattern, () => {
        count += 1
        return to
      })
      return { count, text: next }
    },
    { count: 0, text }
  )

const isDirectory = (path) => {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

// Pure: what a run does over `context` (collectContext of verify-tests).
export const planMoves = ({ context, exists = () => false }) => {
  const { misplaced } = classifyTests(context)
  const targets = new Map()
  misplaced.forEach(({ target }) => {
    if (target !== null)
      targets.set(target, (targets.get(target) ?? 0) + 1)
  })
  const moves = []
  const unplaced = []
  misplaced.forEach((finding) => {
    const { detail, kind, path, target } = finding
    if (target === null || !MOVABLE_KINDS.has(kind)) {
      unplaced.push({ detail, path })
      return
    }
    if (exists(target) || context.files.includes(target)) {
      unplaced.push({
        detail: `${path} belongs at ${target}, which already exists — merge the two by hand.`,
        path
      })
      return
    }
    if (targets.get(target) > 1) {
      unplaced.push({
        detail: `${path} and another test both belong at ${target} — merge them by hand.`,
        path
      })
      return
    }
    moves.push({ from: path, to: target })
  })
  return { moves, unplaced }
}

const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

// The folder `@/` points at in a workspace, from its tsconfig `paths`.
const aliasOf = ({ root, workspace }) => {
  const paths = readJson(join(root, workspace, TSCONFIG))?.compilerOptions
    ?.paths
  const [mapped] = paths?.[ALIAS_KEY] ?? []
  if (typeof mapped !== 'string' || !mapped.endsWith(ALIAS_WILDCARD)) {
    return null
  }
  const folder = normalize(
    `${workspace}/${mapped.slice(0, -ALIAS_WILDCARD.length)}`
  )
  return { folder, prefix: ALIAS_PREFIX }
}

const citationFiles = ({ root }) => {
  const out = []
  const walk = (relativePath) => {
    const absolute = join(root, relativePath)
    if (!isDirectory(absolute)) return
    readdirSync(absolute).forEach((entry) => {
      const next = `${relativePath}/${entry}`
      if (isDirectory(join(root, next))) {
        if (!IGNORED_DIRS.has(entry)) walk(next)
        return
      }
      if (entry.endsWith(CITATION_EXTENSION)) out.push(next)
    })
  }
  CITATION_ROOTS.forEach(walk)
  return out.sort()
}

const gitMove = ({ from, root, to }) => {
  mkdirSync(join(root, dirname(to)), { recursive: true })
  const result = spawnSync('git', ['mv', from, to], {
    cwd: root,
    encoding: 'utf8',
    env: gitFreeEnv()
  })
  if (result.status !== 0) {
    throw new Error(
      `git mv ${from} ${to} failed: ${result.stderr.trim() || result.error}`
    )
  }
}

const applyMoves = ({ moves, root }) => {
  const report = {
    citations: 0,
    docs: 0,
    review: [],
    specifiers: 0,
    tests: 0
  }
  moves.forEach(({ from, to }) => {
    gitMove({ from, root, to })
    const absolute = join(root, to)
    const text = readFileSync(absolute, 'utf8')
    const { count, text: next } = rewriteSpecifiers({
      alias: aliasOf({ root, workspace: workspaceOf(to) }),
      from,
      text,
      to
    })
    if (count > 0) {
      writeFileSync(absolute, next)
      report.specifiers += count
      report.tests += 1
    }
    if (SELF_RELATIVE.test(next)) report.review.push(to)
  })
  citationFiles({ root }).forEach((path) => {
    const absolute = join(root, path)
    const text = readFileSync(absolute, 'utf8')
    const { count, text: next } = rewriteCitations({ moves, text })
    if (count === 0) return
    writeFileSync(absolute, next)
    report.citations += count
    report.docs += 1
  })
  return report
}

const printUnplaced = ({ unplaced }) => {
  if (unplaced.length === 0) return
  console.log(`  cannot place ${unplaced.length} test(s):`)
  unplaced.forEach(({ detail }) => console.log(`    ${detail}`))
}

const main = () => {
  const { values } = parseArgs({
    options: {
      'dry-run': { default: false, type: 'boolean' },
      root: { default: REPO_ROOT, type: 'string' }
    }
  })
  const root = resolve(values.root)
  const context = collectContext({ root })
  const { moves, unplaced } = planMoves({
    context,
    exists: (path) => existsSync(join(root, path))
  })
  process.exitCode = unplaced.length > 0 ? 1 : 0

  if (moves.length === 0) {
    console.log(
      unplaced.length === 0
        ? `${ID}: nothing to move — every test sits in its unit's __tests__/.`
        : `${ID}: nothing to move.`
    )
    printUnplaced({ unplaced })
    return
  }

  if (values['dry-run']) {
    console.log(`${ID}: dry run, ${moves.length} test(s) to move.`)
    moves.forEach(({ from, to }) =>
      console.log(`  would move ${from} → ${to}`)
    )
    printUnplaced({ unplaced })
    return
  }

  const report = applyMoves({ moves, root })
  console.log(
    `${ID}: moved ${moves.length} test(s), rewrote ${report.specifiers} ` +
      `specifier(s) in ${report.tests} test(s), and ${report.citations} ` +
      `citation(s) in ${report.docs} doc(s).`
  )
  moves.forEach(({ from, to }) => console.log(`  ${from} → ${to}`))
  if (report.specifiers > 0) {
    console.log(
      "  run the linter's autofix over the moved tests: a specifier that " +
        'became an alias can change their import order.'
    )
  }
  if (report.review.length > 0) {
    console.log(
      `  review ${report.review.length} moved test(s) that build a path from ` +
        'their own folder, now one level deeper:'
    )
    report.review.forEach((path) => console.log(`    ${path}`))
  }
  printUnplaced({ unplaced })
}

if (import.meta.main) main()
