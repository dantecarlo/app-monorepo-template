'use client'

import type { JSX } from 'react'

import { emptyStateVariants } from '@/components/ui/EmptyState/EmptyState.style'
import type { IEmptyStateProps } from '@/components/ui/EmptyState/EmptyState.type'
import { EmptyStateIcon } from '@/components/ui/EmptyState/EmptyStateIcon.component'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'

export const EmptyState = ({
  cta,
  message,
  title
}: IEmptyStateProps): JSX.Element => {
  const { t } = useAppTranslator()
  const {
    container,
    ctaWrapper,
    iconWrapper,
    message: msgClass,
    title: titleClass
  } = emptyStateVariants()

  return (
    <div className={container()}>
      <div className={iconWrapper()}>
        <EmptyStateIcon />
      </div>
      <p className={titleClass()}>
        {title ?? t('components.emptyState.title')}
      </p>
      <p className={msgClass()}>
        {message ?? t('components.emptyState.message')}
      </p>
      {cta !== undefined && <div className={ctaWrapper()}>{cta}</div>}
    </div>
  )
}
