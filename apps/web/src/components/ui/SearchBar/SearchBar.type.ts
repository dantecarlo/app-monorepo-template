export interface ISearchBarProps {
  accessibilityLabel?: string
  onChangeText: (value: string) => void
  placeholder?: string
  value: string
}
