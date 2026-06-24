import { describe, expect, test } from 'vitest'

import { GoogleGlyph } from '@/components/ui/SocialAuthButton/GoogleGlyph.component'

describe('GoogleGlyph', () => {
  test('is exported as a function', () => {
    expect(typeof GoogleGlyph).toBe('function')
  })
})
