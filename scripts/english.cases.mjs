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

const file = ({ path = NOTES_PATH, text }) => ({ path, text })

const context =
  ({ allowlist = [], files }) =>
  () => ({ allowlist, files })

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
  }
]
