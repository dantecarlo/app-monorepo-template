import type { IObservabilityPort } from '@app/core'
import { describe, expect, test, vi } from 'vitest'

import { BOUNDARY_ERROR_SOURCE } from '@/lib/observability/observability.constant'
import { reportBoundaryError } from '@/lib/observability/reportBoundaryError.helper'

const makePort = () => {
  const captureError = vi.fn()
  const observability: IObservabilityPort = { captureError }
  return { captureError, observability }
}

describe('reportBoundaryError', () => {
  test('captures an error once however often it is reported', () => {
    const { captureError, observability } = makePort()
    const error = new Error('render failed')

    reportBoundaryError({ error, observability })
    reportBoundaryError({ error, observability })

    expect(captureError).toHaveBeenCalledOnce()
    expect(captureError).toHaveBeenCalledWith({
      context: { source: BOUNDARY_ERROR_SOURCE },
      error
    })
  })

  test('captures each distinct error', () => {
    const { captureError, observability } = makePort()
    const first = new Error('first crash')
    const second = new Error('second crash')

    reportBoundaryError({ error: first, observability })
    reportBoundaryError({ error: second, observability })
    reportBoundaryError({ error: first, observability })

    expect(captureError).toHaveBeenCalledTimes(2)
    expect(captureError).toHaveBeenNthCalledWith(1, {
      context: { source: BOUNDARY_ERROR_SOURCE },
      error: first
    })
    expect(captureError).toHaveBeenNthCalledWith(2, {
      context: { source: BOUNDARY_ERROR_SOURCE },
      error: second
    })
  })
})
