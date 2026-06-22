import type { HTMLAttributes } from 'react'
import type { VariantProps } from 'tailwind-variants'

import { chipVariants } from '@/components/ui/Chip/Chip.styles'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IChipProps
  extends
    HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {
  /** Renders a 7px status dot before the label (use with variant="success") */
  withDot?: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Chip = ({
  children,
  className,
  variant,
  withDot,
  ...props
}: IChipProps) => {
  return (
    <span
      className={chipVariants({ class: className, variant })}
      {...props}
    >
      {withDot && (
        <span
          aria-hidden="true"
          className="h-[7px] w-[7px] rounded-full bg-current"
        />
      )}
      {children}
    </span>
  )
}
