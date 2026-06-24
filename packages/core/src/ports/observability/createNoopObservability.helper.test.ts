import { expect, test } from 'vitest'

import { createNoopObservability } from './createNoopObservability.helper'

test('captureError is callable and returns undefined', () => {
  const adapter = createNoopObservability()
  expect(
    adapter.captureError({ error: new Error('test') })
  ).toBeUndefined()
})

test('captureMessage is callable and returns undefined', () => {
  const adapter = createNoopObservability()
  expect(adapter.captureMessage?.({ message: 'test' })).toBeUndefined()
})

test('captureError does not throw with no context', () => {
  const adapter = createNoopObservability()
  expect(() => adapter.captureError({ error: null })).not.toThrow()
})

test('captureError does not throw with context', () => {
  const adapter = createNoopObservability()
  expect(() =>
    adapter.captureError({
      context: { source: 'test' },
      error: new Error('boom')
    })
  ).not.toThrow()
})
