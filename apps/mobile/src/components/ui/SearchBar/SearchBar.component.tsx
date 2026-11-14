import { colors } from '@app/tokens'
import { TextInput, View } from 'react-native'

import { Icon } from '@/components/ui/Icon/Icon.component'
import { ICON_SIZE } from '@/components/ui/SearchBar/SearchBar.constant'
import { SEARCH_BAR_STYLES as styles } from '@/components/ui/SearchBar/SearchBar.style'
import type { ISearchBarProps } from '@/components/ui/SearchBar/SearchBar.type'

export const SearchBar = ({
  accessibilityLabel,
  onChangeText,
  placeholder,
  value
}: ISearchBarProps) => (
  <View style={styles.container}>
    <Icon
      color={colors.text.secondary}
      decorative
      name="search"
      size={ICON_SIZE}
    />
    <TextInput
      accessibilityLabel={accessibilityLabel}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.text.tertiary}
      style={styles.input}
      value={value}
    />
  </View>
)
