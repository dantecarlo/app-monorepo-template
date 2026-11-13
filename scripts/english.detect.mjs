// ---------------------------------------------------------------------------
// Shared detection for verify-english. Not a gate — it exports the rule as
// pure functions over the text of the tracked files and the allowlist, so
// every branch is drivable from a synthetic string.
//
// A line reads as Spanish when it holds a character only Spanish writes among
// the languages found in this repository — an n with a tilde, an inverted
// question or exclamation mark, an a, e, i, o or u with an acute accent, a u
// with a diaeresis, in either case — or two or more distinct Spanish function
// words, each a whole word written in lower case, capitalised or in capitals.
// A run of letters mixed with digits or in mixed case, such as base64, is not
// a word. Each line is normalised to NFC first, so a vowel written as a base
// letter plus a combining accent reads as the accented vowel it shows. Every
// such character below is a Unicode escape and the words sit one per line, so
// this file passes the rule it states.
//
// The words leave out those English or code also uses: `todo`, `del`, `con`,
// `solo`, `algo`. A lone Spanish word is not a sentence, so it passes.
//
// The translation catalogs are the one place Spanish belongs. Elsewhere, a
// line that must keep it is listed in ALLOWLIST_PATH as
// `{ "path", "text" | "pattern", "reason" }`: `text` is the whole line,
// trimmed; `pattern` is a regular expression tested on the trimmed line. The
// allowlist is judged like any other file, so an entry writes a Spanish-only
// character as a JSON Unicode escape, and matches a line of plain Spanish
// words with a `pattern` on a fragment of it.
// ---------------------------------------------------------------------------

export const ALLOWLIST_PATH = 'scripts/verify-english.allow.json'
export const EXCLUDED_PATHS = ['packages/i18n/src/locales/']

const NUL = '\u0000'
const LINE_BREAK = /\r?\n/u
const SPANISH_CHARACTER =
  /[\u00a1\u00bf\u00c1\u00c9\u00cd\u00d1\u00d3\u00da\u00dc\u00e1\u00e9\u00ed\u00f1\u00f3\u00fa\u00fc]/u
const TOKEN = /[\p{L}\p{N}]+/gu
const WORD_SHAPE = /^(?:\p{Lu}?\p{Ll}+|\p{Lu}+)$/u
const WORD_THRESHOLD = 2
const NORMAL_FORM = 'NFC'
const EXCERPT_LENGTH = 120
const HEX_RADIX = 16
const CODE_POINT_DIGITS = 4
const MATCHERS = ['pattern', 'text']

export const SPANISH_WORDS = new Set([
  'ademas',
  'ahora',
  'algun',
  'alguna',
  'antes',
  'aqui',
  'asi',
  'aunque',
  'bien',
  'cada',
  'como',
  'cosa',
  'cosas',
  'cuando',
  'debe',
  'deben',
  'deberia',
  'deberiamos',
  'dejar',
  'desde',
  'despues',
  'donde',
  'ello',
  'ellos',
  'entonces',
  'entre',
  'esa',
  'ese',
  'eso',
  'esta',
  'estamos',
  'estan',
  'estas',
  'este',
  'esto',
  'estos',
  'hacer',
  'hasta',
  'hay',
  'hemos',
  'las',
  'los',
  'luego',
  'mejor',
  'mientras',
  'mismo',
  'mucho',
  'muchos',
  'muy',
  'nada',
  'necesito',
  'ninguna',
  'nosotros',
  'nuestra',
  'nuestro',
  'nunca',
  'otra',
  'otro',
  'para',
  'pero',
  'poco',
  'podemos',
  'por',
  'porque',
  'puede',
  'pueden',
  'puedes',
  'pues',
  'que',
  'quieres',
  'quiero',
  'siempre',
  'sino',
  'sobre',
  'tambien',
  'tanto',
  'tengo',
  'tiene',
  'tienen',
  'tienes',
  'todavia',
  'una',
  'unas',
  'unos',
  'usted',
  'vamos',
  'vez'
])

const isText = ({ value }) =>
  typeof value === 'string' && value.trim() !== ''

const codePoint = ({ character }) =>
  `U+${character
    .codePointAt(0)
    .toString(HEX_RADIX)
    .toUpperCase()
    .padStart(CODE_POINT_DIGITS, '0')}`

const spanishWords = ({ line }) => [
  ...new Set(
    (line.match(TOKEN) ?? [])
      .filter((token) => WORD_SHAPE.test(token))
      .map((token) => token.toLowerCase())
      .filter((word) => SPANISH_WORDS.has(word))
  )
]

// Why a line reads as Spanish, or null when it does not.
const spanishReason = ({ line }) => {
  const character = line.match(SPANISH_CHARACTER)
  if (character) {
    return `holds the Spanish character ${codePoint({ character: character[0] })}`
  }
  const words = spanishWords({ line })
  return words.length >= WORD_THRESHOLD
    ? `holds the Spanish words ${words.join(', ')}`
    : null
}

const isExcluded = ({ path }) =>
  EXCLUDED_PATHS.some((prefix) => path.startsWith(prefix))

// The files the rule judges: every one outside the catalogs that holds no
// NUL byte, the mark of a binary file.
export const judgedFiles = ({ files }) =>
  files.filter(
    ({ path, text }) => !isExcluded({ path }) && !text.includes(NUL)
  )

// Every Spanish line of the judged files, with its 1-based number, its
// trimmed text in NFC and the reason it reads as Spanish.
export const findSpanishLines = ({ files }) =>
  judgedFiles({ files }).flatMap(({ path, text }) =>
    text.split(LINE_BREAK).flatMap((raw, index) => {
      const line = raw.normalize(NORMAL_FORM)
      const reason = spanishReason({ line })
      return reason === null
        ? []
        : [{ line: index + 1, path, reason, text: line.trim() }]
    })
  )

const isPattern = ({ value }) => {
  try {
    return new RegExp(value, 'u') instanceof RegExp
  } catch {
    return false
  }
}

// What is wrong with one allowlist entry, or null when it is well formed.
const entryProblem = ({ entry }) => {
  if (
    entry === null ||
    typeof entry !== 'object' ||
    Array.isArray(entry)
  ) {
    return 'is not an object'
  }
  if (!isText({ value: entry.path })) return 'names no `path`'
  if (!isText({ value: entry.reason })) return 'gives no `reason`'
  const matchers = MATCHERS.filter((key) => entry[key] !== undefined)
  if (matchers.length !== 1)
    return 'needs exactly one of `text` or `pattern`'
  const [matcher] = matchers
  if (!isText({ value: entry[matcher] }))
    return `has an empty \`${matcher}\``
  if (matcher === 'pattern' && !isPattern({ value: entry.pattern })) {
    return 'has a `pattern` that is not a valid regular expression'
  }
  return null
}

const excuses = ({ entry, hit }) =>
  entry.path === hit.path &&
  (entry.text === undefined
    ? new RegExp(entry.pattern, 'u').test(hit.text)
    : entry.text.normalize(NORMAL_FORM).trim() === hit.text)

const excerpt = ({ text }) =>
  text.length > EXCERPT_LENGTH
    ? `${text.slice(0, EXCERPT_LENGTH)}...`
    : text

const entryName = ({ entry, index }) =>
  isText({ value: entry?.path })
    ? `${ALLOWLIST_PATH} entry ${index + 1} (${entry.path})`
    : `${ALLOWLIST_PATH} entry ${index + 1}`

// The findings of the rule: each Spanish line no entry excuses, each malformed
// entry, and each well-formed entry that excuses no line.
export const collectEnglishFindings = ({ allowlist, files }) => {
  const shapeFindings = Array.isArray(allowlist)
    ? []
    : [{ detail: `${ALLOWLIST_PATH} must hold a JSON array of entries.` }]
  const entries = (Array.isArray(allowlist) ? allowlist : []).map(
    (entry, index) => ({ entry, index, problem: entryProblem({ entry }) })
  )
  const valid = entries.filter(({ problem }) => problem === null)
  const hits = findSpanishLines({ files })
  const used = new Set()

  const lineFindings = hits.flatMap((hit) => {
    const excusing = valid.filter(({ entry }) => excuses({ entry, hit }))
    excusing.forEach(({ index }) => used.add(index))
    return excusing.length > 0
      ? []
      : [
          {
            detail:
              `${hit.path}:${hit.line}: ${hit.reason}. Translate it to ` +
              `English, or list it with its reason in ${ALLOWLIST_PATH}: ` +
              excerpt({ text: hit.text })
          }
        ]
  })
  const entryFindings = entries.flatMap(({ entry, index, problem }) => {
    if (problem !== null) {
      return [{ detail: `${entryName({ entry, index })} ${problem}.` }]
    }
    return used.has(index)
      ? []
      : [
          {
            detail:
              `${entryName({ entry, index })} excuses no Spanish line; ` +
              'remove it.'
          }
        ]
  })

  return [...shapeFindings, ...lineFindings, ...entryFindings]
}
