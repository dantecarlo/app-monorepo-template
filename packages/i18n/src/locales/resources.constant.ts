import en from '#src/locales/en.json'
import es from '#src/locales/es.json'
import type {
  ILocaleResources,
  SupportedLanguageType
} from '#src/locales/i18n.constant'

// Every supported language has a catalog, and every catalog holds every key
// of the default one: a catalog that lacks one fails the type check here.
export const resources = {
  en: { translation: en },
  es: { translation: es }
} as const satisfies Record<SupportedLanguageType, ILocaleResources>

/**
 * Canonical project display name, sourced from the default-language catalog.
 * Use this in non-reactive contexts that cannot call a translation hook —
 * e.g. Next.js static `metadata.title`. In React trees prefer the live
 * translation of `app.name` so a locale switch updates the name reactively.
 * `scripts/init-project.mjs` rewrites `app.name` (here) together with the
 * mobile `app.json` expo.name so all identity sources stay in sync.
 */
export const APP_NAME = en.app.name
