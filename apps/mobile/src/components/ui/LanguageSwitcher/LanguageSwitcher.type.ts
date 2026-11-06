import type { SupportedLanguageType } from '@app/i18n'

export interface ILanguageSwitcherProps {
  accessibilityLabel?: string
}

export interface IUseLanguageSwitcherResult {
  cycleLanguage: () => void
  locale: SupportedLanguageType
}
