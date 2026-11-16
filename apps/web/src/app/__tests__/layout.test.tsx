import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { DEFAULT_LANGUAGE } from '@app/i18n'
import { fontFamily, webFontVariable } from '@app/tokens'
import type { ReactElement, ReactNode } from 'react'
import { Children, isValidElement } from 'react'
import { describe, expect, test, vi } from 'vitest'

import RootLayout from '@/app/layout'
import { NO_FLASH_LOCALE_SCRIPT } from '@/i18n/noFlashLocale.constant'

interface IFontCallType {
  display: string
  src: string
  variable: string
  weight: string
}

// next/font is a build-time loader; the test records what the layout asks it
// for, and hands back the class each loader would put on the html element.
const { googleFont, localFont } = vi.hoisted(() => {
  const loader = ({ variable }: { variable: string }) => ({
    className: 'font',
    style: { fontFamily: 'font' },
    variable: `variable${variable}`
  })
  return { googleFont: vi.fn(loader), localFont: vi.fn(loader) }
})

vi.mock('next/font/google', () => ({
  Inter: googleFont,
  Montserrat: googleFont
}))
vi.mock('next/font/local', () => ({ default: localFont }))

// The folder of the layout, which next/font/local resolves each src against.
const APP_DIR = join(import.meta.dirname, '..')

// What both families may weigh together. Google Fonts serves each as one Latin
// variable woff2 of about 40 KB; the full-charset static files weighed 1.6 MB.
const FONT_PAYLOAD_LIMIT_BYTES = 128 * 1024

// The first four bytes of every woff2 file.
const WOFF2_SIGNATURE = 'wOF2'

const fontCalls = () =>
  localFont.mock.calls.map(([options]) => options as IFontCallType)

const fontFor = (variable: string) =>
  fontCalls().find((options) => options.variable === variable)

interface IScriptPropsType {
  dangerouslySetInnerHTML?: { __html: string }
}

// Every element of a rendered tree, depth first, read from its children.
const elementsOf = (node: ReactNode): ReactElement[] =>
  Children.toArray(node).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child)
      ? [child, ...elementsOf(child.props.children)]
      : []
  )

const licenceOf = (family: string) =>
  readFileSync(join(APP_DIR, 'fonts', `${family}-OFL.txt`), 'utf8')

describe('root layout document', () => {
  test('writes the default language and the locale script in the static shell', () => {
    const html = RootLayout({ children: null })
    const inlineScripts = elementsOf(html.props.children)
      .filter((element) => element.type === 'script')
      .map(
        (element) =>
          (element.props as IScriptPropsType).dangerouslySetInnerHTML
            ?.__html
      )

    expect(html.props.lang).toBe(DEFAULT_LANGUAGE)
    expect(inlineScripts).toContain(NO_FLASH_LOCALE_SCRIPT)
  })
})

describe('root layout fonts', () => {
  test('loads both families from files in the app, never from Google Fonts', () => {
    expect(googleFont).not.toHaveBeenCalled()
    expect(localFont).toHaveBeenCalledTimes(2)

    for (const { src } of fontCalls()) {
      expect(src).toMatch(/^\.\/fonts\/.+\.woff2$/)
      expect(existsSync(join(APP_DIR, src))).toBe(true)
    }
  })

  test('ships one variable woff2 per family, small enough to preload', () => {
    const files = fontCalls().map(({ src }) => join(APP_DIR, src))
    const bytes = files.reduce(
      (total, file) => total + statSync(file).size,
      0
    )

    expect(new Set(files).size).toBe(2)
    files.forEach((file) =>
      expect(readFileSync(file).subarray(0, 4).toString('latin1')).toBe(
        WOFF2_SIGNATURE
      )
    )
    expect(bytes).toBeLessThan(FONT_PAYLOAD_LIMIT_BYTES)
  })

  test('keeps the font variables, the swap display and the weights', () => {
    expect(fontFor('--font-montserrat')?.display).toBe('swap')
    expect(fontFor('--font-inter')?.display).toBe('swap')
    expect(fontFor('--font-montserrat')?.weight).toBe('400 800')
    expect(fontFor('--font-inter')?.weight).toBe('400 500')
  })

  test('loads each family under the variable the generated theme reads', () => {
    Object.entries(webFontVariable).forEach(([role, variable]) => {
      const family = fontFamily[role as keyof typeof fontFamily]

      expect(fontFor(variable)?.src).toContain(`/${family.toLowerCase()}-`)
    })
  })

  test('puts both font variables on the html element', () => {
    const html = RootLayout({ children: null })

    expect(html.props.className).toBe(
      'variable--font-montserrat variable--font-inter'
    )
  })

  test('ships the OFL licence of both families beside the files', () => {
    expect(licenceOf('inter')).toContain(
      'Copyright 2020 The Inter Project Authors'
    )
    expect(licenceOf('montserrat')).toContain(
      'Copyright 2024 The Montserrat.Git Project Authors'
    )
    ;['inter', 'montserrat'].forEach((family) =>
      expect(licenceOf(family)).toContain(
        'SIL OPEN FONT LICENSE Version 1.1'
      )
    )
  })
})
