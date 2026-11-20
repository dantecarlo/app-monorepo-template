// ---------------------------------------------------------------------------
// mentions — the rule path a command names anywhere in its text. The guard
// reads it only for a command it cannot read: the main session, a writer
// and an unlisted agent are asked about such a command when it names a rule
// path, and left alone otherwise.
//
// The text is split on the separators of Bash and PowerShell, on `=` (an
// `--output=` value) and on a `:` past a drive (`HEAD:AGENTS.md`, an NTFS
// stream); `~`, `$HOME`, `${HOME}`, `$env:USERPROFILE` and `%USERPROFILE%`
// before a separator are read as the home folder. Each piece is read as a
// path against the folder the command runs in, the way paths.mjs reads a
// target, so a link or a short name to a rule file is one too; a piece it
// cannot read, an option and one holding an unset variable are skipped. A
// folder that holds rule files counts, the root excepted.
//
// Past MAX_MENTIONS distinct pieces the text is too long to read this way,
// and the caller asks: the cap keeps the hook inside its timeout.
// ---------------------------------------------------------------------------

import {
  expandGlob,
  GLOB_MODE,
  hasGlob,
  patternRule
} from './globs.mjs'
import { cachedClassify, isDeadline } from './paths.mjs'
import { ruleOf } from './target.mjs'

export const MAX_MENTIONS = 256

const SEPARATORS = /[\s'"`;&|<>(){}[\],=]+/u
const HOME_SPELLINGS =
  /(?:\$\{HOME\}|\$HOME|\$env:USERPROFILE|\$env:HOME|%USERPROFILE%)(?=[\\/])/giu
const TILDE = /^~(?=[\\/]|$)/u
const DRIVE_HEAD = /^[a-zA-Z]:[\\/]/u
const STREAM_OR_REVISION = ':'
const UNSET = /[$%]/u

// The pieces of one word: a `:` splits it, except the one after a drive.
const piecesOf = ({ word }) => {
  const head = DRIVE_HEAD.test(word) ? word.slice(0, 2) : ''
  const [first, ...rest] = word
    .slice(head.length)
    .split(STREAM_OR_REVISION)
  return [`${head}${first}`, ...rest]
}

const readable = ({ piece }) =>
  piece !== '' && !piece.startsWith('-') && !UNSET.test(piece)

const NUL = String.fromCharCode(0)
const BACKSLASH = String.fromCharCode(92)

const literalRule = ({ cwd, host, piece, policy }) =>
  ruleOf({
    holds: true,
    policy,
    where: cachedClassify({ cwd, host, text: piece })
  })

// A piece with a wildcard is what it matches on the disk, or, when the
// guard cannot expand it, the rule its pattern could name.
const globRule = ({ cwd, host, piece, policy }) => {
  const pattern = piece.replaceAll(BACKSLASH, '/')
  const matches = expandGlob({ cwd, host, pattern })
  if (matches === undefined) {
    return patternRule({ cwd, host, mode: GLOB_MODE.bash, pattern, policy })
  }
  return matches.reduce(
    (found, match) =>
      found ?? literalRule({ cwd, host, piece: match, policy }),
    undefined
  )
}

const ruleNamed = ({ cwd, host, piece, policy }) => {
  try {
    return hasGlob({ pattern: piece })
      ? globRule({ cwd, host, piece, policy })
      : literalRule({ cwd, host, piece, policy })
  } catch (error) {
    if (isDeadline({ error })) throw error
    // A spelling the guard cannot read names nothing it can judge.
    return undefined
  }
}

/**
 * The first rule path `text` names, as { rule, token }; { tooLong: true }
 * when it holds more distinct pieces than the guard reads and none of the
 * first ones is one; undefined when it names none.
 */
export const namedRule = ({ cwd, host, policy, text }) => {
  const home = host.homeDir
  const expanded =
    typeof home === 'string' && home !== ''
      ? text.replace(HOME_SPELLINGS, () => home)
      : text
  const pieces = [
    ...new Set(
      expanded
        .replaceAll(NUL, ' ')
        .split(SEPARATORS)
        .flatMap((word) => piecesOf({ word }))
        .map((piece) =>
          typeof home === 'string' && home !== ''
            ? piece.replace(TILDE, () => home)
            : piece
        )
        .filter((piece) => readable({ piece }))
    )
  ]
  let named
  pieces.slice(0, MAX_MENTIONS).some((piece) => {
    const rule = ruleNamed({ cwd, host, piece, policy })
    if (rule !== undefined) named = { rule, token: piece }
    return rule !== undefined
  })
  if (named !== undefined) return named
  return pieces.length > MAX_MENTIONS ? { tooLong: true } : undefined
}
