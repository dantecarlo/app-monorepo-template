import type { IObservabilityPort } from '@app/core'
import { expect, test, vi } from 'vitest'

import { toCaptureError } from '@/lib/observability/toCaptureError.helper'

test('forwards error and context to captureError', () => {
  const captureError = vi.fn()
  const obs: IObservabilityPort = { captureError }
  const handler = toCaptureError({ observability: obs })
  const error = new Error('test')
  const ctx = { queryKey: ['items'], source: 'queryCache' }

  handler(error, ctx)

  expect(captureError).toHaveBeenCalledOnce()
  expect(captureError).toHaveBeenCalledWith({ context: ctx, error })
})

test('works with only source in context (no queryKey)', () => {
  const captureError = vi.fn()
  const obs: IObservabilityPort = { captureError }
  const handler = toCaptureError({ observability: obs })

  handler(new Error('mutation'), { source: 'mutationCache' })

  expect(captureError).toHaveBeenCalledWith({
    context: { source: 'mutationCache' },
    error: expect.any(Error)
  })
})
