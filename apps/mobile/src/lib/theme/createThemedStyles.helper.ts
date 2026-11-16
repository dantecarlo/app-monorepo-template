import { ThemeEnum, themes } from '@app/tokens'
import { StyleSheet } from 'react-native'

import type {
  ICreateThemedParams,
  ICreateThemedStylesParams,
  StyleSheetStylesType,
  ThemedType
} from '@/lib/theme/createThemedStyles.type'

/**
 * Builds a value once per theme, from that theme's palette, so a block reads
 * the active one through useThemedStyles and repaints when the theme flips.
 * A module-level StyleSheet built from the static `colors` stays dark.
 */
export const createThemedValues = <T>({
  build
}: ICreateThemedParams<T>): ThemedType<T> => ({
  [ThemeEnum.DARK]: build(themes[ThemeEnum.DARK]),
  [ThemeEnum.LIGHT]: build(themes[ThemeEnum.LIGHT])
})

/** createThemedValues for a StyleSheet: one sheet per theme. */
export const createThemedStyles = <T extends StyleSheetStylesType>({
  build
}: ICreateThemedStylesParams<T>): ThemedType<Readonly<T>> =>
  createThemedValues({
    build: (palette) => StyleSheet.create(build(palette))
  })
