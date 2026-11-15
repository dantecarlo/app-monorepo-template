import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, test, vi } from 'vitest'

import RootLayout from '@/app/layout'

interface IFontCallType {
  display: string
  src: { path: string; weight: string }[]
  variable: string
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

const fontCalls = () =>
  localFont.mock.calls.map(([options]) => options as IFontCallType)

const fontFor = (variable: string) =>
  fontCalls().find((options) => options.variable === variable)

describe('root layout fonts', () => {
  test('loads both families from files in the app, never from Google Fonts', () => {
    expect(googleFont).not.toHaveBeenCalled()
    expect(localFont).toHaveBeenCalledTimes(2)

    const paths = fontCalls().flatMap(({ src }) =>
      src.map(({ path }) => path)
    )
    for (const path of paths) {
      expect(path).toMatch(/^\.\/fonts\/.+\.ttf$/)
      expect(existsSync(join(APP_DIR, path))).toBe(true)
    }
  })

  test('keeps the font variables, the swap display and the weights', () => {
    const weightsOf = (variable: string) =>
      fontFor(variable)?.src.map(({ weight }) => weight)

    expect(fontFor('--font-montserrat')?.display).toBe('swap')
    expect(fontFor('--font-inter')?.display).toBe('swap')
    expect(weightsOf('--font-montserrat')).toEqual([
      '400',
      '500',
      '600',
      '700',
      '800'
    ])
    expect(weightsOf('--font-inter')).toEqual(['400', '500'])
  })

  test('puts both font variables on the html element', () => {
    const html = RootLayout({ children: null })

    expect(html.props.className).toBe(
      'variable--font-montserrat variable--font-inter'
    )
  })

  test('ships the OFL licence of both families beside the files', () => {
    const licence = readFileSync(join(APP_DIR, 'fonts', 'OFL.txt'), 'utf8')

    expect(licence).toContain('Copyright 2020 The Inter Project Authors')
    expect(licence).toContain(
      'Copyright 2011 The Montserrat Project Authors'
    )
    expect(licence).toContain('SIL OPEN FONT LICENSE Version 1.1')
  })
})
