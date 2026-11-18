import {
  DEFAULT_LANGUAGE,
  type ILocaleResources,
  resources,
  type SupportedLanguageType
} from '@app/i18n'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactElement } from 'react'

import { I18N_TIME_ZONE } from '@/i18n/i18n.constant'
import { render } from '@/test/test.helper'

export interface IRenderWithIntlParams {
  locale?: SupportedLanguageType
  /** The catalog to read the copy from: the locale's own one by default. */
  messages?: ILocaleResources['translation']
  ui: ReactElement
}

/**
 * Renders a block inside the translation context the client providers give
 * it, with the real catalog of the language: a test reads the copy a reader
 * of that language sees.
 */
export const renderWithIntl = ({
  locale = DEFAULT_LANGUAGE,
  messages = resources[locale].translation,
  ui
}: IRenderWithIntlParams) =>
  render(
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={I18N_TIME_ZONE}
    >
      {ui}
    </NextIntlClientProvider>
  )
