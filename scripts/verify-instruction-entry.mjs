#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-instruction-entry — every session starts from AGENTS.md.
//
// AGENTS.md is the single instruction file every runtime reads, and
// README.md the index a reader opens first. A root file that is gone is a
// finding of its own: a walk that skips an absent file reports green over
// its absence.
//
// Claude Code reads AGENTS.md as the project instructions only while no
// CLAUDE.md, .claude/CLAUDE.md or CLAUDE.local.md sits in the working
// directory or above it, and reads that file alone when one does. Every path
// git lists for the repository (tracked, or not added yet and not ignored)
// is matched by name, in any folder and in any case, so one is a finding
// wherever it sits: a session started in that folder or below it would
// never read AGENTS.md.
//
// Usage:
//   node scripts/verify-instruction-entry.mjs [--root <directory>]
// ---------------------------------------------------------------------------

import { spawnSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineGate, reportGate } from './gate/gate.mjs'
import { gitFreeEnv } from './git-free-env.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT_FLAG = '--root'
const PATH_SEPARATOR = '\0'
const GIT_OUTPUT_LIMIT = 64 * 1024 * 1024

// What a session reads first.
const ENTRY_FILES = ['AGENTS.md', 'README.md']

export const FINDING_KIND = Object.freeze({
  blocking: 'blocking',
  missing: 'missing'
})

// A file Claude Code reads INSTEAD of AGENTS.md: a CLAUDE.md, in a folder or
// in its .claude/, or a CLAUDE.local.md. Matched by file name in any folder
// and in any case, as a case-insensitive disk answers CLAUDE.md for a
// claude.md.
const BLOCKING_NAME = /(?:^|\/)claude(?:\.local)?\.md$/iu

const describeMissing = ({ path }) =>
  `${path} is not there — a session that starts from it loads no project ` +
  'instructions, and nothing else reports the file gone'

const describeBlocking = ({ path }) =>
  `${path} is in the repository — Claude Code reads AGENTS.md as the ` +
  'project instructions only while no CLAUDE.md, .claude/CLAUDE.md or ' +
  'CLAUDE.local.md sits in the working directory or above it, so a ' +
  'session working in this folder or below it reads this file and not ' +
  'AGENTS.md; the rules live in AGENTS.md, so delete it'

export const gate = defineGate({
  claims:
    `${ENTRY_FILES.join(' and ')} exist at the repository root, and no ` +
    'path git lists for the repository, tracked or not added yet and not ' +
    'ignored, is named CLAUDE.md or CLAUDE.local.md in any folder and any ' +
    'case, .claude/CLAUDE.md included, since Claude Code reads such a file ' +
    'instead of AGENTS.md.',
  id: 'verify-instruction-entry',
  notCovered:
    'a CLAUDE.md the repository does not list: one in a folder above the ' +
    'repository root or in the home directory, and a CLAUDE.local.md a ' +
    '.gitignore ignores, both of which Claude Code still reads; what ' +
    'AGENTS.md says, and whether its links and @-imports resolve; and the ' +
    'instruction files other runtimes read beside AGENTS.md.',
  run: ({ entries, files }) => [
    ...entries
      .filter(({ exists }) => !exists)
      .map(({ name }) => ({
        detail: describeMissing({ path: name }),
        kind: FINDING_KIND.missing,
        path: name
      })),
    ...files
      .filter((path) => BLOCKING_NAME.test(path))
      .map((path) => ({
        detail: describeBlocking({ path }),
        kind: FINDING_KIND.blocking,
        path
      }))
  ]
})

// What git lists for the repository: tracked files, and files not added yet
// that no .gitignore ignores.
const listRepositoryFiles = ({ root }) => {
  const result = spawnSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    {
      cwd: root,
      encoding: 'utf8',
      env: gitFreeEnv(),
      maxBuffer: GIT_OUTPUT_LIMIT
    }
  )
  if (result.status !== 0) {
    throw new Error(
      `verify-instruction-entry lists the repository files with git: ${result.stderr}`
    )
  }
  return result.stdout.split(PATH_SEPARATOR).filter((path) => path !== '')
}

const isFile = ({ path }) => existsSync(path) && statSync(path).isFile()

// Gathers what `run` decides on, so a case drives it from a tree of its own.
// `listFiles` returns the repository's paths; git answers it unless a caller
// supplies its own.
export const collectContext = ({
  listFiles = listRepositoryFiles,
  root
}) => ({
  entries: ENTRY_FILES.map((name) => ({
    exists: isFile({ path: join(root, name) }),
    name
  })),
  files: listFiles({ root })
})

const readRoot = () => {
  const index = process.argv.indexOf(ROOT_FLAG)
  return index === -1
    ? resolve(HERE, '..')
    : resolve(process.argv[index + 1])
}

const main = () => {
  const context = collectContext({ root: readRoot() })

  reportGate({
    context,
    denominator:
      `${context.files.length} path(s) git lists and ` +
      `${context.entries.length} root instruction file(s)`,
    gate
  })
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) ===
    resolve(HERE, 'verify-instruction-entry.mjs')
) {
  main()
}
