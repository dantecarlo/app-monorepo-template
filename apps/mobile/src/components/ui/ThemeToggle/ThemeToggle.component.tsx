import type { IThemeToggleProps } from '@/components/ui/ThemeToggle/ThemeToggle.type'
import { useThemeToggle } from '@/components/ui/ThemeToggle/useThemeToggle.hook'
import { Toggle } from '@/components/ui/Toggle/Toggle.component'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'

/** Light/dark theme switch built on the generic Toggle and the theme controller. */
export const ThemeToggle = ({ accessibilityLabel }: IThemeToggleProps) => {
  const { t } = useAppTranslator()
  const { isLight, onValueChange } = useThemeToggle()

  return (
    <Toggle
      accessibilityLabel={
        accessibilityLabel ?? t('auth.themeToggle.label')
      }
      onValueChange={onValueChange}
      value={isLight}
    />
  )
}
