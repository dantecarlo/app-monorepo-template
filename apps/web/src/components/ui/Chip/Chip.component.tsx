import type { HTMLAttributes } from 'react';
import type { VariantProps } from 'tailwind-variants';
import { chipVariants } from '@/components/ui/Chip/Chip.styles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChipProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {
  /** Renders a 7px status dot before the label (use with variant="success") */
  withDot?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Chip({ variant, withDot, className, children, ...props }: ChipProps) {
  return (
    <span className={chipVariants({ variant, class: className })} {...props}>
      {withDot && (
        <span
          aria-hidden="true"
          className="h-[7px] w-[7px] rounded-full bg-current"
        />
      )}
      {children}
    </span>
  );
}
