'use client'

import { useTranslations } from 'next-intl'
import type { JSX } from 'react'
import type { FallbackProps } from 'react-error-boundary'

export const AsyncBoundaryDefaultError = ({
  error,
  resetErrorBoundary
}: FallbackProps): JSX.Element => {
  const t = useTranslations()

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
