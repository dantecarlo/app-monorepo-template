// ---------------------------------------------------------------------------
// projection-manifest — renders the whole projection in memory, compares it
// with the tree on disk, and renders `.agents/projection-manifest.json`, the
// sha256 of every output. The writer and the checker both start here; only the
// writer writes.
//
// Ported from Certifipago's scripts/agent-harness/projection-manifest.mjs.
// ---------------------------------------------------------------------------

import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { renderAdapterProjection } from './adapters.mjs'
import {
  CLAUDE_AGENTS_DIRECTORY,
  renderClaudeProjection
} from './claude-projection.mjs'

// Directories a generator OWNS. Everything inside is compared as a complete
// tree, so a stray file nobody renders is drift the same way a missing one is.
// A target whose outputs sit beside files this harness does not own (`.github/`
// holds workflows too) is scoped to its own subdirectory instead.
const OWNED_DIRECTORIES = [
  { directory: CLAUDE_AGENTS_DIRECTORY, extension: '.md' },
  { directory: '.opencode/agents', extension: '.md' },
  { directory: '.codex/agents', extension: '.toml' },
  { directory: '.github/agents', extension: '.md' }
]
const SINGLE_FILE_OUTPUTS = ['opencode.json', '.codex/config.toml']

export const MANIFEST_PATH = '.agents/projection-manifest.json'

const GENERATED_BY = 'scripts/agent-harness/generate.mjs'
const JSON_INDENT = 2

const sha256 = ({ value }) =>
  createHash('sha256').update(value).digest('hex')

// A projection that exists on disk but is not COMMITTED passes every
// filesystem check here and is absent from a fresh clone. A `.gitignore` line
// written when a config was machine-specific swallows the generated one
// silently, leaving the gate green in the worktree and red on main.
export const untrackedOutputs = ({ rendered, tracked }) =>
  [...rendered.keys()].filter((path) => !tracked.includes(path)).sort()

export const readProjectedFile = ({ path, root }) =>
  readFileSync(join(root, path), 'utf8').replaceAll('\r\n', '\n')

const renderProjection = ({ root }) =>
  new Map([
    ...renderClaudeProjection({ root }),
    ...renderAdapterProjection({ root })
  ])

/**
 * The projection is compared as a COMPLETE tree, not file by file. A renderer
 * that stops emitting a file, and a stray file nobody generates, are both
 * drift; checking only the files the renderer happens to produce would see
 * neither. So the comparison walks the union of both sides.
 */
export const compareProjection = ({ root }) => {
  const rendered = renderProjection({ root })
  const present = OWNED_DIRECTORIES.flatMap(({ directory, extension }) => {
    const absolute = join(root, directory)
    if (!existsSync(absolute)) return []
    return readdirSync(absolute)
      .filter((entry) => entry.endsWith(extension))
      .map((entry) => `${directory}/${entry}`)
  })
    // Single-file outputs are named by the renderer, so they are only "present"
    // when they exist — a directory walk would never see them.
    .concat(
      SINGLE_FILE_OUTPUTS.filter((path) => existsSync(join(root, path)))
    )

  const paths = [...new Set([...rendered.keys(), ...present])].sort()
  const changed = []
  const extra = []
  const missing = []

  paths.forEach((path) => {
    if (!rendered.has(path)) {
      extra.push(path)
      return
    }
    if (!present.includes(path)) {
      missing.push(path)
      return
    }
    if (readProjectedFile({ path, root }) !== rendered.get(path)) {
      changed.push(path)
    }
  })

  return { changed, extra, missing, rendered }
}

const buildManifest = ({ rendered }) => ({
  generatedBy: GENERATED_BY,
  outputs: Object.fromEntries(
    [...rendered.keys()]
      .sort()
      .map((path) => [path, sha256({ value: rendered.get(path) })])
  )
})

export const renderManifest = ({ rendered }) =>
  `${JSON.stringify(buildManifest({ rendered }), null, JSON_INDENT)}\n`
