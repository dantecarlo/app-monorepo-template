import type { JSX } from 'react'

import { Icon } from '@/components/ui/Icon/Icon.component'
import {
  SEARCH_BAR,
  SEARCH_BAR_ICON_SIZE
} from '@/components/ui/SearchBar/SearchBar.constant'

export interface ISearchBarProps {
  accessibilityLabel?: string
  onChangeText: (value: string) => void
  placeholder?: string
  value: string
}

export const SearchBar = ({
  accessibilityLabel,
  onChangeText,
  placeholder,
  value
}: ISearchBarProps): JSX.Element => (
  <div className={SEARCH_BAR.CONTAINER}>
    <Icon
      color="currentColor"
      decorative
      name="search"
      size={SEARCH_BAR_ICON_SIZE}
    />
    <input
      aria-label={accessibilityLabel}
      className={SEARCH_BAR.INPUT}
      onChange={(e) => onChangeText(e.target.value)}
      placeholder={placeholder}
      type="search"
      value={value}
    />
  </div>
)
