import { TextInput, View } from 'react-native'

import { Icon } from '@/components/ui/Icon/Icon.component'
import { ICON_SIZE } from '@/components/ui/SearchBar/SearchBar.constant'
import { SEARCH_BAR_STYLES } from '@/components/ui/SearchBar/SearchBar.style'
import type { ISearchBarProps } from '@/components/ui/SearchBar/SearchBar.type'
import { useThemedStyles } from '@/lib/theme/useThemedStyles.hook'
import { useThemeTokens } from '@/lib/theme/useThemeTokens.hook'

export const SearchBar = ({
  accessibilityLabel,
  onChangeText,
  placeholder,
  value
}: ISearchBarProps) => {
  const { colors: palette } = useThemeTokens()
  const styles = useThemedStyles({ styles: SEARCH_BAR_STYLES })

  return (
    <View style={styles.container}>
      <Icon
        color={palette.text.secondary}
        decorative
        name="search"
        size={ICON_SIZE}
      />
      <TextInput
        accessibilityLabel={accessibilityLabel}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.text.tertiary}
        style={styles.input}
        value={value}
      />
    </View>
  )
}
