import type { ReactNode } from 'react'
import type { StyleProp, TextStyle } from 'react-native'

export type TextVariantType =
  | 'amount'
  | 'amountHero'
  | 'body'
  | 'caption'
  | 'heading'
  | 'label'
  | 'title'

export interface ITextProps {
  children: ReactNode
  numberOfLines?: number
  /** Laid over the variant: positioning, or the look of a screen's own block. */
  style?: StyleProp<TextStyle>
  /** The typography recipe; without one the text takes only `style`. */
  variant?: TextVariantType
}
