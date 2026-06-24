'use client'

import { useTranslations } from 'next-intl'
import type { JSX } from 'react'

import { Button } from '@/components/ui/Button/Button.component'
import { ErrorStateCodeEnum } from '@/components/ui/ErrorState/ErrorState.constant'
import { errorStateVariants } from '@/components/ui/ErrorState/ErrorState.styles'
import { ErrorStateIcon } from '@/components/ui/ErrorState/ErrorStateIcon.component'

export interface IErrorStateProps {
  code?: ErrorStateCodeEnum
  error?: unknown
  message?: string
  onRetry?: () => void
  resetErrorBoundary?: () => void
  title?: string
}

export const ErrorState = ({
  code,
  message,
  onRetry,
  resetErrorBoundary,
  title
}: IErrorStateProps): JSX.Element => {
  const t = useTranslations('components.errorState')
  const {
    action,
    container,
    iconWrapper,
    message: msgClass,
    title: titleClass
  } = errorStateVariants()

  const resolvedTitle =
    title ?? (code !== undefined ? t(`byCode.${code}.title`) : t('title'))
  const resolvedMessage =
    message ??
    (code !== undefined ? t(`byCode.${code}.message`) : t('message'))

  const handleRetry = onRetry ?? resetErrorBoundary

  return (
    <div aria-live="assertive" className={container()} role="alert">
      <div className={iconWrapper()}>
        <ErrorStateIcon />
      </div>
      <p className={titleClass()}>{resolvedTitle}</p>
      <p className={msgClass()}>{resolvedMessage}</p>
      {handleRetry !== undefined && (
        <div className={action()}>
          <Button onClick={handleRetry} size="sm" variant="secondary">
            {t('retry')}
          </Button>
        </div>
      )}
    </div>
  )
}
