import {
  type IObservabilityPortHarness,
  runObservabilityPortContract
} from '@app/tooling/observability-port-contract'
import { describe, expect, test } from 'vitest'

import { createNoopObservability } from '#src/ports/observability/createNoopObservability.helper'

// The no-op adapter has no provider behind it: nothing may reach one.
const noopHarness: IObservabilityPortHarness = {
  create: () => createNoopObservability(),
  currentUser: () => null,
  delivered: () => [],
  delivers: false
}

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

describe('the observability port contract', () => {
  runObservabilityPortContract({ harness: noopHarness, test })
})
