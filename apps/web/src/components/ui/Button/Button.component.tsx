import type { ButtonHTMLAttributes } from 'react'
import type { VariantProps } from 'tailwind-variants'

import { buttonVariants } from '@/components/ui/Button/Button.styles'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Button = ({
  children,
  className,
  disabled,
  fullWidth,
  isLoading,
  size,
  variant,
  ...props
}: IButtonProps) => {
  return (
    <button
      aria-busy={isLoading}
      className={buttonVariants({
        class: className,
        fullWidth,
        size,
        variant
      })}
      disabled={disabled ?? isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          <span className="sr-only">Loading…</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
