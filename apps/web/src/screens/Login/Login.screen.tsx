'use client'

import type { JSX } from 'react'

import { AuthField } from '@/components/ui/AuthField/AuthField.component'
import { AuthShell } from '@/components/ui/AuthShell/AuthShell.component'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { SocialAuthButton } from '@/components/ui/SocialAuthButton/SocialAuthButton.component'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import { useLoginForm } from '@/screens/Login/hooks/useLoginForm.hook'
import { LOGIN_FIELD_ID } from '@/screens/Login/Login.constant'
import { LOGIN } from '@/screens/Login/Login.style'

export const LoginScreen = (): JSX.Element => {
  const { t } = useAppTranslator()
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
      brandLabel={t('app.name')}
      subtitle={t('auth.login.subtitle')}
      title={t('auth.login.title')}
    >
      <form className={LOGIN.FORM} onSubmit={onSubmit}>
        <AuthField
          autoComplete="email"
          helperText={
            errors.email === undefined ? undefined : t(errors.email)
          }
          hidePasswordLabel={t('auth.login.hidePassword')}
          id={LOGIN_FIELD_ID.EMAIL}
          isError={errors.email !== undefined}
          label={t('auth.login.emailLabel')}
          onChange={onEmailChange}
          placeholder={t('auth.login.emailPlaceholder')}
          showPasswordLabel={t('auth.login.showPassword')}
          type="email"
          value={values.email}
        />

        <AuthField
          autoComplete="current-password"
          helperText={
            errors.password === undefined ? undefined : t(errors.password)
          }
          hidePasswordLabel={t('auth.login.hidePassword')}
          id={LOGIN_FIELD_ID.PASSWORD}
          isError={errors.password !== undefined}
          isPassword
          label={t('auth.login.passwordLabel')}
          onChange={onPasswordChange}
          placeholder={t('auth.login.passwordPlaceholder')}
          showPasswordLabel={t('auth.login.showPassword')}
          value={values.password}
        />

        <Button disabled={isSubmitting} fullWidth type="submit">
          {isSubmitting ? t('auth.login.submitting') : t('auth.login.cta')}
        </Button>
      </form>

      <Divider
        className={LOGIN.DIVIDER}
        label={t('auth.login.dividerOr')}
      />

      <SocialAuthButton
        label={t('auth.login.googleCta')}
        loadingLabel={t('auth.login.googleLoading')}
      />
    </AuthShell>
  )
}
