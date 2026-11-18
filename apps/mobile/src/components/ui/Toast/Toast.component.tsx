import { Pressable, Text, View } from 'react-native'

import { TOAST_DOT_COLOR } from '@/components/ui/Toast/Toast.constant'
import { TOAST_STYLES } from '@/components/ui/Toast/Toast.style'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import { useThemedStyles } from '@/lib/theme/useThemedStyles.hook'
import {
  selectRemoveToast,
  selectToasts,
  useToastStore
} from '@/stores/toast.store'

export const Toast = () => {
  const { t } = useAppTranslator()
  const dotColors = useThemedStyles({ styles: TOAST_DOT_COLOR })
  const styles = useThemedStyles({ styles: TOAST_STYLES })

  const toasts = useToastStore(selectToasts)
  const remove = useToastStore(selectRemoveToast)

  if (toasts.length === 0) {
    return null
  }

  return (
    <View pointerEvents="box-none" style={styles.viewport}>
      {toasts.map((toast) => (
        <View
          accessibilityLabel={toast.message}
          accessibilityRole="alert"
          key={toast.id}
          style={styles.pill}
        >
          <View
            style={[
              styles.dot,
              { backgroundColor: dotColors[toast.variant] }
            ]}
          />
          <Text style={styles.message}>{toast.message}</Text>
          <Pressable
            accessibilityLabel={t('common.dismiss')}
            accessibilityRole="button"
            onPress={() => remove(toast.id)}
          >
            <Text style={styles.dismissGlyph}>×</Text>
          </Pressable>
        </View>
      ))}
    </View>
  )
}
