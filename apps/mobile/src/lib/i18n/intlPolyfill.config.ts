// Hermes does not ship a complete Intl implementation.
// @formatjs/intl-pluralrules must be polyfilled before i18next-icu uses
// Intl.PluralRules — otherwise plural rules silently fall back to 'other'.
// Side-effect imports are intentional: they mutate the global Intl object.
import '@formatjs/intl-pluralrules/polyfill.js'
import '@formatjs/intl-pluralrules/locale-data/en.js'
import '@formatjs/intl-pluralrules/locale-data/es.js'
