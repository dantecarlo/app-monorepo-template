'use client'

import { useTranslations } from 'next-intl'
import type { JSX } from 'react'

import { asyncBoundaryVariants } from '@/components/ui/AsyncBoundary/AsyncBoundary.style'

export const AsyncBoundaryDefaultLoading = (): JSX.Element => {
  const t = useTranslations('common')
  const { loadingWrapper, spinner } = asyncBoundaryVariants()
  return (
    <div aria-busy="true" className={loadingWrapper()} role="status">
      <span aria-hidden="true" className={spinner()} />
      <span className="sr-only">{t('loading')}</span>
    </div>
  )
}
