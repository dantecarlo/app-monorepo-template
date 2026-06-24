import type { JSX, ReactNode } from 'react'

import {
  AUTH_SHELL_BRAND_LABEL_CLASS,
  AUTH_SHELL_BRAND_MARK_CLASS,
  AUTH_SHELL_FORM_CLASS,
  AUTH_SHELL_GLYPH_SIZE,
  AUTH_SHELL_ROOT_CLASS,
  AUTH_SHELL_SUBTITLE_CLASS
} from '@/components/ui/AuthShell/AuthShell.constant'
import { GlassCard } from '@/components/ui/GlassCard/GlassCard.component'
import { Icon } from '@/components/ui/Icon/Icon.component'

export interface IAuthShellProps {
  brandLabel: string
  children: ReactNode
  subtitle?: string
  title: string
}

/** Centred auth layout: brand glyph + title/subtitle header above a glass form container. */
export const AuthShell = ({
  brandLabel,
  children,
  subtitle,
  title
}: IAuthShellProps): JSX.Element => (
  <main className={AUTH_SHELL_ROOT_CLASS}>
    <div className="flex flex-col items-center">
      <div className={AUTH_SHELL_BRAND_MARK_CLASS}>
        <Icon decorative name="check" size={AUTH_SHELL_GLYPH_SIZE} />
      </div>
      <p className={AUTH_SHELL_BRAND_LABEL_CLASS}>{brandLabel}</p>
      <h1 className="mt-6 font-display text-heading font-semibold text-text-primary text-center">
        {title}
      </h1>
      {subtitle !== undefined && (
        <p className={AUTH_SHELL_SUBTITLE_CLASS}>{subtitle}</p>
      )}
    </div>

    <GlassCard className={AUTH_SHELL_FORM_CLASS}>{children}</GlassCard>
  </main>
)
