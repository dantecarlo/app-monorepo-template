import { Pressable, Text, View } from 'react-native'

import {
  TOAST_DISMISS_LABEL,
  TOAST_DOT_COLOR
} from '@/components/ui/Toast/Toast.constant'
import { TOAST_STYLES } from '@/components/ui/Toast/Toast.styles'
import {
  selectRemoveToast,
  selectToasts,
  useToastStore
} from '@/stores/toast.store'

export const Toast = () => {
  const toasts = useToastStore(selectToasts)
  const remove = useToastStore(selectRemoveToast)

  if (toasts.length === 0) {
    return null
  }

  return (
    <View pointerEvents="box-none" style={TOAST_STYLES.viewport}>
      {toasts.map((toast) => (
        <View
          accessibilityLabel={toast.message}
          accessibilityRole="alert"
          key={toast.id}
          style={TOAST_STYLES.pill}
        >
          <View
            style={[
              TOAST_STYLES.dot,
              { backgroundColor: TOAST_DOT_COLOR[toast.variant] }
            ]}
          />
          <Text style={TOAST_STYLES.message}>{toast.message}</Text>
          <Pressable
            accessibilityLabel={TOAST_DISMISS_LABEL}
            accessibilityRole="button"
            onPress={() => remove(toast.id)}
          >
            <Text>×</Text>
          </Pressable>
        </View>
      ))}
    </View>
  )
}
