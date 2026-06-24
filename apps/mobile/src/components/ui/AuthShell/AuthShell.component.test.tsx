import { describe, expect, test } from 'vitest'

import { AuthShell } from '@/components/ui/AuthShell/AuthShell.component'

describe('AuthShell', () => {
  test('is exported as a function', () => {
    expect(typeof AuthShell).toBe('function')
  })
})
