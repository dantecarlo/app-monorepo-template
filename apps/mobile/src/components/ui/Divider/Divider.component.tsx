import { Text, View } from 'react-native'

import { DIVIDER_STYLES as styles } from '@/components/ui/Divider/Divider.style'
import type { IDividerProps } from '@/components/ui/Divider/Divider.type'

export const Divider = ({ label, style }: IDividerProps) => (
  <View style={[styles.root, style]}>
    <View style={styles.rule} />
    {label !== undefined && (
      <>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.rule} />
      </>
    )}
  </View>
)
