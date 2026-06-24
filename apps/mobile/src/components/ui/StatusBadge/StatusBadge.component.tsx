import { Text, View } from 'react-native'

import type { StatusBadgeToneType } from '@/components/ui/StatusBadge/StatusBadge.constant'
import { STATUS_BADGE_TONE_COLORS } from '@/components/ui/StatusBadge/StatusBadge.constant'
import { STATUS_BADGE_STYLES as styles } from '@/components/ui/StatusBadge/StatusBadge.styles'

export interface IStatusBadgeProps {
  label: string
  tone?: StatusBadgeToneType
}

export const StatusBadge = ({
  label,
  tone = 'neutral'
}: IStatusBadgeProps) => {
  const { bg, dot, text } = STATUS_BADGE_TONE_COLORS[tone]

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  )
}
