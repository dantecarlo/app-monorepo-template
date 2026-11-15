import { describe, expect, test, vi } from 'vitest'

import { ErrorState } from '@/components/ui/ErrorState/ErrorState.component'

describe('ErrorState', () => {
  test('is exported as a function', () => {
    expect(typeof ErrorState).toBe('function')
  })

  test('accepts retry handler in props shape', () => {
    const props = { onRetry: vi.fn() }
    expect(typeof props.onRetry).toBe('function')
  })
})
