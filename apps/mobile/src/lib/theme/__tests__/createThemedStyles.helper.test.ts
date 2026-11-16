import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

import { sharedColors, themes } from '@app/tokens'
import { describe, expect, test } from 'vitest'

import {
  createThemedStyles,
  createThemedValues
} from '@/lib/theme/createThemedStyles.helper'

const SRC = resolve(__dirname, '../../..')

// The folders whose files paint: the ui blocks, the containers beside them,
// and the screens' own components.
const PAINTING_ROOTS = ['components', 'screens']

const TESTS_FOLDER = '__tests__'

const SOURCE_FILE = /\.(ts|tsx)$/u

// A file that imports the static palette from the tokens.
const IMPORTS_STATIC_PALETTE =
  /import\s*\{[^}]*\bcolors\b[^}]*\}\s*from\s*'@app\/tokens'/u

const THEMED_KEYS = Object.keys(themes.dark).filter(
  (key) => !Object.hasOwn(sharedColors, key)
)

// `colors.<a themed key>`, or a direct read of one theme of the tokens.
const STATIC_THEMED_READ = new RegExp(
  String.raw`\bcolors\.(${THEMED_KEYS.join('|')})\b|\bthemes\.(dark|light)\b`,
  'u'
)

const walk = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) {
      return entry === TESTS_FOLDER ? [] : walk(path)
    }
    return SOURCE_FILE.test(entry) ? [path] : []
  })

describe('createThemedStyles', () => {
  test('builds one style sheet per theme from its palette', () => {
    const styles = createThemedStyles({
      build: (palette) => ({
        title: { color: palette.text.primary, marginTop: 4 }
      })
    })

    expect(styles.dark.title).toEqual({
      color: themes.dark.text.primary,
      marginTop: 4
    })
    expect(styles.light.title).toEqual({
      color: themes.light.text.primary,
      marginTop: 4
    })
  })

  test('builds one value per theme from its palette', () => {
    const values = createThemedValues({
      build: (palette) => ({ dot: palette.success })
    })

    expect(values).toEqual({
      dark: { dot: themes.dark.success },
      light: { dot: themes.light.success }
    })
  })

  test('leaves no block reading a themed colour from the static dark palette', () => {
    const offenders = PAINTING_ROOTS.flatMap((root) =>
      walk(join(SRC, root))
    )
      .filter((path) => {
        const text = readFileSync(path, 'utf8')
        return (
          IMPORTS_STATIC_PALETTE.test(text) &&
          STATIC_THEMED_READ.test(text)
        )
      })
      .map((path) => relative(SRC, path).split(sep).join('/'))

    expect(THEMED_KEYS.length).toBeGreaterThan(0)
    expect(offenders).toEqual([])
  })
})
