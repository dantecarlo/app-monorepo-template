import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'

import {
  CONFIRM_DIALOG_STYLES,
  CONFIRM_PRESSED_OPACITY
} from '@/components/ui/ConfirmDialog/ConfirmDialog.style'
import type { IConfirmDialogProps } from '@/components/ui/ConfirmDialog/ConfirmDialog.type'
import { Modal } from '@/components/ui/Modal/Modal.component'
import { useThemedStyles } from '@/lib/theme/useThemedStyles.hook'

export const ConfirmDialog = ({
  cancelLabel,
  confirmLabel,
  isOpen,
  message,
  onCancel,
  onConfirm,
  title
}: IConfirmDialogProps) => {
  const styles = useThemedStyles({ styles: CONFIRM_DIALOG_STYLES })

  const { t } = useTranslation()

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onCancel}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelLabel}>
            {cancelLabel ?? t('common.cancel')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onConfirm}
          style={({ pressed }) => [
            styles.confirmButton,
            { opacity: pressed ? CONFIRM_PRESSED_OPACITY : 1 }
          ]}
        >
          <Text style={styles.confirmLabel}>
            {confirmLabel ?? t('common.confirm')}
          </Text>
        </Pressable>
      </View>
    </Modal>
  )
}
