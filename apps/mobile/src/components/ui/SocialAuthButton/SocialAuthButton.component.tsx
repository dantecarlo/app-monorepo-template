import { colors } from '@app/tokens'
import { ActivityIndicator, Pressable, Text } from 'react-native'

import { GoogleGlyph } from '@/components/ui/SocialAuthButton/GoogleGlyph.component'
import {
  SOCIAL_AUTH_GLYPH_SIZE,
  SOCIAL_AUTH_STYLES as styles
} from '@/components/ui/SocialAuthButton/SocialAuthButton.styles'

export interface ISocialAuthButtonProps {
  disabled?: boolean
  isLoading?: boolean
  label: string
  onPress?: () => void
}

/** Glass Google social-auth pill button. */
export const SocialAuthButton = ({
  disabled,
  isLoading = false,
  label,
  onPress
}: ISocialAuthButtonProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ disabled: disabled ?? isLoading }}
    disabled={disabled ?? isLoading}
    onPress={onPress}
    style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
  >
    {isLoading ? (
      <ActivityIndicator color={colors.text.secondary} />
    ) : (
      <GoogleGlyph size={SOCIAL_AUTH_GLYPH_SIZE} />
    )}
    <Text style={styles.label}>{label}</Text>
  </Pressable>
)
