import { useTranslation } from 'react-i18next'
import { Pressable, Text } from 'react-native'

import { LANGUAGE_SWITCHER_STYLES as styles } from '@/components/ui/LanguageSwitcher/LanguageSwitcher.styles'
import { useLanguageSwitcher } from '@/components/ui/LanguageSwitcher/useLanguageSwitcher.hook'
import { useThemeTokens } from '@/lib/theme/useThemeTokens.hook'

export interface ILanguageSwitcherProps {
  accessibilityLabel?: string
}

/** Cycles the active locale across SUPPORTED_LANGUAGES, persisting via AsyncStorage. */
export const LanguageSwitcher = ({
  accessibilityLabel
}: ILanguageSwitcherProps) => {
  const { t } = useTranslation()
  const { colors } = useThemeTokens()
  const { cycleLanguage, locale } = useLanguageSwitcher()

  return (
    <Pressable
      accessibilityLabel={
        accessibilityLabel ?? t('auth.languageSwitcher.label')
      }
      accessibilityRole="button"
      onPress={cycleLanguage}
      style={[styles.button, { backgroundColor: colors.neutralTint }]}
    >
      <Text style={[styles.label, { color: colors.text.primary }]}>
        {locale}
      </Text>
    </Pressable>
  )
}
