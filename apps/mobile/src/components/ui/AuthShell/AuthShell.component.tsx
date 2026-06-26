import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AUTH_SHELL_LOGO_SIZE } from '@/components/ui/AuthShell/AuthShell.constant'
import { AUTH_SHELL_STYLES as styles } from '@/components/ui/AuthShell/AuthShell.styles'
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
 * Centred auth layout: a top controls row (theme + language) pinned below the
 * safe-area inset, the project name + gradient brand mark, a title/subtitle
 * header, and a glass form container. The `logo` slot overrides the default
 * brandLabel-driven Logo when a project supplies a custom mark.
 */
export const AuthShell = ({
  brandLabel,
  children,
  logo,
  subtitle,
  title
}: IAuthShellProps) => {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.root}>
      <View style={[styles.controls, { top: insets.top }]}>
        <ThemeToggle />
        <LanguageSwitcher />
      </View>

      <View style={styles.header}>
        {logo ?? (
          <Logo brandLabel={brandLabel} size={AUTH_SHELL_LOGO_SIZE} />
        )}

        <Text style={styles.brandLabel}>{brandLabel}</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {subtitle !== undefined && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>

      <GlassCard style={styles.form}>{children}</GlassCard>
    </View>
  )
}
