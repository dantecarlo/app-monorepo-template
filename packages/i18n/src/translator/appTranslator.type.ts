import type {
  SupportedLanguageType,
  TranslationKeysType
} from '#src/locales/i18n.constant'

// Every dot-separated path from the root of a catalog shape to one of its
// messages: a namespace, which holds messages, is not a path to a message.
type LeafKeyType<TShape, TPrefix extends string> = {
  [TName in keyof TShape & string]: TShape[TName] extends string
    ? `${TPrefix}${TName}`
    : LeafKeyType<TShape[TName], `${TPrefix}${TName}.`>
}[keyof TShape & string]

/**
 * A message key: a dot-separated path to a message of the English catalog,
 * the catalog of the default language, which holds every key.
 */
export type TranslationKeyType = LeafKeyType<TranslationKeysType, ''>

/** The values of a message's ICU arguments, by argument name. */
export type TranslationValuesType = Readonly<
  Record<string, number | string>
>

/**
 * The translator both apps give their blocks, whatever runtime each wraps:
 * web's lib/i18n over next-intl, mobile's over react-i18next.
 */
export interface IAppTranslator {
  /** True when the active catalog holds the string, which is then a key. */
  has: (key: string) => key is TranslationKeyType
  /** The active language. */
  locale: SupportedLanguageType
  /** The message of a key in the active language, its arguments filled. */
  t: (key: TranslationKeyType, values?: TranslationValuesType) => string
}
