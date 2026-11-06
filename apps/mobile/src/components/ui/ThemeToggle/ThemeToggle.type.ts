export interface IThemeToggleProps {
  accessibilityLabel?: string
}

export interface IUseThemeToggleResult {
  isLight: boolean
  onValueChange: (next: boolean) => void
}
