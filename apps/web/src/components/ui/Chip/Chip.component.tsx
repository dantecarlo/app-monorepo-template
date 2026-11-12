import { chipVariants } from '@/components/ui/Chip/Chip.styles'
import type { IChipProps } from '@/components/ui/Chip/Chip.type'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
      {withDot === true && (
        <span
          aria-hidden="true"
          className="h-[7px] w-[7px] rounded-full bg-current"
        />
      )}
      {children}
    </span>
  )
}
