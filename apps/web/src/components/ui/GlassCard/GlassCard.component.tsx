import type { HTMLAttributes } from 'react';
import type { VariantProps } from 'tailwind-variants';
import { glassCardVariants } from '@/components/ui/GlassCard/GlassCard.styles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GlassCardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GlassCard({ radius, padding, className, children, ...props }: GlassCardProps) {
  return (
    <div className={glassCardVariants({ radius, padding, class: className })} {...props}>
      {children}
    </div>
  );
}
