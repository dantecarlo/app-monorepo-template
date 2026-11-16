import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, test } from 'vitest'

import { themeNames } from '@/themeNames.constant'

// The committed web theme, the file the web app's Tailwind reads.
const THEME_CSS = join(import.meta.dirname, '..', '..', 'theme.css')

// Each namespace theme.css declares that feeds a utility, and that utility:
// the web's Tailwind 4 turns --<namespace>-<name> into it, with <name>.
const UTILITY_NAMESPACES = {
  color: 'every colour utility: bg-*, text-*, border-*, shadow-*',
  container: 'max-w-* and w-*',
  ease: 'ease-*',
  font: 'font-*, the family',
  radius: 'rounded-*',
  shadow: 'shadow-*, the size',
  spacing: 'p-*, m-*, gap-*, the insets and the sizes',
  text: 'text-*, the size'
} as const

// Each namespace theme.css declares that feeds no utility, and why. Its
// variables are read through var() alone, so themeNames leaves it out and
// tailwind-merge has nothing of it to merge.
const VARIABLE_ONLY_NAMESPACES = {
  duration:
    'Tailwind 4 builds duration-* from --transition-duration-*, so ' +
    '--duration-<name> makes no utility; globals.css reads it through var()'
} as const

const NAMESPACES = [
  ...Object.keys(UTILITY_NAMESPACES),
  ...Object.keys(VARIABLE_ONLY_NAMESPACES)
]

// Every variable of the @theme and @theme inline blocks, without its
// leading dashes. --text-amount--line-height is a modifier of --text-amount,
// not a name of its own, and the --c-* colours of the theme blocks are
// plain custom properties, not a Tailwind namespace.
const declared = () =>
  [
    ...readFileSync(THEME_CSS, 'utf8').matchAll(
      /@theme(?: inline)? \{([^}]*)\}/g
    )
  ]
    .flatMap(([, body]) =>
      [...body.matchAll(/--([\w-]+):/g)].map(([, variable]) => variable)
    )
    .filter((variable) => !variable.includes('--'))

// The longest namespace a variable starts with: font-weight-* would be
// font-weight, not font.
const namespaceOf = (variable: string) =>
  NAMESPACES.filter((namespace) =>
    variable.startsWith(`${namespace}-`)
  ).sort((left, right) => right.length - left.length)[0]

describe('theme names', () => {
  test('names every token utility theme.css declares, and nothing it does not', () => {
    const variables = declared()
    const namesIn = (namespace: string) =>
      variables
        .filter((variable) => namespaceOf(variable) === namespace)
        .map((variable) => variable.slice(namespace.length + 1))
        .sort()

    expect(variables).not.toHaveLength(0)
    expect(
      variables.filter((variable) => namespaceOf(variable) === undefined)
    ).toEqual([])
    expect(themeNames).toEqual(
      Object.fromEntries(
        Object.keys(UTILITY_NAMESPACES)
          .map((namespace) => [namespace, namesIn(namespace)])
          .filter(([, names]) => names.length > 0)
      )
    )
  })

  test('leaves out a namespace whose variables make no utility, by its rule', () => {
    const variables = declared()

    Object.entries(VARIABLE_ONLY_NAMESPACES).forEach(
      ([namespace, reason]) => {
        expect(
          variables.some(
            (variable) => namespaceOf(variable) === namespace
          ),
          `theme.css declares --${namespace}-*`
        ).toBe(true)
        expect(themeNames, reason).not.toHaveProperty(namespace)
      }
    )
  })
})
