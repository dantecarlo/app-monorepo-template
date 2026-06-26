import type { JSX, ReactNode } from 'react'

import {
  AUTH_SHELL_BRAND_LABEL_CLASS,
  AUTH_SHELL_CONTROLS_CLASS,
  AUTH_SHELL_FORM_CLASS,
  AUTH_SHELL_HEADER_CLASS,
  AUTH_SHELL_ROOT_CLASS,
  AUTH_SHELL_SUBTITLE_CLASS,
  AUTH_SHELL_TITLE_CLASS
} from '@/components/ui/AuthShell/AuthShell.constant'
import { GlassCard } from '@/components/ui/GlassCard/GlassCard.component'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher/LanguageSwitcher.component'
import { Logo } from '@/components/ui/Logo/Logo.component'
import { ThemeToggle } from '@/components/ui/ThemeToggle/ThemeToggle.component'

export interface IAuthShellProps {
  brandLabel: string
  children: ReactNode
  logo?: ReactNode
  subtitle?: string
  title: string
}

/**
 * Centred auth layout: a pinned top-right controls row (theme + language),
 * the project name + logo brand mark, a title/subtitle header, and a glass
 * form container. The `logo` slot overrides the default brandLabel-driven
 * Logo when a project supplies a custom mark.
 */
export const AuthShell = ({
  brandLabel,
  children,
  logo,
  subtitle,
  title
}: IAuthShellProps): JSX.Element => (
  <main className={AUTH_SHELL_ROOT_CLASS}>
    <div className={AUTH_SHELL_CONTROLS_CLASS}>
      <ThemeToggle />
      <LanguageSwitcher />
    </div>

    <div className={AUTH_SHELL_HEADER_CLASS}>
      {logo ?? <Logo brandLabel={brandLabel} />}
      <p className={AUTH_SHELL_BRAND_LABEL_CLASS}>{brandLabel}</p>
      <h1 className={AUTH_SHELL_TITLE_CLASS}>{title}</h1>
      {subtitle !== undefined && (
        <p className={AUTH_SHELL_SUBTITLE_CLASS}>{subtitle}</p>
      )}
    </div>

    <GlassCard className={AUTH_SHELL_FORM_CLASS}>{children}</GlassCard>
  </main>
)
