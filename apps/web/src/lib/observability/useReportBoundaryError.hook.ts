'use client'

import { useEffect } from 'react'

import { observability } from '@/lib/observability/observability.adapter'
import { reportBoundaryError } from '@/lib/observability/reportBoundaryError.helper'
import type { IUseReportBoundaryErrorParams } from '@/lib/observability/reportBoundaryError.type'

/** Reports the error a boundary renders to observability, once. */
export const useReportBoundaryError = ({
  error
}: IUseReportBoundaryErrorParams): void => {
  useEffect(() => {
    reportBoundaryError({ digest: error.digest, error, observability })
  }, [error])
}
