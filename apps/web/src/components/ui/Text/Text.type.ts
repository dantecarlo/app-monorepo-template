import type { ReactNode } from 'react'

import type {
  TextToneType,
  TextVariantType,
  TextWeightType
} from '@/components/ui/Text/Text.constant'

export type TextElementType = 'div' | 'h1' | 'h2' | 'h3' | 'p' | 'span'

export interface ITextProps {
  /** The element rendered; a `span` by default. */
  as?: TextElementType
  children: ReactNode
  /** Positioning classes only: the look comes from the variant. */
  className?: string
  tone?: TextToneType
  variant?: TextVariantType
  weight?: TextWeightType
}
