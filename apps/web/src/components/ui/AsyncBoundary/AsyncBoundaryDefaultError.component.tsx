'use client'

import type { JSX } from 'react'
import type { FallbackProps } from 'react-error-boundary'

import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'

export const AsyncBoundaryDefaultError = ({
  error,
  resetErrorBoundary
}: FallbackProps): JSX.Element => {
  const { t } = useAppTranslator()

  return (
    <div aria-live="assertive" role="alert">
      <p>
        {error instanceof Error
          ? error.message
          : t('helper.error.generic')}
      </p>
      <button onClick={resetErrorBoundary} type="button">
        {t('common.retry')}
      </button>
    </div>
  )
}
