import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { fontSize, glyphSize } from '@app/tokens'
import { twMerge } from 'tailwind-merge'
import { describe, expect, test } from 'vitest'

import { tv } from '@/components/ui/variants.helper'

// The Tailwind key of a token, as the tokens preset writes it: the token
// amountHero is the utility text-amount-hero.
const kebab = (key: string) =>
  key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

const TOKEN_FONT_SIZE_CLASSES = [
  ...Object.keys(fontSize),
  ...Object.keys(glyphSize)
].map((key) => `text-${kebab(key)}`)

const UI_DIR = join(import.meta.dirname, '..')

const styleFiles = () =>
  readdirSync(UI_DIR, { encoding: 'utf8', recursive: true })
    .filter((path) => path.endsWith('.style.ts'))
    .map((path) => ({
      path,
      source: readFileSync(join(UI_DIR, path), 'utf8')
    }))

describe('variants helper', () => {
  test('keeps every token font size beside a text colour', () => {
    for (const size of TOKEN_FONT_SIZE_CLASSES) {
      const variants = tv({
        base: `${size} text-text-primary`,
        variants: { tone: { success: 'text-success-text' } }
      })

      expect(variants({ tone: 'success' })).toBe(
        `${size} text-success-text`
      )
    }
  })

  test('lets a later token font size replace an earlier one', () => {
    const variants = tv({
      base: 'text-button text-accent-ink',
      variants: { size: { lg: 'text-heading' } }
    })

    expect(variants({ size: 'lg' })).toBe('text-accent-ink text-heading')
  })

  test('merges every other class as tailwind-merge does by default', () => {
    const base = 'px-2 text-text-primary bg-bg-base'
    const tone = 'px-4 text-success-text rounded-md'
    const variants = tv({ base, variants: { tone: { success: tone } } })

    expect(variants({ tone: 'success' })).toBe(twMerge(base, tone))
  })

  test('is the tv every ui block builds its variants with', () => {
    const files = styleFiles()
    const builders = files.filter(({ source }) => source.includes('tv('))
    const direct = files
      .filter(({ source }) => source.includes("from 'tailwind-variants'"))
      .map(({ path }) => path)

    expect(builders).not.toHaveLength(0)
    expect(direct).toEqual([])
  })
})
