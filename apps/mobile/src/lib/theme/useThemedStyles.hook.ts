import type { IUseThemedStylesParams } from '@/lib/theme/createThemedStyles.type'
import { useThemeTokens } from '@/lib/theme/useThemeTokens.hook'

/** The active theme's value of a createThemedStyles or createThemedValues map. */
export const useThemedStyles = <T>({
  styles
}: IUseThemedStylesParams<T>): T => styles[useThemeTokens().theme]
