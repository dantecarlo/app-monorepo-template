import { BOUNDARY_ERROR_SOURCE } from '@/lib/observability/observability.constant'
import type { IReportBoundaryErrorParams } from '@/lib/observability/reportBoundaryError.type'

// Every error object already reported. A boundary renders its caught error
// again on every re-render, and React runs a mount effect twice in strict
// mode, so the set keeps each crash to one report.
const REPORTED_ERRORS = new WeakSet<object>()

const isObject = (value: unknown): value is object =>
  typeof value === 'object' && value !== null

/**
 * Reports a crash an error boundary caught to the observability port, once
 * per error object. RootErrorBoundary calls it through
 * useReportBoundaryError; code-standards §19 keeps direct capture inside
 * src/lib/**. Mirrors apps/web/src/lib/observability/reportBoundaryError.helper.ts.
 */
export const reportBoundaryError = ({
  error,
  observability
}: IReportBoundaryErrorParams): void => {
  if (isObject(error)) {
    if (REPORTED_ERRORS.has(error)) return
    REPORTED_ERRORS.add(error)
  }
  observability.captureError({
    context: { source: BOUNDARY_ERROR_SOURCE },
    error
  })
}
