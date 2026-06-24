import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'

import {
  CONFIRM_DIALOG_STYLES as styles,
  CONFIRM_PRESSED_OPACITY
} from '@/components/ui/ConfirmDialog/ConfirmDialog.styles'
import { Modal } from '@/components/ui/Modal/Modal.component'

export interface IConfirmDialogProps {
  cancelLabel?: string
  confirmLabel?: string
  isOpen: boolean
  message: string
  onCancel: () => void
  onConfirm: () => void
  title?: string
}

export const ConfirmDialog = ({
  cancelLabel,
  confirmLabel,
  isOpen,
  message,
  onCancel,
  onConfirm,
  title
}: IConfirmDialogProps) => {
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
