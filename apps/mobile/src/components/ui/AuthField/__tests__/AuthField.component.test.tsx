import { describe, expect, test } from 'vitest'

import { AuthField } from '@/components/ui/AuthField/AuthField.component'

describe('AuthField', () => {
  test('is exported as a function', () => {
    expect(typeof AuthField).toBe('function')
  })
})
