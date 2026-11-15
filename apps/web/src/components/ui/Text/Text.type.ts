import type { ReactNode } from 'react'
import type { VariantProps } from 'tailwind-variants'

import { textVariants } from '@/components/ui/Text/Text.style'

export type TextElementType = 'div' | 'h1' | 'h2' | 'h3' | 'p' | 'span'

export interface ITextProps extends VariantProps<typeof textVariants> {
  /** The element rendered; a `span` by default. */
  as?: TextElementType
  children: ReactNode
  /** Positioning classes only: the look comes from the variant. */
  className?: string
}
