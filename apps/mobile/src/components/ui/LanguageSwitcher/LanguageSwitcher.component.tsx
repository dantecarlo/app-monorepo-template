import { Pressable } from 'react-native'

import { LANGUAGE_SWITCHER_STYLES as styles } from '@/components/ui/LanguageSwitcher/LanguageSwitcher.style'
import type { ILanguageSwitcherProps } from '@/components/ui/LanguageSwitcher/LanguageSwitcher.type'
import { useLanguageSwitcher } from '@/components/ui/LanguageSwitcher/useLanguageSwitcher.hook'
import { Text } from '@/components/ui/Text/Text.component'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import { useThemeTokens } from '@/lib/theme/useThemeTokens.hook'

/** Cycles the active locale across SUPPORTED_LANGUAGES, persisting it on the device. */
export const LanguageSwitcher = ({
  accessibilityLabel
}: ILanguageSwitcherProps) => {
  const { t } = useAppTranslator()
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
