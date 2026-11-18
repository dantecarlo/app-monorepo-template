'use client'

import type { JSX } from 'react'

import { asyncBoundaryVariants } from '@/components/ui/AsyncBoundary/AsyncBoundary.style'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'

export const AsyncBoundaryDefaultLoading = (): JSX.Element => {
  const { t } = useAppTranslator()
  const { loadingWrapper, spinner } = asyncBoundaryVariants()
  return (
    <div aria-busy="true" className={loadingWrapper()} role="status">
      <span aria-hidden="true" className={spinner()} />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  )
}
