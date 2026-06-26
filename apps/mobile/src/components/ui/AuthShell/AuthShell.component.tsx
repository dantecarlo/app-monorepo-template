import type { ReactNode } from 'react'
import { Text, View } from 'react-native'

import { AUTH_SHELL_LOGO_SIZE } from '@/components/ui/AuthShell/AuthShell.constant'
import { AUTH_SHELL_STYLES as styles } from '@/components/ui/AuthShell/AuthShell.styles'
import { GlassCard } from '@/components/ui/GlassCard/GlassCard.component'
import { Logo } from '@/components/ui/Logo/Logo.component'

export interface IAuthShellProps {
  brandLabel: string
  children: ReactNode
  subtitle?: string
  title: string
}

/** Centred auth layout: gradient brand mark + title/subtitle header above a glass form container. */
export const AuthShell = ({
  brandLabel,
  children,
  subtitle,
  title
}: IAuthShellProps) => (
  <View style={styles.root}>
    <View style={styles.header}>
      <Logo brandLabel={brandLabel} size={AUTH_SHELL_LOGO_SIZE} />

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
