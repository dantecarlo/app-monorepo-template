// ---------------------------------------------------------------------------
// verify-english cases: one synthetic file or allowlist per failure branch,
// and the ones that must fire nothing.
//
// Every planted Spanish text is written with Unicode escapes, or one word
// per line, so this file holds no Spanish line of its own.
//
// Used by: verify-english.test.mjs.
// ---------------------------------------------------------------------------

const NOTES_PATH = 'docs/notes.md'
const OTHER_PATH = 'docs/other.md'
const CATALOG_TEXT = [
  '{',
  '  "greeting": "\u00a1Hola!",',
  '  "saved": "Guardado con \u00e9xito"',
  '}'
].join('\n')
const SPANISH_SENTENCE = [
  'Esta',
  'prueba',
  'debe',
  'fallar',
  'porque',
  'no',
  'hay',
  'nada',
  'en',
  'ingles'
].join(' ')
const ENGLISH_TEXT = [
  '# Notes',
  'TODO: delete the cons of this approach, then queue the paragraph.',
  'const para = 1 // one Spanish-looking word alone is not a sentence',
  'integrity: sha512-QuE/LoS+uNa9 // mixed-case runs are not words',
  '\u4e2d\u6587\u754c\u9762 // Chinese UI text is not Spanish'
].join('\n')
const NAME_LINE = 'Author: Jos\u00e9'
const REASON = 'a person the fixture needs by name'

// The 16 characters only Spanish writes, one case each below, so a
// character dropped from the detector fails the case that names it.
const SPANISH_CHARACTERS = [
  ...('\u00a1\u00bf\u00c1\u00c9\u00cd\u00d1\u00d3\u00da' +
    '\u00dc\u00e1\u00e9\u00ed\u00f1\u00f3\u00fa\u00fc')
]
// An o followed by a combining acute accent: the same word as the
// precomposed one once the line is normalised to NFC.
const DECOMPOSED_WORD = 'configuracio\u0301n'
// Two listed words, each on its own line so this file holds no Spanish
// line of its own.
const LISTED_WORD = 'para'
const OTHER_LISTED_WORD = 'porque'
const HEX_RADIX = 16
const CODE_POINT_DIGITS = 4

const file = ({ path = NOTES_PATH, text }) => ({ path, text })

const context =
  ({ allowlist = [], files }) =>
  () => ({ allowlist, files })

const codePointName = ({ character }) =>
  `U+${character
    .codePointAt(0)
    .toString(HEX_RADIX)
    .toUpperCase()
    .padStart(CODE_POINT_DIGITS, '0')}`

const characterCase = ({ character }) => ({
  context: context({
    files: [file({ text: `Planted ${character} here.` })]
  }),
  expected: 1,
  name: `the Spanish character ${codePointName({ character })} fires`
})

export const ENGLISH_CASES = [
  {
    context: context({ files: [file({ text: SPANISH_SENTENCE })] }),
    expected: 1,
    name: 'a planted Spanish sentence without accents fires'
  },
  {
    context: context({
      files: [file({ text: 'The release ships the cat\u00e1logo first.' })]
    }),
    expected: 1,
    name: 'a planted accented word fires'
  },
  {
    context: context({
      files: [file({ text: 'Status: \u00c9XITO' })]
    }),
    expected: 1,
    name: 'an upper-case accented letter fires'
  },
  {
    context: context({
      files: [
        file({ path: 'apps/web/src/i18n/es.json', text: CATALOG_TEXT })
      ]
    }),
    expected: 2,
    name: 'a catalog outside packages/i18n/src/locales/ fires once per line'
  },
  {
    context: context({ files: [file({ text: ENGLISH_TEXT })] }),
    expected: 0,
    name: 'English text, code words and Chinese UI text fire nothing'
  },
  {
    context: context({
      files: [
        file({
          path: 'packages/i18n/src/locales/es.json',
          text: CATALOG_TEXT
        })
      ]
    }),
    expected: 0,
    name: 'a file under the translation catalogs fires nothing'
  },
  {
    context: context({
      files: [file({ text: `binary\u0000${SPANISH_SENTENCE}` })]
    }),
    expected: 0,
    name: 'a file holding a NUL byte is skipped as binary'
  },
  {
    context: context({
      allowlist: [{ path: NOTES_PATH, reason: REASON, text: NAME_LINE }],
      files: [file({ text: NAME_LINE })]
    }),
    expected: 0,
    name: 'a line the allowlist names by its text fires nothing'
  },
  {
    context: context({
      allowlist: [
        { path: NOTES_PATH, pattern: '^Author: ', reason: REASON }
      ],
      files: [file({ text: `${NAME_LINE}\n  ${NAME_LINE}s` })]
    }),
    expected: 0,
    name: 'an allowlist pattern excuses every line it matches'
  },
  {
    context: context({
      allowlist: [{ path: NOTES_PATH, reason: REASON, text: NAME_LINE }],
      files: [file({ text: 'Author: Joseph' })]
    }),
    expected: 1,
    name: 'a stale allowlist entry fires'
  },
  {
    context: context({
      allowlist: [{ path: OTHER_PATH, reason: REASON, text: NAME_LINE }],
      files: [file({ text: NAME_LINE })]
    }),
    expected: 2,
    name: 'an entry for another file excuses nothing and is stale'
  },
  {
    context: context({
      allowlist: [{ path: NOTES_PATH, text: NAME_LINE }],
      files: [file({ text: 'English only.' })]
    }),
    expected: 1,
    name: 'an allowlist entry without a reason fires'
  },
  {
    context: context({
      allowlist: [
        {
          path: NOTES_PATH,
          pattern: '^A',
          reason: REASON,
          text: NAME_LINE
        }
      ],
      files: [file({ text: 'English only.' })]
    }),
    expected: 1,
    name: 'an allowlist entry with both a text and a pattern fires'
  },
  {
    context: context({
      allowlist: [{ path: NOTES_PATH, pattern: '(', reason: REASON }],
      files: [file({ text: 'English only.' })]
    }),
    expected: 1,
    name: 'an allowlist pattern that is not a regular expression fires'
  },
  {
    context: context({
      allowlist: { entries: [] },
      files: [file({ text: 'English only.' })]
    }),
    expected: 1,
    name: 'an allowlist that is not an array fires'
  },
  {
    context: context({
      files: [file({ text: `The ${DECOMPOSED_WORD} screen` })]
    }),
    expected: 1,
    name: 'a decomposed accented word fires once normalised to NFC'
  },
  {
    context: context({
      files: [
        file({ text: `Ship ${LISTED_WORD} and ${OTHER_LISTED_WORD} now` })
      ]
    }),
    expected: 1,
    name: 'exactly two distinct listed words fire'
  },
  {
    context: context({
      files: [file({ text: `Ship ${LISTED_WORD} now` })]
    }),
    expected: 0,
    name: 'a single listed word fires nothing'
  },
  {
    context: context({
      files: [file({ text: `Ship ${LISTED_WORD} and ${LISTED_WORD} now` })]
    }),
    expected: 0,
    name: 'one listed word written twice fires nothing'
  },
  ...SPANISH_CHARACTERS.map((character) => characterCase({ character }))
]
