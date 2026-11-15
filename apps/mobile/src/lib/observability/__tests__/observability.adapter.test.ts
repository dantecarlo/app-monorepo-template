import { expect, test } from 'vitest'

import { observability } from '@/lib/observability/observability.adapter'

test('observability adapter satisfies the IObservabilityPort contract', () => {
  expect(typeof observability.captureError).toBe('function')
})

test('captureError does not throw', () => {
  expect(() =>
    observability.captureError({ error: new Error('test') })
  ).not.toThrow()
})
