import { describe, expect, test } from 'vitest'

import { GlassCard } from '@/components/ui/GlassCard/GlassCard.component'

describe('GlassCard', () => {
  test('is exported as a function', () => {
    expect(typeof GlassCard).toBe('function')
  })
})
