// Test mock for expo-localization. The real package loads expo-modules-core,
// which references the React Native __DEV__ global that does not exist under
// the vitest happy-dom environment. Tests only need a stable device locale.

export const getLocales = () => [
  { languageCode: 'en', languageTag: 'en-US' }
]
