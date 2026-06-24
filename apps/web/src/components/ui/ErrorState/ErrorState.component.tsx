'use client'

import { useTranslations } from 'next-intl'
import type { JSX } from 'react'

import { Button } from '@/components/ui/Button/Button.component'
import { ErrorStateCodeEnum } from '@/components/ui/ErrorState/ErrorState.constant'
import { errorStateVariants } from '@/components/ui/ErrorState/ErrorState.styles'

export interface IErrorStateProps {
  code?: ErrorStateCodeEnum
  error?: unknown
  message?: string
  onRetry?: () => void
  resetErrorBoundary?: () => void
  title?: string
}

const AlertTriangleIcon = (): JSX.Element => (
  <svg
    aria-hidden="true"
    fill="none"
    height={28}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
    width={28}
  >
    <path d="m10.29 3.86-8.2 14.2A2 2 0 0 0 3.77 21h16.46a2 2 0 0 0 1.68-3.09l-8.2-14.2a2 2 0 0 0-3.42 0z" />
    <line x1="12" x2="12" y1="9" y2="13" />
    <line x1="12" x2="12.01" y1="17" y2="17" />
  </svg>
)

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
        <AlertTriangleIcon />
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
