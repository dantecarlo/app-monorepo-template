import type { ThemeColorsType, ThemeEnumType } from '@app/tokens'
import type { StyleSheet } from 'react-native'

/** What StyleSheet.create accepts: a record of named styles. */
export type StyleSheetStylesType = Parameters<typeof StyleSheet.create>[0]

/** One value per theme: what a block reads through useThemedStyles. */
export type ThemedType<T> = Record<ThemeEnumType, T>

export interface ICreateThemedParams<T> {
  /** Builds the value of one theme from that theme's palette. */
  build: (palette: ThemeColorsType) => T
}

export interface ICreateThemedStylesParams<T> {
  /**
   * Builds one theme's sheet from its palette. The intersection types each
   * entry as a style, as StyleSheet.create's parameter does, so a literal
   * such as `flexDirection: 'row'` keeps its type.
   */
  build: (palette: ThemeColorsType) => T & StyleSheetStylesType
}

export interface IUseThemedStylesParams<T> {
  styles: ThemedType<T>
}
