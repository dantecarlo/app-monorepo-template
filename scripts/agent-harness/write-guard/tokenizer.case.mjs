// ---------------------------------------------------------------------------
// tokenizer.case — the tokenizer's reader of `case WORD in [(]PATTERN) LIST
// ;; ... esac`, read as a group: the subject's substitutions, every
// pattern's and every arm's commands are judged, since a substitution in a
// pattern runs when its arm is tested.
//
// It reads through the `cursor` tokenizer.mjs hands it: the position `at`,
// the source, and the parser's own readers.
//
// Ported from the case reader of Certifipago's
// .claude/scripts/enforce-agent-writes.mjs.
// ---------------------------------------------------------------------------

import { repeat, unreadable } from './scan.mjs'

// `case` at the start of a command, after any keyword that may precede it.
export const CASE_START =
  /(?:(?:then|do|else|elif|\{|!|time)[ \t]+)*case(?=[ \t\n])/y
const CASE_IN = /in(?=[\s;]|$)/y
const CASE_ARM_END = /;;&|;;|;&/y
const ESAC = /esac(?=[\s;&|)]|$)/y
const CASE_WORD = { parts: [{ lit: 'case', quoted: false }], raw: 'case' }

export const createCaseReader = ({ cursor: c }) => {
  const atEsac = () => {
    ESAC.lastIndex = c.at
    return ESAC.test(c.source)
  }

  // An arm ends at `;;`, `;&` or `;;&`, which is consumed, or at `esac`,
  // which is left for parseCase.
  const atArmEnd = () =>
    atEsac() || c.sticky({ pattern: CASE_ARM_END }) !== null

  // Blanks, newlines and comments between the arms of a `case`.
  const skipSpace = () => {
    repeat({
      bound: c.source.length,
      step: () => {
        c.skipBlanks()
        if (c.source[c.at] === '\n') {
          c.at += 1
          c.readHeredocs()
          return true
        }
        if (!c.atComment()) return false
        c.skipComment()
        return true
      }
    })
  }

  // `PATTERN | PATTERN )`, the optional `(` already consumed. The words are
  // kept: a substitution in a pattern runs when the arm is tested.
  const parsePatterns = () => {
    const patterns = []
    let closed = false
    repeat({
      bound: c.source.length,
      step: () => {
        c.skipBlanks()
        const before = c.at
        if (c.source[c.at] === ')') {
          c.at += 1
          closed = true
          return false
        }
        if (c.source[c.at] === '|') c.at += 1
        else patterns.push(c.parseWord())
        return c.at !== before
      }
    })
    if (!closed) unreadable({ problem: 'a case pattern with no )' })
    return patterns
  }

  const parseCase = () => {
    c.skipBlanks()
    const subject = c.parseWord()
    skipSpace()
    if (!c.sticky({ pattern: CASE_IN })) {
      unreadable({ problem: 'a case with no in' })
    }
    const script = [
      { op: ';', redirects: [], type: 'cmd', words: [CASE_WORD, subject] }
    ]
    let ended = false
    repeat({
      bound: c.source.length,
      step: () => {
        skipSpace()
        if (c.at >= c.source.length) return false
        if (c.sticky({ pattern: ESAC })) {
          ended = true
          return false
        }
        if (c.source[c.at] === '(') c.at += 1
        // Judged like the subject: substitutions only, under `case`.
        script.push({
          op: ';',
          redirects: [],
          type: 'cmd',
          words: [CASE_WORD, ...parsePatterns()]
        })
        script.push(...c.parseList({ closer: 'case' }))
        return true
      }
    })
    if (!ended) unreadable({ problem: 'an unterminated case' })
    return { op: '', redirects: [], script, type: 'group' }
  }

  return { atArmEnd, parseCase }
}
