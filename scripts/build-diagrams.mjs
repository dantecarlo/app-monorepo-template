#!/usr/bin/env node
// ---------------------------------------------------------------------------
// build-diagrams — renders every checked-in diagram spec, then repaints the
// output with this project's design tokens.
//
// Two rules from the plan meet here:
//
//   Markdown first, HTML derived. A diagram spec is data next to the document
//   it illustrates; the HTML is output, never hand-edited.
//
//   Diagrams are generated, not drawn. Re-running this script from a clean
//   checkout must reproduce the same artifact, so the token repaint lives in
//   the pipeline and not in a one-off patch of the generated file.
//
// The renderer is the vendored `archify` skill (MIT, pinned in
// .claude/skills-lock.json). It emits a self-contained HTML with a small set of
// CSS variables, and those are the seam this script writes through.
//
// Usage:
//   node scripts/build-diagrams.mjs          # render every spec
//   node scripts/build-diagrams.mjs --check  # fail if any output is stale
// ---------------------------------------------------------------------------

import { execFileSync } from 'node:child_process'
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')
const DIAGRAM_DIR = resolve(REPO_ROOT, 'docs/diagrams')
const ARCHIFY = resolve(
  REPO_ROOT,
  '.claude/skills/archify/bin/archify.mjs'
)

const CHECK_ONLY = process.argv.includes('--check')

// The bridge between the renderer's variables and packages/tokens. Keep this
// table small: a variable that is not listed keeps the renderer's own value,
// which is the correct default for anything the design system does not own.
const TOKEN_BRIDGE = {
  '--accent': 'accent',
  '--bg': 'bgBase',
  '--text': 'textPrimary'
}

// Imports the token module itself (Node strips its type annotations), so a
// value is read by its path in the object, never by the first text match.
const readTokens = async () => {
  const { DEFAULT_THEME, themes } = await import(
    pathToFileURL(
      resolve(REPO_ROOT, 'packages/tokens/src/tokens.constant.ts')
    ).href
  )
  const palette = themes[DEFAULT_THEME]
  return {
    accent: palette.accent,
    bgBase: palette.bg.base,
    textPrimary: palette.text.primary
  }
}

const specFiles = () => {
  try {
    return readdirSync(DIAGRAM_DIR)
      .filter((name) => name.endsWith('.json'))
      .sort()
  } catch {
    return []
  }
}

const typeOf = ({ spec }) => spec.diagram_type

const repaint = ({ html, tokens }) => {
  const declarations = Object.entries(TOKEN_BRIDGE)
    .map(([cssVar, tokenKey]) => [cssVar, tokens[tokenKey]])
    .filter(([, value]) => typeof value === 'string' && value.length > 0)
    .map(([cssVar, value]) => `  ${cssVar}: ${value};`)

  if (declarations.length === 0) return html

  const block = [
    '<style data-generated-by="scripts/build-diagrams.mjs">',
    ':root {',
    ...declarations,
    '}',
    '</style>'
  ].join('\n')

  // Appended last so it wins the cascade without editing the renderer output.
  return html.includes('data-generated-by="scripts/build-diagrams.mjs"')
    ? html
    : html.replace('</head>', `${block}\n</head>`)
}

const tokens = await readTokens()
const specs = specFiles()

if (specs.length === 0) {
  console.log('build-diagrams: no specs in docs/diagrams — nothing to do.')
  process.exit(0)
}

const stale = []

for (const name of specs) {
  const specPath = join(DIAGRAM_DIR, name)
  const spec = JSON.parse(readFileSync(specPath, 'utf8'))
  const outPath = join(
    DIAGRAM_DIR,
    `${name.replace(/\.[^.]+\.json$/, '')}.html`
  )

  let before = null
  try {
    before = readFileSync(outPath, 'utf8')
  } catch {
    before = null
  }

  // A check renders beside the committed file, never over it: a check that
  // writes would quietly repair the drift it is meant to report.
  const scratch = CHECK_ONLY
    ? mkdtempSync(join(tmpdir(), 'diagram-'))
    : null
  const renderPath = scratch ? join(scratch, 'out.html') : outPath

  execFileSync(
    process.execPath,
    [
      ARCHIFY,
      'deliver',
      typeOf({ spec }),
      specPath,
      renderPath,
      '--quality',
      'showcase'
    ],
    { cwd: REPO_ROOT, stdio: CHECK_ONLY ? 'pipe' : 'inherit' }
  )

  const painted = repaint({
    html: readFileSync(renderPath, 'utf8'),
    tokens
  })

  if (scratch) {
    rmSync(scratch, { force: true, recursive: true })
  } else {
    writeFileSync(outPath, painted)
  }

  // Compare line-ending agnostic: with core.autocrlf a Windows checkout holds
  // the committed file as CRLF while the renderer emits LF.
  const normalize = (text) => (text ?? '').replace(/\r\n/g, '\n')
  if (CHECK_ONLY && normalize(before) !== normalize(painted)) {
    stale.push(outPath)
  }
}

if (CHECK_ONLY && stale.length > 0) {
  console.error(
    `\nbuild-diagrams: FAIL — ${stale.length} diagram(s) are stale:\n` +
      stale.map((p) => `  ${relative(REPO_ROOT, p)}`).join('\n') +
      '\n\nRun `pnpm docs:diagrams` and commit the result.\n'
  )
  process.exit(1)
}

console.log(
  `build-diagrams: ${specs.length} diagram(s) rendered and repainted with the project tokens.`
)
