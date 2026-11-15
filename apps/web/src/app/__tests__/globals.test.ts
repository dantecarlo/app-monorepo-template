import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

import { describe, expect, test } from 'vitest'

// The web package root, where the Tailwind config sits next to package.json.
const APP_DIR = join(import.meta.dirname, '..', '..', '..')
const requireFromApp = createRequire(join(APP_DIR, 'package.json'))

describe('web CSS entry', () => {
  test('loads the tokens preset through the CSS entry', () => {
    const css = readFileSync(join(APP_DIR, 'src/app/globals.css'), 'utf8')
    const config = requireFromApp('./tailwind.config.cjs')

    expect(css).toContain("@config '../../tailwind.config.cjs';")
    expect(config.presets).toHaveLength(1)
    expect(config.presets[0]).toBe(
      requireFromApp('@app/tokens/tailwind-preset.cjs')
    )
  })
})
