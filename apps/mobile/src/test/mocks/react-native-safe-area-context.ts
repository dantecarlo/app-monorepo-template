// Test mock for react-native-safe-area-context. The real package ships
// untransformed TS that the vitest transformer cannot parse; tests only need
// the insets surface and pass-through providers.

import type { ReactNode } from 'react'

const ZERO_INSETS = { bottom: 0, left: 0, right: 0, top: 0 }

export const useSafeAreaInsets = () => ZERO_INSETS

export const SafeAreaProvider = ({ children }: { children?: ReactNode }) =>
  children

export const SafeAreaView = ({ children }: { children?: ReactNode }) =>
  children
