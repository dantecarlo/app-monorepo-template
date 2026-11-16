import { Text, View } from 'react-native'

import { DIVIDER_STYLES } from '@/components/ui/Divider/Divider.style'
import type { IDividerProps } from '@/components/ui/Divider/Divider.type'
import { useThemedStyles } from '@/lib/theme/useThemedStyles.hook'

export const Divider = ({ label, style }: IDividerProps) => {
  const styles = useThemedStyles({ styles: DIVIDER_STYLES })

  return (
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
}
