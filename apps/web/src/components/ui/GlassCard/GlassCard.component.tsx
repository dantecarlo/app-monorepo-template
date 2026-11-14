import { glassCardVariants } from '@/components/ui/GlassCard/GlassCard.style'
import type { IGlassCardProps } from '@/components/ui/GlassCard/GlassCard.type'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
