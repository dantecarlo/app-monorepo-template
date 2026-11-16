import { describe, expect, test, vi } from 'vitest'

import { renderHook } from '@/test/test.helper'

const { mockCaptureError } = vi.hoisted(() => ({
  mockCaptureError: vi.fn()
}))

vi.mock('@/lib/observability/observability.adapter', () => ({
  observability: { captureError: mockCaptureError }
}))

import { BOUNDARY_ERROR_SOURCE } from '@/lib/observability/observability.constant'
import { useReportBoundaryError } from '@/lib/observability/useReportBoundaryError.hook'

describe('useReportBoundaryError', () => {
  test('reports the error once across re-renders', () => {
    const error = new Error('render failed')
    const { rerender } = renderHook(() =>
      useReportBoundaryError({ error })
    )

    rerender()
    rerender()

    expect(mockCaptureError).toHaveBeenCalledOnce()
    expect(mockCaptureError).toHaveBeenCalledWith({
      context: { source: BOUNDARY_ERROR_SOURCE },
      error
    })
  })
})
