import type { HTMLAttributes } from 'react'
import type { VariantProps } from 'tailwind-variants'

import { glassCardVariants } from '@/components/ui/GlassCard/GlassCard.style'

export interface IGlassCardProps
  extends
    HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}
