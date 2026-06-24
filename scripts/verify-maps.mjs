#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-maps — architecture-map integrity + inline-literal audit.
//
// Four independent checks, all must pass for a green run:
//
//   (A) Map-path integrity. Every repo-relative path referenced inside
//       docs/maps/global-map.md (a `backtick path` that looks like a real
//       location, or a markdown link target) MUST resolve to a file or
//       directory that exists. This keeps the navigable index honest — a
//       moved/renamed thing fails the gate until the map is updated.
//
//   (B) Inline-literal audit. Walks source units with the TypeScript AST and
//       flags magic NUMERIC literals that live OUTSIDE the two files where
//       literals are the point (`*.constant.ts`, `*.styles.ts`). It mirrors
//       the ESLint `no-magic-numbers` contract exactly — allowlist [-1,0,1,2],
//       `detectObjects:false` (object-property values are design, allowed),
//       `enforceConst` (named const initializers are the CORRECT pattern,
//       allowed), `ignoreArrayIndexes`, `ignoreEnums` — so it never disagrees
//       with the linter. Its added value is COVERAGE: ESLint runs per
//       workspace; this single pass scans the whole tree at once and reports
//       any stray magic number as a fatal offender, complementing the rule.
//
//   (C) Inline hex-color audit. Same AST walk as (B); flags string literals
//       whose full text matches /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.
//       Exemptions: same file-suffix scope as (B) — *.constant.ts and
//       *.styles.ts are allowed (literals are the point there), as is the
//       entire packages/tokens/src/** tree (design source of truth).
//       Fix: move hex values into packages/tokens, a *.constant.ts, or a
//       *.styles.ts.
//
//   (D) Reverse map coverage. For each app root (apps/web, apps/mobile),
//       lists PascalCase child directories under src/services/<Domain> and
//       src/screens/<Screen>. Each on-disk domain/screen MUST be referenced
//       by at least one path substring in docs/maps/global-map.md. Catches
//       real domains/screens that were added to the codebase but never
//       documented in the map (the inverse of check A).
//
// Why the TS AST and not a regex: a line scanner cannot tell `borderRadius: 8`
// (object value, allowed) from `setTimeout(fn, 800)` (standalone, magic), nor
// strip numbers inside strings (`'OpenAPI 3.1'`) or className utilities
// (`px-2`). The AST gives the same precision ESLint has, with no extra deps
// (typescript is already a devDependency).
//
// Usage:
//   node scripts/verify-maps.mjs              # full repo
//   node scripts/verify-maps.mjs apps/web/src # restrict the literal scan
// ---------------------------------------------------------------------------

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import tsModule from 'typescript'

const ts = tsModule.default ?? tsModule

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')

const GLOBAL_MAP = 'docs/maps/global-map.md'

// Files where literals ARE the point — exempt from the literal audit.
const LITERAL_EXEMPT_SUFFIXES = ['.constant.ts', '.styles.ts']

// Source suffixes scanned for inline literals.
const SCANNED_SUFFIXES = [
  '.component.tsx',
  '.screen.tsx',
  '.hook.ts',
  '.service.ts',
  '.adapter.ts',
  '.store.ts',
  '.helper.ts',
  '.type.ts'
]

// Numeric literals that never count as "magic" — mirrors the ESLint
// MAGIC_NUMBER_ALLOWLIST in eslint.rules.mjs.
const NUMBER_ALLOWLIST = new Set([-1, 0, 1, 2])

// Hex-color string regex — strict #RGB and #RRGGBB (anchored full match).
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

// Path segments that mark hex-exempt paths (tokens are the design source of
// truth; hex inside them is not a leak, it IS the value).
const HEX_EXEMPT_PATH_SEGMENTS = ['packages/tokens/src']

const isHexExemptPath = (absPath) => {
  const normalized = absPath.replaceAll('\\', '/')
  return HEX_EXEMPT_PATH_SEGMENTS.some((seg) => normalized.includes(seg))
}

// Directories never walked.
const IGNORED_DIRS = new Set([
  '.expo',
  '.git',
  '.next',
  '.turbo',
  'coverage',
  'dist',
  'node_modules'
])

// Path segments that mark test / test-infra files — exempt from the literal
// audit (fixtures and assertions legitimately carry literals).
const TEST_INFRA_SEGMENTS = ['__tests__', '__mocks__', '/test/']

const DEFAULT_SCAN_ROOTS = ['apps/web/src', 'apps/mobile/src', 'packages']

const toRepoRel = (absPath) => absPath.replace(`${REPO_ROOT}/`, '')

const isTestFile = (name) => /\.test\.[cm]?[jt]sx?$/.test(name)

const isTestInfra = (path) => {
  const normalized = path.replaceAll('\\', '/')
  return TEST_INFRA_SEGMENTS.some((seg) => normalized.includes(seg))
}

const exists = (repoRelPath) => {
  try {
    statSync(resolve(REPO_ROOT, repoRelPath))
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Check (A) — map-path integrity.
// ---------------------------------------------------------------------------

// A backtick token is treated as a referenced path ONLY when it is rooted at a
// real top-level repo directory (e.g. `apps/web/src/...`, `packages/...`).
// This deliberately ignores: bare suffix descriptors used in table columns
// (`.cjs`, `.helper.ts`), partial folder fragments (`src/`, `hooks/`), aliases
// (`@app/*`), globs, and prose backticks (`yes`, `useAppQuery`) — none of which
// are resolvable repo paths.
const PATH_TOKEN = /`([^`\n]+)`/g

// Top-level repo dirs a referenced path must start with to be verified.
const PATH_ROOTS = ['apps/', 'packages/', 'docs/', 'scripts/', '.claude/']

// Markdown link targets like [text](docs/foo.md) are also verified.
const LINK_TARGET = /\]\(([^)]+)\)/g

const looksLikePath = (token) => {
  if (token.includes('*')) return false // glob / alias root, not a real path
  if (token.includes('<') || token.includes('>')) return false // placeholder
  if (token.startsWith('@')) return false // alias import, not a filesystem path
  if (token.startsWith('http')) return false
  if (token.includes(' ')) return false // prose, not a path
  return PATH_ROOTS.some((root) => token.startsWith(root))
}

const verifyMapPaths = () => {
  if (!exists(GLOBAL_MAP)) {
    return { missing: [], ok: false, reason: `${GLOBAL_MAP} not found` }
  }

  const content = readFileSync(resolve(REPO_ROOT, GLOBAL_MAP), 'utf8')
  const referenced = new Set()

  for (const match of content.matchAll(PATH_TOKEN)) {
    const token = match[1].trim()
    if (looksLikePath(token)) referenced.add(token)
  }

  for (const match of content.matchAll(LINK_TARGET)) {
    let target = match[1].trim()
    if (target.startsWith('#') || target.startsWith('http')) continue
    target = target.split('#')[0] // drop in-page anchor
    if (!target) continue
    // Map links are relative to docs/maps/ — resolve against that dir.
    referenced.add(join('docs/maps', target))
  }

  const missing = []
  for (const ref of referenced) {
    const normalized = ref.replace(/\/$/, '') // tolerate trailing slash on dirs
    if (!exists(normalized)) missing.push(ref)
  }

  return { missing, ok: missing.length === 0, referenced: referenced.size }
}

// ---------------------------------------------------------------------------
// Check (B) — inline-literal audit (TS AST, ESLint-faithful).
// ---------------------------------------------------------------------------

const scannedSuffixFor = (name) =>
  SCANNED_SUFFIXES.find((suffix) => name.endsWith(suffix)) ?? null

const isLiteralExempt = (name) =>
  LITERAL_EXEMPT_SUFFIXES.some((suffix) => name.endsWith(suffix))

const collectFiles = (dir, acc) => {
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRS.has(entry)) continue
    const full = join(dir, entry)
    const stats = statSync(full)
    if (stats.isDirectory()) {
      collectFiles(full, acc)
      continue
    }
    if (isTestFile(entry)) continue
    if (isTestInfra(full)) continue
    if (isLiteralExempt(entry)) continue
    if (scannedSuffixFor(entry)) acc.push(full)
  }
}

// A numeric literal is ALLOWED (skipped) when, per the ESLint contract, it is:
//   - in the allowlist [-1, 0, 1, 2]
//   - the initializer of a `const` declaration (enforceConst)
//   - an object-literal property VALUE (detectObjects:false)
//   - an array index (ignoreArrayIndexes)
//   - a member of an enum (ignoreEnums)
//   - a TS literal type / type index (ignoreTypeIndexes)
// Anything else is a magic-number offender.
const isAllowedNumeric = (node, value) => {
  if (NUMBER_ALLOWLIST.has(value)) return true

  let current = node
  let parent = node.parent

  // Unwrap a unary minus so `-5` is judged by its real parent context.
  if (
    parent &&
    ts.isPrefixUnaryExpression(parent) &&
    parent.operator === ts.SyntaxKind.MinusToken
  ) {
    current = parent
    parent = parent.parent
  }

  if (!parent) return false

  // enforceConst: `const X = 5` is the CORRECT extraction pattern.
  if (
    ts.isVariableDeclaration(parent) &&
    parent.initializer === current &&
    parent.parent &&
    ts.isVariableDeclarationList(parent.parent) &&
    (parent.parent.flags & ts.NodeFlags.Const) !== 0
  ) {
    return true
  }

  // detectObjects:false — object-literal property values are design, allowed.
  if (ts.isPropertyAssignment(parent) && parent.initializer === current) {
    return true
  }

  // ignoreArrayIndexes — `arr[3]`.
  if (
    ts.isElementAccessExpression(parent) &&
    parent.argumentExpression === current
  ) {
    return true
  }

  // ignoreEnums — `enum E { A = 5 }`.
  if (ts.isEnumMember(parent) && parent.initializer === current)
    return true

  // ignoreTypeIndexes / literal types — `type T = Foo[5]`, `type U = 5`.
  if (ts.isLiteralTypeNode(parent) || ts.isIndexedAccessTypeNode(parent)) {
    return true
  }

  // JSX attribute values — `<View intensity={40} />`. ESLint's
  // `no-magic-numbers` ignores JSX attribute literals (verified against the
  // linter), so this pass must too. Walk up through the wrapping
  // JsxExpression to its JsxAttribute parent.
  if (ts.isJsxExpression(parent) && parent.parent) {
    if (ts.isJsxAttribute(parent.parent)) return true
  }

  return false
}

const auditFile = ({ file, hexOffenders, numericOffenders }) => {
  const source = readFileSync(file, 'utf8')
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )

  const checkHex = !isHexExemptPath(file)

  const visit = (node) => {
    if (ts.isNumericLiteral(node)) {
      const value = Number(node.text)
      if (!isAllowedNumeric(node, value)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(
          node.getStart(sourceFile)
        )
        numericOffenders.push({
          line: line + 1,
          path: toRepoRel(file),
          value: node.text
        })
      }
    }

    // Check (C) — hex-color string literals.
    if (checkHex) {
      if (
        ts.isStringLiteral(node) ||
        ts.isNoSubstitutionTemplateLiteral(node)
      ) {
        if (HEX_COLOR_RE.test(node.text)) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(
            node.getStart(sourceFile)
          )
          hexOffenders.push({
            line: line + 1,
            path: toRepoRel(file),
            value: node.text
          })
        }
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
}

const auditLiterals = (roots) => {
  const files = []
  for (const root of roots) {
    const abs = resolve(REPO_ROOT, root)
    try {
      if (statSync(abs).isDirectory()) collectFiles(abs, files)
    } catch {
      // root does not exist — skip silently (template apps may vary)
    }
  }

  const hexOffenders = []
  const numericOffenders = []
  for (const file of files) {
    auditFile({ file, hexOffenders, numericOffenders })
  }

  return { hexOffenders, numericOffenders, scanned: files.length }
}

// ---------------------------------------------------------------------------
// Check (D) — reverse map coverage.
// ---------------------------------------------------------------------------

// PascalCase folder detection — service domains and screens always use PascalCase.
const isPascalCase = (name) => /^[A-Z][A-Za-z0-9]*$/.test(name)

const listPascalDirs = ({ parentPath }) => {
  try {
    return readdirSync(parentPath).filter((entry) => {
      if (IGNORED_DIRS.has(entry)) return false
      if (!isPascalCase(entry)) return false
      try {
        return statSync(join(parentPath, entry)).isDirectory()
      } catch {
        return false
      }
    })
  } catch {
    return []
  }
}

const APP_ROOTS = ['apps/web', 'apps/mobile']

const verifyReverseMapCoverage = ({ mapContent }) => {
  const uncovered = []

  for (const appRoot of APP_ROOTS) {
    for (const subdir of ['services', 'screens']) {
      const parentPath = resolve(REPO_ROOT, appRoot, 'src', subdir)
      const domains = listPascalDirs({ parentPath })
      for (const domain of domains) {
        const stem = `${appRoot}/src/${subdir}/${domain}`
        // A domain/screen is covered when at least one map reference starts
        // with (or contains) its full repo-relative folder path.
        if (!mapContent.includes(stem)) {
          uncovered.push(stem)
        }
      }
    }
  }

  return { ok: uncovered.length === 0, uncovered }
}

// ---------------------------------------------------------------------------
// Run.
// ---------------------------------------------------------------------------

const scanRoots = process.argv.slice(2).length
  ? process.argv.slice(2)
  : DEFAULT_SCAN_ROOTS

const map = verifyMapPaths()
const literals = auditLiterals(scanRoots)

// Load map content once for check (D).
const mapContent = (() => {
  try {
    return readFileSync(resolve(REPO_ROOT, GLOBAL_MAP), 'utf8')
  } catch {
    return ''
  }
})()
const reverse = verifyReverseMapCoverage({ mapContent })

let failed = false

console.log('verify-maps: report\n')

// (A) map integrity — FATAL.
if (!map.ok) {
  failed = true
  if (map.reason) {
    console.error(`  [A] map integrity: FAIL — ${map.reason}`)
  } else {
    console.error(
      `  [A] map integrity: FAIL — ${map.missing.length} dead reference(s) in ${GLOBAL_MAP}:`
    )
    for (const ref of map.missing) console.error(`        - \`${ref}\``)
  }
} else {
  console.log(
    `  [A] map integrity: OK — ${map.referenced} reference(s) in ${GLOBAL_MAP} all resolve.`
  )
}

// (B) inline literals — magic numbers are FATAL (mirror the ESLint contract).
if (literals.numericOffenders.length > 0) {
  failed = true
  console.error(
    `\n  [B] inline literals: FAIL — ${literals.numericOffenders.length} magic number(s) outside *.constant.ts / *.styles.ts:`
  )
  for (const offender of literals.numericOffenders) {
    console.error(
      `        - ${offender.path}:${offender.line} -> ${offender.value}`
    )
  }
  console.error(
    '\n      Move standalone magic numbers into a *.constant.ts value or an enum.'
  )
} else {
  console.log(
    `  [B] inline literals: OK — ${literals.scanned} unit(s) scanned, no stray magic numbers.`
  )
}

// (C) hex-color strings — FATAL.
if (literals.hexOffenders.length > 0) {
  failed = true
  console.error(
    `\n  [C] hex colors: FAIL — ${literals.hexOffenders.length} inline hex literal(s) outside *.constant.ts / *.styles.ts / packages/tokens/src:**`
  )
  for (const offender of literals.hexOffenders) {
    console.error(
      `        - ${offender.path}:${offender.line} -> "${offender.value}"`
    )
  }
  console.error(
    '\n      Move hex colors into packages/tokens, a *.constant.ts, or a *.styles.ts.'
  )
} else {
  console.log(
    `  [C] hex colors: OK — ${literals.scanned} unit(s) scanned, no inline hex literals.`
  )
}

// (D) reverse map coverage — FATAL.
if (!reverse.ok) {
  failed = true
  console.error(
    `\n  [D] reverse coverage: FAIL — ${reverse.uncovered.length} domain/screen(s) on disk not referenced in ${GLOBAL_MAP}:`
  )
  for (const stem of reverse.uncovered) {
    console.error(`        - "${stem}" exists on disk but is not referenced in docs/maps/global-map.md`)
  }
  console.error(
    '\n      Add a row for each missing domain/screen to docs/maps/global-map.md.'
  )
} else {
  console.log(
    `  [D] reverse coverage: OK — all on-disk domains/screens are referenced in ${GLOBAL_MAP}.`
  )
}

console.log('')

if (failed) {
  console.error('verify-maps: FAILED.\n')
  process.exit(1)
}

console.log('verify-maps: OK.\n')
