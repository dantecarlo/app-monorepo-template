'use client'

import type { JSX } from 'react'

import { Button } from '@/components/ui/Button/Button.component'
import { errorStateVariants } from '@/components/ui/ErrorState/ErrorState.style'
import type { IErrorStateProps } from '@/components/ui/ErrorState/ErrorState.type'
import { ErrorStateIcon } from '@/components/ui/ErrorState/ErrorStateIcon.component'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'

export const ErrorState = ({
  code,
  message,
  onRetry,
  resetErrorBoundary,
  title
}: IErrorStateProps): JSX.Element => {
  const { t } = useAppTranslator()
  const {
    action,
    container,
    iconWrapper,
    message: msgClass,
    title: titleClass
  } = errorStateVariants()

  const resolvedTitle =
    title ??
    (code !== undefined
      ? t(`components.errorState.byCode.${code}.title`)
      : t('components.errorState.title'))
  const resolvedMessage =
    message ??
    (code !== undefined
      ? t(`components.errorState.byCode.${code}.message`)
      : t('components.errorState.message'))

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
            {t('components.errorState.retry')}
          </Button>
        </div>
      )}
    </div>
  )
}
