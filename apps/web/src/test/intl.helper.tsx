import {
  DEFAULT_LANGUAGE,
  resources,
  type SupportedLanguageType
} from '@app/i18n'
import type { ReactElement } from 'react'

import { AppI18nProvider } from '@/lib/i18n/AppI18nProvider.component'
import type { AppMessagesType } from '@/lib/i18n/AppI18nProvider.type'
import { render } from '@/test/test.helper'

/** Some of a catalog's messages, at their paths. */
export type CopyType<TShape> = {
  [TName in keyof TShape]?: TShape[TName] extends string
    ? string
    : CopyType<TShape[TName]>
}

export interface IWithCopyParams {
  copy: CopyType<AppMessagesType>
  locale?: SupportedLanguageType
}

export interface IRenderWithIntlParams {
  locale?: SupportedLanguageType
  /** The catalog to read the copy from: the locale's own one by default. */
  messages?: AppMessagesType
  ui: ReactElement
}

interface IMergeCopyParams {
  base: Record<string, unknown>
  copy: Record<string, unknown>
}

const mergeCopy = ({
  base,
  copy
}: IMergeCopyParams): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(base).map(([name, value]) => {
      const override = copy[name]
      if (override === undefined) return [name, value]
      return [
        name,
        typeof value === 'string'
          ? override
          : mergeCopy({
              base: value as Record<string, unknown>,
              copy: override as Record<string, unknown>
            })
      ]
    })
  )

/**
 * The locale's catalog with some of its messages replaced: a test that
 * asserts its own copy keeps every other message of the real catalog.
 */
export const withCopy = ({
  copy,
  locale = DEFAULT_LANGUAGE
}: IWithCopyParams): AppMessagesType =>
  mergeCopy({
    base: resources[locale].translation as unknown as Record<
      string,
      unknown
    >,
    copy: copy as Record<string, unknown>
  }) as unknown as AppMessagesType

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
    <AppI18nProvider locale={locale} messages={messages}>
      {ui}
    </AppI18nProvider>
  )
