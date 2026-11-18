import {
  DEFAULT_LANGUAGE,
  FALLBACK_LANGUAGE,
  type ILocaleResources,
  resources,
  type SupportedLanguageType
} from '@app/i18n'
import i18next from 'i18next'
import ICU from 'i18next-icu'
import type { ReactElement } from 'react'
import { I18nextProvider } from 'react-i18next'

import { render } from '@/test/test.helper'

export interface IRenderWithI18nParams {
  language?: SupportedLanguageType
  /** The catalog to read the copy from: the language's own one by default. */
  messages?: ILocaleResources['translation']
  ui: ReactElement
}

// An i18next instance on the real catalogs, as src/lib/i18n/i18n.config.ts
// builds the app's, started synchronously in one language.
const createTestI18n = ({
  language,
  messages
}: {
  language: SupportedLanguageType
  messages?: ILocaleResources['translation']
}) => {
  const instance = i18next.createInstance()
  void instance.use(ICU).init({
    compatibilityJSON: 'v4',
    fallbackLng: FALLBACK_LANGUAGE,
    initAsync: false,
    interpolation: { escapeValue: false },
    lng: language,
    react: { useSuspense: false },
    resources:
      messages === undefined
        ? resources
        : { [language]: { translation: messages } }
  })
  return instance
}

/**
 * Renders a block inside an i18next provider holding the real catalogs: a
 * test reads the copy a reader of that language sees.
 */
export const renderWithI18n = ({
  language = DEFAULT_LANGUAGE,
  messages,
  ui
}: IRenderWithI18nParams) =>
  render(
    <I18nextProvider i18n={createTestI18n({ language, messages })}>
      {ui}
    </I18nextProvider>
  )
