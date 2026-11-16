'use client'

import { useEffect } from 'react'

import type { IUseDocumentLanguageParams } from '@/i18n/useDocumentLanguage.type'

/**
 * Keeps the html element's language attribute on the active locale. The
 * pre-paint script sets it on the first load; a language switch refreshes
 * the route without a reload, so the providers set it again here.
 */
export const useDocumentLanguage = ({
  locale
}: IUseDocumentLanguageParams): void => {
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
}
