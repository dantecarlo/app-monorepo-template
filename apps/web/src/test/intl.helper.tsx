import {
  DEFAULT_LANGUAGE,
  resources,
  type SupportedLanguageType
} from '@app/i18n'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactElement } from 'react'

import { I18N_TIME_ZONE } from '@/i18n/i18n.constant'
import { render } from '@/test/test.helper'

export interface IRenderWithIntlParams {
  locale?: SupportedLanguageType
  ui: ReactElement
}

/**
 * Renders a block inside the translation context the client providers give
 * it, with the real catalog of the language: a test reads the copy a reader
 * of that language sees.
 */
export const renderWithIntl = ({
  locale = DEFAULT_LANGUAGE,
  ui
}: IRenderWithIntlParams) =>
  render(
    <NextIntlClientProvider
      locale={locale}
      messages={resources[locale].translation}
      timeZone={I18N_TIME_ZONE}
    >
      {ui}
    </NextIntlClientProvider>
  )
