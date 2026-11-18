import { View } from 'react-native'

import { AuthField } from '@/components/ui/AuthField/AuthField.component'
import { AuthShell } from '@/components/ui/AuthShell/AuthShell.component'
import { Button } from '@/components/ui/Button/Button.component'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import { useLoginForm } from '@/screens/Login/hooks/useLoginForm.hook'
import { LOGIN_STYLES as styles } from '@/screens/Login/Login.style'

export const LoginScreen = () => {
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
      <View style={styles.form}>
        <AuthField
          autoCapitalize="none"
          autoComplete="email"
          helperText={
            errors.email === undefined ? undefined : t(errors.email)
          }
          hidePasswordLabel={t('auth.login.hidePassword')}
          isError={errors.email !== undefined}
          keyboardType="email-address"
          label={t('auth.login.emailLabel')}
          onChangeText={onEmailChange}
          placeholder={t('auth.login.emailPlaceholder')}
          showPasswordLabel={t('auth.login.showPassword')}
          value={values.email}
        />

        <AuthField
          autoComplete="password"
          helperText={
            errors.password === undefined ? undefined : t(errors.password)
          }
          hidePasswordLabel={t('auth.login.hidePassword')}
          isError={errors.password !== undefined}
          isPassword
          label={t('auth.login.passwordLabel')}
          onChangeText={onPasswordChange}
          placeholder={t('auth.login.passwordPlaceholder')}
          showPasswordLabel={t('auth.login.showPassword')}
          value={values.password}
        />

        <View style={styles.submitSpacing}>
          <Button
            fullWidth
            isLoading={isSubmitting}
            onPress={onSubmit}
            variant="primary"
          >
            {t('auth.login.cta')}
          </Button>
        </View>
      </View>
    </AuthShell>
  )
}
