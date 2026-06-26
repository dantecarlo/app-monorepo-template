import en from './en.json'
import es from './es.json'

export const resources = {
  en: { translation: en },
  es: { translation: es }
} as const

/**
 * Canonical project display name, sourced from the default-language catalog.
 * Use this in non-reactive contexts that cannot call a translation hook —
 * e.g. Next.js static `metadata.title`. In React trees prefer the live
 * translation of `app.name` so a locale switch updates the name reactively.
 * `scripts/init-project.mjs` rewrites `app.name` (here) together with the
 * mobile `app.json` expo.name so all identity sources stay in sync.
 */
export const APP_NAME = en.app.name
