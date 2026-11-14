#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-english — the template is written in English: no tracked text file
// outside the translation catalogs holds a Spanish line.
//
// It lists the tracked files with `git ls-files`, skips the ones with a known
// binary extension, and judges every line of the rest with the rule of
// english.detect.mjs, which also skips a file holding a NUL byte. A line that
// must keep Spanish is listed with its reason in
// scripts/verify-english.allow.json, and an entry that excuses no line fails,
// so the list can only shrink.
//
// Usage:
//   node scripts/verify-english.mjs
// ---------------------------------------------------------------------------

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  ALLOWLIST_PATH,
  collectEnglishFindings,
  EXCLUDED_PATHS,
  judgedFiles
} from './english.detect.mjs'
import { defineGate, reportGate } from './gate/gate.mjs'
import { gitFreeEnv } from './git-free-env.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')
const PATH_SEPARATOR = '\0'
const GIT_OUTPUT_LIMIT = 64 * 1024 * 1024
const BINARY_EXTENSIONS = new Set([
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.mp4',
  '.otf',
  '.pdf',
  '.png',
  '.ttf',
  '.webm',
  '.webp',
  '.woff',
  '.woff2',
  '.zip'
])

export const gate = defineGate({
  claims:
    'no tracked text file outside the translation catalogs ' +
    `(${EXCLUDED_PATHS.join(', ')}) holds a line with a Spanish-only ` +
    'character (an n with a tilde, an inverted question or exclamation ' +
    'mark, an accented vowel, a u with a diaeresis) or two or more ' +
    'distinct Spanish function words, unless an allowlist entry excuses it ' +
    'with a reason; and every allowlist entry is well formed and excuses ' +
    'at least one line.',
  id: 'verify-english',
  notCovered:
    'Spanish without accents in a line that holds fewer than two of the ' +
    'listed function words, such as a lone word or a short fixture label; ' +
    'languages other than Spanish; untracked files and files not encoded ' +
    'in UTF-8; and whether an allowlist reason is a good one, which only ' +
    'the pull request review judges.',
  run: ({ allowlist, files }) =>
    collectEnglishFindings({ allowlist, files })
})

const listTrackedFiles = () => {
  const result = spawnSync('git', ['ls-files', '-z'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: gitFreeEnv(),
    maxBuffer: GIT_OUTPUT_LIMIT
  })
  if (result.status !== 0) {
    throw new Error(
      `verify-english lists the tracked files with git: ${result.stderr}`
    )
  }
  return result.stdout.split(PATH_SEPARATOR).filter((path) => path !== '')
}

const readTrackedText = ({ paths }) =>
  paths.flatMap((path) => {
    if (BINARY_EXTENSIONS.has(extname(path).toLowerCase())) return []
    const absolute = join(REPO_ROOT, path)
    if (!existsSync(absolute) || !statSync(absolute).isFile()) return []
    return [{ path, text: readFileSync(absolute, 'utf8') }]
  })

const readAllowlist = () => {
  const absolute = join(REPO_ROOT, ALLOWLIST_PATH)
  return existsSync(absolute)
    ? JSON.parse(readFileSync(absolute, 'utf8'))
    : []
}

const main = () => {
  const files = readTrackedText({ paths: listTrackedFiles() })
  const allowlist = readAllowlist()
  const entries = Array.isArray(allowlist) ? allowlist.length : 0

  reportGate({
    context: { allowlist, files },
    denominator:
      `${judgedFiles({ files }).length} tracked text file(s) and ` +
      `${entries} allowlist entr${entries === 1 ? 'y' : 'ies'}`,
    gate
  })
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(HERE, 'verify-english.mjs')
) {
  main()
}
