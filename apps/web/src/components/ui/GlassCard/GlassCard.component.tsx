import type { HTMLAttributes } from 'react'
import type { VariantProps } from 'tailwind-variants'

import { glassCardVariants } from '@/components/ui/GlassCard/GlassCard.styles'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IGlassCardProps
  extends
    HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const GlassCard = ({
  children,
  className,
  padding,
  radius,
  ...props
}: IGlassCardProps) => {
  return (
    <div
      className={glassCardVariants({ class: className, padding, radius })}
      {...props}
    >
      {children}
    </div>
  )
}
