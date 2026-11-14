'use client'

import { useTranslations } from 'next-intl'
import type { JSX } from 'react'

import { emptyStateVariants } from '@/components/ui/EmptyState/EmptyState.style'
import type { IEmptyStateProps } from '@/components/ui/EmptyState/EmptyState.type'
import { EmptyStateIcon } from '@/components/ui/EmptyState/EmptyStateIcon.component'

export const EmptyState = ({
  cta,
  message,
  title
}: IEmptyStateProps): JSX.Element => {
  const t = useTranslations('components.emptyState')
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
      <p className={titleClass()}>{title ?? t('title')}</p>
      <p className={msgClass()}>{message ?? t('message')}</p>
      {cta !== undefined && <div className={ctaWrapper()}>{cta}</div>}
    </div>
  )
}
