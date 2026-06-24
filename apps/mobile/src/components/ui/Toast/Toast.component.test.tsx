import { describe, expect, test } from 'vitest'

import { Toast } from './Toast.component'

describe('Toast (mobile)', () => {
  test('module exports Toast as a function', () => {
    expect(typeof Toast).toBe('function')
  })
})
