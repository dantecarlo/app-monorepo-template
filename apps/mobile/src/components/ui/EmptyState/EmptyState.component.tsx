import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'

import { EMPTY_STATE_STYLES as styles } from '@/components/ui/EmptyState/EmptyState.styles'

export interface IEmptyStateProps {
  cta?: ReactNode
  message?: string
  title?: string
}

export const EmptyState = ({ cta, message, title }: IEmptyStateProps) => {
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.iconGlyph}>✉</Text>
      </View>
      <Text style={styles.title}>
        {title ?? t('components.emptyState.title')}
      </Text>
      <Text style={styles.message}>
        {message ?? t('components.emptyState.message')}
      </Text>
      {cta !== undefined && <View style={styles.cta}>{cta}</View>}
    </View>
  )
}
