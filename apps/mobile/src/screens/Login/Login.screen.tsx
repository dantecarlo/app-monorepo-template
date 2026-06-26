import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'

import { AuthField } from '@/components/ui/AuthField/AuthField.component'
import { AuthShell } from '@/components/ui/AuthShell/AuthShell.component'
import { Button } from '@/components/ui/Button/Button.component'
import { SocialAuthButton } from '@/components/ui/SocialAuthButton/SocialAuthButton.component'
import { useLoginForm } from '@/screens/Login/hooks/useLoginForm.hook'
import { LOGIN_STYLES as styles } from '@/screens/Login/Login.styles'

export const LoginScreen = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'auth.login' })
  const { t: tRoot } = useTranslation()
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
      brandLabel={tRoot('app.name')}
      subtitle={t('subtitle')}
      title={t('title')}
    >
      <View style={styles.form}>
        <AuthField
          autoCapitalize="none"
          autoComplete="email"
          helperText={
            errors.email === undefined ? undefined : t(errors.email)
          }
          hidePasswordLabel={t('hidePassword')}
          isError={errors.email !== undefined}
          keyboardType="email-address"
          label={t('emailLabel')}
          onChangeText={onEmailChange}
          placeholder={t('emailPlaceholder')}
          showPasswordLabel={t('showPassword')}
          value={values.email}
        />

        <AuthField
          autoComplete="password"
          helperText={
            errors.password === undefined ? undefined : t(errors.password)
          }
          hidePasswordLabel={t('hidePassword')}
          isError={errors.password !== undefined}
          isPassword
          label={t('passwordLabel')}
          onChangeText={onPasswordChange}
          placeholder={t('passwordPlaceholder')}
          showPasswordLabel={t('showPassword')}
          value={values.password}
        />

        <View style={styles.submitSpacing}>
          <Button
            fullWidth
            isLoading={isSubmitting}
            onPress={onSubmit}
            variant="primary"
          >
            {t('cta')}
          </Button>
        </View>
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t('dividerOr')}</Text>
        <View style={styles.dividerLine} />
      </View>

      <SocialAuthButton label={t('googleCta')} />
    </AuthShell>
  )
}
