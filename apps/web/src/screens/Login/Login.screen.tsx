'use client'

import { useTranslations } from 'next-intl'
import type { JSX } from 'react'

import { AuthField } from '@/components/ui/AuthField/AuthField.component'
import { AuthShell } from '@/components/ui/AuthShell/AuthShell.component'
import { SocialAuthButton } from '@/components/ui/SocialAuthButton/SocialAuthButton.component'
import { useLoginForm } from '@/screens/Login/hooks/useLoginForm.hook'
import { LOGIN_FIELD_ID } from '@/screens/Login/Login.constant'
import { LOGIN } from '@/screens/Login/Login.styles'

export const LoginScreen = (): JSX.Element => {
  const t = useTranslations('auth.login')
  const tApp = useTranslations('app')
  const {
    errors,
    isSubmitting,
    onEmailChange,
    onPasswordChange,
    onSubmit,
    values
  } = useLoginForm()

  return (
    <AuthShell
      brandLabel={tApp('name')}
      subtitle={t('subtitle')}
      title={t('title')}
    >
      <form className={LOGIN.FORM} onSubmit={onSubmit}>
        <AuthField
          autoComplete="email"
          helperText={
            errors.email === undefined ? undefined : t(errors.email)
          }
          hidePasswordLabel={t('hidePassword')}
          id={LOGIN_FIELD_ID.EMAIL}
          isError={errors.email !== undefined}
          label={t('emailLabel')}
          onChange={onEmailChange}
          placeholder={t('emailPlaceholder')}
          showPasswordLabel={t('showPassword')}
          type="email"
          value={values.email}
        />

        <AuthField
          autoComplete="current-password"
          helperText={
            errors.password === undefined ? undefined : t(errors.password)
          }
          hidePasswordLabel={t('hidePassword')}
          id={LOGIN_FIELD_ID.PASSWORD}
          isError={errors.password !== undefined}
          isPassword
          label={t('passwordLabel')}
          onChange={onPasswordChange}
          placeholder={t('passwordPlaceholder')}
          showPasswordLabel={t('showPassword')}
          value={values.password}
        />

        <button
          className={LOGIN.SUBMIT}
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? t('submitting') : t('cta')}
        </button>
      </form>

      <div className={LOGIN.DIVIDER}>
        <span className={LOGIN.DIVIDER_LINE} />
        <span className={LOGIN.DIVIDER_TEXT}>{t('dividerOr')}</span>
        <span className={LOGIN.DIVIDER_LINE} />
      </div>

      <SocialAuthButton
        label={t('googleCta')}
        loadingLabel={t('googleLoading')}
      />
    </AuthShell>
  )
}
