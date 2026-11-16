'use client'

import { DEFAULT_LANGUAGE, type SupportedLanguageType } from '@app/i18n'
import { useSyncExternalStore } from 'react'

import { readLocaleCookie } from '@/i18n/locale.helper'

// The cookie changes only through a refresh, so nothing is subscribed to.
const subscribeToNothing = () => () => undefined

const readDocumentLanguage = (): SupportedLanguageType =>
  readLocaleCookie({ cookie: document.cookie })

const readServerLanguage = (): SupportedLanguageType => DEFAULT_LANGUAGE

/**
 * The supported language the NEXT_LOCALE cookie names, read on the client:
 * for a document with no request config above it, such as global-error.tsx.
 * The server render and the hydration use the default language, and the
 * client then renders the cookie's, so the two never mismatch.
 */
export const useCookieLanguage = (): SupportedLanguageType =>
  useSyncExternalStore(
    subscribeToNothing,
    readDocumentLanguage,
    readServerLanguage
  )
