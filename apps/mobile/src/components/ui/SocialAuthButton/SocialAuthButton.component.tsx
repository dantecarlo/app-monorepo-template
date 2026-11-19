import { ActivityIndicator, Pressable } from 'react-native'

import { GoogleGlyph } from '@/components/ui/SocialAuthButton/GoogleGlyph.component'
import {
  SOCIAL_AUTH_GLYPH_SIZE,
  SOCIAL_AUTH_STYLES
} from '@/components/ui/SocialAuthButton/SocialAuthButton.style'
import type { ISocialAuthButtonProps } from '@/components/ui/SocialAuthButton/SocialAuthButton.type'
import { Text } from '@/components/ui/Text/Text.component'
import { useThemedStyles } from '@/lib/theme/useThemedStyles.hook'
import { useThemeTokens } from '@/lib/theme/useThemeTokens.hook'

/** Glass Google social-auth pill button. */
export const SocialAuthButton = ({
  disabled,
  isLoading = false,
  label,
  onPress
}: ISocialAuthButtonProps) => {
  const { colors: palette } = useThemeTokens()
  const styles = useThemedStyles({ styles: SOCIAL_AUTH_STYLES })

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled ?? isLoading }}
      disabled={disabled ?? isLoading}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
    >
      {isLoading ? (
        <ActivityIndicator color={palette.text.secondary} />
      ) : (
        <GoogleGlyph size={SOCIAL_AUTH_GLYPH_SIZE} />
      )}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  )
}
