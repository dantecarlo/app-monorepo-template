#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-unicode-safety — no tracked text file holds a character its reader
// cannot see.
//
// A zero-width character, a direction embedding, override or isolate, a tag
// character or an invisible filler renders as nothing, or reorders what
// renders, so a line can say one thing to the person who reviews it and
// another to the agent or the compiler that reads it. A vendored skill or a
// pulled change can carry one in unseen, so the gate refuses each of them in
// every tracked text file.
//
// It lists the tracked files with `git ls-files`, skips a file holding a NUL
// byte, the mark of a binary file, and reads the rest as UTF-8. The one
// character allowed somewhere is the zero-width joiner, U+200D, inside the
// translation catalogs (packages/i18n/src/locales/), where it builds an emoji
// sequence such as a family. A finding names the file, the line, the column,
// counted in code points from 1, and the code point.
//
// Usage:
//   node scripts/verify-unicode-safety.mjs [--root <directory>]
// ---------------------------------------------------------------------------

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineGate, reportGate } from './gate/gate.mjs'
import { gitFreeEnv } from './git-free-env.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT_FLAG = '--root'
const NOT_FOUND = -1
const PATH_SEPARATOR = '\0'
const GIT_OUTPUT_LIMIT = 64 * 1024 * 1024
const NUL_BYTE = 0
const LINE_BREAK = '\n'
const HEX_RADIX = 16
const CODE_POINT_DIGITS = 4
const FIRST_POSITION = 1

const KIND = Object.freeze({
  direction: 'a direction embedding, override or isolate',
  filler: 'an invisible filler',
  tag: 'a tag character',
  zeroWidth: 'a zero-width character'
})

// The refused characters, as inclusive ranges in the order the claims name
// them; a single character is a range of one.
const INVISIBLE = [
  { first: 0x200b, kind: KIND.zeroWidth, last: 0x200d },
  { first: 0x2060, kind: KIND.zeroWidth, last: 0x2060 },
  { first: 0xfeff, kind: KIND.zeroWidth, last: 0xfeff },
  { first: 0x202a, kind: KIND.direction, last: 0x202e },
  { first: 0x2066, kind: KIND.direction, last: 0x2069 },
  { first: 0xe0000, kind: KIND.tag, last: 0xe007f },
  { first: 0x115f, kind: KIND.filler, last: 0x1160 },
  { first: 0x3164, kind: KIND.filler, last: 0x3164 },
  { first: 0xffa0, kind: KIND.filler, last: 0xffa0 }
]

// The zero-width joiner builds an emoji sequence, and a translation catalog
// may hold one in its copy.
const JOINER = 0x200d
const JOINER_HOME = 'packages/i18n/src/locales/'

const hexOf = ({ codePoint }) =>
  codePoint.toString(HEX_RADIX).toUpperCase().padStart(CODE_POINT_DIGITS, '0')

const nameOf = ({ codePoint }) => `U+${hexOf({ codePoint })}`

const rangeSource = ({ first, last }) =>
  first === last
    ? `\\u{${hexOf({ codePoint: first })}}`
    : `\\u{${hexOf({ codePoint: first })}}-\\u{${hexOf({ codePoint: last })}}`

const INVISIBLE_SOURCE = `[${INVISIBLE.map(rangeSource).join('')}]`
const ANY_INVISIBLE = new RegExp(INVISIBLE_SOURCE, 'u')

const kindOf = ({ codePoint }) =>
  INVISIBLE.find(({ first, last }) => codePoint >= first && codePoint <= last)
    .kind

const isAllowed = ({ codePoint, path }) =>
  codePoint === JOINER && path.startsWith(JOINER_HOME)

const rangesOf = ({ kind }) =>
  INVISIBLE.filter((range) => range.kind === kind)
    .map(({ first, last }) =>
      first === last
        ? nameOf({ codePoint: first })
        : `${nameOf({ codePoint: first })} to ${nameOf({ codePoint: last })}`
    )
    .join(', ')

const lineFindings = ({ line, number, path }) =>
  [...line.matchAll(new RegExp(INVISIBLE_SOURCE, 'gu'))].flatMap((match) => {
    const codePoint = match[0].codePointAt(0)
    if (isAllowed({ codePoint, path })) return []
    const column = [...line.slice(0, match.index)].length + FIRST_POSITION
    const kind = kindOf({ codePoint })
    return [
      {
        codePoint,
        column,
        detail: `${path}:${number}:${column}: ${nameOf({ codePoint })}, ${kind}`,
        kind,
        line: number,
        path
      }
    ]
  })

const fileFindings = ({ path, text }) =>
  ANY_INVISIBLE.test(text)
    ? text
        .split(LINE_BREAK)
        .flatMap((line, index) =>
          lineFindings({ line, number: index + FIRST_POSITION, path })
        )
    : []

export const gate = defineGate({
  claims:
    'no tracked text file holds a zero-width character ' +
    `(${rangesOf({ kind: KIND.zeroWidth })}), a direction embedding, ` +
    `override or isolate (${rangesOf({ kind: KIND.direction })}), a tag ` +
    `character (${rangesOf({ kind: KIND.tag })}) or an invisible filler ` +
    `(${rangesOf({ kind: KIND.filler })}), except the zero-width joiner ` +
    `${nameOf({ codePoint: JOINER })} under ${JOINER_HOME}, where it builds ` +
    'an emoji sequence; each finding names the file, the line, the column ' +
    'and the code point.',
  id: 'verify-unicode-safety',
  notCovered:
    'files git does not track; a file holding a NUL byte, skipped as ' +
    'binary, a UTF-16 text file among them; bytes that are not UTF-8, read ' +
    'as replacement characters; the other invisible or look-alike ' +
    'characters, such as the left-to-right and right-to-left marks ' +
    '(U+200E, U+200F), the soft hyphen (U+00AD), the variation selectors ' +
    'and a letter of another script that looks like a Latin one; an ' +
    'escape such as \\u200B written in source, which stays visible; and ' +
    'what earlier commits hold.',
  run: ({ files }) => files.flatMap(fileFindings)
})

const listTrackedFiles = ({ root }) => {
  const result = spawnSync('git', ['ls-files', '-z'], {
    cwd: root,
    encoding: 'utf8',
    env: gitFreeEnv(),
    maxBuffer: GIT_OUTPUT_LIMIT
  })
  // A git that never started (none on the path, or the output past the
  // buffer) leaves no exit status and no stderr, only the error.
  if (result.error) {
    throw new Error(
      'verify-unicode-safety cannot run git to list the tracked files: ' +
        result.error.message
    )
  }
  if (result.status !== 0) {
    throw new Error(
      `verify-unicode-safety lists the tracked files with git, which exited ${result.status}: ` +
        result.stderr.trim()
    )
  }
  return result.stdout.split(PATH_SEPARATOR).filter((path) => path !== '')
}

const isFile = ({ path }) => existsSync(path) && statSync(path).isFile()

const isBinary = ({ bytes }) => bytes.includes(NUL_BYTE)

// Reads every tracked file that is on disk, and splits off the binary ones,
// so the denominator says how many were skipped.
export const collectContext = ({ root }) => {
  const read = listTrackedFiles({ root }).flatMap((path) => {
    const absolute = join(root, path)
    return isFile({ path: absolute })
      ? [{ bytes: readFileSync(absolute), path }]
      : []
  })
  return {
    binary: read.filter(isBinary).map(({ path }) => path),
    files: read
      .filter((file) => !isBinary(file))
      .map(({ bytes, path }) => ({ path, text: bytes.toString('utf8') }))
  }
}

const readRoot = () => {
  const index = process.argv.indexOf(ROOT_FLAG)
  return index === NOT_FOUND
    ? resolve(HERE, '..')
    : resolve(process.argv[index + 1])
}

const main = () => {
  const context = collectContext({ root: readRoot() })

  reportGate({
    context,
    denominator:
      `${context.files.length} tracked text file(s), and ` +
      `${context.binary.length} binary file(s) holding a NUL byte skipped`,
    gate
  })
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(HERE, 'verify-unicode-safety.mjs')
) {
  main()
}
