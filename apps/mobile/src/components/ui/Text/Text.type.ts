import type { ReactNode } from 'react'
import type { AccessibilityRole, StyleProp, TextStyle } from 'react-native'

export type TextVariantType =
  | 'amount'
  | 'amountHero'
  | 'body'
  | 'caption'
  | 'heading'
  | 'label'
  | 'title'

export interface ITextProps {
  /** What the text is to assistive technology, such as `header` for a title. */
  accessibilityRole?: AccessibilityRole
  children: ReactNode
  /**
   * The NativeWind classes of a ui block that owns this look (Button, Chip);
   * a screen positions its text through `style`, never through classes.
   */
  className?: string
  numberOfLines?: number
  /** Laid over the variant: positioning, or the look of a screen's own block. */
  style?: StyleProp<TextStyle>
  /** The typography recipe; without one the text takes only `style`. */
  variant?: TextVariantType
}
